import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Calendar, Clock, BookOpen, Play, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-context';
import { useLanguage } from '@/hooks/language-context';
import { useTheme } from '@/hooks/theme-context';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useExams, useExamTimer, ExamData } from '@/hooks/useExams';
import { recentExams } from '@/mocks/exams';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

interface ExamCardProps {
  exam: ExamData;
  colors: any;
  router: any;
}

function ExamCard({ exam, colors, router }: ExamCardProps) {
  const { timeUntilStart, timeUntilEnd, isActive, isExpired } = useExamTimer(
    exam.id,
    exam.scheduled_start,
    exam.scheduled_end
  );

  // Calculate attempts information
  const completedAttempts = exam.user_submission ? 1 : 0; // Simplified for now
  const remainingAttempts = exam.allowed_attempts - completedAttempts;
  const hasAttemptsLeft = remainingAttempts > 0;

  const getStatusInfo = () => {
    if (exam.user_submission?.status === 'Graded') {
      if (hasAttemptsLeft && exam.allowed_attempts > 1) {
        return {
          text: `Completed (${remainingAttempts} attempts left)`,
          color: colors.warning || colors.primary,
          bgColor: (colors.warning || colors.primary) + '20'
        };
      }
      return {
        text: 'Completed',
        color: colors.success,
        bgColor: colors.success + '20'
      };
    }
    if (isExpired) {
      return {
        text: 'Expired',
        color: colors.error,
        bgColor: colors.error + '20'
      };
    }
    if (isActive) {
      if (exam.allowed_attempts > 1) {
        return {
          text: `Active (${exam.allowed_attempts} attempts)`,
          color: colors.success,
          bgColor: colors.success + '20'
        };
      }
      return {
        text: 'Active',
        color: colors.success,
        bgColor: colors.success + '20'
      };
    }
    return {
      text: 'Scheduled',
      color: colors.warning || colors.primary,
      bgColor: (colors.warning || colors.primary) + '20'
    };
  };

  const statusInfo = getStatusInfo();
  const canTakeExam = isActive && (!exam.user_submission || hasAttemptsLeft);

  const handleExamAction = () => {
    if (canTakeExam) {
      router.push(`/take-exam?examId=${exam.id}`);
    } else if (exam.user_submission) {
      router.push(`/exam-results?submissionId=${exam.user_submission.id}`);
    }
  };

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 4,
          }}>{exam.title}</Text>
          <Text style={{
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: 2,
          }}>{exam.subject_name}</Text>
          <Text style={{
            fontSize: 12,
            color: colors.textSecondary,
          }}>{exam.duration_minutes} min • {exam.total_questions} questions</Text>
          {exam.allowed_attempts > 1 && (
            <Text style={{
              fontSize: 10,
              color: colors.textSecondary,
              fontWeight: '500',
            }}>Max attempts: {exam.allowed_attempts}</Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: statusInfo.bgColor,
            marginBottom: 4,
          }}>
            <Text style={{
              fontSize: 10,
              fontWeight: '600',
              color: statusInfo.color,
              textTransform: 'uppercase',
            }}>{statusInfo.text}</Text>
          </View>
          {timeUntilStart && (
            <Text style={{
              fontSize: 12,
              fontWeight: '500',
              color: colors.textSecondary,
              textAlign: 'right',
            }}>Starts in {timeUntilStart}</Text>
          )}
          {timeUntilEnd && (
            <Text style={{
              fontSize: 12,
              fontWeight: '500',
              color: colors.error,
              textAlign: 'right',
            }}>Ends in {timeUntilEnd}</Text>
          )}
        </View>
      </View>
      
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Clock color={colors.textSecondary} size={16} />
          <Text style={{
            fontSize: 12,
            color: colors.textSecondary,
            marginLeft: 4,
          }}>
            {exam.scheduled_start 
              ? new Date(exam.scheduled_start).toLocaleDateString()
              : 'Available anytime'
            }
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={handleExamAction}
          disabled={!canTakeExam && !exam.user_submission}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: canTakeExam ? colors.primary : colors.border,
            opacity: (!canTakeExam && !exam.user_submission) ? 0.5 : 1,
          }}
        >
          {exam.user_submission ? (
            <CheckCircle color={colors.surface} size={16} />
          ) : (
            <Play color={colors.surface} size={16} />
          )}
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            color: colors.surface,
            marginLeft: 6,
          }}>
            {exam.user_submission && !hasAttemptsLeft ? 'View Results' : 
             exam.user_submission && hasAttemptsLeft ? 'Retake Exam' :
             canTakeExam ? 'Take Exam' : 'Not Available'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { announcements, isLoading: announcementsLoading } = useAnnouncements(2);
  const { upcomingExams, recentExams: dbRecentExams, isLoading: examsLoading, error: examsError, refetch: refetchExams } = useExams();
  const latestExam = dbRecentExams[0] || recentExams[0];
  const averageScore = dbRecentExams.length > 0 
    ? Math.round(dbRecentExams.reduce((sum, exam) => sum + (exam.user_submission?.score_percent || 0), 0) / dbRecentExams.length)
    : Math.round(recentExams.reduce((sum, exam) => sum + (exam.score || 0), 0) / recentExams.length);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 24,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    greeting: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    viewAllText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    performanceCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    performanceValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 4,
    },
    performanceSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    trendCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    trendText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    bar: {
      width: 20,
      backgroundColor: colors.primary,
      borderRadius: 4,
      marginBottom: 8,
      minHeight: 20,
    },
    examCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    examSubject: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    examDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    scoreText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 2,
    },
    gradeText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    upcomingCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    upcomingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    upcomingText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    remindButton: {
      backgroundColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    remindButtonText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.primary,
    },
    announcementCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    authorAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    authorName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    announcementDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    announcementTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    announcementContent: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView 
        style={dynamicStyles.container} 
        edges={Platform.OS === 'android' ? ['top', 'left', 'right'] : ['top']}
      >
        <View style={dynamicStyles.header}>
          <View>
            <Text style={dynamicStyles.greeting}>{t('welcomeBack')}, {user?.fullName?.split(' ')[0] || t('studentRole')}!</Text>
            <Text style={dynamicStyles.subtitle}>{t('readyToCheck')}</Text>
          </View>
        </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Performance Overview */}
        <View style={styles.section}>
          <View style={styles.performanceContainer}>
            <View style={dynamicStyles.performanceCard}>
              <Text style={styles.performanceLabel}>{t('latest')}</Text>
              <Text style={dynamicStyles.performanceValue}>{(latestExam as any)?.user_submission?.score_percent || (latestExam as any)?.score || 0}%</Text>
              <Text style={dynamicStyles.performanceSubtext}>{t('lastExamScore')}</Text>
            </View>
            <View style={dynamicStyles.performanceCard}>
              <Text style={styles.performanceLabel}>{t('average')}</Text>
              <Text style={dynamicStyles.performanceValue}>{averageScore}%</Text>
              <Text style={dynamicStyles.performanceSubtext}>{t('overallAverage')}</Text>
            </View>
          </View>
        </View>

        {/* Performance Trend */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>{t('performanceTrend')}</Text>
          <View style={dynamicStyles.trendCard}>
            <View style={styles.trendHeader}>
              <TrendingUp color={colors.success} size={20} />
              <Text style={dynamicStyles.trendText}>{t('improvingPerformance')}</Text>
            </View>
            <View style={styles.trendChart}>
              {/* Simple trend visualization */}
              <View style={styles.chartContainer}>
                {recentExams.slice(0, 4).map((exam, index) => (
                  <View key={exam.id} style={styles.chartBar}>
                    <View 
                      style={[
                        dynamicStyles.bar, 
                        { height: `${(exam.score || 0)}%` }
                      ]} 
                    />
                    <Text style={styles.chartLabel}>
                      {exam.date?.split('-')[1] || 'Jan'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Available Exams */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>Available Exams</Text>
            <TouchableOpacity onPress={() => router.push('/scores')}>
              <Text style={dynamicStyles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {examsLoading ? (
            <View style={dynamicStyles.announcementCard}>
              <Text style={dynamicStyles.announcementContent}>Loading exams...</Text>
            </View>
          ) : examsError ? (
            <View style={dynamicStyles.announcementCard}>
              <Text style={[dynamicStyles.announcementContent, { color: colors.error }]}>Error: {examsError}</Text>
              <TouchableOpacity 
                onPress={() => {
                  console.log('[Home] Manual refetch triggered');
                  refetchExams();
                }}
                style={{
                  marginTop: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: colors.primary,
                  borderRadius: 6,
                  alignSelf: 'flex-start'
                }}
              >
                <Text style={{ color: colors.surface, fontSize: 12, fontWeight: '500' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : upcomingExams.length > 0 ? (
            upcomingExams.slice(0, 3).map((exam) => (
              <ExamCard key={exam.id} exam={exam} colors={colors} router={router} />
            ))
          ) : (
            <View style={dynamicStyles.announcementCard}>
              <Text style={dynamicStyles.announcementContent}>No exams available at the moment</Text>
              <Text style={[dynamicStyles.announcementContent, { fontSize: 12, marginTop: 4 }]}>User: {user?.fullName} (Grade: {user?.gradeLevel || 'Not set'})</Text>
              <Text style={[dynamicStyles.announcementContent, { fontSize: 10, marginTop: 2, color: colors.textSecondary }]}>Account Type: {user?.accountType}</Text>
              <TouchableOpacity 
                onPress={() => {
                  console.log('[Home] Debug - Full user object:', user);
                  console.log('[Home] Manual refetch triggered');
                  refetchExams();
                }}
                style={{
                  marginTop: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: colors.primary,
                  borderRadius: 6,
                  alignSelf: 'flex-start'
                }}
              >
                <Text style={{ color: colors.surface, fontSize: 12, fontWeight: '500' }}>Debug & Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent Exams */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>{t('recentExams')}</Text>
            <TouchableOpacity onPress={() => router.push('/scores')}>
              <Text style={dynamicStyles.viewAllText}>{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>
          {dbRecentExams.length > 0 ? (
            dbRecentExams.slice(0, 2).map((exam) => (
              <View key={exam.id} style={dynamicStyles.examCard}>
                <BookOpen color={colors.primary} size={24} />
                <View style={styles.examInfo}>
                  <Text style={dynamicStyles.examSubject}>{exam.title}</Text>
                  <Text style={dynamicStyles.examDate}>{exam.subject_name}</Text>
                </View>
                <View style={styles.examScore}>
                  <Text style={dynamicStyles.scoreText}>{exam.user_submission?.score_percent || 0}%</Text>
                  <Text style={dynamicStyles.gradeText}>Completed</Text>
                </View>
              </View>
            ))
          ) : (
            recentExams.slice(0, 2).map((exam) => (
              <View key={exam.id} style={dynamicStyles.examCard}>
                <Text style={styles.examIcon}>{exam.icon}</Text>
                <View style={styles.examInfo}>
                  <Text style={dynamicStyles.examSubject}>{exam.subject}</Text>
                  <Text style={dynamicStyles.examDate}>{exam.date}</Text>
                </View>
                <View style={styles.examScore}>
                  <Text style={dynamicStyles.scoreText}>{exam.score}%</Text>
                  <Text style={dynamicStyles.gradeText}>{t('gradeDisplay')}: {exam.grade}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Upcoming Exams */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>{t('upcomingExams')}</Text>
          {upcomingExams.length > 0 ? (
            <View style={dynamicStyles.upcomingCard}>
              <Calendar color={colors.primary} size={24} />
              <View style={styles.upcomingInfo}>
                <Text style={dynamicStyles.upcomingTitle}>{upcomingExams[0].title}</Text>
                <Text style={dynamicStyles.upcomingText}>{upcomingExams[0].subject_name}</Text>
              </View>
              <TouchableOpacity style={dynamicStyles.remindButton}>
                <Text style={dynamicStyles.remindButtonText}>{t('remindMe')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={dynamicStyles.upcomingCard}>
              <Calendar color={colors.primary} size={24} />
              <View style={styles.upcomingInfo}>
                <Text style={dynamicStyles.upcomingTitle}>{t('nextExam')}</Text>
                <Text style={dynamicStyles.upcomingText}>{t('checkSchedule')}</Text>
              </View>
              <TouchableOpacity style={dynamicStyles.remindButton}>
                <Text style={dynamicStyles.remindButtonText}>{t('remindMe')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Board Updates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>{t('boardUpdates')}</Text>
            <TouchableOpacity onPress={() => router.push('/board')}>
              <Text style={dynamicStyles.viewAllText}>{t('viewBoard')}</Text>
            </TouchableOpacity>
          </View>
          {!announcementsLoading && announcements.length > 0 ? (
            announcements.map((announcement, index) => (
              <View key={announcement.id} style={[dynamicStyles.announcementCard, index > 0 && { marginTop: 12 }]}>
                <View style={styles.announcementHeader}>
                  <View style={dynamicStyles.authorAvatar}>
                    <Text style={styles.authorInitials}>
                      {(announcement.admin_name || 'Admin').split(' ').map((n: string) => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.announcementInfo}>
                    <Text style={dynamicStyles.authorName}>{announcement.admin_name || 'Admin'}</Text>
                    <Text style={dynamicStyles.announcementDate}>
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={dynamicStyles.announcementTitle}>{announcement.title}</Text>
                <Text style={dynamicStyles.announcementContent} numberOfLines={2}>
                  {announcement.body}
                </Text>
              </View>
            ))
          ) : (
            <View style={dynamicStyles.announcementCard}>
              <Text style={dynamicStyles.announcementContent}>
                {announcementsLoading ? 'Loading announcements...' : 'No announcements available'}
              </Text>
            </View>
          )}
        </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendChart: {
    height: 80,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  examIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  examInfo: {
    flex: 1,
  },
  examScore: {
    alignItems: 'flex-end',
  },
  upcomingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInitials: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  announcementInfo: {
    flex: 1,
  },
});