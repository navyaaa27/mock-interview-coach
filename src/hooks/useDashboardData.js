import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

function getSmartSuggestion(recentSessions) {
  if (!recentSessions || recentSessions.length === 0) {
    return {
      icon: '💬',
      text: "Start with a behavioral round — it's the first thing almost every interviewer opens with, at any company. Twenty-five minutes, five questions, and you'll already know more about where you stand than a number can tell you.",
      type: 'behavioral',
      difficulty: 'medium',
    };
  }

  const typeScores = {};
  recentSessions.forEach(session => {
    const type = session.interview_type;
    if (!typeScores[type]) typeScores[type] = { total: 0, count: 0 };
    if (session.answers) {
      session.answers.forEach(a => {
        if (a.feedback) {
          a.feedback.forEach(fb => {
            if (fb.overall_score) {
              typeScores[type].total += fb.overall_score;
              typeScores[type].count++;
            }
          });
        }
      });
    }
  });

  let weakestType = 'behavioral';
  let lowestAvg = Infinity;
  for (const [type, data] of Object.entries(typeScores)) {
    if (data.count > 0) {
      const avg = data.total / data.count;
      if (avg < lowestAvg) { lowestAvg = avg; weakestType = type; }
    }
  }

  const weakAreas = {};
  recentSessions.forEach(session => {
    if (session.answers) {
      session.answers.forEach(a => {
        if (a.feedback) {
          a.feedback.forEach(fb => {
            if (fb.improvements) {
              fb.improvements.forEach(imp => { weakAreas[imp] = (weakAreas[imp] || 0) + 1; });
            }
          });
        }
      });
    }
  });

  let mostCommonWeak = null;
  let maxCount = 0;
  for (const [area, count] of Object.entries(weakAreas)) {
    if (count > maxCount) { maxCount = count; mostCommonWeak = area; }
  }

  const typeLabels = { behavioral: 'Behavioral', technical: 'Technical', system_design: 'System Design', hr: 'HR' };
  const typeIcons = { behavioral: '💬', technical: '💻', system_design: '🏗️', hr: '🤝' };

  let suggestionText = '';
  if (lowestAvg < 6) {
    suggestionText = mostCommonWeak
      ? `'${mostCommonWeak}' has come up in your last few sessions. It's not a coincidence at this point — let's deal with it directly. A focused ${typeLabels[weakestType]} session today.`
      : `Your last few ${typeLabels[weakestType]} answers landed around ${lowestAvg.toFixed(1)} — not bad, but you were rushing the structure. One focused session today would fix most of it.`;
  } else {
    suggestionText = mostCommonWeak
      ? `'${mostCommonWeak}' keeps appearing in your feedback. You're scoring well overall, but this is the thing holding you back from the next tier.`
      : `You're doing well. Push your ${typeLabels[weakestType]} to the next level with a Hard session — that's where the real gap is now.`;
  }

  return {
    icon: typeIcons[weakestType] || '💡',
    text: suggestionText,
    type: weakestType,
    difficulty: lowestAvg < 6 ? 'medium' : 'hard',
  };
}

export function useDashboardData(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      // Parallel fetch: user record + profile + completed sessions
      const [userRes, profileRes, sessionsRes, recentRes] = await Promise.all([
        supabase.from('users').select('readiness_score, readiness_updated_at').eq('id', userId).maybeSingle(),
        supabase.from('profiles').select('job_role, experience_level, interview_goal, target_companies, current_streak, longest_streak, streak_freeze_available, last_session_date, interview_date').eq('user_id', userId).maybeSingle(),
        supabase.from('sessions')
          .select('id, interview_type, difficulty, job_role, created_at, completed_at, answers(id, feedback(overall_score, clarity_score, depth_score, structure_score))')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false }),
        supabase.from('sessions')
          .select('id, interview_type, answers(feedback(overall_score))')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      const userRecord = userRes.data;
      const profile = profileRes.data || {};
      const allSessions = sessionsRes.data || [];
      const recentSessions = recentRes.data || [];

      // Compute stats
      let totalOverall = 0, totalFeedbackCount = 0, bestScore = 0, totalMinutes = 0;
      allSessions.forEach(s => {
        if (s.created_at && s.completed_at) {
          totalMinutes += Math.round((new Date(s.completed_at) - new Date(s.created_at)) / 60000);
        }
        if (s.answers) {
          s.answers.forEach(a => {
            if (a.feedback) {
              a.feedback.forEach(fb => {
                if (fb.overall_score) {
                  totalOverall += fb.overall_score;
                  totalFeedbackCount++;
                  if (fb.overall_score > bestScore) bestScore = fb.overall_score;
                }
              });
            }
          });
        }
      });

      const avgScore = totalFeedbackCount > 0 ? totalOverall / totalFeedbackCount : 0;
      const hoursStr = totalMinutes >= 60 ? `${(totalMinutes / 60).toFixed(1)}` : `${totalMinutes}m`;

      // Score trend data (last 10 sessions, chronological)
      const trendData = allSessions.map(s => {
        let total = 0, count = 0;
        if (s.answers) {
          s.answers.forEach(a => {
            if (a.feedback) a.feedback.forEach(fb => {
              if (fb.overall_score) { total += fb.overall_score; count++; }
            });
          });
        }
        return { date: s.created_at, avg: count > 0 ? total / count : 0 };
      }).reverse().slice(-10);

      // Last session
      const lastSession = allSessions[0] || null;
      let lastSessionStats = null;
      if (lastSession) {
        let lsTotal = 0, lsCount = 0, lsImprovements = [];
        if (lastSession.answers) {
          lastSession.answers.forEach(a => {
            if (a.feedback) {
              a.feedback.forEach(fb => {
                if (fb.overall_score) { lsTotal += fb.overall_score; lsCount++; }
                if (fb.improvements) lsImprovements.push(...fb.improvements);
              });
            }
          });
        }
        lastSessionStats = {
          session: lastSession,
          avg: lsCount > 0 ? lsTotal / lsCount : 0,
          improvements: [...new Set(lsImprovements)].slice(0, 2),
        };
      }

      // Smart suggestion
      const suggestion = getSmartSuggestion(recentSessions);

      setData({
        readinessScore: userRecord?.readiness_score || 0,
        profile,
        sessionCount: allSessions.length,
        avgScore,
        bestScore,
        hoursStr,
        trendData,
        lastSessionStats,
        suggestion,
      });
    } catch (err) {
      console.error('useDashboardData error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}
