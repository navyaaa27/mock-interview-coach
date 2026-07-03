import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useProgressData(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    async function fetchAll() {
      setLoading(true);
      try {
        // 1. All completed sessions with scores
        const { data: sessions, error: sessionsErr } = await supabase
          .from('sessions')
          .select(`
            id, interview_type, difficulty, job_role,
            created_at, completed_at,
            answers ( id, feedback ( overall_score, clarity_score,
              depth_score, structure_score, filler_word_count,
              words_per_minute, eye_contact_percent, eye_contact_rating ))
          `)
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: true });

        if (sessionsErr) throw sessionsErr;

        // 2. All progress rows (weak/strong areas)
        const { data: progressRows, error: progressErr } = await supabase
          .from('progress')
          .select('weak_areas, strong_areas, recorded_at')
          .eq('user_id', userId)
          .order('recorded_at', { ascending: false })
          .limit(20);

        if (progressErr) throw progressErr;

        // 3. User streak data
        const { data: user, error: userErr } = await supabase
          .from('users')
          .select('current_streak, longest_streak, elevenlabs_chars_used')
          .eq('id', userId)
          .maybeSingle();

        if (userErr) throw userErr;

        // 4. Active Study Plan
        const { data: studyPlanRow } = await supabase
          .from('study_plans')
          .select('id, generated_at, plan_json')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Transform sessions into chart-ready shape
        const sessionChartData = (sessions || []).map((s, i) => {
          const allFeedback = s.answers?.flatMap(a => a.feedback || []) || [];
          const avg = arr => arr.length
            ? Math.round((arr.reduce((sum,v)=>sum+v,0)/arr.length)*10)/10 : 0;
          return {
            session: i + 1,
            date: new Date(s.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short'}),
            overall:   avg(allFeedback.map(f => f.overall_score).filter(Boolean)),
            clarity:   avg(allFeedback.map(f => f.clarity_score).filter(Boolean)),
            depth:     avg(allFeedback.map(f => f.depth_score).filter(Boolean)),
            structure: avg(allFeedback.map(f => f.structure_score).filter(Boolean)),
            pace:      avg(allFeedback.map(f => f.words_per_minute).filter(Boolean)),
            eyeContact:avg(allFeedback.map(f => f.eye_contact_percent).filter(Boolean)),
            fillers:   allFeedback.reduce((sum,f)=>sum+(f.filler_word_count||0),0),
            type:      s.interview_type,
            difficulty:s.difficulty,
            duration:  s.completed_at
              ? Math.round((new Date(s.completed_at)-new Date(s.created_at))/60000) : 0
          };
        });

        // Aggregate weak areas across all sessions
        const weakAreaCounts = {};
        (progressRows || []).forEach(row => {
          (row.weak_areas || []).forEach(area => {
            weakAreaCounts[area] = (weakAreaCounts[area] || 0) + 1;
          });
        });
        const weakAreaData = Object.entries(weakAreaCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a,b) => b.count - a.count)
          .slice(0, 8);

        // Score by interview type
        const byType = {};
        sessionChartData.forEach(s => {
          if (!byType[s.type]) byType[s.type] = [];
          byType[s.type].push(s.overall);
        });
        const typeData = Object.entries(byType).map(([type, scores]) => ({
          type: type ? type.replace('_',' ') : 'Unknown',
          avg: Math.round((scores.reduce((a,b)=>a+b,0)/scores.length)*10)/10,
          sessions: scores.length
        }));

        setData({ 
          sessionChartData, 
          weakAreaData, 
          typeData, 
          progressRows, 
          user, 
          studyPlan: studyPlanRow 
        });
      } catch(e) { 
        console.error("Error fetching progress data:", e);
        setError(e); 
      }
      finally { setLoading(false); }
    }
    fetchAll();
  }, [userId]);

  return { data, loading, error };
}
