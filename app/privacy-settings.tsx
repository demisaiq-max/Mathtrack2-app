import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Shield, Eye, Bell, Database } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { useLanguage } from '@/hooks/language-context';
import { useTheme } from '@/hooks/theme-context';
import { StatusBar } from 'expo-status-bar';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const [dataCollection, setDataCollection] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(true);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    settingCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    settingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: 12,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginTop: 4,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });

  const renderSettingItem = (
    icon: React.ComponentType<any>,
    title: string,
    description: string,
    value: boolean,
    onToggle: (value: boolean) => void
  ) => {
    const IconComponent = icon;
    
    return (
      <View style={dynamicStyles.settingCard}>
        <View style={dynamicStyles.settingHeader}>
          <View style={dynamicStyles.settingLeft}>
            <IconComponent 
              color={colors.primary} 
              size={24} 
              style={dynamicStyles.settingIcon} 
            />
            <Text style={dynamicStyles.settingTitle}>{title}</Text>
          </View>
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
        <Text style={dynamicStyles.settingDescription}>{description}</Text>
      </View>
    );
  };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Screen 
        options={{
          title: t('privacySettings'),
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
          <View style={dynamicStyles.content}>
            <Text style={dynamicStyles.title}>{t('privacySettings')}</Text>
            
            <View style={dynamicStyles.infoCard}>
              <Text style={dynamicStyles.infoText}>
                {t('privacySettingsDesc')} These settings help you control how your data is used and shared.
              </Text>
            </View>

            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Data & Analytics</Text>
              
              {renderSettingItem(
                Database,
                'Data Collection',
                'Allow collection of usage data to improve app performance and features.',
                dataCollection,
                setDataCollection
              )}

              {renderSettingItem(
                Shield,
                'Analytics',
                'Share anonymous analytics data to help us understand app usage patterns.',
                analytics,
                setAnalytics
              )}
            </View>

            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Communication</Text>
              
              {renderSettingItem(
                Bell,
                'Marketing Emails',
                'Receive emails about new features, tips, and educational content.',
                marketingEmails,
                setMarketingEmails
              )}
            </View>

            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Profile</Text>
              
              {renderSettingItem(
                Eye,
                'Profile Visibility',
                'Allow other students and teachers to see your profile information.',
                profileVisibility,
                setProfileVisibility
              )}
            </View>

            <View style={dynamicStyles.infoCard}>
              <Text style={dynamicStyles.infoText}>
                Note: Some data collection is necessary for core app functionality and cannot be disabled. 
                This includes exam scores, progress tracking, and account information.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}