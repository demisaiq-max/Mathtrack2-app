import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import {
  Clock,
  Calendar,
  Users,
  BookOpen,
  Play,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { ExamSchedule } from '@/types/exam';

const GRADES = ['All Grades', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const SUBJECTS = ['All Subjects', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science'];

export default function ExamBoardScreen() {
  const [selectedGrade, setSelectedGrade] = useState('All Grades');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');

  // Mock exam schedules data
  const examSchedules: ExamSchedule[] = [
    {
      id: '1',
      examId: 'exam_1',
      title: 'Algebra II - Final Exam',
      subject: 'Mathematics',
      grade: 'Grade 10',
      startDate: '2025-01-20',
      endDate: '2025-01-20',
      startTime: '09:00',
      endTime: '11:00',
      duration: 120,
      totalQuestions: 25,
      totalPoints: 100,
      allowedAttempts: 1,
      status: 'active',
      createdBy: 'teacher_1',
      createdAt: '2025-01-15T10:00:00Z',
      participants: ['student_1', 'student_2'],
    },
    {
      id: '2',
      examId: 'exam_2',
      title: 'Photosynthesis Quiz',
      subject: 'Biology',
      grade: 'Grade 9',
      startDate: '2025-01-22',
      endDate: '2025-01-22',
      startTime: '14:00',
      endTime: '15:00',
      duration: 60,
      totalQuestions: 15,
      totalPoints: 50,
      allowedAttempts: 2,
      status: 'scheduled',
      createdBy: 'teacher_2',
      createdAt: '2025-01-16T14:00:00Z',
      participants: ['student_1'],
    },
    {
      id: '3',
      examId: 'exam_3',
      title: 'Physics - Motion and Forces',
      subject: 'Physics',
      grade: 'Grade 11',
      startDate: '2025-01-18',
      endDate: '2025-01-18',
      startTime: '10:00',
      endTime: '12:00',
      duration: 120,
      totalQuestions: 20,
      totalPoints: 80,
      allowedAttempts: 1,
      status: 'completed',
      createdBy: 'teacher_3',
      createdAt: '2025-01-10T09:00:00Z',
      participants: ['student_1'],
    },
  ];

  const getStatusInfo = (status: ExamSchedule['status']) => {
    switch (status) {
      case 'active':
        return {
          color: '#10B981',
          bg: '#D1FAE5',
          text: 'Active',
          icon: <Play size={16} color="#10B981" />,
        };
      case 'scheduled':
        return {
          color: '#F59E0B',
          bg: '#FEF3C7',
          text: 'Scheduled',
          icon: <Clock size={16} color="#F59E0B" />,
        };
      case 'completed':
        return {
          color: '#6B7280',
          bg: '#F3F4F6',
          text: 'Completed',
          icon: <CheckCircle size={16} color="#6B7280" />,
        };
      case 'cancelled':
        return {
          color: '#EF4444',
          bg: '#FEE2E2',
          text: 'Cancelled',
          icon: <AlertCircle size={16} color="#EF4444" />,
        };
      default:
        return {
          color: '#6B7280',
          bg: '#F3F4F6',
          text: 'Unknown',
          icon: <AlertCircle size={16} color="#6B7280" />,
        };
    }
  };

  const filteredExams = examSchedules.filter(exam => {
    const gradeMatch = selectedGrade === 'All Grades' || exam.grade === selectedGrade;
    const subjectMatch = selectedSubject === 'All Subjects' || exam.subject === selectedSubject;
    return gradeMatch && subjectMatch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const canTakeExam = (exam: ExamSchedule) => {
    return exam.status === 'active';
  };

  const startExam = (exam: ExamSchedule) => {
    if (canTakeExam(exam)) {
      router.push(`/take-exam?examId=${exam.examId}&scheduleId=${exam.id}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Exam Board',
          headerStyle: {
            backgroundColor: '#4F46E5',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Available Exams</Text>
          <Text style={styles.subtitle}>Select an exam to begin or view results</Text>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Grade:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {GRADES.map(grade => (
                <TouchableOpacity
                  key={grade}
                  style={[
                    styles.filterChip,
                    selectedGrade === grade && styles.filterChipSelected
                  ]}
                  onPress={() => setSelectedGrade(grade)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedGrade === grade && styles.filterChipTextSelected
                  ]}>
                    {grade}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Subject:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {SUBJECTS.map(subject => (
                <TouchableOpacity
                  key={subject}
                  style={[
                    styles.filterChip,
                    selectedSubject === subject && styles.filterChipSelected
                  ]}
                  onPress={() => setSelectedSubject(subject)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedSubject === subject && styles.filterChipTextSelected
                  ]}>
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Exam Cards */}
        <View style={styles.examsList}>
          {filteredExams.map((exam) => {
            const statusInfo = getStatusInfo(exam.status);
            const canTake = canTakeExam(exam);
            
            return (
              <TouchableOpacity
                key={exam.id}
                style={[
                  styles.examCard,
                  canTake && styles.examCardActive
                ]}
                onPress={() => startExam(exam)}
                disabled={!canTake}
              >
                <View style={styles.examHeader}>
                  <View style={styles.examTitleSection}>
                    <Text style={styles.examTitle}>{exam.title}</Text>
                    <View style={styles.examMeta}>
                      <Text style={styles.examGrade}>{exam.grade}</Text>
                      <Text style={styles.examSubject}>{exam.subject}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: statusInfo.bg }
                  ]}>
                    {statusInfo.icon}
                    <Text style={[
                      styles.statusText,
                      { color: statusInfo.color }
                    ]}>
                      {statusInfo.text}
                    </Text>
                  </View>
                </View>

                <View style={styles.examDetails}>
                  <View style={styles.examDetailRow}>
                    <View style={styles.examDetailItem}>
                      <Calendar size={16} color="#6B7280" />
                      <Text style={styles.examDetailText}>
                        {formatDate(exam.startDate)}
                      </Text>
                    </View>
                    <View style={styles.examDetailItem}>
                      <Clock size={16} color="#6B7280" />
                      <Text style={styles.examDetailText}>
                        {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.examDetailRow}>
                    <View style={styles.examDetailItem}>
                      <BookOpen size={16} color="#6B7280" />
                      <Text style={styles.examDetailText}>
                        {exam.totalQuestions} questions
                      </Text>
                    </View>
                    <View style={styles.examDetailItem}>
                      <Users size={16} color="#6B7280" />
                      <Text style={styles.examDetailText}>
                        {exam.duration} minutes
                      </Text>
                    </View>
                  </View>
                </View>

                {canTake && (
                  <View style={styles.examAction}>
                    <View style={styles.startButton}>
                      <Play size={16} color="#FFFFFF" />
                      <Text style={styles.startButtonText}>Start Exam</Text>
                    </View>
                  </View>
                )}

                {exam.status === 'completed' && (
                  <View style={styles.examAction}>
                    <TouchableOpacity style={styles.viewResultsButton}>
                      <CheckCircle size={16} color="#6B7280" />
                      <Text style={styles.viewResultsText}>View Results</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredExams.length === 0 && (
          <View style={styles.emptyState}>
            <BookOpen size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Exams Available</Text>
            <Text style={styles.emptyStateText}>
              There are no exams matching your current filters.
            </Text>
          </View>
        )}
      </ScrollView>
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  filtersSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: '#4F46E5',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  examsList: {
    padding: 20,
    gap: 16,
  },
  examCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    opacity: 0.7,
  },
  examCardActive: {
    opacity: 1,
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  examTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  examMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  examGrade: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
  },
  examSubject: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  examDetails: {
    gap: 8,
    marginBottom: 16,
  },
  examDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  examDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  examDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  examAction: {
    alignItems: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  viewResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  viewResultsText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});