import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Plus,
  Trash2,
  Wand2,
  Save,
  BookOpen,
  Settings,
  ChevronDown,

} from 'lucide-react-native';
import { Question, QuestionType, ExamTemplate, AIQuestionRequest } from '@/types/exam';
import { useLanguage } from '@/hooks/language-context';
import { useTheme } from '@/hooks/theme-context';
import { supabase } from '@/config/supabase';

const GRADES = ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science'];
const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'true-false', label: 'True/False' },
  { value: 'short-answer', label: 'Short Answer' },
  { value: 'essay', label: 'Essay' },
];

export default function EditExamScreen() {
  const params = useLocalSearchParams();
  const examId = params.examId as string;
  const { t } = useLanguage();
  const { colors } = useTheme();
  
  const [examData, setExamData] = useState<Partial<ExamTemplate>>({
    title: '',
    description: '',
    subject: '',
    grade: '',
    duration: 60,
    instructions: '',
    allowedAttempts: 1,
    shuffleQuestions: false,
    showResults: true,
    passingScore: 60,
    questions: [],
    status: 'draft',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentStep, setCurrentStep] = useState<'basic' | 'questions' | 'settings'>('basic');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode] = useState<'date' | 'time'>('date');
  const [currentField, setCurrentField] = useState<'startDate' | 'startTime' | 'endDate' | 'endTime' | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [aiRequest, setAiRequest] = useState<AIQuestionRequest>({
    subject: '',
    grade: '',
    topic: '',
    difficulty: 'medium',
    questionType: 'multiple-choice',
    count: 5,
  });

  const formatDateInput = useCallback((text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    const y = digits.slice(0, 4);
    const m = digits.slice(4, 6);
    const d = digits.slice(6, 8);
    let out = y;
    if (m) out += '-' + m;
    if (d) out += '-' + d;
    return out;
  }, []);

  const formatTimeInput = useCallback((text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    const hh = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    let out = hh;
    if (mm) out += ':' + mm;
    return out;
  }, []);



  // Load existing exam data from Supabase
  const loadExamData = useCallback(async () => {
    if (!examId) {
      setLoading(false);
      return;
    }

    try {
      console.log('Loading exam data for ID:', examId);
      
      // Fetch exam with subject name
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select(`
          *,
          subjects!inner(name)
        `)
        .eq('id', examId)
        .single();

      if (examError) {
        console.error('Error fetching exam:', examError);
        Alert.alert('Error', 'Failed to load exam data');
        return;
      }

      if (!examData) {
        Alert.alert('Error', 'Exam not found');
        router.back();
        return;
      }

      // Fetch exam questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('position');

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        Alert.alert('Error', 'Failed to load exam questions');
        return;
      }

      // Transform database data to match our ExamTemplate interface
      const transformedQuestions: Question[] = (questionsData || []).map(q => ({
        id: q.id.toString(),
        type: q.type.toLowerCase().replace('_', '-') as QuestionType,
        question: q.prompt,
        options: q.options ? q.options.map((opt: any) => opt.text) : [],
        correctAnswer: q.type === 'MCQ' ? 
          (q.options?.findIndex((opt: any) => opt.key === q.correct_answer) ?? 0) :
          q.correct_answer,
        points: parseFloat(q.points?.toString() || '1'),
        explanation: q.explanation || '',
      }));

      // Format dates and times
      const formatDateTime = (timestamp: string | null) => {
        if (!timestamp) return { date: '', time: '' };
        const dt = new Date(timestamp);
        return {
          date: dt.toISOString().split('T')[0],
          time: dt.toTimeString().slice(0, 5)
        };
      };

      const startDateTime = formatDateTime(examData.scheduled_start);
      const endDateTime = formatDateTime(examData.scheduled_end);

      const transformedExam: Partial<ExamTemplate> = {
        id: examData.id.toString(),
        title: examData.title,
        description: examData.description || '',
        subject: examData.subjects.name,
        grade: `Grade ${examData.grade_level}`,
        duration: examData.duration_minutes,
        instructions: examData.instructions || '',
        allowedAttempts: examData.allowed_attempts,
        shuffleQuestions: examData.shuffle_questions,
        showResults: examData.show_results,
        passingScore: parseFloat(examData.passing_score?.toString() || '60'),
        questions: transformedQuestions,
        status: examData.status?.toLowerCase() || 'draft',
        startDate: startDateTime.date,
        endDate: endDateTime.date,
        startTime: startDateTime.time,
        endTime: endDateTime.time,
      };

      console.log('Transformed exam data:', transformedExam);
      setExamData(transformedExam);
      
      // Set AI request defaults
      setAiRequest(prev => ({
        ...prev,
        subject: examData.subjects.name,
        grade: `Grade ${examData.grade_level}`,
      }));
      
      // Set date/time picker values
      if (examData.scheduled_start) {
        const startDt = new Date(examData.scheduled_start);
        setStartDate(startDt);
        setStartTime(startDt);
      }
      if (examData.scheduled_end) {
        const endDt = new Date(examData.scheduled_end);
        setEndDate(endDt);
        setEndTime(endDt);
      }
      
    } catch (error) {
      console.error('Error loading exam data:', error);
      Alert.alert('Error', 'Failed to load exam data');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    loadExamData();
  }, [loadExamData]);

  const generateQuestionsWithAI = async () => {
    if (!aiRequest.subject || !aiRequest.grade || !aiRequest.topic) {
      Alert.alert('Error', 'Please fill in all required fields for AI generation');
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const prompt = `Generate ${aiRequest.count} ${aiRequest.questionType} questions for ${aiRequest.subject} subject, ${aiRequest.grade} level, topic: ${aiRequest.topic}, difficulty: ${aiRequest.difficulty}.

For multiple choice questions, provide 4 options with the correct answer index.
For true/false questions, provide the correct boolean answer.
For short answer and essay questions, provide a sample correct answer.

Format the response as a JSON array with this structure:
[
  {
    "question": "Question text here",
    "type": "${aiRequest.questionType}",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"], // only for multiple choice
    "correctAnswer": 0, // index for multiple choice, true/false for boolean, string for others
    "points": 2,
    "explanation": "Brief explanation of the correct answer"
  }
]`;

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      const data = await response.json();
      const generatedQuestions = JSON.parse(data.completion);
      
      const newQuestions: Question[] = generatedQuestions.map((q: any, index: number) => ({
        id: `q_${Date.now()}_${index}`,
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points || 2,
        explanation: q.explanation,
      }));

      setExamData(prev => ({
        ...prev,
        questions: [...(prev.questions || []), ...newQuestions],
      }));

      Alert.alert('Success', `Generated ${newQuestions.length} questions successfully!`);
    } catch (error) {
      console.error('Error generating questions:', error);
      Alert.alert('Error', 'Failed to generate questions. Please try again.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const addManualQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 2,
    };

    setExamData(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion],
    }));
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setExamData(prev => ({
      ...prev,
      questions: prev.questions?.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      ) || [],
    }));
  };

  const deleteQuestion = (questionId: string) => {
    setExamData(prev => ({
      ...prev,
      questions: prev.questions?.filter(q => q.id !== questionId) || [],
    }));
  };

  const saveExam = async () => {
    if (!examData.title || !examData.subject || !examData.grade) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!examData.questions || examData.questions.length === 0) {
      Alert.alert('Error', 'Please add at least one question');
      return;
    }

    setSaving(true);
    try {
      console.log('Saving exam data:', examData);
      
      // Get subject ID
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', examData.subject)
        .single();

      if (subjectError || !subjectData) {
        console.error('Subject not found:', subjectError);
        Alert.alert('Error', 'Subject not found. Please select a valid subject.');
        return;
      }

      // Prepare scheduled dates
      let scheduledStart = null;
      let scheduledEnd = null;
      
      if (examData.startDate && examData.startTime) {
        scheduledStart = `${examData.startDate}T${examData.startTime}:00`;
      }
      if (examData.endDate && examData.endTime) {
        scheduledEnd = `${examData.endDate}T${examData.endTime}:00`;
      }

      // Update exam
      const { error: examError } = await supabase
        .from('exams')
        .update({
          title: examData.title,
          description: examData.description || null,
          subject_id: subjectData.id,
          grade_level: parseInt(examData.grade?.replace('Grade ', '') || '5'),
          duration_minutes: examData.duration || 60,
          instructions: examData.instructions || null,
          allowed_attempts: examData.allowedAttempts || 1,
          passing_score: examData.passingScore || 60,
          shuffle_questions: examData.shuffleQuestions || false,
          show_results: examData.showResults !== false,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
          status: examData.status || 'Active',
        })
        .eq('id', examId);

      if (examError) {
        console.error('Error updating exam:', examError);
        Alert.alert('Error', `Failed to update exam: ${examError.message}`);
        return;
      }

      // Delete existing questions
      const { error: deleteError } = await supabase
        .from('exam_questions')
        .delete()
        .eq('exam_id', examId);

      if (deleteError) {
        console.error('Error deleting old questions:', deleteError);
        Alert.alert('Error', 'Failed to update questions');
        return;
      }

      // Insert new questions
      if (examData.questions && examData.questions.length > 0) {
        const questionsToInsert = examData.questions.map((q, index) => {
          // Transform question type
          let dbType = 'MCQ';
          if (q.type === 'true-false') dbType = 'TRUE_FALSE';
          else if (q.type === 'short-answer') dbType = 'SHORT_ANSWER';
          else if (q.type === 'essay') dbType = 'ESSAY';

          // Transform options and correct answer
          let options = null;
          let correctAnswer = null;
          
          if (q.type === 'multiple-choice' && q.options) {
            options = q.options.map((opt, idx) => ({
              key: String.fromCharCode(65 + idx), // A, B, C, D
              text: opt
            }));
            correctAnswer = String.fromCharCode(65 + (q.correctAnswer as number));
          } else if (q.type === 'true-false') {
            options = [
              { key: 'T', text: 'True' },
              { key: 'F', text: 'False' }
            ];
            const isTrue = (typeof q.correctAnswer === 'string' && q.correctAnswer === 'true') || 
                          (typeof q.correctAnswer === 'boolean' && q.correctAnswer === true);
            correctAnswer = isTrue ? 'T' : 'F';
          } else {
            correctAnswer = q.correctAnswer?.toString() || '';
          }

          return {
            exam_id: parseInt(examId),
            position: index + 1,
            type: dbType,
            difficulty: 'Medium' as const,
            points: q.points || 1,
            prompt: q.question,
            options,
            correct_answer: correctAnswer,
            explanation: q.explanation || null,
            ai_generated: false,
          };
        });

        const { error: insertError } = await supabase
          .from('exam_questions')
          .insert(questionsToInsert);

        if (insertError) {
          console.error('Error inserting questions:', insertError);
          Alert.alert('Error', `Failed to save questions: ${insertError.message}`);
          return;
        }
      }

      console.log('Exam updated successfully');
      Alert.alert('Success', 'Exam updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      
    } catch (error) {
      console.error('Error saving exam:', error);
      Alert.alert('Error', 'Failed to save exam. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getSubjectTranslation = (subject: string) => {
    const subjectMap: { [key: string]: string } = {
      'Mathematics': 'mathematics',
      'Physics': 'physics',
      'Chemistry': 'chemistry',
      'Biology': 'biology',
      'English': 'englishSubject',
      'History': 'history',
      'Geography': 'geography',
      'Computer Science': 'science'
    };
    const translationKey = subjectMap[subject];
    return translationKey ? t(translationKey as any) : subject;
  };

  const getStyles = () => StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
    stepNavigation: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    stepButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      marginRight: 12,
      gap: 6,
    },
    stepButtonActive: {
      backgroundColor: colors.primary,
    },
    stepButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    stepButtonTextActive: {
      color: colors.primaryText,
    },
    stepContainer: {
      padding: 20,
    },
    stepTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    halfWidth: {
      flex: 1,
    },
    pickerOption: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginHorizontal: 4,
      borderRadius: 6,
    },
    pickerOptionSelected: {
      backgroundColor: colors.primary,
    },
    pickerOptionText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    pickerOptionTextSelected: {
      color: colors.primaryText,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      gap: 4,
    },
    saveButtonText: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: '600',
    },
    questionsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    questionActions: {
      flexDirection: 'row',
      gap: 8,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 4,
    },
    addButtonText: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: '600',
    },
    aiGenerator: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    aiTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#8B5CF6',
    },
    aiForm: {
      gap: 12,
    },
    generateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#8B5CF6',
      borderRadius: 8,
      paddingVertical: 12,
      gap: 8,
    },
    generateButtonDisabled: {
      opacity: 0.6,
    },
    generateButtonText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '600',
    },
    questionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    questionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    questionNumber: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    questionInput: {
      marginBottom: 12,
      minHeight: 60,
    },
    optionsContainer: {
      marginTop: 12,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    optionSelector: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    optionSelectorSelected: {
      borderColor: colors.success,
      backgroundColor: colors.success,
    },
    optionLetter: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.textSecondary,
    },
    optionInput: {
      flex: 1,
    },
    trueFalseContainer: {
      marginTop: 12,
    },
    trueFalseOptions: {
      flexDirection: 'row',
      gap: 12,
    },
    trueFalseOption: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    trueFalseOptionSelected: {
      borderColor: colors.success,
      backgroundColor: colors.success,
    },
    trueFalseText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    trueFalseTextSelected: {
      color: colors.primaryText,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingInfo: {
      flex: 1,
      marginRight: 16,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    settingInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
      width: 80,
      textAlign: 'center',
    },
    scrollContent: {
      paddingHorizontal: 4,
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      minHeight: 44,
    },
    dropdownButtonText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dropdownModal: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      width: '100%',
      maxWidth: 300,
      maxHeight: 400,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    dropdownTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    dropdownList: {
      maxHeight: 300,
    },
    dropdownItem: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 4,
    },
    dropdownItemSelected: {
      backgroundColor: colors.primary,
    },
    dropdownItemText: {
      fontSize: 16,
      color: colors.text,
    },
    dropdownItemTextSelected: {
      color: colors.primaryText,
      fontWeight: '600',
    },
    scheduleSection: {
      marginTop: 24,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    sectionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    helperText: {
      marginTop: 6,
      fontSize: 12,
      color: colors.textSecondary,
    },
    pickerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 30000,
    },
    pickerContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      margin: 20,
      minWidth: 300,
      maxWidth: 350,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    pickerContent: {
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    pickerButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    pickerButtonText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    pickerButtonTextDone: {
      color: colors.primary,
      fontWeight: '600',
    },
  });

  const dynamicStyles = getStyles();

  const renderBasicInfo = () => (
    <View style={dynamicStyles.stepContainer}>
      <Text style={dynamicStyles.stepTitle}>Basic Information</Text>
      
      <View style={dynamicStyles.inputGroup}>
        <Text style={dynamicStyles.label}>{t('title')} *</Text>
        <TextInput
          style={dynamicStyles.input}
          value={examData.title}
          onChangeText={(text) => setExamData(prev => ({ ...prev, title: text }))}
          placeholder={t('enterTitle')}
        />
      </View>

      <View style={dynamicStyles.inputGroup}>
        <Text style={dynamicStyles.label}>Description</Text>
        <TextInput
          style={[dynamicStyles.input, dynamicStyles.textArea]}
          value={examData.description}
          onChangeText={(text) => setExamData(prev => ({ ...prev, description: text }))}
          placeholder="Enter exam description"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={dynamicStyles.row}>
        <View style={[dynamicStyles.inputGroup, dynamicStyles.halfWidth]}>
          <Text style={dynamicStyles.label}>{t('subject')} *</Text>
          <TouchableOpacity 
            style={dynamicStyles.dropdownButton}
            onPress={() => setShowSubjectDropdown(true)}
          >
            <Text style={dynamicStyles.dropdownButtonText}>
              {examData.subject ? getSubjectTranslation(examData.subject) : 'Select Subject'}
            </Text>
            <ChevronDown size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[dynamicStyles.inputGroup, dynamicStyles.halfWidth]}>
          <Text style={dynamicStyles.label}>{t('grade')} *</Text>
          <TouchableOpacity 
            style={dynamicStyles.dropdownButton}
            onPress={() => setShowGradeDropdown(true)}
          >
            <Text style={dynamicStyles.dropdownButtonText}>
              {examData.grade || 'Select Grade'}
            </Text>
            <ChevronDown size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subject Dropdown Modal */}
      <Modal
        visible={showSubjectDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubjectDropdown(false)}
      >
        <TouchableOpacity 
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSubjectDropdown(false)}
        >
          <View style={dynamicStyles.dropdownModal}>
            <Text style={dynamicStyles.dropdownTitle}>Select Subject</Text>
            <FlatList
              data={SUBJECTS}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={true}
              style={dynamicStyles.dropdownList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    dynamicStyles.dropdownItem,
                    examData.subject === item && dynamicStyles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    setExamData(prev => ({ ...prev, subject: item }));
                    setShowSubjectDropdown(false);
                  }}
                >
                  <Text style={[
                    dynamicStyles.dropdownItemText,
                    examData.subject === item && dynamicStyles.dropdownItemTextSelected
                  ]}>
                    {getSubjectTranslation(item)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Grade Dropdown Modal */}
      <Modal
        visible={showGradeDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGradeDropdown(false)}
      >
        <TouchableOpacity 
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGradeDropdown(false)}
        >
          <View style={dynamicStyles.dropdownModal}>
            <Text style={dynamicStyles.dropdownTitle}>Select Grade</Text>
            <FlatList
              data={GRADES}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={true}
              style={dynamicStyles.dropdownList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    dynamicStyles.dropdownItem,
                    examData.grade === item && dynamicStyles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    setExamData(prev => ({ ...prev, grade: item }));
                    setShowGradeDropdown(false);
                  }}
                >
                  <Text style={[
                    dynamicStyles.dropdownItemText,
                    examData.grade === item && dynamicStyles.dropdownItemTextSelected
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={dynamicStyles.inputGroup}>
        <Text style={dynamicStyles.label}>{t('duration')} (minutes)</Text>
        <TextInput
          style={dynamicStyles.input}
          value={examData.duration?.toString()}
          onChangeText={(text) => setExamData(prev => ({ ...prev, duration: parseInt(text) || 60 }))}
          placeholder="60"
          keyboardType="numeric"
        />
      </View>

      <View style={dynamicStyles.inputGroup}>
        <Text style={dynamicStyles.label}>Instructions</Text>
        <TextInput
          style={[dynamicStyles.input, dynamicStyles.textArea]}
          value={examData.instructions}
          onChangeText={(text) => setExamData(prev => ({ ...prev, instructions: text }))}
          placeholder="Enter exam instructions for students"
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Schedule Section */}
      <View style={dynamicStyles.scheduleSection}>
        <Text style={dynamicStyles.sectionTitle}>Schedule (Optional)</Text>
        <Text style={dynamicStyles.sectionDescription}>Set start and end dates/times for the exam. If not set, the exam will be available immediately.</Text>
        
        <View style={dynamicStyles.row}>
          <View style={[dynamicStyles.inputGroup, dynamicStyles.halfWidth]}>
            <Text style={dynamicStyles.label}>Start Date</Text>
            <TextInput
              testID="start-date-input"
              style={dynamicStyles.input}
              value={examData.startDate ?? ''}
              onChangeText={(text) => {
                const formatted = formatDateInput(text);
                setExamData((prev) => ({ ...prev, startDate: formatted }));
              }}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />
            <Text style={dynamicStyles.helperText}>Format: YYYY-MM-DD</Text>
          </View>

          <View style={[dynamicStyles.inputGroup, dynamicStyles.halfWidth]}>
            <Text style={dynamicStyles.label}>Start Time</Text>
            <TextInput
              testID="start-time-input"
              style={dynamicStyles.input}
              value={examData.startTime ?? ''}
              onChangeText={(text) => {
                const formatted = formatTimeInput(text);
                setExamData((prev) => ({ ...prev, startTime: formatted }));
              }}
              placeholder="HH:MM"
              keyboardType="numeric"
            />
            <Text style={dynamicStyles.helperText}>Format: HH:MM (24h)</Text>
          </View>
        </View>

        <View style={dynamicStyles.row}>
          <View style={[dynamicStyles.inputGroup, dynamicStyles.halfWidth]}>
            <Text style={dynamicStyles.label}>End Date</Text>
            <TextInput
              testID="end-date-input"
              style={dynamicStyles.input}
              value={examData.endDate ?? ''}
              onChangeText={(text) => {
                const formatted = formatDateInput(text);
                setExamData((prev) => ({ ...prev, endDate: formatted }));
              }}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />
            <Text style={dynamicStyles.helperText}>Format: YYYY-MM-DD</Text>
          </View>

          <View style={[dynamicStyles.inputGroup, dynamicStyles.halfWidth]}>
            <Text style={dynamicStyles.label}>End Time</Text>
            <TextInput
              testID="end-time-input"
              style={dynamicStyles.input}
              value={examData.endTime ?? ''}
              onChangeText={(text) => {
                const formatted = formatTimeInput(text);
                setExamData((prev) => ({ ...prev, endTime: formatted }));
              }}
              placeholder="HH:MM"
              keyboardType="numeric"
            />
            <Text style={dynamicStyles.helperText}>Format: HH:MM (24h)</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderQuestions = () => (
    <View style={dynamicStyles.stepContainer}>
      <View style={dynamicStyles.questionsHeader}>
        <Text style={dynamicStyles.stepTitle}>{t('questions')} ({examData.questions?.length || 0})</Text>
        <View style={dynamicStyles.questionActions}>
          <TouchableOpacity style={dynamicStyles.addButton} onPress={addManualQuestion}>
            <Plus size={16} color={colors.primaryText} />
            <Text style={dynamicStyles.addButtonText}>Add Question</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Question Generator */}
      <View style={dynamicStyles.aiGenerator}>
        <View style={dynamicStyles.aiHeader}>
          <Wand2 size={20} color="#8B5CF6" />
          <Text style={dynamicStyles.aiTitle}>AI Question Generator</Text>
        </View>
        
        <View style={dynamicStyles.aiForm}>
          <View style={dynamicStyles.row}>
            <View style={[dynamicStyles.inputGroup, dynamicStyles.halfWidth]}>
              <Text style={dynamicStyles.label}>Topic</Text>
              <TextInput
                style={dynamicStyles.input}
                value={aiRequest.topic}
                onChangeText={(text) => setAiRequest(prev => ({ ...prev, topic: text }))}
                placeholder="e.g., Algebra, Photosynthesis"
              />
            </View>
            <View style={[dynamicStyles.inputGroup, dynamicStyles.halfWidth]}>
              <Text style={dynamicStyles.label}>Count</Text>
              <TextInput
                style={dynamicStyles.input}
                value={aiRequest.count.toString()}
                onChangeText={(text) => setAiRequest(prev => ({ ...prev, count: parseInt(text) || 5 }))}
                keyboardType="numeric"
                placeholder="5"
              />
            </View>
          </View>

          <View style={dynamicStyles.row}>
            <View style={[dynamicStyles.inputGroup, dynamicStyles.halfWidth]}>
              <Text style={dynamicStyles.label}>Question Type</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={dynamicStyles.scrollContent}
              >
                {QUESTION_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      dynamicStyles.pickerOption,
                      aiRequest.questionType === type.value && dynamicStyles.pickerOptionSelected
                    ]}
                    onPress={() => setAiRequest(prev => ({ ...prev, questionType: type.value }))}
                  >
                    <Text style={[
                      dynamicStyles.pickerOptionText,
                      aiRequest.questionType === type.value && dynamicStyles.pickerOptionTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={[dynamicStyles.inputGroup, dynamicStyles.halfWidth]}>
              <Text style={dynamicStyles.label}>Difficulty</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={dynamicStyles.scrollContent}
              >
                {['easy', 'medium', 'hard'].map(difficulty => (
                  <TouchableOpacity
                    key={difficulty}
                    style={[
                      dynamicStyles.pickerOption,
                      aiRequest.difficulty === difficulty && dynamicStyles.pickerOptionSelected
                    ]}
                    onPress={() => setAiRequest(prev => ({ ...prev, difficulty: difficulty as any }))}
                  >
                    <Text style={[
                      dynamicStyles.pickerOptionText,
                      aiRequest.difficulty === difficulty && dynamicStyles.pickerOptionTextSelected
                    ]}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity 
            style={[dynamicStyles.generateButton, isGeneratingQuestions && dynamicStyles.generateButtonDisabled]} 
            onPress={generateQuestionsWithAI}
            disabled={isGeneratingQuestions}
          >
            {isGeneratingQuestions ? (
              <ActivityIndicator size="small" color={colors.primaryText} />
            ) : (
              <Wand2 size={16} color={colors.primaryText} />
            )}
            <Text style={dynamicStyles.generateButtonText}>
              {isGeneratingQuestions ? 'Generating...' : 'Generate Questions'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Questions List */}
      {examData.questions?.map((question, index) => (
        <View key={question.id} style={dynamicStyles.questionCard}>
          <View style={dynamicStyles.questionHeader}>
            <Text style={dynamicStyles.questionNumber}>Question {index + 1}</Text>
            <TouchableOpacity onPress={() => deleteQuestion(question.id)}>
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[dynamicStyles.input, dynamicStyles.questionInput]}
            value={question.question}
            onChangeText={(text) => updateQuestion(question.id, { question: text })}
            placeholder="Enter your question here"
            multiline
          />

          <View style={dynamicStyles.row}>
            <View style={[dynamicStyles.inputGroup, dynamicStyles.halfWidth]}>
              <Text style={dynamicStyles.label}>Type</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={dynamicStyles.scrollContent}
              >
                {QUESTION_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      dynamicStyles.pickerOption,
                      question.type === type.value && dynamicStyles.pickerOptionSelected
                    ]}
                    onPress={() => updateQuestion(question.id, { type: type.value })}
                  >
                    <Text style={[
                      dynamicStyles.pickerOptionText,
                      question.type === type.value && dynamicStyles.pickerOptionTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={[dynamicStyles.inputGroup, dynamicStyles.halfWidth]}>
              <Text style={dynamicStyles.label}>Points</Text>
              <TextInput
                style={dynamicStyles.input}
                value={question.points.toString()}
                onChangeText={(text) => updateQuestion(question.id, { points: parseInt(text) || 1 })}
                keyboardType="numeric"
                placeholder="2"
              />
            </View>
          </View>

          {question.type === 'multiple-choice' && (
            <View style={dynamicStyles.optionsContainer}>
              <Text style={dynamicStyles.label}>Options</Text>
              {question.options?.map((option, optionIndex) => (
                <View key={optionIndex} style={dynamicStyles.optionRow}>
                  <TouchableOpacity
                    style={[
                      dynamicStyles.optionSelector,
                      question.correctAnswer === optionIndex && dynamicStyles.optionSelectorSelected
                    ]}
                    onPress={() => updateQuestion(question.id, { correctAnswer: optionIndex })}
                  >
                    <Text style={dynamicStyles.optionLetter}>{String.fromCharCode(65 + optionIndex)}</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[dynamicStyles.input, dynamicStyles.optionInput]}
                    value={option}
                    onChangeText={(text) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[optionIndex] = text;
                      updateQuestion(question.id, { options: newOptions });
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                  />
                </View>
              ))}
            </View>
          )}

          {question.type === 'true-false' && (
            <View style={dynamicStyles.trueFalseContainer}>
              <Text style={dynamicStyles.label}>Correct Answer</Text>
              <View style={dynamicStyles.trueFalseOptions}>
                <TouchableOpacity
                  style={[
                    dynamicStyles.trueFalseOption,
                    question.correctAnswer === 'true' && dynamicStyles.trueFalseOptionSelected
                  ]}
                  onPress={() => updateQuestion(question.id, { correctAnswer: 'true' })}
                >
                  <Text style={[
                    dynamicStyles.trueFalseText,
                    question.correctAnswer === 'true' && dynamicStyles.trueFalseTextSelected
                  ]}>True</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    dynamicStyles.trueFalseOption,
                    question.correctAnswer === 'false' && dynamicStyles.trueFalseOptionSelected
                  ]}
                  onPress={() => updateQuestion(question.id, { correctAnswer: 'false' })}
                >
                  <Text style={[
                    dynamicStyles.trueFalseText,
                    question.correctAnswer === 'false' && dynamicStyles.trueFalseTextSelected
                  ]}>False</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Explanation (Optional)</Text>
            <TextInput
              style={[dynamicStyles.input, dynamicStyles.textArea]}
              value={question.explanation}
              onChangeText={(text) => updateQuestion(question.id, { explanation: text })}
              placeholder="Explain the correct answer"
              multiline
              numberOfLines={2}
            />
          </View>
        </View>
      ))}
    </View>
  );

  const renderSettings = () => (
    <View style={dynamicStyles.stepContainer}>
      <Text style={dynamicStyles.stepTitle}>Exam Settings</Text>
      
      <View style={dynamicStyles.settingRow}>
        <View style={dynamicStyles.settingInfo}>
          <Text style={dynamicStyles.settingLabel}>Allowed Attempts</Text>
          <Text style={dynamicStyles.settingDescription}>Number of times students can take this exam</Text>
        </View>
        <TextInput
          style={dynamicStyles.settingInput}
          value={examData.allowedAttempts?.toString()}
          onChangeText={(text) => setExamData(prev => ({ ...prev, allowedAttempts: parseInt(text) || 1 }))}
          keyboardType="numeric"
        />
      </View>

      <View style={dynamicStyles.settingRow}>
        <View style={dynamicStyles.settingInfo}>
          <Text style={dynamicStyles.settingLabel}>Passing Score (%)</Text>
          <Text style={dynamicStyles.settingDescription}>Minimum score required to pass</Text>
        </View>
        <TextInput
          style={dynamicStyles.settingInput}
          value={examData.passingScore?.toString()}
          onChangeText={(text) => {
            const cleanText = text.replace(/[^0-9]/g, '');
            if (cleanText === '') {
              setExamData(prev => ({ ...prev, passingScore: undefined }));
            } else {
              const numericValue = parseInt(cleanText, 10);
              if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
                setExamData(prev => ({ ...prev, passingScore: numericValue }));
              }
            }
          }}
          keyboardType="numeric"
          selectTextOnFocus={true}
        />
      </View>

      <View style={dynamicStyles.settingRow}>
        <View style={dynamicStyles.settingInfo}>
          <Text style={dynamicStyles.settingLabel}>Shuffle Questions</Text>
          <Text style={dynamicStyles.settingDescription}>Randomize question order for each student</Text>
        </View>
        <Switch
          value={examData.shuffleQuestions}
          onValueChange={(value) => setExamData(prev => ({ ...prev, shuffleQuestions: value }))}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.primaryText}
        />
      </View>

      <View style={dynamicStyles.settingRow}>
        <View style={dynamicStyles.settingInfo}>
          <Text style={dynamicStyles.settingLabel}>Show Results</Text>
          <Text style={dynamicStyles.settingDescription}>Allow students to see their results immediately</Text>
        </View>
        <Switch
          value={examData.showResults}
          onValueChange={(value) => setExamData(prev => ({ ...prev, showResults: value }))}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.primaryText}
        />
      </View>
    </View>
  );

  const renderStepNavigation = () => (
    <View style={dynamicStyles.stepNavigation}>
      <TouchableOpacity
        style={[
          dynamicStyles.stepButton,
          currentStep === 'basic' && dynamicStyles.stepButtonActive
        ]}
        onPress={() => setCurrentStep('basic')}
      >
        <BookOpen size={16} color={currentStep === 'basic' ? colors.primaryText : colors.textSecondary} />
        <Text style={[
          dynamicStyles.stepButtonText,
          currentStep === 'basic' && dynamicStyles.stepButtonTextActive
        ]}>Basic</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          dynamicStyles.stepButton,
          currentStep === 'questions' && dynamicStyles.stepButtonActive
        ]}
        onPress={() => setCurrentStep('questions')}
      >
        <Plus size={16} color={currentStep === 'questions' ? colors.primaryText : colors.textSecondary} />
        <Text style={[
          dynamicStyles.stepButtonText,
          currentStep === 'questions' && dynamicStyles.stepButtonTextActive
        ]}>{t('questions')}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          dynamicStyles.stepButton,
          currentStep === 'settings' && dynamicStyles.stepButtonActive
        ]}
        onPress={() => setCurrentStep('settings')}
      >
        <Settings size={16} color={currentStep === 'settings' ? colors.primaryText : colors.textSecondary} />
        <Text style={[
          dynamicStyles.stepButtonText,
          currentStep === 'settings' && dynamicStyles.stepButtonTextActive
        ]}>{t('settings')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'basic':
        return renderBasicInfo();
      case 'questions':
        return renderQuestions();
      case 'settings':
        return renderSettings();
      default:
        return renderBasicInfo();
    }
  };

  return (
    <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: t('edit'),
          headerRight: () => (
            <TouchableOpacity 
              style={[dynamicStyles.saveButton, saving && { opacity: 0.6 }]} 
              onPress={saveExam}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.primaryText} />
              ) : (
                <Save size={16} color={colors.primaryText} />
              )}
              <Text style={dynamicStyles.saveButtonText}>
                {saving ? 'Updating...' : 'Update'}
              </Text>
            </TouchableOpacity>
          ),
        }} 
      />
      
      {renderStepNavigation()}
      
      {loading ? (
        <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[dynamicStyles.label, { marginTop: 16, textAlign: 'center' }]}>Loading exam data...</Text>
        </View>
      ) : (
        <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentStep()}
        </ScrollView>
      )}
      
      {/* Date/Time Picker - Platform specific rendering */}
      {Platform.OS === 'ios' && showDatePicker && currentField && (
          <View style={dynamicStyles.pickerOverlay}>
            <View style={dynamicStyles.pickerContainer}>
              <View style={dynamicStyles.pickerHeader}>
                <TouchableOpacity 
                  style={dynamicStyles.pickerButton}
                  onPress={() => {
                    setShowDatePicker(false);
                    setCurrentField(null);
                  }}
                >
                  <Text style={dynamicStyles.pickerButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={dynamicStyles.pickerTitle}>
                  {pickerMode === 'date' ? 'Select Date' : 'Select Time'}
                </Text>
                <TouchableOpacity 
                  style={dynamicStyles.pickerButton}
                  onPress={() => {
                    setShowDatePicker(false);
                    setCurrentField(null);
                  }}
                >
                  <Text style={[dynamicStyles.pickerButtonText, dynamicStyles.pickerButtonTextDone]}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={dynamicStyles.pickerContent}>
                <DateTimePicker
                  testID="dateTimePicker"
                  value={(() => {
                    switch (currentField) {
                      case 'startDate':
                        return startDate || new Date();
                      case 'startTime':
                        return startTime || new Date();
                      case 'endDate':
                        return endDate || new Date();
                      case 'endTime':
                        return endTime || new Date();
                      default:
                        return new Date();
                    }
                  })()}
                  mode={pickerMode}
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    console.log('iOS DateTimePicker onChange:', event.type, selectedDate, 'field:', currentField);
                    if (event.type === 'set' && selectedDate && currentField) {
                      switch (currentField) {
                        case 'startDate':
                          setStartDate(selectedDate);
                          setExamData(prev => ({ ...prev, startDate: selectedDate.toISOString().split('T')[0] }));
                          break;
                        case 'startTime':
                          setStartTime(selectedDate);
                          const startTimeString = selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                          setExamData(prev => ({ ...prev, startTime: startTimeString }));
                          break;
                        case 'endDate':
                          setEndDate(selectedDate);
                          setExamData(prev => ({ ...prev, endDate: selectedDate.toISOString().split('T')[0] }));
                          break;
                        case 'endTime':
                          setEndTime(selectedDate);
                          const endTimeString = selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                          setExamData(prev => ({ ...prev, endTime: endTimeString }));
                          break;
                      }
                    }
                  }}
                />
              </View>
            </View>
          </View>
        )}
    </SafeAreaView>
  );
}

