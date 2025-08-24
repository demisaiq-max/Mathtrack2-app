import { createClient } from '@supabase/supabase-js';
import config from '@/config/env';
import NetInfo from '@react-native-community/netinfo';

const supabaseUrl = config.SUPABASE_URL;
const supabaseAnonKey = config.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Network connectivity helper
export const checkNetworkConnectivity = async (): Promise<{ isConnected: boolean; error?: string }> => {
  try {
    const netInfo = await NetInfo.fetch();
    console.log('[Network] Connection status:', {
      isConnected: netInfo.isConnected,
      type: netInfo.type,
      isInternetReachable: netInfo.isInternetReachable
    });
    
    if (!netInfo.isConnected) {
      return {
        isConnected: false,
        error: 'No internet connection. Please check your network settings and try again.'
      };
    }
    
    return { isConnected: true };
  } catch (error) {
    console.error('[Network] Error checking connectivity:', error);
    return {
      isConnected: false,
      error: 'Unable to check network connectivity. Please try again.'
    };
  }
};

// Test Supabase connection
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[Supabase] Testing connection...');
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('[Supabase] Connection test failed:', error);
      return {
        success: false,
        error: `Database connection failed: ${error.message}`
      };
    }
    
    console.log('[Supabase] Connection test successful');
    return { success: true };
  } catch (error) {
    console.error('[Supabase] Connection test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown connection error'
    };
  }
};

export default supabase;