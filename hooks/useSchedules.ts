import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from './auth-context';
import { Alert } from 'react-native';

export interface Schedule {
  id: number;
  admin_id: string;
  title: string;
  type: 'Class' | 'Exam' | 'Meeting' | 'Other';
  subject_id?: number;
  grade_level?: number;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  created_at: string;
}

export interface ScheduleFormData {
  title: string;
  type: 'Class' | 'Exam' | 'Meeting' | 'Other';
  subject_id?: number;
  grade_level?: number;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
}

export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadSchedules = useCallback(async () => {
    if (!user?.id) {
      console.log('[useSchedules] No user ID available');
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('[useSchedules] Loading schedules for admin:', user.id);
      console.log('[useSchedules] User object:', JSON.stringify(user, null, 2));
      
      // First, let's check if we can access the schedules table at all
      const { data: testData, error: testError } = await supabase
        .from('schedules')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('[useSchedules] Cannot access schedules table:', testError);
        const errorMsg = typeof testError === 'object' ? JSON.stringify(testError) : String(testError);
        setError(`Database access error: ${errorMsg}`);
        return;
      }
      
      console.log('[useSchedules] Schedules table accessible, test result:', testData);
      
      // Try to fetch all schedules first to see if there are any in the database
      const { data: allSchedules, error: allError } = await supabase
        .from('schedules')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (allError) {
        console.error('[useSchedules] Error loading all schedules:', allError);
        const errorMsg = typeof allError === 'object' ? JSON.stringify(allError) : String(allError);
        setError(`Database error: ${errorMsg}`);
        return;
      }
      
      console.log('[useSchedules] All schedules in database:', allSchedules?.length || 0);
      console.log('[useSchedules] All schedule data:', JSON.stringify(allSchedules, null, 2));
      
      // Now fetch schedules for this admin
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('admin_id', user.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('[useSchedules] Error loading admin schedules:', error);
        const errorMsg = typeof error === 'object' ? JSON.stringify(error) : String(error);
        setError(`Database error: ${errorMsg}`);
        return;
      }

      console.log('[useSchedules] Loaded admin schedules:', data?.length || 0);
      console.log('[useSchedules] Admin schedule data:', JSON.stringify(data, null, 2));
      setSchedules(data || []);
    } catch (err) {
      console.error('[useSchedules] Unexpected error:', err);
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : String(err));
      console.error('[useSchedules] Error details:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createSchedule = async (scheduleData: ScheduleFormData): Promise<boolean> => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useSchedules] Creating schedule:', scheduleData);
      
      const { data, error } = await supabase
        .from('schedules')
        .insert({
          admin_id: user.id,
          title: scheduleData.title,
          type: scheduleData.type,
          subject_id: scheduleData.subject_id || null,
          grade_level: scheduleData.grade_level || null,
          date: scheduleData.date,
          start_time: scheduleData.start_time,
          end_time: scheduleData.end_time,
          location: scheduleData.location || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[useSchedules] Error creating schedule:', error);
        setError(error.message);
        Alert.alert('Error', 'Failed to create schedule');
        return false;
      }

      console.log('[useSchedules] Schedule created successfully:', data.id);
      // Force immediate refresh
      setSchedules(prev => [...prev, data].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      }));
      // Also reload from database to ensure consistency
      setTimeout(() => loadSchedules(), 100);
      Alert.alert('Success', 'Schedule created successfully!');
      return true;
    } catch (err) {
      console.error('[useSchedules] Unexpected error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create schedule';
      console.error('[useSchedules] Error details:', JSON.stringify(err, null, 2));
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = async (id: number, scheduleData: ScheduleFormData): Promise<boolean> => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useSchedules] Updating schedule:', id, scheduleData);
      
      const { data, error } = await supabase
        .from('schedules')
        .update({
          title: scheduleData.title,
          type: scheduleData.type,
          subject_id: scheduleData.subject_id || null,
          grade_level: scheduleData.grade_level || null,
          date: scheduleData.date,
          start_time: scheduleData.start_time,
          end_time: scheduleData.end_time,
          location: scheduleData.location || null,
        })
        .eq('id', id)
        .eq('admin_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('[useSchedules] Error updating schedule:', error);
        setError(error.message);
        Alert.alert('Error', 'Failed to update schedule');
        return false;
      }

      console.log('[useSchedules] Schedule updated successfully:', data.id);
      // Force immediate refresh
      setSchedules(prev => prev.map(s => s.id === data.id ? data : s).sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      }));
      // Also reload from database to ensure consistency
      setTimeout(() => loadSchedules(), 100);
      Alert.alert('Success', 'Schedule updated successfully!');
      return true;
    } catch (err) {
      console.error('[useSchedules] Unexpected error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update schedule';
      console.error('[useSchedules] Error details:', JSON.stringify(err, null, 2));
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (id: number): Promise<boolean> => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useSchedules] Deleting schedule:', id);
      
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)
        .eq('admin_id', user.id);

      if (error) {
        console.error('[useSchedules] Error deleting schedule:', error);
        setError(error.message);
        Alert.alert('Error', 'Failed to delete schedule');
        return false;
      }

      console.log('[useSchedules] Schedule deleted successfully');
      // Force immediate refresh
      setSchedules(prev => prev.filter(s => s.id !== id));
      // Also reload from database to ensure consistency
      setTimeout(() => loadSchedules(), 100);
      Alert.alert('Success', 'Schedule deleted successfully!');
      return true;
    } catch (err) {
      console.error('[useSchedules] Unexpected error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete schedule';
      console.error('[useSchedules] Error details:', JSON.stringify(err, null, 2));
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getTodaySchedules = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.date === today);
  }, [schedules]);

  const getUpcomingSchedules = useCallback((days: number = 7) => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate >= today && scheduleDate <= futureDate;
    });
  }, [schedules]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Force refresh schedules when user changes
  useEffect(() => {
    if (user?.id) {
      console.log('[useSchedules] User changed, reloading schedules');
      loadSchedules();
    }
  }, [user?.id, loadSchedules]);

  return {
    schedules,
    loading,
    error,
    loadSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getTodaySchedules,
    getUpcomingSchedules,
  };
}