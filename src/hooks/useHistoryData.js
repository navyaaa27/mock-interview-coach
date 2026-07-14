import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Shared hook: fetches all completed sessions for a user with full feedback data.
 * Used by both HistoryPage and DashboardPage to avoid duplicating the Supabase query.
 */
export function useHistoryData(userId) {
  const [sessions, setSessions] = useState([]);
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const [sessionsRes, profileRes] = await Promise.all([
        supabase.from('sessions')
          .select('*, answers(id, feedback(overall_score, clarity_score, depth_score, structure_score))')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false }),
        supabase.from('profiles')
          .select('current_streak, longest_streak')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      if (sessionsRes.error) throw sessionsRes.error;

      const processed = (sessionsRes.data || []).map(s => {
        let durationMin = 0;
        if (s.created_at && s.completed_at) {
          durationMin = Math.round((new Date(s.completed_at) - new Date(s.created_at)) / 60000);
        }

        let totalOverall = 0, totalClarity = 0, totalDepth = 0, totalStructure = 0, count = 0;
        (s.answers || []).forEach(a => {
          (a.feedback || []).forEach(fb => {
            totalOverall   += fb.overall_score   || 0;
            totalClarity   += fb.clarity_score   || 0;
            totalDepth     += fb.depth_score     || 0;
            totalStructure += fb.structure_score  || 0;
            count++;
          });
        });

        return {
          ...s,
          durationMin,
          durationStr: durationMin > 0 ? `${durationMin} min` : 'Unknown',
          avgOverall:   count > 0 ? totalOverall   / count : 0,
          avgClarity:   count > 0 ? totalClarity   / count : 0,
          avgDepth:     count > 0 ? totalDepth     / count : 0,
          avgStructure: count > 0 ? totalStructure / count : 0,
        };
      });

      setSessions(processed);
      setProfile(profileRes.data || {});
    } catch (err) {
      console.error('useHistoryData error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { sessions, profile, loading, error, refetch };
}
