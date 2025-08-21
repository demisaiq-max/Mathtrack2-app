import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, MessageCircle, FileText } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { useLanguage } from '@/hooks/language-context';
import { useTheme } from '@/hooks/theme-context';
import { StatusBar } from 'expo-status-bar';

export default function HelpSupportScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@mathtrack.com?subject=Support Request');
  };

  const handleReportIssue = () => {
    Linking.openURL('mailto:support@mathtrack.com?subject=Issue Report');
  };

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
    optionCard: {
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
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    optionIcon: {
      marginRight: 12,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    optionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    faqItem: {
      marginBottom: 20,
    },
    faqQuestion: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    faqAnswer: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });

  const faqItems = [
    {
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking "Forgot Password" on the login screen and following the instructions sent to your email.',
    },
    {
      question: 'How are my exam scores calculated?',
      answer: 'Exam scores are calculated based on the number of correct answers divided by the total number of questions, then converted to a percentage.',
    },
    {
      question: 'Can I retake an exam?',
      answer: 'Exam retake policies depend on your institution\'s settings. Contact your administrator for specific retake policies.',
    },
    {
      question: 'How do I update my profile information?',
      answer: 'Go to your Profile tab and tap "Edit Profile" to update your name and profile picture. Email and grade level changes require administrator approval.',
    },
    {
      question: 'Why can\'t I see my exam results?',
      answer: 'Exam results may be delayed if they require manual grading. Contact your instructor if results are missing after 24 hours.',
    },
  ];

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Screen 
        options={{
          title: t('helpSupport'),
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
            <Text style={dynamicStyles.title}>{t('helpSupport')}</Text>
            
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Contact Options</Text>
              
              <TouchableOpacity style={dynamicStyles.optionCard} onPress={handleContactSupport}>
                <View style={dynamicStyles.optionHeader}>
                  <Mail color={colors.primary} size={24} style={dynamicStyles.optionIcon} />
                  <Text style={dynamicStyles.optionTitle}>{t('contactSupport')}</Text>
                </View>
                <Text style={dynamicStyles.optionDescription}>
                  Send us an email and we&apos;ll get back to you within 24 hours.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={dynamicStyles.optionCard} onPress={handleReportIssue}>
                <View style={dynamicStyles.optionHeader}>
                  <MessageCircle color={colors.primary} size={24} style={dynamicStyles.optionIcon} />
                  <Text style={dynamicStyles.optionTitle}>{t('reportIssue')}</Text>
                </View>
                <Text style={dynamicStyles.optionDescription}>
                  Found a bug or having technical difficulties? Let us know.
                </Text>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>{t('faq')}</Text>
              
              {faqItems.map((item, index) => (
                <View key={index} style={dynamicStyles.faqItem}>
                  <Text style={dynamicStyles.faqQuestion}>{item.question}</Text>
                  <Text style={dynamicStyles.faqAnswer}>{item.answer}</Text>
                </View>
              ))}
            </View>

            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Additional Resources</Text>
              
              <View style={dynamicStyles.optionCard}>
                <View style={dynamicStyles.optionHeader}>
                  <FileText color={colors.primary} size={24} style={dynamicStyles.optionIcon} />
                  <Text style={dynamicStyles.optionTitle}>User Guide</Text>
                </View>
                <Text style={dynamicStyles.optionDescription}>
                  Comprehensive guide on how to use all features of MathTrack.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}