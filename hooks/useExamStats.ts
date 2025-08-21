import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/auth-context';

export interface ExamStats {
  highestScore: number;
  lowestScore: number;
  totalExams: number;
  averageScore: number;
}

export interface CompletedExam {
  id: number;
  title: string;
  subject: string;
  score: number;
  grade: string;
  submittedAt: string;
  icon: string;
}

export interface UpcomingExam {
  id: number;
  title: string;
  subject: string;
  scheduledStart: string;
  icon: string;
}

export function useExamStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ExamStats>({
    highestScore: 0,
    lowestScore: 0,
    totalExams: 0,
    averageScore: 0,
  });
  const [completedExams, setCompletedExams] = useState<CompletedExam[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSubjectIcon = (subjectName: string): string => {
    const subject = subjectName.toLowerCase();
    if (subject.includes('math')) return '📊';
    if (subject.includes('physics')) return '⚛️';
    if (subject.includes('chemistry')) return '🧪';
    if (subject.includes('biology')) return '🧬';
    if (subject.includes('english')) return '📚';
    if (subject.includes('history')) return '📜';
    if (subject.includes('geography')) return '🌍';
    if (subject.includes('computer')) return '💻';
    return '📖';
  };

  const getGrade = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const fetchExamStats = useCallback(async () => {
    if (!user?.id) {
      console.log('[ExamStats] No user ID available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('[ExamStats] Fetching exam stats for user:', user.id);

      // Get user's grade level as number
      let gradeLevel: number | null = null;
      if (user.gradeLevel) {
        const gradeMatch = user.gradeLevel.match(/\d+/);
        gradeLevel = gradeMatch ? parseInt(gradeMatch[0]) : null;
      }
      console.log('[ExamStats] User grade level string:', user.gradeLevel);
      console.log('[ExamStats] Parsed grade level number:', gradeLevel);

      if (!gradeLevel) {
        console.log('[ExamStats] No grade level found for user');
        setIsLoading(false);
        return;
      }

      // Fetch completed exams (submissions with scores)
      const { data: submissions, error: submissionsError } = await supabase
        .from('exam_submissions')
        .select(`
          id,
          score_percent,
          submitted_at,
          exam_id,
          exams (
            id,
            title,
            subjects (
              name
            )
          )
        `)
        .eq('student_id', user.id)
        .not('score_percent', 'is', null)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false });

      if (submissionsError) {
        console.error('[ExamStats] Error fetching submissions:', submissionsError);
        throw submissionsError;
      }

      console.log('[ExamStats] Fetched submissions:', submissions);

      // Process completed exams
      const completed: CompletedExam[] = (submissions || []).map((submission: any) => ({
        id: submission.id,
        title: submission.exams?.title || 'Unknown Exam',
        subject: submission.exams?.subjects?.name || 'Unknown Subject',
        score: Math.round(submission.score_percent || 0),
        grade: getGrade(submission.score_percent || 0),
        submittedAt: new Date(submission.submitted_at).toLocaleDateString(),
        icon: getSubjectIcon(submission.exams?.subjects?.name || ''),
      }));

      setCompletedExams(completed);

      // Calculate statistics
      if (completed.length > 0) {
        const scores = completed.map(exam => exam.score);
        const highest = Math.max(...scores);
        const lowest = Math.min(...scores);
        const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
        
        setStats({
          highestScore: highest,
          lowestScore: lowest,
          totalExams: completed.length,
          averageScore: average,
        });
      } else {
        setStats({
          highestScore: 0,
          lowestScore: 0,
          totalExams: 0,
          averageScore: 0,
        });
      }

      // Fetch upcoming exams using the same logic as useExams hook
      console.log('[ExamStats] Fetching upcoming exams for grade level:', gradeLevel);
      console.log('[ExamStats] Current date for comparison:', new Date().toISOString());
      
      // Fetch all exams for this grade level (not just those with scheduled_start)
      const { data: allExamsData, error: upcomingError } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          scheduled_start,
          scheduled_end,
          status,
          subjects (
            name
          )
        `)
        .eq('grade_level', gradeLevel)
        .order('scheduled_start', { ascending: true, nullsFirst: false });

      if (upcomingError) {
        console.error('[ExamStats] Error fetching upcoming exams:', upcomingError);
        console.error('[ExamStats] Upcoming exams error details:', JSON.stringify(upcomingError, null, 2));
      } else {
        console.log('[ExamStats] Fetched all exams raw data:', allExamsData);
        console.log('[ExamStats] Number of exams found:', allExamsData?.length || 0);
        
        // Filter for active exams and apply the same logic as useExams
        const activeExams = (allExamsData || []).filter((exam: any) => {
          const isActive = !exam.status || exam.status === 'Active' || exam.status === 'active';
          console.log(`[ExamStats] Exam ${exam.id} (${exam.title}) status: '${exam.status}', isActive: ${isActive}`);
          return isActive;
        });
        
        // Apply the same upcoming logic as useExams
        const now = new Date();
        const upcomingFiltered = activeExams.filter((exam: any) => {
          // Check if user has already completed this exam
          const hasSubmission = submissions?.some((sub: any) => 
            sub.exam_id === exam.id && sub.status === 'Graded'
          );
          
          if (hasSubmission) {
            console.log(`[ExamStats] Exam ${exam.id} already completed by user`);
            return false; // Don't show completed exams in upcoming
          }
          
          if (exam.scheduled_start) {
            const startTime = new Date(exam.scheduled_start);
            const endTime = exam.scheduled_end ? new Date(exam.scheduled_end) : null;
            
            if (startTime > now) {
              // Exam is scheduled for the future
              console.log(`[ExamStats] Exam ${exam.id} is scheduled for future`);
              return true;
            } else if (!endTime || now <= endTime) {
              // Exam is currently active
              console.log(`[ExamStats] Exam ${exam.id} is currently active`);
              return true;
            } else {
              console.log(`[ExamStats] Exam ${exam.id} has expired`);
              return false;
            }
          } else {
            // No schedule, available anytime
            console.log(`[ExamStats] Exam ${exam.id} is available anytime`);
            return true;
          }
        });
        
        const upcoming: UpcomingExam[] = upcomingFiltered.map((exam: any) => {
          console.log('[ExamStats] Processing upcoming exam:', {
            id: exam.id,
            title: exam.title,
            scheduled_start: exam.scheduled_start,
            subject: exam.subjects?.name
          });
          
          return {
            id: exam.id,
            title: exam.title,
            subject: exam.subjects?.name || 'Unknown Subject',
            scheduledStart: exam.scheduled_start 
              ? new Date(exam.scheduled_start).toLocaleDateString()
              : 'Available anytime',
            icon: getSubjectIcon(exam.subjects?.name || ''),
          };
        });

        console.log('[ExamStats] Processed upcoming exams:', upcoming);
        setUpcomingExams(upcoming);
      }

    } catch (err) {
      console.error('[ExamStats] Error fetching exam stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch exam statistics');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.gradeLevel]);

  useEffect(() => {
    fetchExamStats();
  }, [user?.id, fetchExamStats]);

  return {
    stats,
    completedExams,
    upcomingExams,
    isLoading,
    error,
    refetch: fetchExamStats,
  };
}