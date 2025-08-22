import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  Award,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-context';
import { useLanguage } from '@/hooks/language-context';
import { useTheme } from '@/hooks/theme-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();

  console.log('[Profile] Current user data:', user);

  // Refresh user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[Profile] Screen focused, refreshing user data');
      console.log('[Profile] Current user profileImage:', user?.profileImage);
      console.log('[Profile] Full user object:', JSON.stringify(user, null, 2));
      if (refreshUser) {
        refreshUser();
      }
    }, [refreshUser])
  );

  const handleLogout = async () => {
    try {
      console.log('[Profile] Logout initiated');
      await logout();
      console.log('[Profile] Logout successful, redirecting to login');
      // Navigate directly to login page after logout
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('[Profile] Logout error:', error);
      // Even if logout fails, try to navigate to login
      router.replace('/(auth)/login');
    }
  };

  const profileStats = [
    { label: t('totalExamsCount'), value: '12' },
    { label: t('averageScore'), value: '78.5%' },
    { label: t('bestSubject'), value: 'Math' },
  ];

  const menuItems = [
    {
      icon: User,
      label: t('editProfile'),
      onPress: () => router.push('/edit-profile'),
    },
    {
      icon: Award,
      label: t('achievements'),
      onPress: () => router.push('/achievements'),
    },
    {
      icon: Settings,
      label: t('settings'),
      onPress: () => router.push('/settings'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.profileImageContainer}>
            <View style={[styles.profileImage, { backgroundColor: colors.primary }]}>
              {user?.profileImage ? (
                <Image
                  key={`${user.profileImage}-${Date.now()}`} // Force re-render with timestamp
                  source={{ uri: user.profileImage }}
                  style={styles.profileImagePhoto}
                  contentFit="cover"
                  cachePolicy="none" // Disable caching to always fetch fresh image
                  onLoad={() => console.log('[Profile] Image loaded successfully:', user.profileImage)}
                  onError={(error) => console.log('[Profile] Image load error:', error)}
                />
              ) : (
                <User color={colors.primaryText} size={40} />
              )}
            </View>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{user?.fullName || 'Loading...'}</Text>
          <Text style={[styles.accountType, { color: colors.textSecondary }]}>
            {user?.accountType === 'student' ? t('studentRole') : t('administratorRole')}
          </Text>
          {user?.gradeLevel && (
            <Text style={[styles.gradeText, { color: colors.primary }]}>{user.gradeLevel}</Text>
          )}
        </View>

        <View style={styles.statsContainer}>
          {profileStats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('accountInformation')}</Text>
          
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Mail color={colors.textSecondary} size={20} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('email')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{user?.email}</Text>
              </View>
            </View>

            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <GraduationCap color={colors.textSecondary} size={20} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('gradeLevel')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{user?.gradeLevel || t('notSpecified')}</Text>
              </View>
            </View>

            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Calendar color={colors.textSecondary} size={20} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('memberSince')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  }) : 'January 2025'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.surface }]}
              onPress={item.onPress}
            >
              <View style={styles.menuLeft}>
                <item.icon color={colors.textSecondary} size={20} />
                <Text style={[styles.menuText, { color: colors.text }]}>{item.label}</Text>
              </View>
              <ChevronRight color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.error + '20' }]} onPress={handleLogout}>
          <LogOut color={colors.error} size={20} />
          <Text style={[styles.logoutText, { color: colors.error }]}>{t('logOut')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImagePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
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
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 32,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});