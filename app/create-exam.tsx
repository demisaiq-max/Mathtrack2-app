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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import {
  Plus,
  Trash2,
  Wand2,
  Save,
  BookOpen,
  Settings,
  Calendar,
} from 'lucide-react-native';
import { Question, QuestionType, ExamTemplate, AIQuestionRequest } from '@/types/exam';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/auth-context';

const GRADES = [5, 6, 7, 8, 9, 10];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science', 'Science', 'Social Studies', 'Hindi', 'Sanskrit'];
const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'true-false', label: 'True/False' },
  { value: 'short-answer', label: 'Short Answer' },
  { value: 'essay', label: 'Essay' },
];

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;

export default function CreateExamScreen() {
  const { user } = useAuth();
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
  const [subjects, setSubjects] = useState<{id: number, name: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [currentStep, setCurrentStep] = useState<'basic' | 'questions' | 'settings'>('basic');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [currentField, setCurrentField] = useState<'startDate' | 'startTime' | 'endDate' | 'endTime' | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [aiRequest, setAiRequest] = useState<AIQuestionRequest>({
    subject: '',
    grade: '',
    topic: '',
    difficulty: 'medium',
    questionType: 'multiple-choice',
    count: 1,
  });
  
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [showQuestionTypeDropdown, setShowQuestionTypeDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showManualQuestionTypeModal, setShowManualQuestionTypeModal] = useState(false);
  const [selectedManualQuestionType, setSelectedManualQuestionType] = useState<QuestionType>('multiple-choice');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

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

  const isValidDate = useCallback((val: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
    const [y, m, d] = val.split('-').map((n) => parseInt(n, 10));
    if (!y || !m || !d) return false;
    if (m < 1 || m > 12) return false;
    const maxDay = new Date(y, m, 0).getDate();
    return d >= 1 && d <= maxDay;
  }, []);

  const isValidTime = useCallback((val: string) => {
    if (!/^\d{2}:\d{2}$/.test(val)) return false;
    const [h, m] = val.split(':').map((n) => parseInt(n, 10));
    if (isNaN(h) || isNaN(m)) return false;
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }, []);

  const loadSubjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('admin_id', user?.id)
        .order('name');

      if (error) {
        console.error('Error loading subjects:', error);
        // Use default subjects if no custom subjects found
        const defaultSubjects = SUBJECTS.map((name, index) => ({ id: index + 1, name }));
        setSubjects(defaultSubjects);
      } else {
        setSubjects(data || []);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      // Use default subjects as fallback
      const defaultSubjects = SUBJECTS.map((name, index) => ({ id: index + 1, name }));
      setSubjects(defaultSubjects);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadSubjects();
    }
  }, [user?.id, loadSubjects]);

  const createSubjectIfNeeded = async (subjectName: string): Promise<number> => {
    try {
      // Check if subject already exists
      const existingSubject = subjects.find(s => s.name === subjectName);
      if (existingSubject) {
        return existingSubject.id;
      }

      // Create new subject
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          admin_id: user?.id,
          name: subjectName,
          description: `${subjectName} subject`
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating subject:', error);
        throw error;
      }

      // Update local subjects list
      const newSubject = { id: data.id, name: subjectName };
      setSubjects(prev => [...prev, newSubject]);
      
      return data.id;
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
  };

  const generateQuestionsWithAI = async () => {
    if (!aiRequest.topic) {
      Alert.alert('Error', 'Please provide a statement or prompt for AI generation');
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const subjectContext = examData.subject || aiRequest.subject || 'general';
      const gradeContext = examData.grade || aiRequest.grade || 'middle school';
      
      const prompt = `Generate ${aiRequest.count} ${aiRequest.questionType} questions based on the following statement/prompt: "${aiRequest.topic}"

Context:
- Subject: ${subjectContext}
- Grade Level: ${gradeContext}
- Difficulty: ${aiRequest.difficulty}
- Question Type: ${aiRequest.questionType}

Instructions:
- For multiple choice questions, provide exactly 4 options with the correct answer index (0-3)
- For true/false questions, provide options as ["True", "False"] and correctAnswer as 0 for True or 1 for False
- For short answer and essay questions, provide a sample correct answer
- Make questions appropriate for the specified difficulty level
- Ensure questions are relevant to the given statement/prompt

Format the response as a valid JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "type": "${aiRequest.questionType}",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 0,
    "points": 2,
    "explanation": "Brief explanation of the correct answer"
  }
]

IMPORTANT: Return only the JSON array, no additional text.`;

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let generatedQuestions;
      
      try {
        // Try to parse the completion directly
        generatedQuestions = JSON.parse(data.completion);
      } catch {
        // If direct parsing fails, try to extract JSON from the response
        const jsonMatch = data.completion.match(/\[.*\]/s);
        if (jsonMatch) {
          generatedQuestions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid JSON response from AI');
        }
      }
      
      if (!Array.isArray(generatedQuestions)) {
        throw new Error('AI response is not an array');
      }
      
      const newQuestions: Question[] = generatedQuestions.map((q: any, index: number) => {
        // Validate question structure
        if (!q.question || !q.type) {
          throw new Error(`Invalid question structure at index ${index}`);
        }
        
        // Handle True/False questions specifically
        if (q.type === 'true-false') {
          return {
            id: `q_${Date.now()}_${index}`,
            type: q.type,
            question: q.question,
            options: ['True', 'False'],
            correctAnswer: q.correctAnswer, // Should be 0 for True, 1 for False
            points: q.points || 2,
            explanation: q.explanation || '',
          };
        }
        
        return {
          id: `q_${Date.now()}_${index}`,
          type: q.type,
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          points: q.points || 2,
          explanation: q.explanation || '',
        };
      });

      setExamData(prev => ({
        ...prev,
        questions: [...(prev.questions || []), ...newQuestions],
      }));

      Alert.alert('Success', `Generated ${newQuestions.length} questions successfully!`);
    } catch (error) {
      console.error('Error generating questions:', error);
      Alert.alert('Error', `Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const addManualQuestion = (questionType: QuestionType) => {
    let newQuestion: Question;
    
    switch (questionType) {
      case 'multiple-choice':
        newQuestion = {
          id: `q_${Date.now()}`,
          type: 'multiple-choice',
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          points: 2,
        };
        break;
      case 'true-false':
        newQuestion = {
          id: `q_${Date.now()}`,
          type: 'true-false',
          question: '',
          options: ['True', 'False'],
          correctAnswer: 0,
          points: 2,
        };
        break;
      case 'short-answer':
        newQuestion = {
          id: `q_${Date.now()}`,
          type: 'short-answer',
          question: '',
          options: [],
          correctAnswer: '',
          points: 2,
        };
        break;
      case 'essay':
        newQuestion = {
          id: `q_${Date.now()}`,
          type: 'essay',
          question: '',
          options: [],
          correctAnswer: '',
          points: 5,
        };
        break;
      default:
        newQuestion = {
          id: `q_${Date.now()}`,
          type: 'multiple-choice',
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          points: 2,
        };
    }

    setExamData(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion],
    }));
    
    setShowManualQuestionTypeModal(false);
  };

  const changeQuestionType = (questionId: string, newType: QuestionType) => {
    const currentQuestion = examData.questions?.find(q => q.id === questionId);
    if (!currentQuestion) return;

    let updatedQuestion: Partial<Question>;
    
    switch (newType) {
      case 'multiple-choice':
        updatedQuestion = {
          type: 'multiple-choice',
          options: ['', '', '', ''],
          correctAnswer: 0,
        };
        break;
      case 'true-false':
        updatedQuestion = {
          type: 'true-false',
          options: ['True', 'False'],
          correctAnswer: 0,
        };
        break;
      case 'short-answer':
        updatedQuestion = {
          type: 'short-answer',
          options: [],
          correctAnswer: '',
        };
        break;
      case 'essay':
        updatedQuestion = {
          type: 'essay',
          options: [],
          correctAnswer: '',
          points: 5,
        };
        break;
      default:
        return;
    }

    updateQuestion(questionId, updatedQuestion);
    setShowManualQuestionTypeModal(false);
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
    console.log('Starting exam save process...');
    console.log('Exam data:', examData);
    
    if (!examData.title || !examData.subject || !examData.grade) {
      Alert.alert('Error', 'Please fill in all required fields (Title, Subject, Grade)');
      return;
    }

    if (!examData.questions || examData.questions.length === 0) {
      Alert.alert('Error', 'Please add at least one question');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Validate questions
    for (let i = 0; i < examData.questions.length; i++) {
      const question = examData.questions[i];
      if (!question.question.trim()) {
        Alert.alert('Error', `Question ${i + 1} is empty. Please fill in all questions.`);
        return;
      }
      
      if (question.type === 'multiple-choice') {
        const hasEmptyOptions = question.options?.some(opt => !opt.trim());
        if (hasEmptyOptions) {
          Alert.alert('Error', `Question ${i + 1} has empty options. Please fill in all options.`);
          return;
        }
        if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0 || question.correctAnswer > 3) {
          Alert.alert('Error', `Question ${i + 1} doesn't have a valid correct answer selected.`);
          return;
        }
      }
      
      if (question.type === 'true-false') {
        if (typeof question.correctAnswer !== 'number' || (question.correctAnswer !== 0 && question.correctAnswer !== 1)) {
          Alert.alert('Error', `Question ${i + 1} doesn't have a valid true/false answer selected.`);
          return;
        }
      }
      
      if ((question.type === 'short-answer' || question.type === 'essay') && !question.correctAnswer) {
        Alert.alert('Error', `Question ${i + 1} needs a correct answer or key points for grading reference.`);
        return;
      }
    }

    setIsSaving(true);
    
    try {
      console.log('Creating/getting subject ID for:', examData.subject);
      // Create or get subject ID
      const subjectId = await createSubjectIfNeeded(examData.subject);
      console.log('Subject ID:', subjectId);
      
      // Create exam record
      const toTimestamptz = (dateStr?: string | null, timeStr?: string | null): string | null => {
        if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
        const time = timeStr && /^\d{2}:\d{2}$/.test(timeStr) ? `${timeStr}:00` : '00:00:00';
        const local = new Date(`${dateStr}T${time}`);
        return isNaN(local.getTime()) ? null : local.toISOString();
      };

      const scheduled_start = toTimestamptz(examData.startDate ?? null, examData.startTime ?? null);
      const scheduled_end = toTimestamptz(examData.endDate ?? null, examData.endTime ?? null);

      const examInsertData = {
        admin_id: user.id,
        title: examData.title,
        description: examData.description || '',
        subject_id: subjectId,
        grade_level: parseInt(examData.grade.toString()),
        duration_minutes: examData.duration || 60,
        instructions: examData.instructions || '',
        allowed_attempts: examData.allowedAttempts || 1,
        passing_score: examData.passingScore || 60,
        shuffle_questions: examData.shuffleQuestions || false,
        show_results: examData.showResults !== false,
        status: 'Active',
        scheduled_start,
        scheduled_end,
      } as const;
      
      console.log('Inserting exam with data:', examInsertData);
      
      const { data: examRecord, error: examError } = await supabase
        .from('exams')
        .insert(examInsertData)
        .select('id')
        .single();

      if (examError) {
        console.error('Error creating exam:', examError);
        throw new Error(`Failed to create exam: ${examError.message ?? JSON.stringify(examError)}`);
      }

      console.log('Exam created with ID:', examRecord.id);

      // Create questions
      const questionsToInsert = examData.questions.map((question, index) => {
        console.log(`Processing question ${index + 1}:`, question);
        
        // Map question types to database enum values
        let dbQuestionType: string;
        switch (question.type) {
          case 'multiple-choice':
            dbQuestionType = 'MCQ';
            break;
          case 'true-false':
            dbQuestionType = 'TRUE_FALSE';
            break;
          case 'short-answer':
            dbQuestionType = 'SHORT_ANSWER';
            break;
          case 'essay':
            dbQuestionType = 'ESSAY';
            break;
          default:
            dbQuestionType = 'MCQ';
        }

        // Format options for database
        let formattedOptions = null;
        if (question.options && question.options.length > 0) {
          if (question.type === 'multiple-choice') {
            formattedOptions = question.options.map((option, optIndex) => ({
              key: String.fromCharCode(65 + optIndex), // A, B, C, D
              text: option
            }));
          } else if (question.type === 'true-false') {
            formattedOptions = [
              { key: 'A', text: question.options[0] || 'True' },
              { key: 'B', text: question.options[1] || 'False' }
            ];
          }
        }

        // Format correct answer
        let correctAnswer = null;
        if (question.type === 'multiple-choice' && typeof question.correctAnswer === 'number') {
          correctAnswer = String.fromCharCode(65 + question.correctAnswer); // Convert 0,1,2,3 to A,B,C,D
        } else if (question.type === 'true-false' && typeof question.correctAnswer === 'number') {
          correctAnswer = question.correctAnswer === 0 ? 'A' : 'B'; // 0 = A (True), 1 = B (False)
        } else if (typeof question.correctAnswer === 'string') {
          correctAnswer = question.correctAnswer;
        }

        const questionData = {
          exam_id: examRecord.id,
          position: index + 1,
          type: dbQuestionType,
          difficulty: 'Medium' as const,
          points: question.points || 1,
          prompt: question.question,
          options: formattedOptions,
          correct_answer: correctAnswer,
          explanation: question.explanation || null,
          ai_generated: question.id.includes('q_') && question.id.includes('ai_')
        };
        
        console.log(`Question ${index + 1} formatted:`, questionData);
        return questionData;
      });

      console.log('Inserting questions:', questionsToInsert);
      
      const { error: questionsError } = await supabase
        .from('exam_questions')
        .insert(questionsToInsert);

      if (questionsError) {
        console.error('Error creating questions:', questionsError);
        throw new Error(`Failed to create questions: ${questionsError.message}`);
      }

      console.log('Questions created successfully');
      
      Alert.alert('Success', 'Exam created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving exam:', error);
      Alert.alert('Error', `Failed to save exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderBasicInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Exam Title *</Text>
        <TextInput
          style={styles.input}
          value={examData.title}
          onChangeText={(text) => setExamData(prev => ({ ...prev, title: text }))}
          placeholder="Enter exam title"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={examData.description}
          onChangeText={(text) => setExamData(prev => ({ ...prev, description: text }))}
          placeholder="Enter exam description"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={[styles.row, { zIndex: (showSubjectDropdown || showGradeDropdown) ? 10000 : 1 }]}>
        <View style={[styles.inputGroup, styles.halfWidth, { zIndex: showSubjectDropdown ? 10001 : 1 }]}>
          <Text style={styles.label}>Subject *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              setShowSubjectDropdown(!showSubjectDropdown);
              setShowGradeDropdown(false);
            }}
          >
            <Text style={styles.dropdownButtonText}>
              {examData.subject || 'Select Subject'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          {showSubjectDropdown && (
            <ScrollView style={styles.dropdown} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
              {(subjects.length > 0 ? subjects : SUBJECTS.map((name, index) => ({ id: index + 1, name }))).map(subject => (
                <TouchableOpacity
                  key={typeof subject === 'string' ? subject : subject.id}
                  style={[
                    styles.dropdownOption,
                    examData.subject === (typeof subject === 'string' ? subject : subject.name) && styles.dropdownOptionSelected
                  ]}
                  onPress={() => {
                    const subjectName = typeof subject === 'string' ? subject : subject.name;
                    setExamData(prev => ({ ...prev, subject: subjectName }));
                    setShowSubjectDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    examData.subject === (typeof subject === 'string' ? subject : subject.name) && styles.dropdownOptionTextSelected
                  ]}>
                    {typeof subject === 'string' ? subject : subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={[styles.inputGroup, styles.halfWidth, { zIndex: showGradeDropdown ? 10001 : 1 }]}>
          <Text style={styles.label}>Grade *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              setShowGradeDropdown(!showGradeDropdown);
              setShowSubjectDropdown(false);
            }}
          >
            <Text style={styles.dropdownButtonText}>
              {examData.grade ? `Grade ${examData.grade}` : 'Select Grade'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          {showGradeDropdown && (
            <ScrollView style={styles.dropdown} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
              {GRADES.map(grade => (
                <TouchableOpacity
                  key={grade}
                  style={[
                    styles.dropdownOption,
                    examData.grade === grade.toString() && styles.dropdownOptionSelected
                  ]}
                  onPress={() => {
                    setExamData(prev => ({ ...prev, grade: grade.toString() }));
                    setShowGradeDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    examData.grade === grade.toString() && styles.dropdownOptionTextSelected
                  ]}>
                    Grade {grade}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          value={examData.duration?.toString() || ''}
          onChangeText={(text) => {
            // Remove any non-numeric characters
            const cleanText = text.replace(/[^0-9]/g, '');
            if (cleanText === '') {
              setExamData(prev => ({ ...prev, duration: undefined }));
            } else {
              const numericValue = parseInt(cleanText, 10);
              if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 999) {
                setExamData(prev => ({ ...prev, duration: numericValue }));
              }
            }
          }}
          placeholder="Enter duration (1-999 minutes)"
          keyboardType="numeric"
          selectTextOnFocus={true}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Instructions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={examData.instructions}
          onChangeText={(text) => setExamData(prev => ({ ...prev, instructions: text }))}
          placeholder="Enter exam instructions for students"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Passing Score (%)</Text>
        <Text style={styles.settingDescription}>Minimum score required to pass</Text>
        <TextInput
          style={styles.input}
          value={examData.passingScore?.toString() || ''}
          onChangeText={(text) => {
            // Remove any non-numeric characters
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
          placeholder="Enter passing score (0-100%)"
          keyboardType="numeric"
          selectTextOnFocus={true}
        />
      </View>

      {/* Schedule Section */}
      <View style={styles.scheduleSection}>
        <Text style={styles.sectionTitle}>Schedule (Optional)</Text>
        <Text style={styles.sectionDescription}>Set start and end dates/times for the exam. If not set, the exam will be available immediately.</Text>
        
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              testID="start-date-input"
              style={styles.input}
              value={examData.startDate ?? ''}
              onChangeText={(text) => {
                const formatted = formatDateInput(text);
                setExamData((prev) => ({ ...prev, startDate: formatted }));
              }}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>Format: YYYY-MM-DD</Text>
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Start Time</Text>
            <TextInput
              testID="start-time-input"
              style={styles.input}
              value={examData.startTime ?? ''}
              onChangeText={(text) => {
                const formatted = formatTimeInput(text);
                setExamData((prev) => ({ ...prev, startTime: formatted }));
              }}
              placeholder="HH:MM"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>Format: HH:MM (24h)</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>End Date</Text>
            <TextInput
              testID="end-date-input"
              style={styles.input}
              value={examData.endDate ?? ''}
              onChangeText={(text) => {
                const formatted = formatDateInput(text);
                setExamData((prev) => ({ ...prev, endDate: formatted }));
              }}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>Format: YYYY-MM-DD</Text>
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>End Time</Text>
            <TextInput
              testID="end-time-input"
              style={styles.input}
              value={examData.endTime ?? ''}
              onChangeText={(text) => {
                const formatted = formatTimeInput(text);
                setExamData((prev) => ({ ...prev, endTime: formatted }));
              }}
              placeholder="HH:MM"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>Format: HH:MM (24h)</Text>
          </View>
        </View>


      </View>
    </View>
  );

  const renderQuestions = () => (
    <View style={styles.stepContainer}>
      <View style={styles.questionsHeader}>
        <Text style={styles.stepTitle}>Questions ({examData.questions?.length || 0})</Text>
        <View style={styles.questionActions}>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowManualQuestionTypeModal(true)}>
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Question</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Question Generator */}
      <View style={styles.aiGenerator}>
        <View style={styles.aiHeader}>
          <Wand2 size={20} color="#8B5CF6" />
          <Text style={styles.aiTitle}>AI Question Generator</Text>
        </View>
        
        <View style={styles.aiForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Statement/Prompt *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={aiRequest.topic}
              onChangeText={(text) => setAiRequest(prev => ({ ...prev, topic: text }))}
              placeholder="Enter a statement or prompt for question generation"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={[styles.row, { zIndex: (showQuestionTypeDropdown || showDifficultyDropdown) ? 10000 : 1 }]}>
            <View style={[styles.inputGroup, styles.halfWidth, { zIndex: showQuestionTypeDropdown ? 10001 : 1 }]}>
              <Text style={styles.label}>Question Type</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setShowQuestionTypeDropdown(!showQuestionTypeDropdown);
                  setShowDifficultyDropdown(false);
                }}
              >
                <Text style={styles.dropdownButtonText}>
                  {QUESTION_TYPES.find(t => t.value === aiRequest.questionType)?.label || 'Select Type'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              {showQuestionTypeDropdown && (
                <ScrollView style={styles.dropdown} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                  {QUESTION_TYPES.map(type => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.dropdownOption,
                        aiRequest.questionType === type.value && styles.dropdownOptionSelected
                      ]}
                      onPress={() => {
                        setAiRequest(prev => ({ ...prev, questionType: type.value }));
                        setShowQuestionTypeDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        aiRequest.questionType === type.value && styles.dropdownOptionTextSelected
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
            
            <View style={[styles.inputGroup, styles.halfWidth, { zIndex: showDifficultyDropdown ? 10001 : 1 }]}>
              <Text style={styles.label}>Difficulty</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setShowDifficultyDropdown(!showDifficultyDropdown);
                  setShowQuestionTypeDropdown(false);
                }}
              >
                <Text style={styles.dropdownButtonText}>
                  {DIFFICULTY_LEVELS.find(d => d.value === aiRequest.difficulty)?.label || 'Select Difficulty'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              {showDifficultyDropdown && (
                <ScrollView style={styles.dropdown} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                  {DIFFICULTY_LEVELS.map(difficulty => (
                    <TouchableOpacity
                      key={difficulty.value}
                      style={[
                        styles.dropdownOption,
                        aiRequest.difficulty === difficulty.value && styles.dropdownOptionSelected
                      ]}
                      onPress={() => {
                        setAiRequest(prev => ({ ...prev, difficulty: difficulty.value }));
                        setShowDifficultyDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        aiRequest.difficulty === difficulty.value && styles.dropdownOptionTextSelected
                      ]}>
                        {difficulty.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Number of Questions</Text>
            <TextInput
              style={styles.input}
              value={aiRequest.count.toString()}
              onChangeText={(text) => {
                if (text === '') {
                  setAiRequest(prev => ({ ...prev, count: 1 }));
                } else {
                  const numericValue = parseInt(text.replace(/[^0-9]/g, ''), 10);
                  if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 50) {
                    setAiRequest(prev => ({ ...prev, count: numericValue }));
                  }
                }
              }}
              keyboardType="numeric"
              placeholder="Enter number of questions (1-50)"
              selectTextOnFocus={true}
            />
          </View>

          <TouchableOpacity 
            style={[styles.generateButton, isGeneratingQuestions && styles.generateButtonDisabled]} 
            onPress={generateQuestionsWithAI}
            disabled={isGeneratingQuestions}
          >
            {isGeneratingQuestions ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Wand2 size={16} color="#FFFFFF" />
            )}
            <Text style={styles.generateButtonText}>
              {isGeneratingQuestions ? 'Generating...' : 'Generate Questions'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Manual Question Type Selection Modal */}
      {showManualQuestionTypeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Question Type</Text>
            {QUESTION_TYPES.map(type => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.modalOption,
                  selectedManualQuestionType === type.value && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setSelectedManualQuestionType(type.value);
                  if (editingQuestionId) {
                    changeQuestionType(editingQuestionId, type.value);
                    setEditingQuestionId(null);
                  } else {
                    addManualQuestion(type.value);
                  }
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  selectedManualQuestionType === type.value && styles.modalOptionTextSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowManualQuestionTypeModal(false);
                setEditingQuestionId(null);
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Questions List */}
      {examData.questions?.map((question, index) => (
        <View key={question.id} style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>Question {index + 1}</Text>
            <TouchableOpacity onPress={() => deleteQuestion(question.id)}>
              <Trash2 size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[styles.input, styles.questionInput]}
            value={question.question}
            onChangeText={(text) => updateQuestion(question.id, { question: text })}
            placeholder="Enter your question here"
            multiline
          />

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Type</Text>
              <TouchableOpacity 
                style={styles.typeEditButton}
                onPress={() => {
                  setSelectedManualQuestionType(question.type);
                  setEditingQuestionId(question.id);
                  setShowManualQuestionTypeModal(true);
                }}
              >
                <Text style={styles.typeEditButtonText}>
                  {QUESTION_TYPES.find(t => t.value === question.type)?.label || 'Unknown Type'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Points</Text>
              <TextInput
                style={styles.input}
                value={question.points.toString()}
                onChangeText={(text) => updateQuestion(question.id, { points: parseInt(text) || 1 })}
                keyboardType="numeric"
                placeholder="2"
              />
            </View>
          </View>

          {question.type === 'multiple-choice' && (
            <View style={styles.optionsContainer}>
              <Text style={styles.label}>Options</Text>
              {question.options?.map((option, optionIndex) => (
                <View key={optionIndex} style={styles.optionRow}>
                  <Text style={styles.optionLetter}>{String.fromCharCode(65 + optionIndex)})</Text>
                  <TextInput
                    style={[styles.input, styles.optionInput]}
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
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correct Answer (Admin Only)</Text>
                <TextInput
                  style={styles.input}
                  value={typeof question.correctAnswer === 'number' ? String.fromCharCode(65 + question.correctAnswer).toLowerCase() : ''}
                  onChangeText={(text) => {
                    const lowerText = text.toLowerCase();
                    if (lowerText === 'a') {
                      updateQuestion(question.id, { correctAnswer: 0 });
                    } else if (lowerText === 'b') {
                      updateQuestion(question.id, { correctAnswer: 1 });
                    } else if (lowerText === 'c') {
                      updateQuestion(question.id, { correctAnswer: 2 });
                    } else if (lowerText === 'd') {
                      updateQuestion(question.id, { correctAnswer: 3 });
                    }
                  }}
                  placeholder="Enter 'a', 'b', 'c', or 'd' for correct answer"
                />
              </View>
            </View>
          )}

          {question.type === 'true-false' && (
            <View style={styles.trueFalseContainer}>
              <Text style={styles.label}>Student View (Options)</Text>
              <View style={styles.trueFalseStudentView}>
                <View style={styles.optionRow}>
                  <Text style={styles.optionLetter}>a)</Text>
                  <TextInput
                    style={[styles.input, styles.optionInput]}
                    value={question.options?.[0] || 'True'}
                    onChangeText={(text) => {
                      const newOptions = [...(question.options || ['True', 'False'])];
                      newOptions[0] = text;
                      updateQuestion(question.id, { options: newOptions });
                    }}
                    placeholder="Option A"
                  />
                </View>
                <View style={styles.optionRow}>
                  <Text style={styles.optionLetter}>b)</Text>
                  <TextInput
                    style={[styles.input, styles.optionInput]}
                    value={question.options?.[1] || 'False'}
                    onChangeText={(text) => {
                      const newOptions = [...(question.options || ['True', 'False'])];
                      newOptions[1] = text;
                      updateQuestion(question.id, { options: newOptions });
                    }}
                    placeholder="Option B"
                  />
                </View>
              </View>
              
              <Text style={[styles.label, { marginTop: 16 }]}>Correct Answer (Admin Only)</Text>
              <TextInput
                style={styles.input}
                value={question.correctAnswer === 0 ? 'a' : question.correctAnswer === 1 ? 'b' : ''}
                onChangeText={(text) => {
                  const lowerText = text.toLowerCase();
                  if (lowerText === 'a') {
                    updateQuestion(question.id, { correctAnswer: 0 });
                  } else if (lowerText === 'b') {
                    updateQuestion(question.id, { correctAnswer: 1 });
                  }
                }}
                placeholder="Enter 'a' for True or 'b' for False"
              />
            </View>
          )}

          {(question.type === 'short-answer' || question.type === 'essay') && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correct Answer / Key Points (Admin Only)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={typeof question.correctAnswer === 'string' ? question.correctAnswer : ''}
                onChangeText={(text) => updateQuestion(question.id, { correctAnswer: text })}
                placeholder={question.type === 'essay' ? "Enter key points as reference for grading" : "Enter the correct answer"}
                multiline
                numberOfLines={question.type === 'essay' ? 4 : 2}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Explanation (Optional - Admin Only)</Text>
            <Text style={styles.explanationNote}>This explanation will only be visible to admins and not shown to students during the exam.</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={question.explanation}
              onChangeText={(text) => updateQuestion(question.id, { explanation: text })}
              placeholder="Explain the correct answer (visible to admin only)"
              multiline
              numberOfLines={2}
            />
          </View>
        </View>
      ))}
    </View>
  );

  const renderSettings = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Exam Settings</Text>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Allowed Attempts</Text>
          <Text style={styles.settingDescription}>Number of times students can take this exam</Text>
        </View>
        <TextInput
          style={styles.settingInput}
          value={examData.allowedAttempts?.toString() || ''}
          onChangeText={(text) => {
            const cleanText = text.replace(/[^0-9]/g, '');
            if (cleanText === '') {
              setExamData(prev => ({ ...prev, allowedAttempts: 1 }));
            } else {
              const numericValue = parseInt(cleanText, 10);
              if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 10) {
                setExamData(prev => ({ ...prev, allowedAttempts: numericValue }));
              }
            }
          }}
          keyboardType="numeric"
          selectTextOnFocus={true}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Passing Score (%)</Text>
          <Text style={styles.settingDescription}>Minimum score required to pass</Text>
        </View>
        <TextInput
          style={styles.settingInput}
          value={examData.passingScore?.toString() || ''}
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

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Shuffle Questions</Text>
          <Text style={styles.settingDescription}>Randomize question order for each student</Text>
        </View>
        <Switch
          value={examData.shuffleQuestions}
          onValueChange={(value) => setExamData(prev => ({ ...prev, shuffleQuestions: value }))}
          trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
          thumbColor={examData.shuffleQuestions ? '#FFFFFF' : '#FFFFFF'}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Show Results</Text>
          <Text style={styles.settingDescription}>Allow students to see their results immediately</Text>
        </View>
        <Switch
          value={examData.showResults}
          onValueChange={(value) => setExamData(prev => ({ ...prev, showResults: value }))}
          trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
          thumbColor={examData.showResults ? '#FFFFFF' : '#FFFFFF'}
        />
      </View>
    </View>
  );



  const renderStepNavigation = () => (
    <View style={styles.stepNavigation}>
      <TouchableOpacity
        style={[
          styles.stepButton,
          currentStep === 'basic' && styles.stepButtonActive
        ]}
        onPress={() => setCurrentStep('basic')}
      >
        <BookOpen size={16} color={currentStep === 'basic' ? '#FFFFFF' : '#6B7280'} />
        <Text style={[
          styles.stepButtonText,
          currentStep === 'basic' && styles.stepButtonTextActive
        ]}>Basic</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.stepButton,
          currentStep === 'questions' && styles.stepButtonActive
        ]}
        onPress={() => setCurrentStep('questions')}
      >
        <Plus size={16} color={currentStep === 'questions' ? '#FFFFFF' : '#6B7280'} />
        <Text style={[
          styles.stepButtonText,
          currentStep === 'questions' && styles.stepButtonTextActive
        ]}>Questions</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.stepButton,
          currentStep === 'settings' && styles.stepButtonActive
        ]}
        onPress={() => setCurrentStep('settings')}
      >
        <Settings size={16} color={currentStep === 'settings' ? '#FFFFFF' : '#6B7280'} />
        <Text style={[
          styles.stepButtonText,
          currentStep === 'settings' && styles.stepButtonTextActive
        ]}>Settings</Text>
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
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Create Exam',
          headerRight: () => (
            <TouchableOpacity 
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
              onPress={saveExam}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Save size={16} color="#FFFFFF" />
              )}
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          ),
        }} 
      />
      
      {renderStepNavigation()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>
      
      {/* Date/Time Picker - Platform specific rendering */}
      {Platform.OS === 'ios' && showDatePicker && currentField && (
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => {
                    setShowDatePicker(false);
                    setCurrentField(null);
                  }}
                >
                  <Text style={styles.pickerButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>
                  {pickerMode === 'date' ? 'Select Date' : 'Select Time'}
                </Text>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => {
                    setShowDatePicker(false);
                    setCurrentField(null);
                  }}
                >
                  <Text style={[styles.pickerButtonText, styles.pickerButtonTextDone]}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContent}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  stepNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    backgroundColor: '#4F46E5',
  },
  stepButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  stepButtonTextActive: {
    color: '#FFFFFF',
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  pickerContainerOld: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 6,
  },
  pickerOptionSelected: {
    backgroundColor: '#4F46E5',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: '#FFFFFF',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.6,
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
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  aiGenerator: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 1,
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#4F46E5',
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
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionSelectorSelected: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
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
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  trueFalseOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  trueFalseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  trueFalseTextSelected: {
    color: '#FFFFFF',
  },
  trueFalseStudentView: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  trueFalseStudentOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  trueFalseStudentText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  typeDisplayContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    minHeight: 44,
    justifyContent: 'center',
  },
  typeDisplayText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  explanationNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    width: 80,
    textAlign: 'center',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 10002,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionSelected: {
    backgroundColor: '#EEF2FF',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  dropdownOptionTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  typeEditButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  typeEditButtonText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 280,
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  scheduleNote: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  scheduleNoteText: {
    fontSize: 14,
    color: '#0369A1',
    lineHeight: 20,
  },
  scheduleSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
    gap: 8,
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
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
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E5E7EB',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  pickerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  pickerButtonTextDone: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
});