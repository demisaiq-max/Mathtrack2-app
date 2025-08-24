import React, { useState } from 'react';
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
import { Image } from 'expo-image';
import { useAuth } from '@/hooks/auth-context';
import { useTheme } from '@/hooks/theme-context';
import { useLanguage } from '@/hooks/language-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  User,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ArrowLeft,
} from 'lucide-react-native';

interface ScheduleItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: 'exam' | 'class' | 'meeting' | 'other';
}

export default function AdminProfile() {
  const { user, logout, refreshUser, updateUser } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'schedule'>('profile');

  // Refresh user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[AdminProfile] Screen focused, refreshing user data');
      console.log('[AdminProfile] Current user profileImage:', user?.profileImage);
      if (refreshUser) {
        refreshUser();
      }
    }, [refreshUser])
  );
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    {
      id: '1',
      title: 'Calculus Quiz',
      subject: 'Mathematics',
      grade: 'Grade 12',
      date: '2025-01-15',
      startTime: '14:00',
      endTime: '15:00',
      location: 'Room 101',
      type: 'exam',
    },
    {
      id: '2',
      title: 'Physics Lab Test',
      subject: 'Physics',
      grade: 'Grade 11',
      date: '2025-01-15',
      startTime: '15:30',
      endTime: '16:30',
      location: 'Lab 2',
      type: 'exam',
    },
    {
      id: '3',
      title: 'Staff Meeting',
      subject: 'Administration',
      grade: 'All',
      date: '2025-01-15',
      startTime: '16:00',
      endTime: '17:00',
      location: 'Conference Room',
      type: 'meeting',
    },
  ]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [scheduleForm, setScheduleForm] = useState<Partial<ScheduleItem>>({
    title: '',
    subject: '',
    grade: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    type: 'class',
  });
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      'Are you sure you want to logout?',
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[AdminProfile] Logout initiated');
              await logout();
              console.log('[AdminProfile] Logout successful, redirecting to login');
              // Navigate directly to login page after logout
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('[AdminProfile] Logout error:', error);
              // Even if logout fails, try to navigate to login
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setScheduleForm({
      title: '',
      subject: '',
      grade: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      type: 'class',
    });
    setShowScheduleModal(true);
  };

  const handleEditSchedule = (item: ScheduleItem) => {
    setEditingSchedule(item);
    setScheduleForm(item);
    setShowScheduleModal(true);
  };

  const handleDeleteSchedule = (id: string) => {
    Alert.alert(
      t('deleteScheduleItem'),
      t('deleteScheduleConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            setScheduleItems(prev => prev.filter(item => item.id !== id));
            Alert.alert(t('success'), t('scheduleItemDeleted'));
          },
        },
      ]
    );
  };

  const handleSaveSchedule = () => {
    if (!scheduleForm.title || !scheduleForm.date || !scheduleForm.startTime || !scheduleForm.endTime) {
      Alert.alert(t('error'), t('fillRequiredFields'));
      return;
    }

    if (editingSchedule) {
      setScheduleItems(prev => prev.map(item => 
        item.id === editingSchedule.id 
          ? { ...item, ...scheduleForm } as ScheduleItem
          : item
      ));
      Alert.alert(t('success'), t('scheduleItemUpdated'));
    } else {
      const newItem: ScheduleItem = {
        id: Date.now().toString(),
        ...scheduleForm,
      } as ScheduleItem;
      setScheduleItems(prev => [...prev, newItem]);
      Alert.alert(t('success'), t('scheduleItemAdded'));
    }
    
    setShowScheduleModal(false);
    setEditingSchedule(null);
  };

  const handleUpdateName = async () => {
    if (!editingName.trim()) {
      Alert.alert(t('error'), 'Please enter a valid name');
      return;
    }

    if (!user) {
      Alert.alert(t('error'), 'User not found');
      return;
    }

    setIsUpdatingName(true);
    try {
      const updatedUser = {
        ...user,
        fullName: editingName.trim()
      };
      
      await updateUser(updatedUser);
      Alert.alert(t('success'), 'Name updated successfully!');
      setShowEditNameModal(false);
    } catch (error) {
      console.error('Error updating name:', error);
      Alert.alert(t('error'), 'Failed to update name. Please try again.');
    } finally {
      setIsUpdatingName(false);
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
      case 'exam':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'class':
        return { bg: '#EEF2FF', text: '#4F46E5' };
      case 'meeting':
        return { bg: '#D1FAE5', text: '#059669' };
      default:
        return { bg: '#E5E7EB', text: '#6B7280' };
    }
  };

  const menuItems = [
    {
      icon: Calendar,
      title: t('schedule'),
      subtitle: 'Manage your schedule and appointments',
      onPress: () => router.push('/schedule-management'),
    },
    {
      icon: User,
      title: t('profile'),
      subtitle: t('updatePersonalInfo'),
      onPress: () => router.push('/edit-profile'),
    },
    {
      icon: Settings,
      title: t('settings'),
      subtitle: t('manageNotificationPrefs'),
      onPress: () => router.push('/settings'),
    },
    {
      icon: Shield,
      title: t('privacySecurityTitle'),
      subtitle: t('controlPrivacySettings'),
      onPress: () => router.push('/settings'),
    },
    {
      icon: HelpCircle,
      title: t('helpSupportTitle'),
      subtitle: t('getHelpContactSupport'),
      onPress: () => router.push('/settings'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.profileSection, { backgroundColor: colors.surface }]}>
            <View style={[styles.avatarContainer, { backgroundColor: isDark ? colors.card : '#F3F4F6' }]}>
              {user?.profileImage ? (
                <Image
                  key={`${user.profileImage}-${Date.now()}`} // Force re-render with timestamp
                  source={{ uri: user.profileImage }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  cachePolicy="none" // Disable caching to always fetch fresh image
                  onLoad={() => console.log('[AdminProfile] Image loaded successfully:', user.profileImage)}
                  onError={(error) => console.log('[AdminProfile] Image load error:', error)}
                />
              ) : (
                <User size={40} color={colors.textSecondary} />
              )}
            </View>
            <View style={styles.userInfo}>
              <View style={styles.nameContainer}>
                <Text style={[styles.userName, { color: colors.text }]}>{user?.fullName}</Text>
                <TouchableOpacity 
                  style={[styles.editNameButton, { backgroundColor: isDark ? colors.card : '#F3F4F6' }]}
                  onPress={() => {
                    setEditingName(user?.fullName || '');
                    setShowEditNameModal(true);
                  }}
                >
                  <Edit size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
              <View style={[styles.roleBadge, { backgroundColor: isDark ? colors.card : '#EEF2FF' }]}>
                <Text style={[styles.roleText, { color: colors.primary }]}>{t('administratorRole')}</Text>
              </View>
            </View>
          </View>
        </View>



        {activeTab === 'profile' ? (
          <>
            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings')}</Text>
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.menuItem, { backgroundColor: colors.surface }]}
                    onPress={item.onPress}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[styles.menuIconContainer, { backgroundColor: isDark ? colors.card : '#F3F4F6' }]}>
                        <IconComponent size={20} color={colors.textSecondary} />
                      </View>
                      <View style={styles.menuItemContent}>
                        <Text style={[styles.menuItemTitle, { color: colors.text }]}>{item.title}</Text>
                        <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.logoutSection}>
              <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: isDark ? colors.error : '#FEE2E2' }]} onPress={handleLogout}>
                <LogOut size={20} color={colors.error} />
                <Text style={[styles.logoutText, { color: colors.error }]}>{t('logout')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>MathTrack Admin v1.0.0</Text>
            </View>
          </>
        ) : (
          <>
            {/* Schedule Management */}
            <View style={styles.scheduleSection}>
              <View style={styles.scheduleSectionHeader}>
                <View style={styles.scheduleHeaderLeft}>
                  <TouchableOpacity 
                    style={[styles.backButton, { backgroundColor: colors.surface }]} 
                    onPress={() => setActiveTab('profile')}
                  >
                    <ArrowLeft size={20} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('scheduleManagement')}</Text>
                </View>
                <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAddSchedule}>
                  <Plus size={20} color={colors.primaryText} />
                  <Text style={[styles.addButtonText, { color: colors.primaryText }]}>{t('addSchedule')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.scheduleList}>
                {scheduleItems.map((item) => {
                  const typeColors = getTypeColor(item.type);
                  return (
                    <View key={item.id} style={[styles.scheduleCard, { backgroundColor: colors.surface }]}>
                      <View style={styles.scheduleCardHeader}>
                        <View style={styles.scheduleCardLeft}>
                          <Text style={[styles.scheduleTitle, { color: colors.text }]}>{item.title}</Text>
                          <Text style={[styles.scheduleSubject, { color: colors.textSecondary }]}>{item.subject} - {item.grade}</Text>
                        </View>
                        <View style={styles.scheduleCardRight}>
                          <View style={[styles.typeBadge, { backgroundColor: typeColors.bg }]}>
                            <Text style={[styles.typeText, { color: typeColors.text }]}>
                              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.scheduleDetails}>
                        <View style={styles.scheduleDetailRow}>
                          <Calendar size={16} color={colors.textSecondary} />
                          <Text style={[styles.scheduleDetailText, { color: colors.text }]}>{formatDate(item.date)}</Text>
                        </View>
                        <View style={styles.scheduleDetailRow}>
                          <Clock size={16} color={colors.textSecondary} />
                          <Text style={[styles.scheduleDetailText, { color: colors.text }]}>
                            {formatTime(item.startTime)} - {formatTime(item.endTime)}
                          </Text>
                        </View>
                        <View style={styles.scheduleDetailRow}>
                          <Text style={[styles.scheduleLocation, { color: colors.text }]}>📍 {item.location}</Text>
                        </View>
                      </View>

                      <View style={[styles.scheduleActions, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: isDark ? colors.card : '#F9FAFB' }]}
                          onPress={() => handleEditSchedule(item)}
                        >
                          <Edit size={16} color={colors.primary} />
                          <Text style={[styles.actionButtonText, { color: colors.primary }]}>{t('edit')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: isDark ? colors.card : '#FEF2F2' }]}
                          onPress={() => handleDeleteSchedule(item.id)}
                        >
                          <Trash2 size={16} color={colors.error} />
                          <Text style={[styles.actionButtonText, { color: colors.error }]}>{t('delete')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Schedule Modal */}
      <Modal
        visible={showScheduleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingSchedule ? t('editSchedule') : t('addSchedule')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowScheduleModal(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>{t('title')} *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={scheduleForm.title}
                onChangeText={(text) => setScheduleForm(prev => ({ ...prev, title: text }))}
                placeholder={t('enterTitle')}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>{t('subject')}</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={scheduleForm.subject}
                onChangeText={(text) => setScheduleForm(prev => ({ ...prev, subject: text }))}
                placeholder={t('enterSubject')}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>{t('grade')}</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={scheduleForm.grade}
                onChangeText={(text) => setScheduleForm(prev => ({ ...prev, grade: text }))}
                placeholder={t('enterGrade')}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>{t('date')} *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={scheduleForm.date}
                onChangeText={(text) => setScheduleForm(prev => ({ ...prev, date: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={[styles.formLabel, { color: colors.text }]}>{t('startTime')} *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={scheduleForm.startTime}
                  onChangeText={(text) => setScheduleForm(prev => ({ ...prev, startTime: text }))}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={[styles.formLabel, { color: colors.text }]}>{t('endTime')} *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={scheduleForm.endTime}
                  onChangeText={(text) => setScheduleForm(prev => ({ ...prev, endTime: text }))}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>{t('location')}</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={scheduleForm.location}
                onChangeText={(text) => setScheduleForm(prev => ({ ...prev, location: text }))}
                placeholder={t('enterLocation')}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>{t('type')}</Text>
              <View style={styles.typeSelector}>
                {['class', 'exam', 'meeting', 'other'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      { backgroundColor: isDark ? colors.card : '#F3F4F6', borderColor: colors.border },
                      scheduleForm.type === type && [styles.selectedTypeOption, { backgroundColor: isDark ? colors.primary : '#EEF2FF', borderColor: colors.primary }]
                    ]}
                    onPress={() => setScheduleForm(prev => ({ ...prev, type: type as any }))}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      { color: colors.textSecondary },
                      scheduleForm.type === type && [styles.selectedTypeOptionText, { color: colors.primary }]
                    ]}>
                      {t(type as keyof typeof t)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveSchedule}>
              <Save size={20} color={colors.primaryText} />
              <Text style={[styles.saveButtonText, { color: colors.primaryText }]}>
                {editingSchedule ? t('updateSchedule') : t('addSchedule')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Name Modal */}
      <Modal
        visible={showEditNameModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditNameModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Name</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEditNameModal(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Full Name *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={editingName}
                onChangeText={setEditingName}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary, opacity: isUpdatingName ? 0.7 : 1 }]} 
              onPress={handleUpdateName}
              disabled={isUpdatingName}
            >
              <Save size={20} color={colors.primaryText} />
              <Text style={[styles.saveButtonText, { color: colors.primaryText }]}>
                {isUpdatingName ? 'Updating...' : 'Update Name'}
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  editNameButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flexShrink: 1,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    flexShrink: 1,
  },
  roleBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    flexShrink: 1,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    flexShrink: 1,
  },
  logoutSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 6,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  scheduleSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scheduleSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scheduleList: {
    gap: 16,
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
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
    marginBottom: 10,
  },
  scheduleCardLeft: {
    flex: 1,
  },
  scheduleCardRight: {
    marginLeft: 12,
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    flexShrink: 1,
  },
  scheduleSubject: {
    fontSize: 13,
    color: '#6B7280',
    flexShrink: 1,
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
    gap: 6,
    marginBottom: 12,
  },
  scheduleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleDetailText: {
    fontSize: 13,
    color: '#374151',
    flexShrink: 1,
  },
  scheduleLocation: {
    fontSize: 13,
    color: '#374151',
    flexShrink: 1,
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    gap: 4,
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4F46E5',
  },
  deleteButtonText: {
    color: '#DC2626',
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
    paddingHorizontal: 24,
    paddingVertical: 20,
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
});