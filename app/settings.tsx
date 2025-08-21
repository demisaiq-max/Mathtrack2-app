import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  FileText,
  Trash2,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { useLanguage } from '@/hooks/language-context';
import { useTheme } from '@/hooks/theme-context';
import { useAuth } from '@/hooks/auth-context';
import { StatusBar } from 'expo-status-bar';

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<any>;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
  disabled?: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t, getCurrentLanguageDisplay } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();
  const { deleteAccount } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      t('deleteAccountTitle'),
      t('deleteAccountFinalWarning'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: showDeleteConfirmation
        }
      ]
    );
  };

  const showDeleteConfirmation = () => {
    Alert.prompt(
      t('deleteAccountTitle'),
      t('deleteAccountConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: (text) => {
            if (text === 'DELETE') {
              performDeleteAccount();
            } else {
              Alert.alert(t('error'), 'Please type DELETE exactly to confirm.');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const performDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
      Alert.alert(
        t('accountDeleted'),
        t('deleteAccountSuccess'),
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login')
          }
        ]
      );
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert(
        t('error'),
        t('deleteAccountError')
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const settingSections = [
    {
      title: t('preferences'),
      items: [
        {
          id: 'notifications',
          title: t('pushNotifications'),
          description: t('pushNotificationsDesc'),
          icon: Bell,
          type: 'toggle' as const,
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
        {
          id: 'darkMode',
          title: t('darkMode'),
          description: t('darkModeDesc'),
          icon: Moon,
          type: 'toggle' as const,
          value: isDark,
          onToggle: toggleTheme,
        },
        {
          id: 'language',
          title: t('language'),
          description: getCurrentLanguageDisplay(),
          icon: Globe,
          type: 'navigation' as const,
          onPress: () => router.push('/language-selection'),
        },
      ],
    },
    {
      title: t('privacySecurity'),
      items: [
        {
          id: 'privacy',
          title: t('privacySettings'),
          description: t('privacySettingsDesc'),
          icon: Shield,
          type: 'navigation' as const,
          onPress: () => router.push('/privacy-settings'),
        },
      ],
    },
    {
      title: t('support'),
      items: [
        {
          id: 'help',
          title: t('helpSupport'),
          description: t('helpSupportDesc'),
          icon: HelpCircle,
          type: 'navigation' as const,
          onPress: () => router.push('/help-support'),
        },
        {
          id: 'terms',
          title: t('termsOfService'),
          icon: FileText,
          type: 'navigation' as const,
          onPress: () => router.push('/terms-of-service'),
        },
        {
          id: 'privacy-policy',
          title: t('privacyPolicy'),
          icon: FileText,
          type: 'navigation' as const,
          onPress: () => router.push('/privacy-policy'),
        },
      ],
    },
    {
      title: t('account'),
      items: [
        {
          id: 'delete',
          title: t('deleteAccount'),
          description: t('deleteAccountDesc'),
          icon: Trash2,
          type: 'action' as const,
          onPress: handleDeleteAccount,
          destructive: true,
          disabled: isDeleting,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    const IconComponent = item.icon;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.settingItem, 
          { borderBottomColor: colors.border },
          item.disabled && { opacity: 0.5 }
        ]}
        onPress={item.onPress}
        disabled={item.type === 'toggle' || item.disabled}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, { backgroundColor: colors.border }, item.destructive && styles.destructiveIcon]}>
            <IconComponent 
              color={item.destructive ? colors.error : colors.textSecondary} 
              size={20} 
            />
          </View>
          <View style={styles.settingContent}>
            <Text style={[
              styles.settingTitle, 
              { color: colors.text }, 
              item.destructive && { color: colors.error }
            ]}>
              {item.title}{item.disabled && isDeleting ? ' (Deleting...)' : ''}
            </Text>
            {item.description && (
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.settingRight}>
          {item.type === 'toggle' && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          )}
          {item.type === 'navigation' && (
            <ChevronRight color={colors.textSecondary} size={20} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      paddingHorizontal: 20,
    },
    sectionContent: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      borderRadius: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    footerText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
  });

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Screen 
        options={{
          title: t('settings'),
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color={colors.primary} size={24} />
            </TouchableOpacity>
          ),
        }} 
      />
      <SafeAreaView style={dynamicStyles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {settingSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={dynamicStyles.sectionTitle}>{section.title}</Text>
              <View style={dynamicStyles.sectionContent}>
                {section.items.map(renderSettingItem)}
              </View>
            </View>
          ))}
          
          <View style={styles.footer}>
            <Text style={dynamicStyles.footerText}>MathTrack v1.0.0</Text>
            <Text style={dynamicStyles.footerText}>© 2025 MathTrack. All rights reserved.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIcon: {
    backgroundColor: '#FEE2E2',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  settingRight: {
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
});