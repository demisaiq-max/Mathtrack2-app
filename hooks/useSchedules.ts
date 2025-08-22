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
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('[useSchedules] Loading schedules for admin:', user.id);
      
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('admin_id', user.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('[useSchedules] Error loading schedules:', error);
        setError(error.message);
        return;
      }

      console.log('[useSchedules] Loaded schedules:', data?.length || 0);
      setSchedules(data || []);
    } catch (err) {
      console.error('[useSchedules] Unexpected error:', err);
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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
      await loadSchedules();
      Alert.alert('Success', 'Schedule created successfully!');
      return true;
    } catch (err) {
      console.error('[useSchedules] Unexpected error:', err);
      setError('Failed to create schedule');
      Alert.alert('Error', 'Failed to create schedule');
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
      await loadSchedules();
      Alert.alert('Success', 'Schedule updated successfully!');
      return true;
    } catch (err) {
      console.error('[useSchedules] Unexpected error:', err);
      setError('Failed to update schedule');
      Alert.alert('Error', 'Failed to update schedule');
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
      await loadSchedules();
      Alert.alert('Success', 'Schedule deleted successfully!');
      return true;
    } catch (err) {
      console.error('[useSchedules] Unexpected error:', err);
      setError('Failed to delete schedule');
      Alert.alert('Error', 'Failed to delete schedule');
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