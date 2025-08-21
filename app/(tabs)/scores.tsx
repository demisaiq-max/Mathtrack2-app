import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useLanguage } from '@/hooks/language-context';
import { useTheme } from '@/hooks/theme-context';
import { recentExams, upcomingExams } from '@/mocks/exams';

export default function ScoresScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const allExams = [...recentExams, ...upcomingExams];

  const getGradeColor = (grade?: string) => {
    if (!grade) return '#6B7280';
    switch (grade) {
      case 'A': return '#10B981';
      case 'B': return '#3B82F6';
      case 'C': return '#F59E0B';
      case 'D': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTrend = (index: number) => {
    if (index === 0) return null;
    const current = recentExams[index]?.score || 0;
    const previous = recentExams[index - 1]?.score || 0;
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'same';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('scoreManager')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('trackPerformance')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('highestScore')}</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {Math.max(...recentExams.map(e => e.score || 0))}%
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('lowestScore')}</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {Math.min(...recentExams.map(e => e.score || 0))}%
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('totalExams')}</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{allExams.length}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('completedExams')}</Text>
          {recentExams.map((exam, index) => (
            <TouchableOpacity key={exam.id} style={[styles.examCard, { backgroundColor: colors.surface }]}>
              <View style={styles.examLeft}>
                <Text style={styles.examIcon}>{exam.icon}</Text>
                <View style={styles.examInfo}>
                  <Text style={[styles.examSubject, { color: colors.text }]}>{exam.subject}</Text>
                  <Text style={[styles.examDate, { color: colors.textSecondary }]}>{exam.date}</Text>
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
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('upcomingExams')}</Text>
          {upcomingExams.map((exam) => (
            <View key={exam.id} style={[styles.upcomingCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.examIcon}>{exam.icon}</Text>
              <View style={styles.examInfo}>
                <Text style={[styles.examSubject, { color: colors.text }]}>{exam.subject}</Text>
                <Text style={[styles.examDate, { color: colors.textSecondary }]}>{exam.date}</Text>
              </View>
              <View style={[styles.pendingBadge, { backgroundColor: colors.card }]}>
                <Text style={[styles.pendingText, { color: colors.textSecondary }]}>{t('pending')}</Text>
              </View>
            </View>
          ))}
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
    marginBottom: 4,
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
});