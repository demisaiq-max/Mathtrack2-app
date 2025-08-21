import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  CheckCircle,
  XCircle,
  Trophy,
  Clock,
  BookOpen,
  Home,
} from 'lucide-react-native';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/auth-context';

interface ExamResultData {
  submissionId: number;
  examId: number;
  examTitle: string;
  subjectName: string;
  score: number;
  maxScore: number;
  percentage: number;
  questionsAnswered: number;
  totalQuestions: number;
  timeSpent: number; // in minutes
  passingScore: number;
}

export default function ExamResultsScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [resultData, setResultData] = useState<ExamResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get params - try both direct params and submissionId approach
  const submissionId = params.submissionId as string;
  const directScore = params.score ? parseInt(params.score as string) : null;
  const directMaxScore = params.maxScore ? parseInt(params.maxScore as string) : null;
  const directPercentage = params.percentage ? parseInt(params.percentage as string) : null;
  const directExamTitle = params.examTitle as string;

  useEffect(() => {
    const fetchResultData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // If we have direct params, use them (legacy support)
        if (directScore !== null && directMaxScore !== null && directPercentage !== null) {
          console.log('[ExamResults] Using direct params:', { directScore, directMaxScore, directPercentage });
          setResultData({
            submissionId: submissionId ? parseInt(submissionId) : 0,
            examId: 0, // Unknown for legacy params
            examTitle: directExamTitle || 'Exam',
            subjectName: 'Unknown Subject',
            score: directScore,
            maxScore: directMaxScore,
            percentage: directPercentage,
            questionsAnswered: Math.round((directScore / directMaxScore) * 5), // Estimate
            totalQuestions: 5, // Default estimate
            timeSpent: 45, // Default estimate
            passingScore: 70
          });
          setIsLoading(false);
          return;
        }

        // Otherwise fetch from database using submissionId
        if (!submissionId || !user?.id) {
          throw new Error('Missing submission ID or user authentication');
        }

        console.log('[ExamResults] Fetching submission data for ID:', submissionId);

        // Fetch submission with exam and question data
        const { data: submission, error: submissionError } = await supabase
          .from('exam_submissions')
          .select(`
            id,
            score_percent,
            earned_points,
            total_points,
            submitted_at,
            exams!inner(
              id,
              title,
              duration_minutes,
              passing_score,
              subjects!inner(name),
              exam_questions(id, points)
            ),
            submission_answers(id, question_id, is_correct, earned_points)
          `)
          .eq('id', submissionId)
          .eq('student_id', user.id)
          .single();

        if (submissionError) {
          console.error('[ExamResults] Error fetching submission:', submissionError);
          throw submissionError;
        }

        if (!submission) {
          throw new Error('Submission not found');
        }

        console.log('[ExamResults] Submission data:', submission);

        const exam = Array.isArray(submission.exams) ? submission.exams[0] : submission.exams;
        if (!exam) {
          throw new Error('Exam data not found');
        }
        
        const totalQuestions = exam.exam_questions?.length || 0;
        const questionsAnswered = submission.submission_answers?.length || 0;
        
        // Calculate time spent (estimate based on duration)
        const timeSpent = exam.duration_minutes || 60;

        const resultData: ExamResultData = {
          submissionId: submission.id,
          examId: exam.id,
          examTitle: exam.title,
          subjectName: (() => {
            if (Array.isArray(exam.subjects)) {
              return exam.subjects[0]?.name || 'Unknown Subject';
            } else if (exam.subjects && typeof exam.subjects === 'object' && 'name' in exam.subjects) {
              return (exam.subjects as any).name || 'Unknown Subject';
            }
            return 'Unknown Subject';
          })(),
          score: submission.earned_points || 0,
          maxScore: submission.total_points || 0,
          percentage: submission.score_percent || 0,
          questionsAnswered,
          totalQuestions,
          timeSpent,
          passingScore: exam.passing_score || 70
        };

        console.log('[ExamResults] Processed result data:', resultData);
        setResultData(resultData);

      } catch (err) {
        console.error('[ExamResults] Error fetching result data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResultData();
  }, [submissionId, user?.id, directScore, directMaxScore, directPercentage, directExamTitle]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Loading Results...' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading exam results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !resultData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Error' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Failed to load results'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.retryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { score, maxScore, percentage, questionsAnswered, timeSpent, subjectName, passingScore } = resultData;
  const isPassed = percentage >= passingScore;
  const grade = getGrade(percentage);
  const correctAnswers = Math.round((score / maxScore) * questionsAnswered);

  function getGrade(percent: number): string {
    if (percent >= 90) return 'A';
    if (percent >= 80) return 'B';
    if (percent >= 70) return 'C';
    if (percent >= 60) return 'D';
    return 'F';
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return '#10B981';
      case 'B': return '#3B82F6';
      case 'C': return '#F59E0B';
      case 'D': return '#EF4444';
      case 'F': return '#DC2626';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Exam Results',
          headerLeft: () => null,
          gestureEnabled: false,
        }} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <View style={[
            styles.resultIcon,
            { backgroundColor: isPassed ? '#D1FAE5' : '#FEE2E2' }
          ]}>
            {isPassed ? (
              <CheckCircle size={48} color="#10B981" />
            ) : (
              <XCircle size={48} color="#EF4444" />
            )}
          </View>
          
          <Text style={styles.resultTitle}>
            {isPassed ? 'Congratulations!' : 'Keep Trying!'}
          </Text>
          
          <Text style={styles.resultSubtitle}>
            {isPassed 
              ? 'You have successfully passed the exam'
              : 'You can retake the exam to improve your score'
            }
          </Text>
        </View>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Trophy size={24} color="#F59E0B" />
            <Text style={styles.scoreTitle}>Your Score</Text>
          </View>
          
          <View style={styles.scoreDetails}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Points Earned</Text>
              <Text style={styles.scoreValue}>{score} / {maxScore}</Text>
            </View>
            
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Percentage</Text>
              <Text style={[
                styles.scoreValue,
                { color: isPassed ? '#10B981' : '#EF4444' }
              ]}>
                {percentage}%
              </Text>
            </View>
            
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Grade</Text>
              <View style={[
                styles.gradeBadge,
                { backgroundColor: getGradeColor(grade) }
              ]}>
                <Text style={styles.gradeText}>{grade}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Performance Breakdown */}
        <View style={styles.performanceCard}>
          <Text style={styles.performanceTitle}>Performance Breakdown</Text>
          
          <View style={styles.performanceItem}>
            <View style={styles.performanceIcon}>
              <CheckCircle size={20} color="#10B981" />
            </View>
            <View style={styles.performanceDetails}>
              <Text style={styles.performanceLabel}>Correct Answers</Text>
              <Text style={styles.performanceValue}>
                {correctAnswers} out of {questionsAnswered} questions
              </Text>
            </View>
          </View>
          
          <View style={styles.performanceItem}>
            <View style={styles.performanceIcon}>
              <Clock size={20} color="#F59E0B" />
            </View>
            <View style={styles.performanceDetails}>
              <Text style={styles.performanceLabel}>Time Spent</Text>
              <Text style={styles.performanceValue}>{timeSpent} minutes</Text>
            </View>
          </View>
          
          <View style={styles.performanceItem}>
            <View style={styles.performanceIcon}>
              <BookOpen size={20} color="#3B82F6" />
            </View>
            <View style={styles.performanceDetails}>
              <Text style={styles.performanceLabel}>Subject</Text>
              <Text style={styles.performanceValue}>{subjectName}</Text>
            </View>
          </View>
        </View>

        {/* Feedback */}
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>Feedback</Text>
          <Text style={styles.feedbackText}>
            {isPassed 
              ? 'Excellent work! You demonstrated a strong understanding of the material. Keep up the great work and continue practicing to maintain your skills.'
              : 'Don&apos;t be discouraged! Review the topics you found challenging and practice more problems. Consider seeking help from your teacher or study group.'
            }
          </Text>
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsCard}>
          <Text style={styles.recommendationsTitle}>Next Steps</Text>
          
          {isPassed ? (
            <View style={styles.recommendationsList}>
              <Text style={styles.recommendationItem}>
                • Continue to the next chapter
              </Text>
              <Text style={styles.recommendationItem}>
                • Practice advanced problems
              </Text>
              <Text style={styles.recommendationItem}>
                • Help classmates who are struggling
              </Text>
            </View>
          ) : (
            <View style={styles.recommendationsList}>
              <Text style={styles.recommendationItem}>
                • Review the exam questions and explanations
              </Text>
              <Text style={styles.recommendationItem}>
                • Study the topics you missed
              </Text>
              <Text style={styles.recommendationItem}>
                • Schedule a meeting with your teacher
              </Text>
              <Text style={styles.recommendationItem}>
                • Retake the exam when you&apos;re ready
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace('/(tabs)/home')}
        >
          <Home size={16} color="#FFFFFF" />
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
        
        {!isPassed && resultData.examId > 0 && (
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => router.push(`/take-exam?examId=${resultData.examId}`)}
          >
            <Text style={styles.retakeButtonText}>Retake Exam</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  resultsHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  scoreDetails: {
    gap: 16,
  },
  scoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  performanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  performanceDetails: {
    flex: 1,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
  },
  recommendationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  homeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  retakeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});