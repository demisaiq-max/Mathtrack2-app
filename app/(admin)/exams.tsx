import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Edit, Eye, Trash2, Calendar, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/hooks/theme-context';
import { useLanguage } from '@/hooks/language-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/auth-context';

interface Exam {
  id: number;
  title: string;
  admin_id: string;
  grade_level: number;
  subject_name: string;
  duration_minutes: number;
  scheduled_start: string | null;
  scheduled_end: string | null;
  status: string;
  question_count: number;
  admin_name: string;
}

export default function ExamsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedGrade, setSelectedGrade] = useState('All Grades');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  const grades = ['All Grades', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
  const subjects = ['All Subjects', 'Mathematics', 'Science', 'English', 'History', 'Geography'];

  // Fetch exams from Supabase
  const { data: exams = [], isLoading, error, refetch } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      console.log('Fetching exams from database...');
      const { data, error } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          admin_id,
          grade_level,
          duration_minutes,
          scheduled_start,
          scheduled_end,
          status,
          subjects!inner(name),
          profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching exams:', error);
        throw error;
      }

      console.log('Raw exams data:', data);

      // Get question counts for each exam
      const examIds = data.map((exam: any) => exam.id);
      const { data: questionCounts } = await supabase
        .from('exam_questions')
        .select('exam_id')
        .in('exam_id', examIds);

      // Count questions per exam
      const questionCountMap = questionCounts?.reduce((acc: Record<number, number>, question: any) => {
        acc[question.exam_id] = (acc[question.exam_id] || 0) + 1;
        return acc;
      }, {}) || {};

      // Transform the data to match our interface
      const transformedExams: Exam[] = data.map((exam: any) => ({
        id: exam.id,
        title: exam.title,
        admin_id: exam.admin_id,
        grade_level: exam.grade_level,
        subject_name: exam.subjects?.name || 'Unknown Subject',
        duration_minutes: exam.duration_minutes,
        scheduled_start: exam.scheduled_start,
        scheduled_end: exam.scheduled_end,
        status: exam.status,
        question_count: questionCountMap[exam.id] || 0,
        admin_name: exam.profiles?.full_name || 'Unknown Admin',
      }));

      console.log('Transformed exams:', transformedExams);
      return transformedExams;
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Delete exam mutation
  const deleteExamMutation = useMutation({
    mutationFn: async (examId: number) => {
      console.log('Deleting exam:', examId);
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);
      
      if (error) {
        console.error('Error deleting exam:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Exam deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      Alert.alert('Success', 'Exam deleted successfully!');
    },
    onError: (error) => {
      console.error('Delete exam error:', error);
      Alert.alert('Error', 'Failed to delete exam. Please try again.');
    },
  });

  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const gradeMatch = selectedGrade === 'All Grades' || `Grade ${exam.grade_level}` === selectedGrade;
      const subjectMatch = selectedSubject === 'All Subjects' || exam.subject_name === selectedSubject;
      return gradeMatch && subjectMatch;
    });
  }, [exams, selectedGrade, selectedSubject]);

  const handleViewExam = (examId: number) => {
    console.log('Viewing exam:', examId);
    router.push(`/exam-detail?examId=${examId}`);
  };

  const handleEditExam = (examId: number) => {
    console.log('Editing exam:', examId);
    router.push(`/edit-exam?examId=${examId}`);
  };

  const handleScheduleExam = (examId: number) => {
    console.log('Scheduling exam:', examId);
    router.push(`/schedule-exam?examId=${examId}`);
  };

  const handleDeleteExam = (examId: number) => {
    Alert.alert(
      'Delete Exam',
      'Are you sure you want to delete this exam? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteExamMutation.mutate(examId);
          },
        },
      ]
    );
  };

  const handleNavigateToTab = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        router.push('/(admin)/dashboard');
        break;
      case 'submissions':
        router.push('/(admin)/submissions');
        break;
      case 'students':
        router.push('/(admin)/students');
        break;
      default:
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'Inactive':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'Completed':
        return { bg: '#E5E7EB', text: '#6B7280' };
      default:
        return { bg: '#E5E7EB', text: '#6B7280' };
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading exams...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>Error loading exams</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={[styles.retryButtonText, { color: colors.primaryText }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
<Text style={[styles.title, { color: colors.text }]}>{t('mathTrackAdmin')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('administrationDashboard')}</Text>
          </View>
          <View style={styles.adminInfo}>
<Text style={[styles.adminRole, { color: colors.text }]}>{t('administrator')}</Text>
            <Text style={[styles.adminEmail, { color: colors.textSecondary }]}>alijawad12@gmail.com</Text>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={[styles.navTabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.navTab}
            onPress={() => handleNavigateToTab('dashboard')}
          >
<Text style={[styles.navTabText, { color: colors.textSecondary }]}>{t('dashboard')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navTab}
            onPress={() => handleNavigateToTab('submissions')}
          >
<Text style={[styles.navTabText, { color: colors.textSecondary }]}>{t('submissions')} (1)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navTab, styles.activeNavTab]}>
<Text style={[styles.navTabText, styles.activeNavTabText, { color: colors.primary }]}>{t('exams')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navTab}
            onPress={() => handleNavigateToTab('students')}
          >
<Text style={[styles.navTabText, { color: colors.textSecondary }]}>{t('students')}</Text>
          </TouchableOpacity>
        </View>

        {/* Exam Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
<Text style={[styles.sectionTitle, { color: colors.text }]}>{t('examManagement')}</Text>
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/create-exam')}
            >
              <Plus size={16} color={colors.primaryText} />
<Text style={[styles.createButtonText, { color: colors.primaryText }]}>{t('createExam')}</Text>
            </TouchableOpacity>
          </View>

          {/* Filters */}
          <View style={styles.filtersRow}>
            <Text style={[styles.filtersTitle, { color: colors.text }]}>{t('filters')}:</Text>
            <View style={styles.filtersContainer}>
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{t('grade')}:</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={[styles.filterDropdown, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => setShowGradeDropdown(!showGradeDropdown)}
                  >
                    <Text style={[styles.filterValue, { color: colors.text }]}>{selectedGrade}</Text>
                    <ChevronDown size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                  {showGradeDropdown && (
                    <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      {grades.map((grade) => (
                        <TouchableOpacity
                          key={grade}
                          style={[styles.dropdownItem, selectedGrade === grade && { backgroundColor: colors.primary + '20' }]}
                          onPress={() => {
                            setSelectedGrade(grade);
                            setShowGradeDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, { color: colors.text }]}>{grade}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{t('subject')}:</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={[styles.filterDropdown, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => setShowSubjectDropdown(!showSubjectDropdown)}
                  >
                    <Text style={[styles.filterValue, { color: colors.text }]}>{selectedSubject}</Text>
                    <ChevronDown size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                  {showSubjectDropdown && (
                    <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      {subjects.map((subject) => (
                        <TouchableOpacity
                          key={subject}
                          style={[styles.dropdownItem, selectedSubject === subject && { backgroundColor: colors.primary + '20' }]}
                          onPress={() => {
                            setSelectedSubject(subject);
                            setShowSubjectDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, { color: colors.text }]}>{subject}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Table Container with Horizontal Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={[styles.tableContainer, { borderColor: colors.border }]}>
            <View style={styles.tableWrapper}>
              {/* Table Header */}
              <View style={[styles.tableHeader, { backgroundColor: colors.background }]}>
                <View style={[styles.tableHeaderCell, styles.examColumn]}>
<Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>{t('exam').toUpperCase()}</Text>
                </View>
                <View style={[styles.tableHeaderCell, styles.gradeColumn]}>
<Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>{t('gradeAndSubject').toUpperCase()}</Text>
                </View>
                <View style={[styles.tableHeaderCell, styles.scheduleColumn]}>
<Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>{t('schedule').toUpperCase()}</Text>
                </View>
                <View style={[styles.tableHeaderCell, styles.durationColumn]}>
<Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>{t('duration').toUpperCase()}</Text>
                </View>
                <View style={[styles.tableHeaderCell, styles.questionsColumn]}>
<Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>{t('questions').toUpperCase()}</Text>
                </View>
                <View style={[styles.tableHeaderCell, styles.statusColumn]}>
<Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>{t('status').toUpperCase()}</Text>
                </View>
                <View style={[styles.tableHeaderCell, styles.actionsColumn]}>
<Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>{t('actions').toUpperCase()}</Text>
                </View>
              </View>

              {/* Table Rows */}
              {filteredExams.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    {isLoading ? 'Loading exams...' : 'No exams found'}
                  </Text>
                </View>
              ) : (
                filteredExams.map((exam) => {
                  const statusColors = getStatusColor(exam.status);
                  const formatDate = (dateString: string | null) => {
                    if (!dateString) return 'Not scheduled';
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-GB');
                  };
                  const formatTime = (dateString: string | null) => {
                    if (!dateString) return '';
                    const date = new Date(dateString);
                    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                  };
                  
                  return (
                    <View key={exam.id} style={[styles.tableRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={[styles.tableCell, styles.examColumn]}>
                        <Text style={[styles.examCreator, { color: colors.text }]}>{exam.admin_name}</Text>
                        <Text style={[styles.examTitle, { color: colors.textSecondary }]}>{exam.title}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.gradeColumn]}>
                        <Text style={[styles.examGrade, { color: colors.text }]}>Grade {exam.grade_level}</Text>
                        <Text style={[styles.examSubject, { color: colors.textSecondary }]}>{exam.subject_name}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.scheduleColumn]}>
                        <Text style={[styles.examDate, { color: colors.text }]}>{formatDate(exam.scheduled_start)}</Text>
                        {exam.scheduled_start && exam.scheduled_end && (
                          <Text style={[styles.examTime, { color: colors.textSecondary }]}>
                            {formatTime(exam.scheduled_start)} - {formatTime(exam.scheduled_end)}
                          </Text>
                        )}
                      </View>
                      <View style={[styles.tableCell, styles.durationColumn]}>
                        <Text style={[styles.examDuration, { color: colors.text }]}>{exam.duration_minutes}m</Text>
                      </View>
                      <View style={[styles.tableCell, styles.questionsColumn]}>
<Text style={[styles.examQuestions, { color: colors.text }]}>{exam.question_count} {t('questions')}</Text>
                      </View>
                      <View style={[styles.tableCell, styles.statusColumn]}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                          <Text style={[styles.statusText, { color: statusColors.text }]}>
                            {exam.status}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.tableCell, styles.actionsColumn]}>
                        <View style={styles.actionsContainer}>
                          <TouchableOpacity 
                            style={styles.actionIcon}
                            onPress={() => handleViewExam(exam.id)}
                            testID={`view-exam-${exam.id}`}
                          >
                            <Eye size={16} color={colors.textSecondary} />
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={styles.actionIcon}
                            onPress={() => handleEditExam(exam.id)}
                            testID={`edit-exam-${exam.id}`}
                          >
                            <Edit size={16} color={colors.textSecondary} />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.actionIcon, deleteExamMutation.isPending && styles.disabledAction]}
                            onPress={() => handleDeleteExam(exam.id)}
                            testID={`delete-exam-${exam.id}`}
                            disabled={deleteExamMutation.isPending}
                          >
                            <Trash2 size={16} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 14,
    flexShrink: 1,
  },
  adminInfo: {
    alignItems: 'flex-end',
    flexShrink: 1,
    maxWidth: '50%',
  },
  adminRole: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 1,
  },
  adminEmail: {
    fontSize: 10,
    numberOfLines: 1,
  },
  navTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  navTab: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginRight: 12,
    flex: 1,
    alignItems: 'center',
  },
  activeNavTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  navTabText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeNavTabText: {
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  createButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filtersRow: {
    flexDirection: 'column',
    marginBottom: 16,
    gap: 8,
    zIndex: 9998,
    position: 'relative',
  },
  filtersTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  filterGroup: {
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  filterLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 9999,
    flex: 1,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 36,
    gap: 4,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 6,
    marginTop: 2,
    maxHeight: 200,
    zIndex: 10000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dropdownItemText: {
    fontSize: 12,
  },
  filterValue: {
    fontSize: 12,
    flex: 1,
    numberOfLines: 1,
  },
  tableContainer: {
    borderRadius: 8,
    borderWidth: 1,
  },
  tableWrapper: {
    minWidth: 800,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderCell: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  tableCell: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  examColumn: {
    width: 120,
  },
  gradeColumn: {
    width: 100,
  },
  scheduleColumn: {
    width: 120,
  },
  durationColumn: {
    width: 70,
  },
  questionsColumn: {
    width: 80,
  },
  statusColumn: {
    width: 80,
  },
  actionsColumn: {
    width: 120,
  },
  examCreator: {
    fontSize: 12,
    fontWeight: '500',
    numberOfLines: 1,
  },
  examGrade: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 1,
    numberOfLines: 1,
  },
  examSubject: {
    fontSize: 10,
    numberOfLines: 1,
  },
  examDate: {
    fontSize: 12,
    marginBottom: 1,
    numberOfLines: 1,
  },
  examTime: {
    fontSize: 10,
    numberOfLines: 1,
  },
  examDuration: {
    fontSize: 12,
    numberOfLines: 1,
  },
  examQuestions: {
    fontSize: 12,
    numberOfLines: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    padding: 4,
  },
  disabledAction: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  examTitle: {
    fontSize: 10,
    marginTop: 1,
    numberOfLines: 1,
  },
});