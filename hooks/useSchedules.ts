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
    setLoading(true);
    setError(null);
    
    try {
      console.log('[useSchedules] Loading all schedules (RLS disabled)');
      
      // Since RLS is disabled, fetch all schedules without filtering by admin_id
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('[useSchedules] Error loading schedules:', error);
        console.error('[useSchedules] Error code:', error.code);
        console.error('[useSchedules] Error details:', error.details);
        console.error('[useSchedules] Error hint:', error.hint);
        const errorMessage = `Database error: ${error.message}${error.code ? ` (Code: ${error.code})` : ''}`;
        setError(errorMessage);
        return;
      }

      console.log('[useSchedules] Loaded schedules:', data?.length || 0);
      console.log('[useSchedules] Schedule data:', JSON.stringify(data, null, 2));
      setSchedules(data || []);
    } catch (err) {
      console.error('[useSchedules] Unexpected error:', err);
      let errorMessage = 'Failed to load schedules';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      } else {
        errorMessage = String(err);
      }
      console.error('[useSchedules] Error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

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
        const errorMessage = `Failed to create schedule: ${error.message}`;
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
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
      let errorMessage = 'Failed to create schedule';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      } else {
        errorMessage = String(err);
      }
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = async (id: number, scheduleData: ScheduleFormData): Promise<boolean> => {
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
        .select()
        .single();

      if (error) {
        console.error('[useSchedules] Error updating schedule:', error);
        const errorMessage = `Failed to update schedule: ${error.message}`;
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
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
      let errorMessage = 'Failed to update schedule';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      } else {
        errorMessage = String(err);
      }
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useSchedules] Deleting schedule:', id);
      
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useSchedules] Error deleting schedule:', error);
        const errorMessage = `Failed to delete schedule: ${error.message}`;
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
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
      let errorMessage = 'Failed to delete schedule';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      } else {
        errorMessage = String(err);
      }
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

  // Load schedules when component mounts
  useEffect(() => {
    console.log('[useSchedules] Component mounted, loading schedules');
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