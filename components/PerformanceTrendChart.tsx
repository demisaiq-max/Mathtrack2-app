import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/hooks/theme-context';
import { CompletedExam } from '@/hooks/useExamStats';

interface PerformanceTrendChartProps {
  completedExams: CompletedExam[];
}

type TimeFrame = 'weekly' | 'monthly';

interface ChartDataPoint {
  period: string;
  score: number;
  count: number;
  date: Date;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40; // Account for padding
const chartHeight = 180;
const barWidth = 40;
const maxBars = Math.floor((chartWidth - 60) / (barWidth + 12)); // Leave space for labels

export default function PerformanceTrendChart({ completedExams }: PerformanceTrendChartProps) {
  const { colors } = useTheme();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');

  const chartData = useMemo(() => {
    if (completedExams.length === 0) return [];

    // Sort exams by date (oldest first for trend calculation)
    const sortedExams = [...completedExams].sort((a, b) => 
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );

    const now = new Date();
    const data: ChartDataPoint[] = [];

    if (timeFrame === 'weekly') {
      // Generate last 8 weeks of data
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7) - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekExams = sortedExams.filter(exam => {
          const examDate = new Date(exam.submittedAt);
          return examDate >= weekStart && examDate <= weekEnd;
        });

        if (weekExams.length > 0) {
          const avgScore = Math.round(
            weekExams.reduce((sum, exam) => sum + exam.score, 0) / weekExams.length
          );
          
          data.push({
            period: `W${Math.ceil((weekStart.getDate()) / 7)}`,
            score: avgScore,
            count: weekExams.length,
            date: weekStart,
          });
        }
      }
    } else {
      // Generate last 6 months of data
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

        const monthExams = sortedExams.filter(exam => {
          const examDate = new Date(exam.submittedAt);
          return examDate >= monthStart && examDate <= monthEnd;
        });

        if (monthExams.length > 0) {
          const avgScore = Math.round(
            monthExams.reduce((sum, exam) => sum + exam.score, 0) / monthExams.length
          );
          
          data.push({
            period: monthStart.toLocaleDateString('en-US', { month: 'short' }),
            score: avgScore,
            count: monthExams.length,
            date: monthStart,
          });
        }
      }
    }

    // Limit to maxBars and return most recent data
    return data.slice(-maxBars);
  }, [completedExams, timeFrame]);

  const maxScore = Math.max(...chartData.map(d => d.score), 100);
  const minScore = Math.min(...chartData.map(d => d.score), 0);
  const scoreRange = maxScore - minScore || 100;

  const isImproving = useMemo(() => {
    if (chartData.length < 2) return null;
    const firstScore = chartData[0].score;
    const lastScore = chartData[chartData.length - 1].score;
    return lastScore > firstScore;
  }, [chartData]);

  if (completedExams.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Performance Trend</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Complete some exams to see your performance trend
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Performance Trend</Text>
          {isImproving !== null && (
            <View style={styles.trendIndicator}>
              <TrendingUp 
                color={isImproving ? '#10B981' : '#EF4444'} 
                size={16} 
                style={isImproving ? {} : { transform: [{ rotate: '180deg' }] }}
              />
              <Text style={[styles.trendText, { color: isImproving ? '#10B981' : '#EF4444' }]}>
                {isImproving ? 'Improving Performance' : 'Declining Performance'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.timeFrameSelector}>
          <TouchableOpacity
            style={[
              styles.timeFrameButton,
              timeFrame === 'weekly' && { backgroundColor: colors.primary },
              { borderColor: colors.border }
            ]}
            onPress={() => setTimeFrame('weekly')}
          >
            <Text style={[
              styles.timeFrameText,
              { color: timeFrame === 'weekly' ? '#FFFFFF' : colors.textSecondary }
            ]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeFrameButton,
              timeFrame === 'monthly' && { backgroundColor: colors.primary },
              { borderColor: colors.border }
            ]}
            onPress={() => setTimeFrame('monthly')}
          >
            <Text style={[
              styles.timeFrameText,
              { color: timeFrame === 'monthly' ? '#FFFFFF' : colors.textSecondary }
            ]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {chartData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No data available for selected time frame
          </Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <View style={styles.chart}>
            {chartData.map((dataPoint, index) => {
              const barHeight = Math.max(
                ((dataPoint.score - minScore) / scoreRange) * (chartHeight - 60),
                8
              );
              
              return (
                <View key={`${dataPoint.period}-${index}`} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
                      {dataPoint.score}%
                    </Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>
                    {dataPoint.period}
                  </Text>
                  <Text style={[styles.countLabel, { color: colors.textSecondary }]}>
                    {dataPoint.count} exam{dataPoint.count !== 1 ? 's' : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeFrameSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeFrameButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  timeFrameText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    height: chartHeight,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: chartHeight - 40,
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    maxWidth: barWidth + 20,
  },
  barWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  bar: {
    width: barWidth,
    borderRadius: 4,
    marginTop: 4,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  periodLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  countLabel: {
    fontSize: 9,
    marginTop: 2,
  },
  emptyState: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});