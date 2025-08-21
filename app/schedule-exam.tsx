import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  Calendar,
  Clock,
  Users,
  Save,
  Plus,
  ArrowLeft,
} from 'lucide-react-native';
import { ExamSchedule } from '@/types/exam';
import { useTheme } from '@/hooks/theme-context';

const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

export default function ScheduleExamScreen() {
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams();
  const examId = params.examId as string;
  
  const [scheduleData, setScheduleData] = useState<Partial<ExamSchedule>>({
    examId: examId || '',
    title: '',
    subject: '',
    grade: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    duration: 60,
    allowedAttempts: 1,
    status: 'scheduled',
    participants: [],
  });

  const saveSchedule = async () => {
    if (!scheduleData.title || !scheduleData.startDate || !scheduleData.endDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const finalSchedule: ExamSchedule = {
      ...scheduleData as ExamSchedule,
      id: `schedule_${Date.now()}`,
      totalQuestions: 10, // This would come from the exam template
      totalPoints: 20, // This would come from the exam template
      createdBy: 'current_user_id',
      createdAt: new Date().toISOString(),
    };

    console.log('Saving schedule:', finalSchedule);
    Alert.alert('Success', 'Exam scheduled successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: 'Schedule Exam',
          headerLeft: () => (
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: colors.surface }]} 
              onPress={() => router.back()}
            >
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.success }]} onPress={saveSchedule}>
              <Save size={16} color={colors.primaryText} />
              <Text style={[styles.saveButtonText, { color: colors.primaryText }]}>Schedule</Text>
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Exam Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Exam Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={scheduleData.title}
              onChangeText={(text) => setScheduleData(prev => ({ ...prev, title: text }))}
              placeholder="Enter exam title"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>Subject *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={scheduleData.subject}
                onChangeText={(text) => setScheduleData(prev => ({ ...prev, subject: text }))}
                placeholder="Mathematics"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>Grade *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {GRADES.map(grade => (
                    <TouchableOpacity
                      key={grade}
                      style={[
                        styles.pickerOption,
                        scheduleData.grade === grade && [styles.pickerOptionSelected, { backgroundColor: colors.primary }]
                      ]}
                      onPress={() => setScheduleData(prev => ({ ...prev, grade }))}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        { color: colors.textSecondary },
                        scheduleData.grade === grade && [styles.pickerOptionTextSelected, { color: colors.primaryText }]
                      ]}>
                        {grade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Schedule</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>Start Date *</Text>
              <TouchableOpacity style={[styles.dateInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Calendar size={16} color={colors.textSecondary} />
                <TextInput
                  style={[styles.dateText, { color: colors.text }]}
                  value={scheduleData.startDate}
                  onChangeText={(text) => setScheduleData(prev => ({ ...prev, startDate: text }))}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>End Date *</Text>
              <TouchableOpacity style={[styles.dateInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Calendar size={16} color={colors.textSecondary} />
                <TextInput
                  style={[styles.dateText, { color: colors.text }]}
                  value={scheduleData.endDate}
                  onChangeText={(text) => setScheduleData(prev => ({ ...prev, endDate: text }))}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>Start Time *</Text>
              <TouchableOpacity style={[styles.dateInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Clock size={16} color={colors.textSecondary} />
                <TextInput
                  style={[styles.dateText, { color: colors.text }]}
                  value={scheduleData.startTime}
                  onChangeText={(text) => setScheduleData(prev => ({ ...prev, startTime: text }))}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>End Time *</Text>
              <TouchableOpacity style={[styles.dateInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Clock size={16} color={colors.textSecondary} />
                <TextInput
                  style={[styles.dateText, { color: colors.text }]}
                  value={scheduleData.endTime}
                  onChangeText={(text) => setScheduleData(prev => ({ ...prev, endTime: text }))}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Duration (minutes)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={scheduleData.duration?.toString()}
              onChangeText={(text) => setScheduleData(prev => ({ ...prev, duration: parseInt(text) || 60 }))}
              placeholder="60"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Participants</Text>
          
          <View style={[styles.participantCard, { backgroundColor: isDark ? colors.card : '#F8FAFC' }]}>
            <Users size={20} color={colors.primary} />
            <View style={styles.participantInfo}>
              <Text style={[styles.participantTitle, { color: colors.text }]}>All Students in {scheduleData.grade || 'Selected Grade'}</Text>
              <Text style={[styles.participantSubtitle, { color: colors.textSecondary }]}>Automatically includes all students in the selected grade</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.addParticipantButton, { borderColor: colors.primary }]}>
            <Plus size={16} color={colors.primary} />
            <Text style={[styles.addParticipantText, { color: colors.primary }]}>Add Specific Students</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Allowed Attempts</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Number of times students can take this exam</Text>
            </View>
            <TextInput
              style={[styles.settingInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={scheduleData.allowedAttempts?.toString()}
              onChangeText={(text) => setScheduleData(prev => ({ ...prev, allowedAttempts: parseInt(text) || 1 }))}
              keyboardType="numeric"
            />
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
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
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
  inputGroup: {
    marginBottom: 16,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  pickerContainer: {
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
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  participantSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  addParticipantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  addParticipantText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
});