import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useLanguage } from '@/hooks/language-context';
import { useTheme } from '@/hooks/theme-context';
import { Language } from '@/constants/translations';
import { StatusBar } from 'expo-status-bar';

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const { colors, isDark } = useTheme();

  const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
  ];

  const handleLanguageSelect = async (language: Language) => {
    await changeLanguage(language);
    router.back();
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      backgroundColor: colors.surface,
      margin: 20,
      borderRadius: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    languageName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 2,
    },
    languageSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Screen 
        options={{
          title: t('selectLanguage'),
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
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.content}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={dynamicStyles.languageItem}
              onPress={() => handleLanguageSelect(language.code)}
            >
              <View style={styles.languageInfo}>
                <Text style={dynamicStyles.languageName}>{language.nativeName}</Text>
                <Text style={dynamicStyles.languageSubtitle}>{language.name}</Text>
              </View>
              {currentLanguage === language.code && (
                <Check color={colors.primary} size={24} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  languageInfo: {
    flex: 1,
  },
});