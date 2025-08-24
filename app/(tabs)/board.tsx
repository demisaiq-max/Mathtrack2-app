import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Heart, MessageCircle, AlertCircle, Send, Trash2 } from 'lucide-react-native';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/language-context';
import { useTheme } from '@/hooks/theme-context';

interface AnnouncementRow {
  id: number;
  admin_id: string;
  grade_level: number;
  title: string;
  priority: 'normal' | 'high' | 'urgent';
  body: string;
  created_at: string;
  announcement_comments?: { id: number }[];
  announcement_likes?: { id: number; user_id: string }[];
}

interface QuestionRow {
  id: number;
  grade_level: number;
  subject_id: number | null;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  question_comments?: { id: number }[];
  question_likes?: { id: number; user_id: string }[];
}

type ActiveTab = 'qa' | 'announcements';

function CommentsList({ type, id }: { type: ActiveTab; id: number }) {
  const { colors } = useTheme();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['comments', type, id],
    enabled: !!id,
    queryFn: async () => {
      if (type === 'announcements') {
        const { data, error } = await supabase
          .from('announcement_comments')
          .select('id, user_id, comment, created_at')
          .eq('announcement_id', id)
          .order('created_at', { ascending: true });
        if (error) throw error;
        return data ?? [];
      } else {
        const { data, error } = await supabase
          .from('question_comments')
          .select('id, user_id, comment, created_at')
          .eq('question_id', id)
          .order('created_at', { ascending: true });
        if (error) throw error;
        return data ?? [];
      }
    },
  });

  if (isLoading) return <ActivityIndicator color={colors.primary} />;
  if (error) return <Text style={{ color: colors.error }}>Failed to load comments</Text>;

  return (
    <View style={{ maxHeight: 240 }}>
      <ScrollView>
        {(data as Array<{ id: number; user_id: string; comment: string; created_at: string }>).map((c) => (
          <View key={c.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.text, fontSize: 14 }}>{c.comment}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{new Date(c.created_at).toLocaleString()}</Text>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity onPress={() => refetch()} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
        <Text style={{ color: colors.primary, fontWeight: '600' }}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function BoardScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const qc = useQueryClient();
  

  


  const [activeTab, setActiveTab] = useState<ActiveTab>('announcements');
  const [showAskModal, setShowAskModal] = useState(false);
  const [question, setQuestion] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: ActiveTab; id: number } | null>(null);
  const [commentText, setCommentText] = useState('');

  const gradeNumber = useMemo(() => {
    const g = user?.gradeLevel?.replace('Grade ', '') ?? '';
    const n = parseInt(g, 10);
    return Number.isFinite(n) ? n : undefined;
  }, [user?.gradeLevel]);

  const profileGradeQuery = useQuery({
    queryKey: ['profile-grade', user?.id],
    enabled: !!user?.id && !gradeNumber,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('grade_level')
        .eq('id', user?.id as string)
        .single();
      if (error) {
        console.error('[Board] Profile grade fetch error:', error);
        return null;
      }
      return data?.grade_level as number | null;
    },
  });

  const currentGrade: number | undefined = useMemo(() => {
    return gradeNumber ?? (profileGradeQuery.data ?? undefined);
  }, [gradeNumber, profileGradeQuery.data]);

  const askQuestionMutation = useMutation({
    mutationFn: async (text: string) => {
      console.log('[Board] Starting question submission...');
      const trimmed = text.trim();
      if (!trimmed) {
        console.log('[Board] Question is empty');
        throw new Error('Question cannot be empty');
      }

      console.log('[Board] Getting auth user...');
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        console.log('[Board] Auth error:', authErr);
        throw new Error(`Unable to verify session: ${authErr.message}`);
      }
      const authUser = authData?.user;
      if (!authUser?.id) {
        console.log('[Board] No authenticated user');
        throw new Error('You must be logged in');
      }
      const userId = authUser.id;
      console.log('[Board] User ID:', userId);
      
      let effectiveGrade: number | undefined = currentGrade;
      console.log('[Board] Current grade from context:', effectiveGrade);
      
      if (!effectiveGrade) {
        console.log('[Board] Fetching grade from profile...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('grade_level, role')
          .eq('id', userId)
          .single();
        if (profileError) {
          console.log('[Board] Profile error:', JSON.stringify(profileError, null, 2));
          throw new Error(`Unable to fetch your grade level. Please set your grade level in your profile first.`);
        }
        effectiveGrade = profileData?.grade_level ?? undefined;
        console.log('[Board] Grade from profile:', effectiveGrade);
      }
      
      if (!effectiveGrade) {
        console.log('[Board] No grade level found');
        throw new Error('Your grade level is not set in your profile. Please go to Profile > Edit Profile to set your grade level.');
      }
      
      const title = trimmed.split('\n')[0]?.slice(0, 140) ?? 'Question';
      
      const questionData = {
        grade_level: effectiveGrade,
        author_id: userId,
        title: title,
        body: trimmed,
      };
      
      console.log('[Board] Question data to insert:', questionData);
      
      const { data, error } = await supabase
        .from('questions')
        .insert([questionData])
        .select('id')
        .single();
      
      if (error) {
        console.log('[Board] Insert error:', error);
        throw new Error(`Failed to submit question: ${error.message}`);
      }
      
      console.log('[Board] Question inserted successfully:', data);
      return data as { id: number };
    },
    onSuccess: (data) => {
      console.log('[Board] Question submitted successfully:', data);
      setQuestion('');
      setShowAskModal(false);
      qc.invalidateQueries({ queryKey: ['questions', currentGrade] });
      Alert.alert(t('success'), t('questionPosted'));
    },
    onError: (e: unknown) => {
      console.log('[Board] Question submission error:', e);
      const errorMessage = (e as Error)?.message ?? 'Please try again';
      Alert.alert('Unable to post', errorMessage);
    },
  });

  const announcementsQuery = useQuery({
    queryKey: ['announcements', currentGrade],
    enabled: !!currentGrade,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select(
          'id, admin_id, grade_level, title, priority, body, created_at, announcement_comments(id), announcement_likes(id, user_id)'
        )
        .eq('grade_level', currentGrade as number)
        .order('created_at', { ascending: false });
      if (error) {
        throw error;
      }
      return (data ?? []) as AnnouncementRow[];
    },
  });

  const questionsQuery = useQuery({
    queryKey: ['questions', currentGrade],
    enabled: !!currentGrade,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select(
          'id, grade_level, subject_id, author_id, title, body, created_at, question_comments(id), question_likes(id, user_id)'
        )
        .eq('grade_level', currentGrade as number)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      return (data ?? []) as QuestionRow[];
    },
  });

  const openComments = useCallback((type: ActiveTab, id: number) => {
    setSelectedItem({ type, id });
    setShowCommentModal(true);
  }, []);

  const likeMutation = useMutation({
    mutationFn: async ({ type, id }: { type: ActiveTab; id: number }) => {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const uid = authData?.user?.id;
      if (!uid) throw new Error('Not authenticated');
      if (type === 'announcements') {
        const { data: existing } = await supabase
          .from('announcement_likes')
          .select('id')
          .eq('announcement_id', id)
          .eq('user_id', uid)
          .maybeSingle();
        if (existing?.id) {
          const { error } = await supabase
            .from('announcement_likes')
            .delete()
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('announcement_likes')
            .insert({ announcement_id: id, user_id: uid });
          if (error) throw error;
        }
      } else {
        const { data: existing } = await supabase
          .from('question_likes')
          .select('id')
          .eq('question_id', id)
          .eq('user_id', uid)
          .maybeSingle();
        if (existing?.id) {
          const { error } = await supabase
            .from('question_likes')
            .delete()
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('question_likes')
            .insert({ question_id: id, user_id: uid });
          if (error) throw error;
        }
      }
    },
    onSuccess: (_data, variables) => {
      if (variables.type === 'announcements') qc.invalidateQueries({ queryKey: ['announcements', currentGrade] });
      else qc.invalidateQueries({ queryKey: ['questions', currentGrade] });
    },
    onError: (e: unknown) => {
      Alert.alert(t('error'), (e as Error).message ?? 'Failed to like');
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ type, id, text }: { type: ActiveTab; id: number; text: string }) => {
      if (!text.trim()) throw new Error('Comment cannot be empty');
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const uid = authData?.user?.id;
      if (!uid) throw new Error('Not authenticated');
      
      const trimmedText = text.trim();
      
      if (type === 'announcements') {
        const { data, error } = await supabase
          .from('announcement_comments')
          .insert({ announcement_id: id, user_id: uid, comment: trimmedText })
          .select('id')
          .single();

        if (error) {
          throw new Error(`Failed to post comment: ${error.message}`);
        }
        return data;
      } else {
        const { data, error } = await supabase
          .from('question_comments')
          .insert({ question_id: id, user_id: uid, comment: trimmedText })
          .select('id')
          .single();

        if (error) {
          throw new Error(`Failed to post comment: ${error.message}`);
        }
        return data;
      }
    },
    onSuccess: (_d, v) => {
      setCommentText('');
      setShowCommentModal(false);
      setSelectedItem(null);
      // Invalidate both the main queries and the comments query
      qc.invalidateQueries({ queryKey: ['comments', v.type, v.id] });
      if (v.type === 'announcements') qc.invalidateQueries({ queryKey: ['announcements', currentGrade] });
      else qc.invalidateQueries({ queryKey: ['questions', currentGrade] });
    },
    onError: (e: unknown) => {
      Alert.alert(t('error'), (e as Error).message ?? 'Failed to post comment');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id, authorId }: { type: ActiveTab; id: number; authorId?: string }) => {
      console.log(`[Board] Starting delete for ${type} with id:`, id);
      
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        console.error('[Board] Auth error during delete:', authErr);
        throw new Error(`Authentication failed: ${authErr.message}`);
      }
      
      const uid = authData?.user?.id;
      if (!uid) {
        console.error('[Board] No user ID found');
        throw new Error('Not authenticated');
      }
      
      console.log('[Board] User ID for delete:', uid);
      
      // Check if user is admin or the author of the question
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .single();
      
      if (profileError) {
        console.error('[Board] Profile fetch error:', profileError);
        throw new Error('Unable to verify permissions');
      }
      
      const isAdmin = profile?.role === 'admin';
      const isAuthor = type === 'qa' && authorId === uid;
      
      if (!isAdmin && !isAuthor) {
        console.error('[Board] User is not admin or author:', { role: profile?.role, isAuthor, authorId, uid });
        if (type === 'announcements') {
          throw new Error('Only administrators can delete announcements');
        } else {
          throw new Error('You can only delete your own questions');
        }
      }
      
      console.log('[Board] User has permission to delete, proceeding with delete');
      
      if (type === 'announcements') {
        console.log('[Board] Deleting announcement with id:', id);
        const { error } = await supabase
          .from('announcements')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('[Board] Announcement delete error:', error);
          throw new Error(`Failed to delete announcement: ${error.message}`);
        }
        console.log('[Board] Announcement deleted successfully');
      } else {
        console.log('[Board] Deleting question with id:', id);
        const { error } = await supabase
          .from('questions')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('[Board] Question delete error:', error);
          throw new Error(`Failed to delete question: ${error.message}`);
        }
        console.log('[Board] Question deleted successfully');
      }
    },
    onSuccess: (_data, variables) => {
      console.log('[Board] Delete successful, invalidating queries');
      if (variables.type === 'announcements') {
        qc.invalidateQueries({ queryKey: ['announcements', currentGrade] });
      } else {
        qc.invalidateQueries({ queryKey: ['questions', currentGrade] });
      }
      Alert.alert('Success', `${variables.type === 'announcements' ? 'Announcement' : 'Question'} deleted successfully`);
    },
    onError: (e: unknown) => {
      console.error('[Board] Delete error:', e);
      Alert.alert('Error', (e as Error).message ?? 'Failed to delete');
    },
  });

  const handleDelete = useCallback((type: ActiveTab, id: number, authorId?: string) => {
    console.log(`[Board] Delete requested for ${type} with id:`, id);
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete this ${type === 'announcements' ? 'announcement' : 'question'}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('[Board] Delete cancelled')
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('[Board] Delete confirmed, executing mutation');
            deleteMutation.mutate({ type, id, authorId });
          }
        }
      ]
    );
  }, [deleteMutation]);

  // Check if current user is admin
  const isAdmin = useMemo(() => {
    return user?.accountType === 'admin';
  }, [user?.accountType]);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'normal': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPriorityBg = (priority?: string) => {
    switch (priority) {
      case 'urgent': return '#FEE2E2';
      case 'high': return '#FEF3C7';
      case 'normal': return '#F3F4F6';
      default: return '#F3F4F6';
    }
  };

  const isLoading = announcementsQuery.isLoading || questionsQuery.isLoading || profileGradeQuery.isLoading;

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={Platform.OS === 'android' ? ['top', 'left', 'right'] : ['top']}
    >
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]} testID="board-title">{t('board')}</Text>
        <TouchableOpacity
          style={[styles.askButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAskModal(true)}
          testID="ask-question-btn"
        >
          <Plus color={colors.primaryText} size={20} />
          <Text style={[styles.askButtonText, { color: colors.primaryText }]}>{t('askQuestionBoard')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'announcements' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('announcements')}
          testID="tab-announcements"
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'announcements' && { color: colors.primary }]}>
            Announcements
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'qa' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('qa')}
          testID="tab-qa"
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'qa' && { color: colors.primary }]}>
            Q&A Forum
          </Text>
        </TouchableOpacity>
      </View>


      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.content} testID="board-list">
          {!currentGrade ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 10 }}>
                Please set your grade level in your profile to view board content.
              </Text>

            </View>
          ) : (activeTab === 'announcements' ? announcementsQuery.data ?? [] : questionsQuery.data ?? []).length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                {activeTab === 'announcements' ? 'No announcements for your grade level.' : t('noQuestions')}
              </Text>
            </View>
          ) : (activeTab === 'announcements' ? announcementsQuery.data ?? [] : questionsQuery.data ?? []).map((item) => {
            const isAnnouncement = activeTab === 'announcements';
            const likes = isAnnouncement ? (item as AnnouncementRow).announcement_likes?.length ?? 0 : (item as QuestionRow).question_likes?.length ?? 0;
            const comments = isAnnouncement ? (item as AnnouncementRow).announcement_comments?.length ?? 0 : (item as QuestionRow).question_comments?.length ?? 0;
            const userLiked = isAnnouncement
              ? !!(item as AnnouncementRow).announcement_likes?.some(l => l.user_id === user?.id)
              : !!(item as QuestionRow).question_likes?.some(l => l.user_id === user?.id);
            return (
              <View key={item.id} style={[styles.postCard, { backgroundColor: colors.surface }]} testID={`post-${item.id}`}>
                <View style={styles.postHeader}>
                  <View style={styles.postMeta}>
                    <Text style={[styles.postTitle, { color: colors.text }]}>{isAnnouncement ? (item as AnnouncementRow).title : (item as QuestionRow).title}</Text>
                    <View style={styles.badgeContainer}>
                      {isAnnouncement && (
                        <View
                          style={[
                            styles.priorityBadge,
                            { backgroundColor: getPriorityBg((item as AnnouncementRow).priority) },
                          ]}
                        >
                          <Text
                            style={[
                              styles.priorityText,
                              { color: getPriorityColor((item as AnnouncementRow).priority) },
                            ]}
                          >
                            {(item as AnnouncementRow).priority}
                          </Text>
                        </View>
                      )}
                      <View style={[styles.gradeBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.gradeText, { color: colors.primary }]}>
                          Grade {isAnnouncement ? (item as AnnouncementRow).grade_level : (item as QuestionRow).grade_level}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.headerActions}>
                    {isAnnouncement && (item as AnnouncementRow).priority === 'urgent' && (
                      <AlertCircle color="#EF4444" size={20} />
                    )}
                    {(isAdmin || (!isAnnouncement && (item as QuestionRow).author_id === user?.id)) && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(activeTab, item.id, !isAnnouncement ? (item as QuestionRow).author_id : undefined)}
                        testID={`delete-${item.id}`}
                      >
                        <Trash2 color="#EF4444" size={18} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <Text style={[styles.postContent, { color: colors.textSecondary }]} numberOfLines={3}>
                  {isAnnouncement ? (item as AnnouncementRow).body : (item as QuestionRow).body}
                </Text>

                <View style={styles.postFooter}>
                  <View style={styles.authorInfo}>
                    <Text style={[styles.authorText, { color: colors.text }]}>{isAnnouncement ? 'Announcement' : 'Question'}</Text>
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>{new Date((item as any).created_at).toLocaleDateString()}</Text>
                  </View>

                  <View style={styles.postActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => likeMutation.mutate({ type: activeTab, id: item.id })}
                      testID={`like-${item.id}`}
                    >
                      <Heart
                        color={userLiked ? '#EF4444' : '#9CA3AF'}
                        size={16}
                        fill={userLiked ? '#EF4444' : 'transparent'}
                      />
                      <Text style={[styles.actionText, { color: colors.textSecondary }, userLiked && { color: colors.error, fontWeight: '600' }]}>
                        {likes}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => openComments(activeTab, item.id)}
                      testID={`comments-${item.id}`}
                    >
                      <MessageCircle color={colors.textSecondary} size={16} />
                      <Text style={[styles.actionText, { color: colors.textSecondary }]}>{comments}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal
        visible={showAskModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('askQuestionBoard')}</Text>
            <TextInput
              style={[styles.questionInput, { borderColor: colors.border, color: colors.text }]}
              placeholder={t('questionBody')}
              placeholderTextColor={colors.textSecondary}
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowAskModal(false);
                  setQuestion('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary },
                  (askQuestionMutation.isPending || !question.trim()) && { backgroundColor: colors.textSecondary, opacity: 0.6 }
                ]}
                onPress={() => {
                  try {
                    if (!question.trim()) {
                      Alert.alert(t('error'), 'Please enter a question');
                      return;
                    }
                    askQuestionMutation.mutate(question);
                  } catch (err) {
                    Alert.alert('Error', (err as Error).message ?? 'Failed to submit');
                  }
                }}
                testID="submit-question"
                disabled={askQuestionMutation.isPending || !question.trim()}
              >
                <Text style={[
                  styles.submitButtonText,
                  { color: colors.primaryText },
                  (askQuestionMutation.isPending || !question.trim()) && { color: colors.border }
                ]}>
                  {askQuestionMutation.isPending ? t('loading') : t('submit')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCommentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Comments</Text>
            {selectedItem && (
              <CommentsList type={selectedItem.type} id={selectedItem.id} />
            )}
            <TextInput
              style={[styles.commentInput, { borderColor: colors.border, color: colors.text }]}
              placeholder="Write your comment..."
              placeholderTextColor={colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowCommentModal(false);
                  setCommentText('');
                  setSelectedItem(null);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (!selectedItem) return;
                  commentMutation.mutate({ type: selectedItem.type, id: selectedItem.id, text: commentText });
                }}
                testID="post-comment"
              >
                <Send color={colors.primaryText} size={16} />
                <Text style={[styles.submitButtonText, { color: colors.primaryText }]}>{t('submit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  askButton: {
    flexDirection: 'row',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 6,
  },
  askButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  postCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postMeta: {
    flex: 1,
    gap: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
    borderRadius: 4,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    gap: 4,
  },
  authorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  questionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});