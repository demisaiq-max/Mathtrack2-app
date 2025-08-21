import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/config/supabase';
import { User, LoginCredentials, SignUpData } from '@/types/auth';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile && !error) {
          console.log('[Auth] Profile data from DB:', profile);
          const userData: User = {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            accountType: profile.role,
            gradeLevel: profile.grade_level ? `Grade ${profile.grade_level}` : undefined,
            profileImage: profile.profile_image,
            createdAt: new Date(profile.created_at),
          };
          console.log('[Auth] Processed user data:', userData);
          setUser(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        } else {
          console.error('[Auth] Profile fetch error:', JSON.stringify(error, null, 2));
          // If there's an RLS error, try to get basic user info from auth session
          if (session?.user) {
            const basicUserData: User = {
              id: session.user.id,
              email: session.user.email || '',
              fullName: session.user.user_metadata?.full_name || 'User',
              accountType: 'student',
              gradeLevel: undefined,
              createdAt: new Date(),
            };
            console.log('[Auth] Using basic user data from session:', basicUserData);
            setUser(basicUserData);
            await AsyncStorage.setItem('user', JSON.stringify(basicUserData));
          }
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          console.log('[Auth] Auth state change - Profile data:', profile);
          const userData: User = {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            accountType: profile.role,
            gradeLevel: profile.grade_level ? `Grade ${profile.grade_level}` : undefined,
            profileImage: profile.profile_image,
            createdAt: new Date(profile.created_at),
          };
          console.log('[Auth] Auth state change - Processed user data:', userData);
          setUser(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        } else {
          // If profile fetch fails, use basic session data
          if (session?.user) {
            const basicUserData: User = {
              id: session.user.id,
              email: session.user.email || '',
              fullName: session.user.user_metadata?.full_name || 'User',
              accountType: 'student',
              gradeLevel: undefined,
              createdAt: new Date(),
            };
            console.log('[Auth] Using basic user data from session (auth state change):', basicUserData);
            setUser(basicUserData);
            await AsyncStorage.setItem('user', JSON.stringify(basicUserData));
          }
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem('user');
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.emailOrUsername,
        password: credentials.password,
      });
      
      if (error) {
        console.error('Login error:', error.message);
        throw new Error(error.message);
      }
      
      // User will be set via onAuthStateChange
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    try {
      setIsLoading(true);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      
      if (authError) {
        console.error('Signup auth error:', authError.message);
        throw new Error(authError.message);
      }
      
      if (authData.user) {
        // Create profile
        const gradeNumber = data.gradeLevel ? parseInt(data.gradeLevel.replace('Grade ', '')) : null;
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: data.fullName,
            email: data.email,
            role: data.accountType,
            grade_level: gradeNumber,
          });
        
        if (profileError) {
          console.error('Profile creation error:', profileError.message);
          console.error('Profile creation error details:', profileError);
          throw new Error(profileError.message);
        } else {
          console.log('[Auth] Profile created successfully for user:', authData.user.id);
        }
      }
      
      return authData.user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('[Auth] Starting logout process');
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[Auth] Supabase logout error:', error);
        throw error;
      }
      
      console.log('[Auth] Supabase logout successful');
      
      // Clear local state immediately
      setUser(null);
      await AsyncStorage.removeItem('user');
      console.log('[Auth] Local state cleared');
      
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    try {
      console.log('[Auth] Updating user with data:', {
        fullName: updatedUser.fullName,
        profileImage: updatedUser.profileImage,
      });
      
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updatedUser.fullName,
          profile_image: updatedUser.profileImage,
        })
        .eq('id', updatedUser.id);
      
      if (error) {
        console.error('Update user error:', error.message);
        throw new Error(error.message);
      }
      
      console.log('[Auth] Database update successful, setting user state');
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('[Auth] User state and AsyncStorage updated');
      return updatedUser;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log('[Auth] Refreshing user data for ID:', user.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile && !error) {
        console.log('[Auth] Refreshed profile data:', profile);
        console.log('[Auth] Profile image from DB:', profile.profile_image);
        const userData: User = {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          accountType: profile.role,
          gradeLevel: profile.grade_level ? `Grade ${profile.grade_level}` : undefined,
          profileImage: profile.profile_image,
          createdAt: new Date(profile.created_at),
        };
        console.log('[Auth] Setting refreshed user data:', userData);
        console.log('[Auth] Profile image in userData:', userData.profileImage);
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.error('[Auth] Error refreshing profile:', error);
      }
    } catch (error) {
      console.error('[Auth] Refresh user error:', error);
    }
  }, [user?.id]);

  const deleteAccount = useCallback(async () => {
    if (!user?.id) {
      throw new Error('No user logged in');
    }

    try {
      setIsLoading(true);
      
      // Delete user profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Profile deletion error:', profileError);
        throw new Error(profileError.message);
      }
      
      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) {
        console.error('Auth deletion error:', authError);
        // If admin delete fails, try regular signOut
        await supabase.auth.signOut();
      }
      
      // Clear local data
      setUser(null);
      await AsyncStorage.removeItem('user');
      
      console.log('[Auth] Account deleted successfully');
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  return useMemo(() => ({
    user,
    isLoading,
    login,
    signUp,
    logout,
    updateUser,
    refreshUser,
    deleteAccount,
  }), [user, isLoading, login, signUp, logout, updateUser, refreshUser, deleteAccount]);
});