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

export default function TermsOfServiceScreen() {
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
          title: t('termsOfService'),
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
            <Text style={dynamicStyles.title}>{t('termsOfService')}</Text>
            
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Acceptance of Terms</Text>
              <Text style={dynamicStyles.text}>
                By accessing and using MathTrack, you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, 
                please do not use this service.
              </Text>
            </View>

            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Use License</Text>
              <Text style={dynamicStyles.text}>
                Permission is granted to temporarily use MathTrack for personal, non-commercial 
                transitory viewing only. This is the grant of a license, not a transfer of title.
              </Text>
            </View>

            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>User Account</Text>
              <Text style={dynamicStyles.text}>
                You are responsible for safeguarding the password and for maintaining the 
                confidentiality of your account. You agree not to disclose your password to any third party.
              </Text>
            </View>

            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Prohibited Uses</Text>
              <Text style={dynamicStyles.text}>
                You may not use our service for any illegal or unauthorized purpose nor may you, 
                in the use of the service, violate any laws in your jurisdiction.
              </Text>
            </View>

            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Service Modifications</Text>
              <Text style={dynamicStyles.text}>
                We reserve the right to modify or discontinue the service at any time without notice. 
                We shall not be liable to you or any third party for any modification, suspension, 
                or discontinuance of the service.
              </Text>
            </View>

            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Limitation of Liability</Text>
              <Text style={dynamicStyles.text}>
                In no event shall MathTrack or its suppliers be liable for any damages arising 
                out of the use or inability to use the materials on this application.
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