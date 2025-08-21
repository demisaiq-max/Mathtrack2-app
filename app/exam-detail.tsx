import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  Edit,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Award,
  Trash2,
  Play,
} from 'lucide-react-native';

interface ExamDetail {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  duration: number;
  totalQuestions: number;
  totalPoints: number;
  passingScore: number;
  allowedAttempts: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  status: 'Active' | 'Inactive' | 'Completed';
  createdBy: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  participants: number;
  submissions: number;
}

export default function ExamDetailScreen() {
  const params = useLocalSearchParams();
  const examId = params.examId as string;
  
  // Mock exam data - in real app, this would be fetched based on examId
  const [examData] = useState<ExamDetail>({
    id: examId || '1',
    title: 'Mathematics Mid-Term Exam',
    description: 'Comprehensive mathematics exam covering algebra, geometry, and basic calculus concepts.',
    subject: 'Mathematics',
    grade: 'Grade 5',
    duration: 60,
    totalQuestions: 25,
    totalPoints: 50,
    passingScore: 60,
    allowedAttempts: 2,
    shuffleQuestions: true,
    showResults: true,
    status: 'Active',
    createdBy: 'Ali Jawad',
    createdAt: '2025-08-10T10:00:00Z',
    startDate: '13/08/2025',
    endDate: '15/08/2025',
    startTime: '09:00',
    endTime: '17:00',
    participants: 28,
    submissions: 15,
  });

  const handleEdit = () => {
    router.push('/edit-exam' as any);
  };

  const handleSchedule = () => {
    router.push(`/schedule-exam?examId=${examData.id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Exam',
      'Are you sure you want to delete this exam? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('Deleting exam:', examData.id);
            Alert.alert('Success', 'Exam deleted successfully!', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          },
        },
      ]
    );
  };

  const handlePreview = () => {
    router.push(`/take-exam?examId=${examData.id}&preview=true`);
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

  const statusColors = getStatusColor(examData.status);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Exam Details',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton} onPress={handlePreview}>
                <Play size={16} color="#4F46E5" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
                <Edit size={16} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
                <Trash2 size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.examTitle}>{examData.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {examData.status}
                </Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.examDescription}>{examData.description}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <BookOpen size={16} color="#6B7280" />
              <Text style={styles.metaText}>{examData.subject}</Text>
            </View>
            <View style={styles.metaItem}>
              <Users size={16} color="#6B7280" />
              <Text style={styles.metaText}>{examData.grade}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.metaText}>{examData.duration} min</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Edit size={20} color="#4F46E5" />
            <Text style={styles.actionButtonText}>Edit Exam</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleSchedule}>
            <Calendar size={20} color="#10B981" />
            <Text style={styles.actionButtonText}>Schedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handlePreview}>
            <Play size={20} color="#8B5CF6" />
            <Text style={styles.actionButtonText}>Preview</Text>
          </TouchableOpacity>
        </View>

        {/* Exam Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Exam Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <BookOpen size={24} color="#4F46E5" />
              <Text style={styles.statNumber}>{examData.totalQuestions}</Text>
              <Text style={styles.statLabel}>Questions</Text>
            </View>
            
            <View style={styles.statCard}>
              <Award size={24} color="#10B981" />
              <Text style={styles.statNumber}>{examData.totalPoints}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            
            <View style={styles.statCard}>
              <Users size={24} color="#8B5CF6" />
              <Text style={styles.statNumber}>{examData.participants}</Text>
              <Text style={styles.statLabel}>Participants</Text>
            </View>
            
            <View style={styles.statCard}>
              <Calendar size={24} color="#F59E0B" />
              <Text style={styles.statNumber}>{examData.submissions}</Text>
              <Text style={styles.statLabel}>Submissions</Text>
            </View>
          </View>
        </View>

        {/* Schedule Information */}
        {examData.startDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            
            <View style={styles.scheduleCard}>
              <View style={styles.scheduleRow}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.scheduleLabel}>Date Range:</Text>
                <Text style={styles.scheduleValue}>
                  {examData.startDate} - {examData.endDate}
                </Text>
              </View>
              
              <View style={styles.scheduleRow}>
                <Clock size={16} color="#6B7280" />
                <Text style={styles.scheduleLabel}>Time:</Text>
                <Text style={styles.scheduleValue}>
                  {examData.startTime} - {examData.endTime}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Exam Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Passing Score</Text>
              <Text style={styles.settingValue}>{examData.passingScore}%</Text>
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Allowed Attempts</Text>
              <Text style={styles.settingValue}>{examData.allowedAttempts}</Text>
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Shuffle Questions</Text>
              <Text style={[styles.settingValue, { color: examData.shuffleQuestions ? '#10B981' : '#DC2626' }]}>
                {examData.shuffleQuestions ? 'Yes' : 'No'}
              </Text>
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Show Results</Text>
              <Text style={[styles.settingValue, { color: examData.showResults ? '#10B981' : '#DC2626' }]}>
                {examData.showResults ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </View>

        {/* Created By */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Created By</Text>
          
          <View style={styles.creatorCard}>
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{examData.createdBy}</Text>
              <Text style={styles.createdDate}>
                Created on {new Date(examData.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  titleRow: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  examTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  examDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionsSection: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scheduleCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 80,
  },
  scheduleValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  creatorCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
  },
  creatorInfo: {
    gap: 4,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  createdDate: {
    fontSize: 14,
    color: '#6B7280',
  },
});