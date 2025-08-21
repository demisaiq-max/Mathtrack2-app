import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/auth-context';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: 'normal' | 'high' | 'urgent';
  admin_id: string;
  grade_level: number;
  created_at: string;
  admin_name?: string;
}

export function useAnnouncements(limit?: number) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.gradeLevel) {
      setIsLoading(false);
      return;
    }

    const fetchAnnouncements = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Extract grade number from "Grade X" format
        const gradeNumber = parseInt(user.gradeLevel!.replace('Grade ', ''));
        
        console.log('[useAnnouncements] Fetching announcements for grade:', gradeNumber);
        
        let query = supabase
          .from('announcements')
          .select(`
            id,
            title,
            body,
            priority,
            admin_id,
            grade_level,
            created_at,
            profiles!announcements_admin_id_fkey(full_name)
          `)
          .eq('grade_level', gradeNumber)
          .order('created_at', { ascending: false });
        
        if (limit) {
          query = query.limit(limit);
        }
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) {
          console.error('[useAnnouncements] Fetch error:', fetchError);
          setError(fetchError.message);
          return;
        }
        
        console.log('[useAnnouncements] Raw data:', data);
        
        const processedAnnouncements: Announcement[] = (data || []).map(item => ({
          id: item.id.toString(),
          title: item.title,
          body: item.body,
          priority: item.priority,
          admin_id: item.admin_id,
          grade_level: item.grade_level,
          created_at: item.created_at,
          admin_name: (item.profiles as any)?.full_name || 'Admin',
        }));
        
        console.log('[useAnnouncements] Processed announcements:', processedAnnouncements);
        setAnnouncements(processedAnnouncements);
        
      } catch (err) {
        console.error('[useAnnouncements] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch announcements');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();

    // Set up real-time subscription
    const gradeNumber = parseInt(user.gradeLevel!.replace('Grade ', ''));
    const subscription = supabase
      .channel('announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
          filter: `grade_level=eq.${gradeNumber}`,
        },
        () => {
          console.log('[useAnnouncements] Real-time update detected');
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.gradeLevel, limit]);

  return { announcements, isLoading, error };
}