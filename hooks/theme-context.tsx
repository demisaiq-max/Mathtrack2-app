import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';

const THEME_STORAGE_KEY = 'app_theme';

export type Theme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryText: string;
  success: string;
  error: string;
  warning: string;
  shadow: string;
}

const lightTheme: ThemeColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  primary: '#4F46E5',
  primaryText: '#FFFFFF',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  shadow: '#000000',
};

const darkTheme: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  card: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#475569',
  primary: '#6366F1',
  primaryText: '#FFFFFF',
  success: '#22C55E',
  error: '#F87171',
  warning: '#FBBF24',
  shadow: '#000000',
};

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme on app start
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setCurrentTheme(savedTheme as Theme);
        }
      } catch (error) {
        console.log('Error loading saved theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedTheme();
  }, []);

  const toggleTheme = useCallback(async () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setCurrentTheme(newTheme);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  }, [currentTheme]);

  const setTheme = useCallback(async (theme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      setCurrentTheme(theme);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  }, []);

  const colors = useMemo(() => {
    return currentTheme === 'light' ? lightTheme : darkTheme;
  }, [currentTheme]);

  const isDark = useMemo(() => currentTheme === 'dark', [currentTheme]);

  return useMemo(() => ({
    currentTheme,
    colors,
    isDark,
    toggleTheme,
    setTheme,
    isLoading,
  }), [currentTheme, colors, isDark, toggleTheme, setTheme, isLoading]);
});