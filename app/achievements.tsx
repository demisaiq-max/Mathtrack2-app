import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Award,
  Trophy,
  Star,
  Target,
  TrendingUp,
  ArrowLeft,
  Medal,
  Zap,
} from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  backgroundColor: string;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  maxProgress?: number;
}

export default function AchievementsScreen() {
  const router = useRouter();

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first exam',
      icon: Star,
      color: '#F59E0B',
      backgroundColor: '#FEF3C7',
      earned: true,
      earnedDate: '2025-01-10',
    },
    {
      id: '2',
      title: 'Perfect Score',
      description: 'Score 100% on any exam',
      icon: Trophy,
      color: '#10B981',
      backgroundColor: '#D1FAE5',
      earned: true,
      earnedDate: '2025-01-12',
    },
    {
      id: '3',
      title: 'Consistent Performer',
      description: 'Score above 80% on 5 consecutive exams',
      icon: Target,
      color: '#3B82F6',
      backgroundColor: '#DBEAFE',
      earned: false,
      progress: 3,
      maxProgress: 5,
    },
    {
      id: '4',
      title: 'Math Master',
      description: 'Complete 10 math exams',
      icon: Medal,
      color: '#8B5CF6',
      backgroundColor: '#EDE9FE',
      earned: false,
      progress: 7,
      maxProgress: 10,
    },
    {
      id: '5',
      title: 'Improvement Champion',
      description: 'Improve your average score by 15%',
      icon: TrendingUp,
      color: '#EF4444',
      backgroundColor: '#FEE2E2',
      earned: false,
      progress: 8,
      maxProgress: 15,
    },
    {
      id: '6',
      title: 'Speed Demon',
      description: 'Complete an exam in under 30 minutes',
      icon: Zap,
      color: '#F97316',
      backgroundColor: '#FED7AA',
      earned: false,
    },
  ];

  const earnedAchievements = achievements.filter(a => a.earned);
  const unlockedAchievements = achievements.filter(a => !a.earned);

  const renderAchievement = (achievement: Achievement) => {
    const IconComponent = achievement.icon;
    
    return (
      <View key={achievement.id} style={styles.achievementCard}>
        <View style={[styles.iconContainer, { backgroundColor: achievement.backgroundColor }]}>
          <IconComponent 
            color={achievement.color} 
            size={24} 
            style={{ opacity: achievement.earned ? 1 : 0.5 }}
          />
        </View>
        
        <View style={styles.achievementContent}>
          <Text style={[styles.achievementTitle, { opacity: achievement.earned ? 1 : 0.7 }]}>
            {achievement.title}
          </Text>
          <Text style={[styles.achievementDescription, { opacity: achievement.earned ? 1 : 0.6 }]}>
            {achievement.description}
          </Text>
          
          {achievement.earned && achievement.earnedDate && (
            <Text style={styles.earnedDate}>
              Earned on {new Date(achievement.earnedDate).toLocaleDateString()}
            </Text>
          )}
          
          {!achievement.earned && achievement.progress !== undefined && achievement.maxProgress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                      backgroundColor: achievement.color 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {achievement.progress}/{achievement.maxProgress}
              </Text>
            </View>
          )}
        </View>
        
        {achievement.earned && (
          <View style={styles.earnedBadge}>
            <Award color="#10B981" size={16} />
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Achievements',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color="#4F46E5" size={24} />
            </TouchableOpacity>
          ),
        }} 
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Trophy color="#F59E0B" size={24} />
              <Text style={styles.statValue}>{earnedAchievements.length}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
            
            <View style={styles.statCard}>
              <Target color="#6B7280" size={24} />
              <Text style={styles.statValue}>{unlockedAchievements.length}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            
            <View style={styles.statCard}>
              <Star color="#4F46E5" size={24} />
              <Text style={styles.statValue}>
                {Math.round((earnedAchievements.length / achievements.length) * 100)}%
              </Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </View>

          {earnedAchievements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏆 Earned Achievements</Text>
              {earnedAchievements.map(renderAchievement)}
            </View>
          )}

          {unlockedAchievements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎯 In Progress</Text>
              {unlockedAchievements.map(renderAchievement)}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  earnedDate: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  earnedBadge: {
    marginLeft: 12,
  },
});