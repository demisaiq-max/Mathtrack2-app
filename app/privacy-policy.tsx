import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { useLanguage } from '@/hooks/language-context';
import { useTheme } from '@/hooks/theme-context';
import { StatusBar } from 'expo-status-bar';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

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
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    text: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
      marginBottom: 12,
    },
  });

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Screen 
        options={{
          title: t('privacyPolicy'),
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
            <Text style={dynamicStyles.title}>{t('privacyPolicy')}</Text>
            
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Information We Collect</Text>
              <Text style={dynamicStyles.text}>
                We collect information you provide directly to us, such as when you create an account, 
                take exams, or contact us for support. This includes your name, email address, 
                grade level, and academic performance data.
              </Text>
            </View>

            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>How We Use Your Information</Text>
              <Text style={dynamicStyles.text}>
                We use the information we collect to provide, maintain, and improve our services, 
                including tracking your academic progress, providing personalized recommendations, 
                and communicating with you about your account.
              </Text>
            </View>

            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Information Sharing</Text>
              <Text style={dynamicStyles.text}>
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as described in this policy or as required by law.
              </Text>
            </View>

            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Data Security</Text>
              <Text style={dynamicStyles.text}>
                We implement appropriate security measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction.
              </Text>
            </View>

            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Your Rights</Text>
              <Text style={dynamicStyles.text}>
                You have the right to access, update, or delete your personal information. 
                You can also request that we stop processing your data or transfer it to another service.
              </Text>
            </View>

            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Contact Us</Text>
              <Text style={dynamicStyles.text}>
                If you have any questions about this Privacy Policy, please contact us at 
                privacy@mathtrack.com or through the app&apos;s support section.
              </Text>
            </View>

            <Text style={[dynamicStyles.text, { fontSize: 14, marginTop: 20 }]}>
              Last updated: January 2025
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

