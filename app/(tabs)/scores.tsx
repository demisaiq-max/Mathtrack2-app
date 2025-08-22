import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react-native';
import { useLanguage } from '@/hooks/language-context';
import { useTheme } from '@/hooks/theme-context';
import { useExamStats } from '@/hooks/useExamStats';
import PerformanceTrendChart from '@/components/PerformanceTrendChart';

export default function ScoresScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { stats, completedExams, upcomingExams, isLoading, error, refetch } = useExamStats();

  const getGradeColor = (grade?: string) => {
    if (!grade) return '#6B7280';
    switch (grade) {
      case 'A': return '#10B981';
      case 'B': return '#3B82F6';
      case 'C': return '#F59E0B';
      case 'D': return '#EF4444';
      case 'F': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTrend = (index: number) => {
    if (index === 0 || completedExams.length < 2) return null;
    const current = completedExams[index]?.score || 0;
    const previous = completedExams[index - 1]?.score || 0;
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'same';
  };

  if (isLoading) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        edges={Platform.OS === 'android' ? ['top', 'left', 'right'] : ['top']}
      >
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('scoreManager')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('trackPerformance')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading exam statistics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        edges={Platform.OS === 'android' ? ['top', 'left', 'right'] : ['top']}
      >
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('scoreManager')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('trackPerformance')}</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle color={colors.error} size={48} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]} 
            onPress={refetch}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      edges={Platform.OS === 'android' ? ['top', 'left', 'right'] : ['top']}
    >
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('scoreManager')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('trackPerformance')}</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('highestScore')}</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {stats.highestScore}%
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('lowestScore')}</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {stats.lowestScore}%
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('totalExams')}</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{stats.totalExams}</Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <PerformanceTrendChart completedExams={completedExams} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('completedExams')}</Text>
          {completedExams.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No completed exams yet</Text>
            </View>
          ) : (
            completedExams.map((exam: any, index: number) => (
              <TouchableOpacity key={exam.id} style={[styles.examCard, { backgroundColor: colors.surface }]}>
                <View style={styles.examLeft}>
                  <Text style={styles.examIcon}>{exam.icon}</Text>
                  <View style={styles.examInfo}>
                    <Text style={[styles.examSubject, { color: colors.text }]}>{exam.title}</Text>
                    <Text style={[styles.examSubjectName, { color: colors.textSecondary }]}>{exam.subject}</Text>
                    <Text style={[styles.examDate, { color: colors.textSecondary }]}>{exam.submittedAt}</Text>
                  </View>
                </View>
                <View style={styles.examRight}>
                  <View style={styles.scoreContainer}>
                    <Text style={[styles.scoreText, { color: colors.text }]}>{exam.score}%</Text>
                    {getTrend(index) === 'up' && (
                      <TrendingUp color="#10B981" size={16} />
                    )}
                    {getTrend(index) === 'down' && (
                      <TrendingDown color="#EF4444" size={16} />
                    )}
                    {getTrend(index) === 'same' && (
                      <Minus color="#6B7280" size={16} />
                    )}
                  </View>
                  <View
                    style={[
                      styles.gradeBadge,
                      { backgroundColor: getGradeColor(exam.grade) },
                    ]}
                  >
                    <Text style={styles.gradeText}>{exam.grade}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('upcomingExams')}</Text>
          {upcomingExams.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No upcoming exams scheduled</Text>
            </View>
          ) : (
            upcomingExams.map((exam: any) => (
              <View key={exam.id} style={[styles.upcomingCard, { backgroundColor: colors.surface }]}>
                <Text style={styles.examIcon}>{exam.icon}</Text>
                <View style={styles.examInfo}>
                  <Text style={[styles.examSubject, { color: colors.text }]}>{exam.title}</Text>
                  <Text style={[styles.examSubjectName, { color: colors.textSecondary }]}>{exam.subject}</Text>
                  <Text style={[styles.examDate, { color: colors.textSecondary }]}>{exam.scheduledStart}</Text>
                </View>
                <View style={[styles.pendingBadge, { backgroundColor: colors.card }]}>
                  <Text style={[styles.pendingText, { color: colors.textSecondary }]}>{t('pending')}</Text>
                </View>
              </View>
            ))
          )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 11,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  examCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  examLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  examIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  examInfo: {
    flex: 1,
  },
  examSubject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  examSubjectName: {
    fontSize: 13,
    marginBottom: 2,
  },
  examDate: {
    fontSize: 12,
  },
  examRight: {
    alignItems: 'flex-end',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  upcomingCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  pendingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  chartSection: {
    paddingHorizontal: 20,
  },
});