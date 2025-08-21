import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/auth-context';

export interface ExamData {
  id: number;
  title: string;
  subject_name: string;
  grade_level: number;
  duration_minutes: number;
  scheduled_start: string | null;
  scheduled_end: string | null;
  status: string;
  total_questions: number;
  total_points: number;
  passing_score: number;
  allowed_attempts: number;
  user_submission?: {
    id: number;
    score_percent: number | null;
    status: string;
    submitted_at: string | null;
    attempt_number: number;
  } | null;
}

export function useExams() {
  const [exams, setExams] = useState<ExamData[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<ExamData[]>([]);
  const [recentExams, setRecentExams] = useState<ExamData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchExams = useCallback(async () => {
    console.log('[useExams] Starting fetchExams, user:', { 
      id: user?.id, 
      gradeLevel: user?.gradeLevel, 
      accountType: user?.accountType,
      fullName: user?.fullName 
    });
    
    if (!user?.id) {
      console.log('[useExams] No user ID, stopping fetch');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Extract numeric grade level from string like "Grade 10" -> 10
      let numericGradeLevel: number | null = null;
      if (user.gradeLevel) {
        const match = user.gradeLevel.match(/\d+/);
        if (match) {
          numericGradeLevel = parseInt(match[0]);
        } else {
          console.warn('[useExams] Could not extract numeric grade from:', user.gradeLevel);
        }
      } else {
        console.warn('[useExams] User has no grade level set');
      }
      
      console.log('[useExams] Extracted grade level:', numericGradeLevel);

      // First, try a simple query to test connection
      console.log('[useExams] Testing basic connection...');
      const { data: testData, error: testError } = await supabase
        .from('exams')
        .select('id, title')
        .limit(1);
      
      if (testError) {
        console.error('[useExams] Basic connection test failed:', testError);
        setError(`Connection error: ${testError.message}`);
        return;
      }
      
      console.log('[useExams] Basic connection successful, test data:', testData);

      // Now try the full query - first check what statuses exist
      console.log('[useExams] Checking available exam statuses...');
      const { data: statusCheck, error: statusError } = await supabase
        .from('exams')
        .select('id, title, status, grade_level')
        .limit(10);
      
      if (statusError) {
        console.error('[useExams] Status check failed:', statusError);
      } else {
        console.log('[useExams] Available exams with statuses:', statusCheck);
      }

      // Build the main query - don't filter by status initially to see all exams
      let query = supabase
        .from('exams')
        .select(`
          id,
          title,
          grade_level,
          duration_minutes,
          scheduled_start,
          scheduled_end,
          status,
          passing_score,
          allowed_attempts,
          subjects(name),
          exam_questions(id, points)
        `);
      
      // Only filter by active status if we want to exclude inactive exams
      // For now, let's include all exams to see what's available
      // .eq('status', 'Active');

      // Only filter by grade level if we have one
      if (numericGradeLevel !== null) {
        console.log('[useExams] Filtering by grade level:', numericGradeLevel);
        query = query.eq('grade_level', numericGradeLevel);
      } else {
        console.log('[useExams] No grade level found, fetching all exams');
        // If no grade level, still show some exams for testing
        // In production, you might want to show an error or require grade level
      }

      query = query.order('scheduled_start', { ascending: true, nullsFirst: false });

      console.log('[useExams] Executing main query...');
      const { data: examData, error: examError } = await query;

      if (examError) {
        console.error('[useExams] Error fetching exams:', examError);
        console.error('[useExams] Error details:', JSON.stringify(examError, null, 2));
        setError(`Database error: ${examError.message}`);
        return;
      }

      console.log('[useExams] Raw exam data:', examData);
      console.log('[useExams] Number of exams found:', examData?.length || 0);
      
      if (!examData || examData.length === 0) {
        console.log('[useExams] No exams found. Debug info:');
        console.log('- User grade level:', user.gradeLevel);
        console.log('- Numeric grade level:', numericGradeLevel);
        console.log('- User ID:', user.id);
        
        // Try a simple query without grade filter to see if there are any exams at all
        const { data: allExams, error: allExamsError } = await supabase
          .from('exams')
          .select('id, title, grade_level, status')
          .limit(10);
        
        console.log('[useExams] All active exams (debug):', allExams);
        if (allExamsError) {
          console.error('[useExams] Error fetching all exams:', allExamsError);
        }
      }

      // Now fetch submissions separately for each exam
      const examIds = (examData || []).map((exam: any) => exam.id);
      console.log('[useExams] Fetching submissions for exam IDs:', examIds);
      
      let submissionsData: any[] = [];
      if (examIds.length > 0) {
        const { data: submissions, error: submissionsError } = await supabase
          .from('exam_submissions')
          .select('*')
          .in('exam_id', examIds)
          .eq('student_id', user.id);
        
        if (submissionsError) {
          console.error('[useExams] Error fetching submissions:', submissionsError);
        } else {
          submissionsData = submissions || [];
          console.log('[useExams] Submissions data:', submissionsData);
        }
      }

      // Process the data - filter out inactive exams here instead of in the query
      const processedExams: ExamData[] = (examData || [])
        .filter((exam: any) => {
          // Include exams that are Active or don't have a status set
          const isActive = !exam.status || exam.status === 'Active' || exam.status === 'active';
          console.log(`[useExams] Exam ${exam.id} (${exam.title}) status: '${exam.status}', isActive: ${isActive}`);
          return isActive;
        })
        .map((exam: any) => {
          const totalQuestions = exam.exam_questions?.length || 0;
          const totalPoints = exam.exam_questions?.reduce((sum: number, q: any) => sum + (q.points || 0), 0) || 0;
          
          // Find user submission for this exam
          const userSubmission = submissionsData.find((sub: any) => sub.exam_id === exam.id) || null;
          
          console.log(`[useExams] Processing exam ${exam.id}:`, {
            title: exam.title,
            subject: exam.subjects?.[0]?.name || 'Unknown',
            totalQuestions,
            userSubmission: userSubmission ? 'Found' : 'None',
            status: exam.status
          });

          return {
            id: exam.id,
            title: exam.title,
            subject_name: exam.subjects?.[0]?.name || 'Unknown Subject',
            grade_level: exam.grade_level,
            duration_minutes: exam.duration_minutes,
            scheduled_start: exam.scheduled_start,
            scheduled_end: exam.scheduled_end,
            status: exam.status,
            total_questions: totalQuestions,
            total_points: totalPoints,
            passing_score: exam.passing_score,
            allowed_attempts: exam.allowed_attempts,
            user_submission: userSubmission
          };
        });
      
      console.log('[useExams] Processed exams:', processedExams.length);

      setExams(processedExams);

      // Separate upcoming and recent exams
      const now = new Date();
      const upcoming: ExamData[] = [];
      const recent: ExamData[] = [];

      processedExams.forEach(exam => {
        if (exam.user_submission && exam.user_submission.status === 'Graded') {
          // Student has completed this exam
          recent.push(exam);
        } else if (exam.scheduled_start) {
          const startTime = new Date(exam.scheduled_start);
          const endTime = exam.scheduled_end ? new Date(exam.scheduled_end) : null;
          
          if (startTime > now) {
            // Exam is scheduled for the future
            upcoming.push(exam);
          } else if (!endTime || now <= endTime) {
            // Exam is currently active
            upcoming.push(exam);
          }
        } else {
          // No schedule, available anytime
          upcoming.push(exam);
        }
      });

      setUpcomingExams(upcoming);
      setRecentExams(recent);
      
      console.log('[useExams] Final results:', {
        totalExams: processedExams.length,
        upcomingCount: upcoming.length,
        recentCount: recent.length
      });

    } catch (err) {
      console.error('[useExams] Error in fetchExams:', err);
      console.error('[useExams] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[useExams] Error message:', errorMessage);
      setError(`Error fetching exams: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.gradeLevel, user?.accountType, user?.fullName]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // Set up real-time subscription for exam updates
  useEffect(() => {
    if (!user?.id) return;

    // Extract numeric grade level for subscription
    let numericGradeLevel: number | null = null;
    if (user.gradeLevel) {
      const match = user.gradeLevel.match(/\d+/);
      if (match) {
        numericGradeLevel = parseInt(match[0]);
      }
    }

    const channel = supabase
      .channel('exam-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exams',
          filter: numericGradeLevel ? `grade_level=eq.${numericGradeLevel}` : undefined
        },
        () => {
          console.log('Exam data changed, refetching...');
          fetchExams();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_submissions',
          filter: `student_id=eq.${user.id}`
        },
        () => {
          console.log('Submission data changed, refetching...');
          fetchExams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.gradeLevel, user?.id, fetchExams]);

  return {
    exams,
    upcomingExams,
    recentExams,
    isLoading,
    error,
    refetch: fetchExams
  };
}

export function useExamTimer(examId: number, scheduledStart: string | null, scheduledEnd: string | null) {
  const [timeUntilStart, setTimeUntilStart] = useState<number | null>(null);
  const [timeUntilEnd, setTimeUntilEnd] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!scheduledStart) {
      setIsActive(true); // No schedule means always available
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const startTime = new Date(scheduledStart).getTime();
      const endTime = scheduledEnd ? new Date(scheduledEnd).getTime() : null;

      if (now < startTime) {
        // Exam hasn't started yet
        setTimeUntilStart(startTime - now);
        setTimeUntilEnd(null);
        setIsActive(false);
        setIsExpired(false);
      } else if (!endTime || now <= endTime) {
        // Exam is active
        setTimeUntilStart(null);
        setTimeUntilEnd(endTime ? endTime - now : null);
        setIsActive(true);
        setIsExpired(false);
      } else {
        // Exam has ended
        setTimeUntilStart(null);
        setTimeUntilEnd(null);
        setIsActive(false);
        setIsExpired(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [scheduledStart, scheduledEnd]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return {
    timeUntilStart: timeUntilStart ? formatTime(timeUntilStart) : null,
    timeUntilEnd: timeUntilEnd ? formatTime(timeUntilEnd) : null,
    isActive,
    isExpired
  };
}