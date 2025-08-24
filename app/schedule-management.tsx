import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Save,
  X,
  BookOpen,
  Users,
  MessageSquare,
  Settings,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/theme-context';
import { useSchedules, Schedule, ScheduleFormData } from '@/hooks/useSchedules';

export default function ScheduleManagement() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    schedules,
    loading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getTodaySchedules,
  } = useSchedules();

  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: '',
    type: 'Class',
    grade_level: undefined,
    date: '',
    start_time: '',
    end_time: '',
    location: '',
  });
  const [showDateModal, setShowDateModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setFormData({
      title: '',
      type: 'Class',
      grade_level: undefined,
      date: '',
      start_time: '',
      end_time: '',
      location: '',
    });
    setShowModal(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title,
      type: schedule.type,
      grade_level: schedule.grade_level || undefined,
      date: schedule.date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      location: schedule.location || '',
    });
    setShowModal(true);
  };

  const handleDeleteSchedule = (schedule: Schedule) => {
    Alert.alert(
      'Delete Schedule',
      `Are you sure you want to delete &quot;${schedule.title}&quot;?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSchedule(schedule.id),
        },
      ]
    );
  };

  const handleSaveSchedule = async () => {
    if (!formData.title || !formData.date || !formData.start_time || !formData.end_time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    let success = false;
    if (editingSchedule) {
      success = await updateSchedule(editingSchedule.id, formData);
    } else {
      success = await createSchedule(formData);
    }

    if (success) {
      setShowModal(false);
      setEditingSchedule(null);
      // Force refresh the component
      setRefreshKey(prev => prev + 1);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Exam':
        return { bg: '#FEF3C7', text: '#D97706', icon: BookOpen };
      case 'Class':
        return { bg: '#EEF2FF', text: '#4F46E5', icon: Users };
      case 'Meeting':
        return { bg: '#D1FAE5', text: '#059669', icon: MessageSquare };
      case 'Other':
        return { bg: '#E5E7EB', text: '#6B7280', icon: Settings };
      default:
        return { bg: '#E5E7EB', text: '#6B7280', icon: Settings };
    }
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get first day of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    
    // Get first day of the week for the first day of month
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    // Generate 6 weeks of days
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(current);
        const isCurrentMonth = date.getMonth() === currentMonth;
        const isToday = date.toDateString() === today.toDateString();
        const isPast = date < today && !isToday;
        
        days.push({
          date: new Date(date),
          day: date.getDate(),
          isCurrentMonth,
          isToday,
          isPast,
          value: date.toISOString().split('T')[0]
        });
        
        current.setDate(current.getDate() + 1);
      }
    }
    
    return {
      days,
      monthName: firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  };

  // Force refresh when schedules change
  useEffect(() => {
    console.log('[ScheduleManagement] Schedules updated:', schedules.length);
  }, [schedules.length, refreshKey]);

  const generateTimeOptions = () => {
    const options = [];
    
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayHour = hour % 12 || 12;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const timeLabel = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
        options.push({ value: timeValue, label: timeLabel });
      }
    }
    
    return options;
  };

  const todaySchedules = getTodaySchedules();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.background }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Schedule Management</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Manage your exams, classes, and meetings
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddSchedule}
        >
          <Plus size={20} color={colors.primaryText} />
          <Text style={[styles.addButtonText, { color: colors.primaryText }]}>Add Schedule</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Today's Schedule */}
        {todaySchedules.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Today&apos;s Schedule</Text>
            <View style={styles.scheduleList}>
              {todaySchedules.map((schedule) => {
                const typeConfig = getTypeColor(schedule.type);
                const IconComponent = typeConfig.icon;
                return (
                  <View key={schedule.id} style={[styles.scheduleCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.scheduleCardHeader}>
                      <View style={styles.scheduleCardLeft}>
                        <View style={styles.scheduleIconContainer}>
                          <View style={[styles.scheduleIcon, { backgroundColor: typeConfig.bg }]}>
                            <IconComponent size={16} color={typeConfig.text} />
                          </View>
                          <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }]}>
                            <Text style={[styles.typeText, { color: typeConfig.text }]}>
                              {schedule.type}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.scheduleInfo}>
                          <Text style={[styles.scheduleTitle, { color: colors.text }]}>{schedule.title}</Text>
                          {schedule.grade_level && (
                            <Text style={[styles.scheduleGrade, { color: colors.textSecondary }]}>Grade {schedule.grade_level}</Text>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.scheduleDetails}>
                      <View style={styles.scheduleDetailRow}>
                        <Calendar size={14} color={colors.textSecondary} />
                        <Text style={[styles.scheduleDetailText, { color: colors.text }]}>
                          {formatDate(schedule.date)}
                        </Text>
                      </View>
                      <View style={styles.scheduleDetailRow}>
                        <Clock size={14} color={colors.textSecondary} />
                        <Text style={[styles.scheduleDetailText, { color: colors.text }]}>
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </Text>
                      </View>
                      {schedule.location && (
                        <View style={styles.scheduleDetailRow}>
                          <MapPin size={14} color={colors.textSecondary} />
                          <Text style={[styles.scheduleDetailText, { color: colors.text }]}>
                            {schedule.location}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={[styles.scheduleActions, { borderTopColor: colors.border }]}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: isDark ? colors.card : '#F9FAFB' }]}
                        onPress={() => handleEditSchedule(schedule)}
                      >
                        <Edit size={14} color={colors.primary} />
                        <Text style={[styles.actionButtonText, { color: colors.primary }]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: isDark ? colors.card : '#FEF2F2' }]}
                        onPress={() => handleDeleteSchedule(schedule)}
                      >
                        <Trash2 size={14} color={colors.error} />
                        <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* All Schedules */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>All Schedules ({schedules.length})</Text>
          
          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading schedules...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text>
            </View>
          )}

          {!loading && !error && schedules.length === 0 && (
            <View style={styles.emptyContainer}>
              <Calendar size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No schedules yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Create your first schedule to get started</Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={handleAddSchedule}
              >
                <Plus size={16} color={colors.primaryText} />
                <Text style={[styles.emptyButtonText, { color: colors.primaryText }]}>Add Schedule</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && schedules.length > 0 && (
            <View style={styles.scheduleList}>
              {schedules.map((schedule) => {
                const typeConfig = getTypeColor(schedule.type);
                const IconComponent = typeConfig.icon;
                return (
                  <View key={schedule.id} style={[styles.scheduleCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.scheduleCardHeader}>
                      <View style={styles.scheduleCardLeft}>
                        <View style={styles.scheduleIconContainer}>
                          <View style={[styles.scheduleIcon, { backgroundColor: typeConfig.bg }]}>
                            <IconComponent size={16} color={typeConfig.text} />
                          </View>
                          <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }]}>
                            <Text style={[styles.typeText, { color: typeConfig.text }]}>
                              {schedule.type}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.scheduleInfo}>
                          <Text style={[styles.scheduleTitle, { color: colors.text }]}>{schedule.title}</Text>
                          {schedule.grade_level && (
                            <Text style={[styles.scheduleGrade, { color: colors.textSecondary }]}>Grade {schedule.grade_level}</Text>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.scheduleDetails}>
                      <View style={styles.scheduleDetailRow}>
                        <Calendar size={14} color={colors.textSecondary} />
                        <Text style={[styles.scheduleDetailText, { color: colors.text }]}>
                          {formatDate(schedule.date)}
                        </Text>
                      </View>
                      <View style={styles.scheduleDetailRow}>
                        <Clock size={14} color={colors.textSecondary} />
                        <Text style={[styles.scheduleDetailText, { color: colors.text }]}>
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </Text>
                      </View>
                      {schedule.location && (
                        <View style={styles.scheduleDetailRow}>
                          <MapPin size={14} color={colors.textSecondary} />
                          <Text style={[styles.scheduleDetailText, { color: colors.text }]}>
                            {schedule.location}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={[styles.scheduleActions, { borderTopColor: colors.border }]}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: isDark ? colors.card : '#F9FAFB' }]}
                        onPress={() => handleEditSchedule(schedule)}
                      >
                        <Edit size={14} color={colors.primary} />
                        <Text style={[styles.actionButtonText, { color: colors.primary }]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: isDark ? colors.card : '#FEF2F2' }]}
                        onPress={() => handleDeleteSchedule(schedule)}
                      >
                        <Trash2 size={14} color={colors.error} />
                        <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Schedule Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalContentContainer}
          >
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Title *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                placeholder="Enter schedule title"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Type</Text>
              <View style={styles.typeSelector}>
                {['Class', 'Exam', 'Meeting', 'Other'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      { backgroundColor: isDark ? colors.card : '#F3F4F6', borderColor: colors.border },
                      formData.type === type && [styles.selectedTypeOption, { backgroundColor: isDark ? colors.primary : '#EEF2FF', borderColor: colors.primary }]
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, type: type as any }))}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      { color: colors.textSecondary },
                      formData.type === type && [styles.selectedTypeOptionText, { color: colors.primary }]
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Grade Level</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={formData.grade_level?.toString() || ''}
                onChangeText={(text) => setFormData(prev => ({ ...prev, grade_level: text ? parseInt(text) : undefined }))}
                placeholder="Enter grade level (5-12)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Date *</Text>
              <TouchableOpacity
                style={[styles.formInput, styles.datePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowDateModal(true)}
              >
                <Text style={[styles.datePickerText, { color: formData.date ? colors.text : colors.textSecondary }]}>
                  {formData.date ? formatDate(formData.date) : 'Select Date'}
                </Text>
                <Calendar size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Start Time *</Text>
                <TouchableOpacity
                  style={[styles.formInput, styles.timePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowStartTimeModal(true)}
                >
                  <Text style={[styles.timePickerText, { color: formData.start_time ? colors.text : colors.textSecondary }]}>
                    {formData.start_time ? formatTime(formData.start_time) : 'Start Time'}
                  </Text>
                  <Clock size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={[styles.formLabel, { color: colors.text }]}>End Time *</Text>
                <TouchableOpacity
                  style={[styles.formInput, styles.timePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowEndTimeModal(true)}
                >
                  <Text style={[styles.timePickerText, { color: formData.end_time ? colors.text : colors.textSecondary }]}>
                    {formData.end_time ? formatTime(formData.end_time) : 'End Time'}
                  </Text>
                  <Clock size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Location</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="Enter location"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]} 
              onPress={handleSaveSchedule}
              disabled={loading}
            >
              <Save size={20} color={colors.primaryText} />
              <Text style={[styles.saveButtonText, { color: colors.primaryText }]}>
                {loading ? 'Saving...' : (editingSchedule ? 'Update Schedule' : 'Add Schedule')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDateModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowDateModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Date</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDateModal(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.calendarContainer} showsVerticalScrollIndicator={false}>
            {(() => {
              const { days, monthName } = generateCalendarDays();
              return (
                <>
                  <Text style={[styles.calendarMonth, { color: colors.text }]}>{monthName}</Text>
                  
                  <View style={styles.calendarHeader}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <Text key={day} style={[styles.calendarHeaderDay, { color: colors.textSecondary }]}>
                        {day}
                      </Text>
                    ))}
                  </View>
                  
                  <View style={styles.calendarGrid}>
                    {days.map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.calendarDay,
                          !day.isCurrentMonth && styles.calendarDayInactive,
                          day.isPast && styles.calendarDayPast,
                          day.isToday && [styles.calendarDayToday, { borderColor: colors.primary }],
                          formData.date === day.value && [styles.calendarDaySelected, { backgroundColor: colors.primary }]
                        ]}
                        onPress={() => {
                          if (!day.isPast || day.isToday) {
                            setFormData(prev => ({ ...prev, date: day.value }));
                            setShowDateModal(false);
                          }
                        }}
                        disabled={day.isPast && !day.isToday}
                      >
                        <Text style={[
                          styles.calendarDayText,
                          { color: colors.text },
                          !day.isCurrentMonth && { color: colors.textSecondary },
                          day.isPast && !day.isToday && { color: colors.textSecondary, opacity: 0.5 },
                          day.isToday && { color: colors.primary, fontWeight: 'bold' },
                          formData.date === day.value && { color: colors.primaryText, fontWeight: 'bold' }
                        ]}>
                          {day.day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              );
            })()}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Start Time Picker Modal */}
      <Modal
        visible={showStartTimeModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowStartTimeModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Start Time</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowStartTimeModal(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.timeModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.timeGrid}>
              {generateTimeOptions().map((time) => (
                <TouchableOpacity
                  key={time.value}
                  style={[
                    styles.timeModalOption,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    formData.start_time === time.value && [styles.timeModalOptionSelected, { backgroundColor: colors.primary, borderColor: colors.primary }]
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, start_time: time.value }));
                    setShowStartTimeModal(false);
                  }}
                >
                  <Text style={[
                    styles.timeModalOptionText,
                    { color: colors.text },
                    formData.start_time === time.value && { color: colors.primaryText, fontWeight: '600' }
                  ]}>
                    {time.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* End Time Picker Modal */}
      <Modal
        visible={showEndTimeModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowEndTimeModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select End Time</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEndTimeModal(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.timeModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.timeGrid}>
              {generateTimeOptions().map((time) => (
                <TouchableOpacity
                  key={time.value}
                  style={[
                    styles.timeModalOption,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    formData.end_time === time.value && [styles.timeModalOptionSelected, { backgroundColor: colors.primary, borderColor: colors.primary }]
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, end_time: time.value }));
                    setShowEndTimeModal(false);
                  }}
                >
                  <Text style={[
                    styles.timeModalOptionText,
                    { color: colors.text },
                    formData.end_time === time.value && { color: colors.primaryText, fontWeight: '600' }
                  ]}>
                    {time.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  scheduleList: {
    gap: 12,
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scheduleCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  scheduleIconContainer: {
    alignItems: 'center',
    gap: 6,
  },
  scheduleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  scheduleGrade: {
    fontSize: 14,
    color: '#6B7280',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  scheduleDetails: {
    gap: 8,
    marginBottom: 12,
  },
  scheduleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleDetailText: {
    fontSize: 14,
    color: '#374151',
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedTypeOption: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedTypeOptionText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    fontSize: 16,
    flex: 1,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePickerText: {
    fontSize: 16,
    flex: 1,
  },
  calendarContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  calendarMonth: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  calendarHeaderDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  calendarDayInactive: {
    opacity: 0.3,
  },
  calendarDayPast: {
    opacity: 0.5,
  },
  calendarDayToday: {
    borderWidth: 2,
  },
  calendarDaySelected: {
    backgroundColor: '#4F46E5',
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  timeModalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 20,
  },
  timeModalOption: {
    width: '30%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  timeModalOptionSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  timeModalOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});