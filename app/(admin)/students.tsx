import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, MessageSquare, Bell, X, Save, Heart, MessageCircle, Send, ChevronDown, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAdmin } from '@/hooks/admin-context';
import { useTheme } from '@/hooks/theme-context';
import { useLanguage } from '@/hooks/language-context';
import { useAuth } from '@/hooks/auth-context';
import { supabase } from '@/config/supabase';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

interface NewAnnouncementData {
  title: string;
  content: string;
  priority: 'high' | 'normal' | 'urgent';
}

interface NewQuestionData {
  title: string;
  content: string;
  priority: 'high' | 'normal' | 'urgent';
}

export default function StudentsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { 
    announcements: adminAnnouncements, 
    qaQuestions, 
    pendingSubmissionsCount,
    addAnnouncement: adminAddAnnouncement, 
    likeAnnouncement: adminLikeAnnouncement, 
    addComment: adminAddComment,
    addQAQuestion,
    answerQAQuestion 
  } = useAdmin();
  
  // Local state for database announcements and questions
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedGrade, setSelectedGrade] = useState(t('allGradesFilter'));
  const [activeTab, setActiveTab] = useState<'announcements' | 'qa'>('announcements');
  const [isNewAnnouncementModalVisible, setIsNewAnnouncementModalVisible] = useState(false);
  const [isNewQuestionModalVisible, setIsNewQuestionModalVisible] = useState(false);
  const [isGradeDropdownVisible, setIsGradeDropdownVisible] = useState(false);
  const [newAnnouncementData, setNewAnnouncementData] = useState<NewAnnouncementData>({
    title: '',
    content: '',
    priority: 'normal',
  });
  const [newQuestionData, setNewQuestionData] = useState<NewQuestionData>({
    title: '',
    content: '',
    priority: 'normal',
  });
  
  // Comment state for announcements and questions
  const [commentInputs, setCommentInputs] = useState<{[key: number]: string}>({});
  const [showCommentInput, setShowCommentInput] = useState<{[key: number]: boolean}>({});
  const [questionCommentInputs, setQuestionCommentInputs] = useState<{[key: number]: string}>({});
  const [showQuestionCommentInput, setShowQuestionCommentInput] = useState<{[key: number]: boolean}>({});

  const grades = [t('allGradesFilter'), t('grade5'), t('grade6'), t('grade7'), t('grade8'), t('grade9'), t('grade10')];
  const gradeNumbers = [5, 6, 7, 8, 9, 10];

  // Load announcements from database
  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles!announcements_admin_id_fkey(full_name),
          announcement_likes(id, user_id),
          announcement_comments(id, comment, user_id, created_at, profiles!announcement_comments_user_id_fkey(full_name))
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading announcements:', error);
        return;
      }

      console.log('Loaded announcements:', JSON.stringify(data, null, 2));
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  // Load questions from database
  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          profiles!questions_author_id_fkey(full_name),
          question_likes(id, user_id),
          question_comments(id, comment, user_id, created_at, profiles!question_comments_user_id_fkey(full_name))
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading questions:', error);
        return;
      }

      console.log('Loaded questions:', JSON.stringify(data, null, 2));
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    loadQuestions();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' };
      case 'high':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' };
      case 'normal':
        return { bg: '#E0E7FF', text: '#4F46E5', border: '#A5B4FC' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' };
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncementData.title.trim() || !newAnnouncementData.content.trim()) {
      Alert.alert(t('error'), t('fillRequiredFields'));
      return;
    }

    if (!user?.id) {
      Alert.alert(t('error'), 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          admin_id: user.id,
          title: newAnnouncementData.title.trim(),
          body: newAnnouncementData.content.trim(),
          grade_level: parseInt(selectedGrade.replace('Grade ', '').replace(t('grade5'), '5').replace(t('grade6'), '6').replace(t('grade7'), '7').replace(t('grade8'), '8').replace(t('grade9'), '9').replace(t('grade10'), '10')) || 5,
          priority: newAnnouncementData.priority
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating announcement:', error);
        Alert.alert(t('error'), 'Failed to create announcement');
        return;
      }

      Alert.alert(t('success'), 'Announcement created successfully!');
      setNewAnnouncementData({ title: '', content: '', priority: 'normal' });
      setIsNewAnnouncementModalVisible(false);
      loadAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert(t('error'), 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!newQuestionData.title.trim() || !newQuestionData.content.trim()) {
      Alert.alert(t('error'), t('fillRequiredFields'));
      return;
    }

    if (!user?.id) {
      Alert.alert(t('error'), 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const gradeLevel = selectedGrade === t('allGradesFilter') ? 5 : 
        parseInt(selectedGrade.replace('Grade ', '').replace(t('grade5'), '5').replace(t('grade6'), '6').replace(t('grade7'), '7').replace(t('grade8'), '8').replace(t('grade9'), '9').replace(t('grade10'), '10')) || 5;
      
      const { data, error } = await supabase
        .from('questions')
        .insert({
          author_id: user.id,
          title: newQuestionData.title.trim(),
          body: newQuestionData.content.trim(),
          grade_level: gradeLevel
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating question:', error);
        Alert.alert(t('error'), 'Failed to create question');
        return;
      }

      Alert.alert(t('success'), 'Question created successfully!');
      setNewQuestionData({ title: '', content: '', priority: 'normal' });
      setIsNewQuestionModalVisible(false);
      loadQuestions();
    } catch (error) {
      console.error('Error creating question:', error);
      Alert.alert(t('error'), 'Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeAnnouncement = async (announcementId: number) => {
    if (!user?.id) return;

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('announcement_likes')
        .select('id')
        .eq('announcement_id', announcementId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('announcement_likes')
          .delete()
          .eq('announcement_id', announcementId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('announcement_likes')
          .insert({
            announcement_id: announcementId,
            user_id: user.id
          });
      }

      loadAnnouncements();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async (announcementId: number) => {
    if (!user?.id) return;
    
    const commentText = commentInputs[announcementId]?.trim();
    if (!commentText) return;

    try {
      const { error } = await supabase
        .from('announcement_comments')
        .insert({
          announcement_id: announcementId,
          user_id: user.id,
          comment: commentText
        });

      if (error) {
        console.error('Error adding comment:', error);
        Alert.alert(t('error'), 'Failed to add comment');
        return;
      }

      // Clear the input and hide it
      setCommentInputs(prev => ({ ...prev, [announcementId]: '' }));
      setShowCommentInput(prev => ({ ...prev, [announcementId]: false }));
      
      // Reload announcements to show new comment
      loadAnnouncements();
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert(t('error'), 'Failed to add comment');
    }
  };
  
  const toggleCommentInput = (announcementId: number) => {
    setShowCommentInput(prev => ({
      ...prev,
      [announcementId]: !prev[announcementId]
    }));
  };

  const handleLikeQuestion = async (questionId: number) => {
    if (!user?.id) return;

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('question_likes')
        .select('id')
        .eq('question_id', questionId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('question_likes')
          .delete()
          .eq('question_id', questionId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('question_likes')
          .insert({
            question_id: questionId,
            user_id: user.id
          });
      }

      loadQuestions();
    } catch (error) {
      console.error('Error toggling question like:', error);
    }
  };

  const handleAddQuestionComment = async (questionId: number) => {
    if (!user?.id) return;
    
    const commentText = questionCommentInputs[questionId]?.trim();
    if (!commentText) return;

    try {
      const { error } = await supabase
        .from('question_comments')
        .insert({
          question_id: questionId,
          user_id: user.id,
          comment: commentText
        });

      if (error) {
        console.error('Error adding question comment:', error);
        Alert.alert(t('error'), 'Failed to add comment');
        return;
      }

      // Clear the input and hide it
      setQuestionCommentInputs(prev => ({ ...prev, [questionId]: '' }));
      setShowQuestionCommentInput(prev => ({ ...prev, [questionId]: false }));
      
      // Reload questions to show new comment
      loadQuestions();
    } catch (error) {
      console.error('Error adding question comment:', error);
      Alert.alert(t('error'), 'Failed to add comment');
    }
  };
  
  const toggleQuestionCommentInput = (questionId: number) => {
    setShowQuestionCommentInput(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleAnswerQuestion = (id: string) => {
    answerQAQuestion(id);
    Alert.alert(t('answerAdded'), t('answerAddedMessage'));
  };

  const handleDeleteAnnouncement = async (announcementId: number) => {
    console.log('Delete button clicked for announcement:', announcementId);
    
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Delete cancelled')
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('Delete confirmed, starting deletion process...');
            setLoading(true);
            try {
              console.log('Attempting to delete announcement with ID:', announcementId);
              console.log('Current user ID:', user?.id);
              
              // Delete the announcement directly - cascade will handle related records
              const { error, data, count } = await supabase
                .from('announcements')
                .delete()
                .eq('id', announcementId)
                .select();

              console.log('Delete result:', { error, data, count });

              if (error) {
                console.error('Error deleting announcement:', error);
                Alert.alert('Error', 'Failed to delete announcement: ' + error.message);
                return;
              }

              if (!data || data.length === 0) {
                console.log('No rows were deleted - announcement may not exist or user lacks permission');
                Alert.alert('Error', 'Could not delete announcement. You may not have permission or the announcement may not exist.');
                return;
              }

              console.log('Announcement deleted successfully:', data);
              Alert.alert('Success', 'Announcement deleted successfully!');
              await loadAnnouncements();
            } catch (error) {
              console.error('Error deleting announcement:', error);
              Alert.alert('Error', 'Failed to delete announcement');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteQuestion = async (questionId: number) => {
    console.log('Delete button clicked for question:', questionId);
    
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Delete cancelled')
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('Delete confirmed, starting deletion process...');
            setLoading(true);
            try {
              console.log('Attempting to delete question with ID:', questionId);
              console.log('Current user ID:', user?.id);
              
              // Delete the question directly - cascade will handle related records
              const { error, data, count } = await supabase
                .from('questions')
                .delete()
                .eq('id', questionId)
                .select();

              console.log('Delete result:', { error, data, count });

              if (error) {
                console.error('Error deleting question:', error);
                Alert.alert('Error', 'Failed to delete question: ' + error.message);
                return;
              }

              if (!data || data.length === 0) {
                console.log('No rows were deleted - question may not exist or user lacks permission');
                Alert.alert('Error', 'Could not delete question. You may not have permission or the question may not exist.');
                return;
              }

              console.log('Question deleted successfully:', data);
              Alert.alert('Success', 'Question deleted successfully!');
              await loadQuestions();
            } catch (error) {
              console.error('Error deleting question:', error);
              Alert.alert('Error', 'Failed to delete question');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{t('mathTrackAdminTitle')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('administrationDashboardTitle')}</Text>
          </View>
          <View style={styles.adminInfo}>
            <Text style={[styles.adminRole, { color: colors.text }]}>{t('administratorTitle')}</Text>
            <Text style={[styles.adminEmail, { color: colors.textSecondary }]}>alijawad12@gmail.com</Text>
          </View>
        </View>

        {/* Navigation Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.navTabsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.navTabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.navTab}
              onPress={() => router.push('/(admin)/dashboard')}
            >
              <Text style={[styles.navTabText, { color: colors.textSecondary }]}>{t('dashboard')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navTab}
              onPress={() => router.push('/(admin)/submissions')}
            >
              <Text style={[styles.navTabText, { color: colors.textSecondary }]}>{t('submissions')} ({pendingSubmissionsCount})</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navTab}
              onPress={() => router.push('/(admin)/exams')}
            >
              <Text style={[styles.navTabText, { color: colors.textSecondary }]}>{t('exams')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navTab, styles.activeNavTab, { borderBottomColor: colors.primary }]}>
              <Text style={[styles.navTabText, styles.activeNavTabText, { color: colors.primary }]}>{t('students')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Student Management Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isTablet && styles.sectionHeaderTablet]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('studentManagement')}</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => activeTab === 'announcements' ? setIsNewAnnouncementModalVisible(true) : setIsNewQuestionModalVisible(true)}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  {activeTab === 'announcements' ? t('newAnnouncement') : t('askQuestionAdmin')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={[styles.tabNavigation, { backgroundColor: colors.background }]}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'announcements' && { ...styles.activeTabButton, backgroundColor: colors.surface }]}
              onPress={() => setActiveTab('announcements')}
            >
              <Bell size={16} color={activeTab === 'announcements' ? colors.primary : colors.textSecondary} />
              <Text style={[styles.tabButtonText, { color: colors.textSecondary }, activeTab === 'announcements' && { ...styles.activeTabButtonText, color: colors.primary }]}>{t('announcements')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'qa' && { ...styles.activeTabButton, backgroundColor: colors.surface }]}
              onPress={() => setActiveTab('qa')}
            >
              <MessageSquare size={16} color={activeTab === 'qa' ? colors.primary : colors.textSecondary} />
              <Text style={[styles.tabButtonText, { color: colors.textSecondary }, activeTab === 'qa' && { ...styles.activeTabButtonText, color: colors.primary }]}>{t('qaForum')}</Text>
            </TouchableOpacity>
          </View>

          {/* Student Accounts Filter */}
          <View style={[styles.filtersRow, isTablet && styles.filtersRowTablet, { zIndex: 999999 }]}>
            <Text style={[styles.filtersTitle, { color: colors.text }]}>{t('studentAccounts')}</Text>
            <View style={[styles.filterGroup, { zIndex: 999999 }]}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{t('filterByGrade')}</Text>
              <View style={[styles.filterContainer, { zIndex: 999999 }]}>
                <TouchableOpacity 
                  style={[styles.filterDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setIsGradeDropdownVisible(!isGradeDropdownVisible)}
                >
                  <Text style={[styles.filterValue, { color: colors.text }]}>{selectedGrade}</Text>
                  <ChevronDown size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                {isGradeDropdownVisible && (
                  <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border, zIndex: 9999999 }]}>
                    {grades.map((grade) => (
                      <TouchableOpacity
                        key={grade}
                        style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                        onPress={() => {
                          setSelectedGrade(grade);
                          setIsGradeDropdownVisible(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { color: colors.text }, selectedGrade === grade && { ...styles.dropdownItemTextSelected, color: colors.primary }]}>
                          {grade}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Content based on active tab */}
          {activeTab === 'announcements' ? (
            <View style={styles.contentContainer}>
              {announcements.length === 0 ? (
                <View style={styles.emptyState}>
                  <Bell size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No announcements yet</Text>
                  <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>Create your first announcement to engage with students</Text>
                </View>
              ) : (
                announcements.map((announcement) => {
                  const priorityColors = getPriorityColor(announcement.priority);
                  const isLiked = announcement.announcement_likes?.some((like: any) => like.user_id === user?.id);
                  const likesCount = announcement.announcement_likes?.length || 0;
                  const commentsCount = announcement.announcement_comments?.length || 0;
                  
                  return (
                    <View key={announcement.id} style={[styles.announcementCard, { borderLeftColor: priorityColors.border, backgroundColor: colors.surface }]}>
                      <View style={styles.announcementHeader}>
                        <View style={styles.announcementTitleRow}>
                          <Text style={[styles.announcementTitle, { color: colors.text }]}>{announcement.title}</Text>
                          <View style={styles.badgeContainer}>
                            <View style={[styles.priorityBadge, { backgroundColor: priorityColors.bg }]}>
                              <Text style={[styles.priorityText, { color: priorityColors.text }]}>
                                {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                              </Text>
                            </View>
                            <View style={[styles.gradeBadge, { backgroundColor: '#E0E7FF' }]}>
                              <Text style={[styles.gradeText, { color: '#4F46E5' }]}>
                                Grade {announcement.grade_level}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Text style={[styles.announcementContent, { color: colors.textSecondary }]}>{announcement.body}</Text>
                      </View>
                      <View style={styles.announcementFooter}>
                        <View style={styles.authorInfo}>
                          <Text style={[styles.authorName, { color: colors.textSecondary }]}>{t('by')} {announcement.profiles?.full_name || 'Administrator'}</Text>
                          <Text style={[styles.announcementDate, { color: colors.textSecondary }]}>{new Date(announcement.created_at).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.engagementStats}>
                          <TouchableOpacity 
                            style={[styles.statButton, isLiked && styles.likedButton]}
                            onPress={() => handleLikeAnnouncement(announcement.id)}
                          >
                            <Heart 
                              size={16} 
                              color={isLiked ? "#EF4444" : colors.textSecondary}
                              fill={isLiked ? "#EF4444" : "none"}
                            />
                            <Text style={[styles.statNumber, { color: isLiked ? "#EF4444" : colors.textSecondary }]}>{likesCount}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.statButton}
                            onPress={() => toggleCommentInput(announcement.id)}
                          >
                            <MessageCircle size={16} color={colors.textSecondary} />
                            <Text style={[styles.statNumber, { color: colors.textSecondary }]}>{commentsCount}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.statButton, styles.deleteButton]}
                            onPress={() => {
                              console.log('Delete button pressed for announcement:', announcement.id);
                              handleDeleteAnnouncement(announcement.id);
                            }}
                            disabled={loading}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={16} color={loading ? "#9CA3AF" : "#EF4444"} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {/* Comment Input */}
                      {showCommentInput[announcement.id] && (
                        <View style={[styles.commentInputSection, { borderTopColor: colors.border }]}>
                          <TextInput
                            style={[styles.commentInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            placeholder="Write a comment..."
                            placeholderTextColor={colors.textSecondary}
                            value={commentInputs[announcement.id] || ''}
                            onChangeText={(text) => setCommentInputs(prev => ({ ...prev, [announcement.id]: text }))}
                            multiline
                            maxLength={500}
                          />
                          <View style={styles.commentInputActions}>
                            <TouchableOpacity
                              style={[styles.commentCancelButton, { borderColor: colors.border }]}
                              onPress={() => toggleCommentInput(announcement.id)}
                            >
                              <Text style={[styles.commentCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.commentSubmitButton, { backgroundColor: colors.primary }]}
                              onPress={() => handleAddComment(announcement.id)}
                              disabled={!commentInputs[announcement.id]?.trim()}
                            >
                              <Send size={14} color="#FFFFFF" />
                              <Text style={styles.commentSubmitText}>Post</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      
                      {/* Comments Section */}
                      {announcement.announcement_comments?.length > 0 && (
                        <View style={[styles.commentsSection, { borderTopColor: colors.border }]}>
                          <Text style={[styles.commentsSectionTitle, { color: colors.text }]}>Comments ({announcement.announcement_comments.length})</Text>
                          {announcement.announcement_comments.slice(0, 3).map((comment: any) => (
                            <View key={comment.id} style={[styles.commentItem, { backgroundColor: colors.background }]}>
                              <Text style={[styles.commentAuthor, { color: colors.text }]}>
                                {comment.profiles?.full_name || 'User'}
                              </Text>
                              <Text style={[styles.commentText, { color: colors.textSecondary }]}>
                                {comment.comment}
                              </Text>
                              <Text style={[styles.commentDate, { color: colors.textSecondary }]}>
                                {new Date(comment.created_at).toLocaleDateString()}
                              </Text>
                            </View>
                          ))}
                          {announcement.announcement_comments.length > 3 && (
                            <Text style={[styles.moreComments, { color: colors.primary }]}>
                              +{announcement.announcement_comments.length - 3} more comments
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            <View style={styles.contentContainer}>
              {questions.length === 0 ? (
                <View style={styles.emptyState}>
                  <MessageSquare size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No questions yet</Text>
                  <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>Create your first question to start the discussion</Text>
                </View>
              ) : (
                questions.map((question) => {
                  const isLiked = question.question_likes?.some((like: any) => like.user_id === user?.id);
                  const likesCount = question.question_likes?.length || 0;
                  const commentsCount = question.question_comments?.length || 0;
                  
                  return (
                    <View key={question.id} style={[styles.questionCard, { backgroundColor: colors.surface }]}>
                      <View style={styles.questionHeader}>
                        <View style={styles.questionTitleRow}>
                          <Text style={[styles.questionTitle, { color: colors.text }]}>{question.title}</Text>
                          <View style={styles.questionBadges}>
                            <View style={[styles.priorityBadge, { backgroundColor: '#E0E7FF' }]}>
                              <Text style={[styles.priorityText, { color: '#4F46E5' }]}>
                                Grade {question.grade_level}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Text style={[styles.questionContent, { color: colors.textSecondary }]}>{question.body}</Text>
                      </View>
                      <View style={styles.questionFooter}>
                        <View style={styles.authorInfo}>
                          <Text style={[styles.authorName, { color: colors.textSecondary }]}>{t('by')} {question.profiles?.full_name || 'User'}</Text>
                          <Text style={[styles.questionDate, { color: colors.textSecondary }]}>{new Date(question.created_at).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.engagementStats}>
                          <TouchableOpacity 
                            style={[styles.statButton, isLiked && styles.likedButton]}
                            onPress={() => handleLikeQuestion(question.id)}
                          >
                            <Heart 
                              size={16} 
                              color={isLiked ? "#EF4444" : colors.textSecondary}
                              fill={isLiked ? "#EF4444" : "none"}
                            />
                            <Text style={[styles.statNumber, { color: isLiked ? "#EF4444" : colors.textSecondary }]}>{likesCount}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.statButton}
                            onPress={() => toggleQuestionCommentInput(question.id)}
                          >
                            <MessageCircle size={16} color={colors.textSecondary} />
                            <Text style={[styles.statNumber, { color: colors.textSecondary }]}>{commentsCount}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.statButton, styles.deleteButton]}
                            onPress={() => {
                              console.log('Delete button pressed for question:', question.id);
                              handleDeleteQuestion(question.id);
                            }}
                            disabled={loading}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={16} color={loading ? "#9CA3AF" : "#EF4444"} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {/* Comment Input */}
                      {showQuestionCommentInput[question.id] && (
                        <View style={[styles.commentInputSection, { borderTopColor: colors.border }]}>
                          <TextInput
                            style={[styles.commentInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            placeholder="Write a comment..."
                            placeholderTextColor={colors.textSecondary}
                            value={questionCommentInputs[question.id] || ''}
                            onChangeText={(text) => setQuestionCommentInputs(prev => ({ ...prev, [question.id]: text }))}
                            multiline
                            maxLength={500}
                          />
                          <View style={styles.commentInputActions}>
                            <TouchableOpacity
                              style={[styles.commentCancelButton, { borderColor: colors.border }]}
                              onPress={() => toggleQuestionCommentInput(question.id)}
                            >
                              <Text style={[styles.commentCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.commentSubmitButton, { backgroundColor: colors.primary }]}
                              onPress={() => handleAddQuestionComment(question.id)}
                              disabled={!questionCommentInputs[question.id]?.trim()}
                            >
                              <Send size={14} color="#FFFFFF" />
                              <Text style={styles.commentSubmitText}>Post</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      
                      {/* Comments Section */}
                      {question.question_comments?.length > 0 && (
                        <View style={[styles.commentsSection, { borderTopColor: colors.border }]}>
                          <Text style={[styles.commentsSectionTitle, { color: colors.text }]}>Comments ({question.question_comments.length})</Text>
                          {question.question_comments.slice(0, 3).map((comment: any) => (
                            <View key={comment.id} style={[styles.commentItem, { backgroundColor: colors.background }]}>
                              <Text style={[styles.commentAuthor, { color: colors.text }]}>
                                {comment.profiles?.full_name || 'User'}
                              </Text>
                              <Text style={[styles.commentText, { color: colors.textSecondary }]}>
                                {comment.comment}
                              </Text>
                              <Text style={[styles.commentDate, { color: colors.textSecondary }]}>
                                {new Date(comment.created_at).toLocaleDateString()}
                              </Text>
                            </View>
                          ))}
                          {question.question_comments.length > 3 && (
                            <Text style={[styles.moreComments, { color: colors.primary }]}>
                              +{question.question_comments.length - 3} more comments
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

        </View>
      </ScrollView>

      {/* New Announcement Modal */}
      <Modal
        visible={isNewAnnouncementModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsNewAnnouncementModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.modalHeaderLeft}>
              <Bell size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('newAnnouncementTitle')}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsNewAnnouncementModalVisible(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>{t('title')} *</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder={t('enterAnnouncementTitle')}
                  placeholderTextColor={colors.textSecondary}
                  value={newAnnouncementData.title}
                  onChangeText={(text) => setNewAnnouncementData(prev => ({ ...prev, title: text }))}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>{t('priority')}</Text>
                <View style={styles.prioritySelector}>
                  {(['normal', 'high', 'urgent'] as const).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityOption,
                        { borderColor: colors.border },
                        newAnnouncementData.priority === priority && { ...styles.priorityOptionSelected, backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => setNewAnnouncementData(prev => ({ ...prev, priority }))}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        { color: colors.textSecondary },
                        newAnnouncementData.priority === priority && { ...styles.priorityOptionTextSelected, color: colors.primaryText }
                      ]}>
                        {t(priority as keyof typeof t)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>{t('content')} *</Text>
                <TextInput
                  style={[styles.textAreaInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder={t('enterAnnouncementContent')}
                  placeholderTextColor={colors.textSecondary}
                  value={newAnnouncementData.content}
                  onChangeText={(text) => setNewAnnouncementData(prev => ({ ...prev, content: text }))}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
              
              <TouchableOpacity 
                style={[styles.createButton, { backgroundColor: colors.primary }]} 
                onPress={handleCreateAnnouncement}
                disabled={loading}
              >
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>
                  {loading ? 'Creating...' : t('createAnnouncement')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* New Question Modal */}
      <Modal
        visible={isNewQuestionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsNewQuestionModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.modalHeaderLeft}>
              <MessageSquare size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('askQuestionTitle')}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsNewQuestionModalVisible(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>{t('questionTitleAdmin')} *</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder={t('enterQuestionTitle')}
                  placeholderTextColor={colors.textSecondary}
                  value={newQuestionData.title}
                  onChangeText={(text) => setNewQuestionData(prev => ({ ...prev, title: text }))}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>{t('priority')}</Text>
                <View style={styles.prioritySelector}>
                  {(['normal', 'high', 'urgent'] as const).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityOption,
                        { borderColor: colors.border },
                        newQuestionData.priority === priority && { ...styles.priorityOptionSelected, backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => setNewQuestionData(prev => ({ ...prev, priority }))}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        { color: colors.textSecondary },
                        newQuestionData.priority === priority && { ...styles.priorityOptionTextSelected, color: colors.primaryText }
                      ]}>
                        {t(priority as keyof typeof t)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.text }]}>{t('questionDetails')} *</Text>
                <TextInput
                  style={[styles.textAreaInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder={t('describeQuestion')}
                  placeholderTextColor={colors.textSecondary}
                  value={newQuestionData.content}
                  onChangeText={(text) => setNewQuestionData(prev => ({ ...prev, content: text }))}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
              
              <TouchableOpacity 
                style={[styles.createButton, { backgroundColor: colors.primary }]} 
                onPress={handleCreateQuestion}
                disabled={loading}
              >
                <Send size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>
                  {loading ? 'Creating...' : t('postQuestionAdmin')}
                </Text>
              </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    numberOfLines: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    numberOfLines: 1,
  },
  adminInfo: {
    alignItems: 'flex-end',
  },
  adminRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    numberOfLines: 1,
  },
  adminEmail: {
    fontSize: 10,
    color: '#6B7280',
    numberOfLines: 1,
  },
  navTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navTab: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginRight: 24,
  },
  activeNavTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  navTabText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    numberOfLines: 1,
  },
  activeNavTabText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    numberOfLines: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    numberOfLines: 1,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    numberOfLines: 1,
  },
  activeTabButtonText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    numberOfLines: 1,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterContainer: {
    position: 'relative',
    zIndex: 999999,
  },
  filterLabel: {
    fontSize: 12,
    color: '#374151',
    marginRight: 8,
    numberOfLines: 1,
  },
  filterDropdown: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 100,
  },
  filterValue: {
    fontSize: 12,
    color: '#111827',
    numberOfLines: 1,
  },
  announcementsContainer: {
    gap: 16,
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  announcementHeader: {
    marginBottom: 12,
  },
  announcementTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
    numberOfLines: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E0E7FF',
  },
  gradeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4F46E5',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  announcementContent: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    numberOfLines: 3,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 2,
    numberOfLines: 1,
  },
  announcementDate: {
    fontSize: 10,
    color: '#9CA3AF',
    numberOfLines: 1,
  },
  engagementStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  attachmentsSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachmentsTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  navTabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionHeaderTablet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  filtersRowTablet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 9999999,
    minWidth: 120,
    maxHeight: 300,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    numberOfLines: 1,
  },
  dropdownItemTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  contentContainer: {
    gap: 16,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  likedButton: {
    backgroundColor: '#FEE2E2',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 4,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  commentInputSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  commentInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  commentCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
  },
  commentCancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  commentSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4F46E5',
    borderRadius: 6,
  },
  commentSubmitText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  commentsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  commentItem: {
    marginBottom: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  commentDate: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  moreComments: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  questionHeader: {
    marginBottom: 12,
  },
  questionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
    numberOfLines: 2,
  },
  questionBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  answeredBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  answeredText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
  },
  questionContent: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    numberOfLines: 3,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionDate: {
    fontSize: 10,
    color: '#9CA3AF',
    numberOfLines: 1,
  },
  questionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  repliesCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  answerButtonText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
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
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    alignItems: 'center',
  },
  priorityOptionSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  priorityOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  priorityOptionTextSelected: {
    color: '#FFFFFF',
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    minHeight: 120,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
    marginTop: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});