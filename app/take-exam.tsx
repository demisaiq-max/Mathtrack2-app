import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Flag,
} from 'lucide-react-native';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/auth-context';

interface ExamQuestion {
  id: number;
  type: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'PROOF';
  prompt: string;
  options?: { key: string; text: string }[];
  correct_answer?: string;
  points: number;
  explanation?: string;
  position: number;
}

interface ExamData {
  id: number;
  title: string;
  description?: string;
  duration_minutes: number;
  instructions?: string;
  questions: ExamQuestion[];
  subject_name: string;
  grade_level: number;
  allowed_attempts: number;
}

export default function TakeExamScreen() {
  const params = useLocalSearchParams();
  const examId = params.examId as string;
  const { user } = useAuth();

  const [examData, setExamData] = useState<ExamData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: any }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);

  // Create submission record
  const createSubmission = useCallback(async (examId: number, allowedAttempts: number) => {
    if (!user?.id) {
      console.log('[TakeExam] No user ID for submission creation');
      setError('User authentication required');
      return;
    }

    console.log('[TakeExam] Creating submission for exam:', examId, 'user:', user.id);

    try {
      // Check existing submissions for this exam
      const { data: existingSubmissions, error: checkError } = await supabase
        .from('exam_submissions')
        .select('id, status, attempt_number')
        .eq('exam_id', examId)
        .eq('student_id', user.id)
        .order('attempt_number', { ascending: false });

      if (checkError) {
        console.error('[TakeExam] Error checking existing submissions:', checkError);
        console.error('[TakeExam] Full error object:', JSON.stringify(checkError, null, 2));
        setError(`Failed to check existing submissions: ${checkError.message || checkError.details || 'Unknown error'}`);
        return;
      }

      console.log('[TakeExam] Existing submissions:', existingSubmissions);

      // Check if there's a pending submission
      const pendingSubmission = existingSubmissions?.find(sub => sub.status === 'Pending');
      if (pendingSubmission) {
        console.log('[TakeExam] Using existing pending submission:', pendingSubmission.id);
        setSubmissionId(pendingSubmission.id);
        return;
      }

      // Check if user has reached attempt limit
      const completedAttempts = existingSubmissions?.filter(sub => sub.status === 'Graded').length || 0;
      const nextAttemptNumber = completedAttempts + 1;
      
      if (completedAttempts >= allowedAttempts) {
        setError(`You have reached the maximum number of attempts (${allowedAttempts}) for this exam.`);
        return;
      }

      // Create new submission
      const { data: newSubmission, error: createError } = await supabase
        .from('exam_submissions')
        .insert({
          exam_id: examId,
          student_id: user.id,
          attempt_number: nextAttemptNumber,
          status: 'Pending'
        })
        .select('id')
        .single();

      if (createError) {
        console.error('[TakeExam] Error creating submission:', createError);
        console.error('[TakeExam] Full create error object:', JSON.stringify(createError, null, 2));
        setError(`Failed to create submission: ${createError.message || createError.details || 'Unknown error'}`);
        return;
      }

      console.log('[TakeExam] Created new submission:', newSubmission.id, 'attempt:', nextAttemptNumber);
      setSubmissionId(newSubmission.id);

    } catch (err) {
      console.error('[TakeExam] Error in createSubmission:', err);
      console.error('[TakeExam] Full createSubmission error:', JSON.stringify(err, null, 2));
      setError(`Error creating submission: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [user?.id]);

  // Fetch exam data and questions from database
  const fetchExamData = useCallback(async () => {
    if (!examId || !user?.id) {
      console.log('[TakeExam] Missing required data:', { examId, userId: user?.id });
      setError('Missing exam ID or user authentication');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[TakeExam] Fetching exam data for ID:', examId);
      console.log('[TakeExam] User ID:', user.id);
      console.log('[TakeExam] User role:', user.accountType);
      console.log('[TakeExam] User grade:', user.gradeLevel);

      // Fetch exam with questions
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          description,
          duration_minutes,
          instructions,
          grade_level,
          allowed_attempts,
          subjects(name),
          exam_questions(
            id,
            type,
            prompt,
            options,
            correct_answer,
            points,
            explanation,
            position
          )
        `)
        .eq('id', examId)
        .single();

      if (examError) {
        console.error('[TakeExam] Error fetching exam:', examError);
        console.error('[TakeExam] Full exam error object:', JSON.stringify(examError, null, 2));
        setError(`Failed to load exam: ${examError.message || examError.details || 'Unknown error'}`);
        return;
      }

      if (!exam) {
        setError('Exam not found');
        return;
      }

      console.log('[TakeExam] Exam data loaded:', exam);

      // Sort questions by position
      const sortedQuestions = (exam.exam_questions || []).sort((a: any, b: any) => a.position - b.position);

      console.log('[TakeExam] Processing questions:', sortedQuestions.map(q => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt?.substring(0, 50) + '...',
        optionsCount: Array.isArray(q.options) ? q.options.length : 0,
        options: q.options
      })));

      const examData: ExamData = {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        duration_minutes: exam.duration_minutes,
        instructions: exam.instructions,
        subject_name: exam.subjects?.[0]?.name || 'Unknown Subject',
        grade_level: exam.grade_level,
        allowed_attempts: exam.allowed_attempts || 1,
        questions: sortedQuestions.map((q: any) => {
          // Ensure options is always an array for MCQ and TRUE_FALSE questions
          let processedOptions: any[] = [];
          
          if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
            if (q.options) {
              if (Array.isArray(q.options)) {
                processedOptions = q.options;
              } else if (typeof q.options === 'object' && q.options !== null) {
                // JSONB from database - could be array or object
                if (Array.isArray(q.options)) {
                  processedOptions = q.options;
                } else {
                  // Convert object to array if needed
                  processedOptions = Object.values(q.options);
                }
              } else if (typeof q.options === 'string') {
                try {
                  const parsed = JSON.parse(q.options);
                  processedOptions = Array.isArray(parsed) ? parsed : Object.values(parsed);
                } catch {
                  console.error('[TakeExam] Failed to parse options JSON:', q.options);
                  processedOptions = [];
                }
              }
            }
            
            // For TRUE_FALSE, ensure we have True/False options if none provided
            if (q.type === 'TRUE_FALSE' && processedOptions.length === 0) {
              processedOptions = [
                { key: 'True', text: 'True' },
                { key: 'False', text: 'False' }
              ];
            }
          }
          
          console.log(`[TakeExam] Question ${q.id}:`);
          console.log(`  - Type: ${q.type}`);
          console.log(`  - Raw options:`, q.options);
          console.log(`  - Processed options:`, processedOptions);
          console.log(`  - Options type:`, typeof q.options);
          console.log(`  - Options isArray:`, Array.isArray(q.options));
          
          return {
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            options: processedOptions,
            correct_answer: q.correct_answer,
            points: q.points,
            explanation: q.explanation,
            position: q.position
          };
        })
      };

      setExamData(examData);
      setTimeRemaining(examData.duration_minutes * 60); // Convert to seconds

      // Create or get existing submission
      await createSubmission(examData.id, examData.allowed_attempts);

    } catch (err) {
      console.error('[TakeExam] Error in fetchExamData:', err);
      console.error('[TakeExam] Full fetchExamData error:', JSON.stringify(err, null, 2));
      setError(`Error loading exam: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, [examId, user?.id, user?.accountType, user?.gradeLevel, createSubmission]);



  const handleSubmitExam = useCallback(async () => {
    if (!submissionId || !examData || !user?.id) {
      Alert.alert('Error', 'Unable to submit exam. Please try again.');
      return;
    }

    Alert.alert(
      'Submit Exam',
      'Are you sure you want to submit your exam? You cannot change your answers after submission.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            
            try {
              console.log('[TakeExam] Submitting exam with answers:', answers);

              // Save all answers to database
              const answerPromises = examData.questions.map(async (question) => {
                const userAnswer = answers[question.id];
                if (userAnswer === undefined || userAnswer === null) return;

                let answerData: any = {
                  submission_id: submissionId,
                  question_id: question.id
                };

                if (question.type === 'MCQ') {
                  // For MCQ, userAnswer is the index, convert to key
                  const selectedOption = question.options?.[userAnswer];
                  if (selectedOption) {
                    const optionKey = typeof selectedOption === 'object' ? selectedOption.key : String.fromCharCode(65 + userAnswer);
                    const optionText = typeof selectedOption === 'object' ? selectedOption.text : selectedOption;
                    answerData.selected_key = optionKey;
                    answerData.answer_text = optionText;
                  }
                } else if (question.type === 'TRUE_FALSE') {
                  answerData.selected_key = userAnswer; // 'True' or 'False'
                  answerData.answer_text = userAnswer;
                } else {
                  // For text-based answers
                  answerData.answer_text = userAnswer;
                }

                console.log('[TakeExam] Saving answer for question', question.id, ':', answerData);

                const { error } = await supabase
                  .from('submission_answers')
                  .upsert(answerData, {
                    onConflict: 'submission_id,question_id'
                  });

                if (error) {
                  console.error('[TakeExam] Error saving answer:', error);
                  console.error('[TakeExam] Full answer save error:', JSON.stringify(error, null, 2));
                  throw error;
                }
              });

              await Promise.all(answerPromises);

              // Update submission status and submitted_at
              const { error: updateError } = await supabase
                .from('exam_submissions')
                .update({
                  status: 'Graded', // Auto-graded by trigger
                  submitted_at: new Date().toISOString()
                })
                .eq('id', submissionId);

              if (updateError) {
                console.error('[TakeExam] Error updating submission:', updateError);
                console.error('[TakeExam] Full update error:', JSON.stringify(updateError, null, 2));
                throw updateError;
              }

              // Fetch final results
              const { data: finalSubmission, error: fetchError } = await supabase
                .from('exam_submissions')
                .select('score_percent, earned_points, total_points')
                .eq('id', submissionId)
                .single();

              if (fetchError) {
                console.error('[TakeExam] Error fetching results:', fetchError);
                console.error('[TakeExam] Full fetch results error:', JSON.stringify(fetchError, null, 2));
                throw fetchError;
              }

              console.log('[TakeExam] Exam submitted successfully:', finalSubmission);

              // Navigate to answer sheet upload
              router.replace(`/answer-sheet-upload?submissionId=${submissionId}&examTitle=${encodeURIComponent(examData.title)}`);

            } catch (err) {
              console.error('[TakeExam] Error submitting exam:', err);
              console.error('[TakeExam] Full submit error:', JSON.stringify(err, null, 2));
              Alert.alert('Error', `Failed to submit exam: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  }, [submissionId, examData, answers, user?.id]);

  useEffect(() => {
    fetchExamData();
  }, [fetchExamData]);

  useEffect(() => {
    if (!examData) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleSubmitExam, examData]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: any) => {
    if (!examData) return;
    const currentQuestion = examData.questions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (!examData || currentQuestionIndex >= examData.questions.length - 1) return;
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const isTimeRunningOut = timeRemaining < 300; // Less than 5 minutes

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Loading Exam...' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading exam...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !examData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Error' }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Failed to load exam'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchExamData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = examData.questions[currentQuestionIndex];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: examData.title,
          headerLeft: () => null,
          gestureEnabled: false,
        }} 
      />
      
      {/* Timer and Progress */}
      <View style={styles.header}>
        <View style={styles.timerContainer}>
          <Clock size={16} color={isTimeRunningOut ? '#EF4444' : '#6B7280'} />
          <Text style={[
            styles.timerText,
            isTimeRunningOut && styles.timerTextWarning
          ]}>
            {formatTime(timeRemaining)}
          </Text>
        </View>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {examData.questions.length}
          </Text>
          <Text style={styles.answeredText}>
            {getAnsweredCount()} answered
          </Text>
          {examData.allowed_attempts > 1 && (
            <Text style={styles.attemptsText}>
              Attempts: {examData.allowed_attempts}
            </Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <View style={styles.questionContainer}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>
              Question {currentQuestionIndex + 1}
            </Text>
            <Text style={styles.questionPoints}>
              {currentQuestion.points} points
            </Text>
          </View>
          
          <Text style={styles.questionText}>
            {currentQuestion.prompt}
          </Text>
        </View>

        {/* Answer Options */}
        <View style={styles.answersContainer}>
          {currentQuestion.type === 'MCQ' && (
            <View style={styles.multipleChoiceContainer}>
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                currentQuestion.options.map((option, index) => {
                  // Handle both object format {key: 'A', text: 'Answer'} and string format
                  const optionKey = typeof option === 'object' ? option.key : String.fromCharCode(65 + index); // A, B, C, D
                  const optionText = typeof option === 'object' ? option.text : option;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        answers[currentQuestion.id] === index && styles.optionButtonSelected
                      ]}
                      onPress={() => handleAnswerSelect(index)}
                    >
                      <View style={[
                        styles.optionCircle,
                        answers[currentQuestion.id] === index && styles.optionCircleSelected
                      ]}>
                        <Text style={[
                          styles.optionLetter,
                          answers[currentQuestion.id] === index && styles.optionLetterSelected
                        ]}>
                          {optionKey}
                        </Text>
                      </View>
                      <Text style={[
                        styles.optionText,
                        answers[currentQuestion.id] === index && styles.optionTextSelected
                      ]}>
                        {optionText}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.noOptionsContainer}>
                  <Text style={styles.noOptionsText}>No options available for this question</Text>
                  <Text style={styles.debugText}>Debug: {JSON.stringify(currentQuestion.options)}</Text>
                </View>
              )}
            </View>
          )}

          {currentQuestion.type === 'TRUE_FALSE' && (
            <View style={styles.trueFalseContainer}>
              <TouchableOpacity
                style={[
                  styles.trueFalseButton,
                  answers[currentQuestion.id] === 'True' && styles.trueFalseButtonSelected
                ]}
                onPress={() => handleAnswerSelect('True')}
              >
                <CheckCircle 
                  size={20} 
                  color={answers[currentQuestion.id] === 'True' ? '#FFFFFF' : '#10B981'} 
                />
                <Text style={[
                  styles.trueFalseText,
                  answers[currentQuestion.id] === 'True' && styles.trueFalseTextSelected
                ]}>
                  True
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.trueFalseButton,
                  answers[currentQuestion.id] === 'False' && styles.trueFalseButtonSelected
                ]}
                onPress={() => handleAnswerSelect('False')}
              >
                <AlertCircle 
                  size={20} 
                  color={answers[currentQuestion.id] === 'False' ? '#FFFFFF' : '#EF4444'} 
                />
                <Text style={[
                  styles.trueFalseText,
                  answers[currentQuestion.id] === 'False' && styles.trueFalseTextSelected
                ]}>
                  False
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentQuestionIndex === 0 && styles.navButtonDisabled
          ]}
          onPress={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Text style={[
            styles.navButtonText,
            currentQuestionIndex === 0 && styles.navButtonTextDisabled
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        {currentQuestionIndex < examData.questions.length - 1 ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextQuestion}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitExam}
            disabled={isSubmitting}
          >
            <Flag size={16} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  timerTextWarning: {
    color: '#EF4444',
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  answeredText: {
    fontSize: 12,
    color: '#6B7280',
  },
  attemptsText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  noOptionsContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  noOptionsText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  questionContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  questionPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#111827',
  },
  answersContainer: {
    margin: 16,
  },
  multipleChoiceContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  optionButtonSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  optionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionCircleSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  optionLetterSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  optionTextSelected: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  trueFalseContainer: {
    gap: 12,
  },
  trueFalseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  trueFalseButtonSelected: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  trueFalseText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  trueFalseTextSelected: {
    color: '#FFFFFF',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  navButtonTextDisabled: {
    color: '#D1D5DB',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});