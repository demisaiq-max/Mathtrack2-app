import Constants from 'expo-constants';

interface Config {
  GEMINI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

const config: Config = {
  GEMINI_API_KEY: Constants.expoConfig?.extra?.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyDjR_x70NMho7FZzE5cU7_4OcLiBKGZx6Q',
  SUPABASE_URL: Constants.expoConfig?.extra?.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yoxycnkjbsmfsfaxexgz.supabase.co',
  SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlveHljbmtqYnNtZnNmYXhleGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NzQ2MTUsImV4cCI6MjA3MDQ1MDYxNX0.fQYz6x00TBT0g2O2j2Mv_uo_dleab7iyZsKZVcjXzQg',
};

export default config;