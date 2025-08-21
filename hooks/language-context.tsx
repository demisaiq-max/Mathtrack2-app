import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Language, translations, Translations } from '@/constants/translations';

const LANGUAGE_STORAGE_KEY = 'app_language';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language on app start
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ko')) {
          setCurrentLanguage(savedLanguage as Language);
        }
      } catch (error) {
        console.log('Error loading saved language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedLanguage();
  }, []);

  const changeLanguage = useCallback(async (language: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      setCurrentLanguage(language);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  }, []);

  const t = useCallback((key: keyof Translations): string => {
    return translations[currentLanguage][key] || key;
  }, [currentLanguage]);

  const getCurrentLanguageDisplay = useCallback((): string => {
    return currentLanguage === 'en' ? 'English' : '한국어';
  }, [currentLanguage]);

  return useMemo(() => ({
    currentLanguage,
    changeLanguage,
    t,
    getCurrentLanguageDisplay,
    isLoading,
  }), [currentLanguage, changeLanguage, t, getCurrentLanguageDisplay, isLoading]);
});