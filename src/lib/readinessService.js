import { supabase } from './supabase';

export async function recalculateReadiness(userId, saveToDb = true) {
  try {
    // 1. Fetch user streak from profiles table
    const { data: user, error: userErr } = await supabase
      .from('profiles')
      .select('current_streak')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (userErr) console.warn('Could not fetch streak:', userErr.message);

    // 2. Fetch last 20 completed sessions (with generation_status for null-safety)
    const { data: sessions, error: sessionErr } = await supabase
      .from('sessions')
      .select(`
        id, 
        interview_type, 
        difficulty, 
        created_at,
        answers ( feedback ( overall_score, words_per_minute, eye_contact_percent, generation_status ) )
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(20);

    if (sessionErr) throw sessionErr;

    if (!sessions || sessions.length === 0) {
      await supabase.from('users').update({ readiness_score: 0, readiness_updated_at: new Date().toISOString() }).eq('id', userId);
      return { score: 0, signals: [] };
    }

    // Process session scores
    const sessionScores = sessions.map(s => {
      const fbList = s.answers?.flatMap(a => a.feedback || []) || [];
      let totalScore = 0, paceCount = 0, eyeSum = 0, eyeCount = 0, scoredAnswers = 0;
      
      fbList.forEach(fb => {
        if (fb.overall_score) { totalScore += fb.overall_score; scoredAnswers++; }
        if (fb.words_per_minute >= 130 && fb.words_per_minute <= 170) paceCount++;
        if (fb.eye_contact_percent) { eyeSum += fb.eye_contact_percent; eyeCount++; }
      });

      return {
        type: s.interview_type,
        difficulty: s.difficulty,
        avg_score: scoredAnswers > 0 ? (totalScore / scoredAnswers) : 0,
        pace_normal_ratio: fbList.length > 0 ? (paceCount / fbList.length) : 0,
        avg_eye: eyeCount > 0 ? (eyeSum / eyeCount) : 0
      };
    });

    const last10 = sessionScores.slice(0, 10);
    const last3 = sessionScores.slice(0, 3);
    const prev3 = sessionScores.slice(3, 6);

    const signals = [];

    // SIGNAL 1: Average overall score (30%)
    let s1Raw = 0;
    if (last10.length > 0) {
      s1Raw = last10.reduce((acc, s) => acc + s.avg_score, 0) / last10.length;
    }
    const s1Norm = (s1Raw / 10) * 100;
    const s1Contrib = s1Norm * 0.30;
    signals.push({ name: 'Score Average', value: `${s1Raw.toFixed(1)} avg`, weight: '30%', contribution: s1Contrib, max: 30 });

    // SIGNAL 2: Interview type coverage (20%)
    const distinctTypes = new Set(sessionScores.map(s => s.type));
    const s2Score = (distinctTypes.size / 4) * 100;
    const s2Contrib = s2Score * 0.20;
    signals.push({ name: 'Type Coverage', value: `${distinctTypes.size}/4 types`, weight: '20%', contribution: s2Contrib, max: 20 });

    // SIGNAL 3: Score trend direction (15%)
    let trendScore = 50; // flat default
    if (last3.length > 0 && prev3.length > 0) {
      const avgLast3 = last3.reduce((acc, s) => acc + s.avg_score, 0) / last3.length;
      const avgPrev3 = prev3.reduce((acc, s) => acc + s.avg_score, 0) / prev3.length;
      const delta = avgLast3 - avgPrev3;
      if (delta > 0.5) trendScore = 80;
      else if (delta < -0.5) trendScore = 20;
    }
    const s3Contrib = trendScore * 0.15;
    const trendLabel = trendScore === 80 ? 'Improving' : (trendScore === 20 ? 'Declining' : 'Flat');
    signals.push({ name: 'Score Trend', value: trendLabel, weight: '15%', contribution: s3Contrib, max: 15 });

    // SIGNAL 4: Delivery quality (15%)
    let paceAvg = 0, eyeAvg = 0;
    if (last10.length > 0) {
      paceAvg = last10.reduce((acc, s) => acc + s.pace_normal_ratio, 0) / last10.length * 100;
      eyeAvg = last10.reduce((acc, s) => acc + s.avg_eye, 0) / last10.length;
    }
    const deliveryScore = (paceAvg + eyeAvg) / 2;
    const s4Contrib = deliveryScore * 0.15;
    signals.push({ name: 'Delivery Quality', value: `${Math.round(deliveryScore)}/100`, weight: '15%', contribution: s4Contrib, max: 15 });

    // SIGNAL 5: Consistency / streak (10%)
    const streak = user?.current_streak || 0;
    const streakScore = Math.min(streak * 10, 100);
    const s5Contrib = streakScore * 0.10;
    signals.push({ name: 'Consistency', value: `${streak} day streak`, weight: '10%', contribution: s5Contrib, max: 10 });

    // SIGNAL 6: Hard difficulty performance (10%)
    const hardSessions = sessionScores.filter(s => s.difficulty === 'hard');
    let hardScore = 0;
    if (hardSessions.length > 0) {
      const hardAvg = hardSessions.reduce((acc, s) => acc + s.avg_score, 0) / hardSessions.length;
      hardScore = (hardAvg / 10) * 100;
    }
    const s6Contrib = hardScore * 0.10;
    signals.push({ name: 'Hard Questions', value: hardSessions.length > 0 ? 'Practiced' : 'None', weight: '10%', contribution: s6Contrib, max: 10 });

    // Final Score
    const totalScoreRaw = s1Contrib + s2Contrib + s3Contrib + s4Contrib + s5Contrib + s6Contrib;
    let finalScore = Math.round(totalScoreRaw);
    if (finalScore < 0) finalScore = 0;
    if (finalScore > 100) finalScore = 100;

    // P5.06: Gap Analysis Calculation
    let gapAnalysis = null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('target_companies')
      .eq('user_id', userId)
      .maybeSingle();

    const targetCompany = (profile?.target_companies && profile.target_companies.length > 0) 
      ? profile.target_companies[0] 
      : 'Startup';

    const { data: companyData } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('company_name', targetCompany)
      .maybeSingle();

    let companySettings = companyData;
    if (!companySettings) {
      const { data: startupData } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('company_name', 'Startup')
        .maybeSingle();
      companySettings = startupData;
    }

    if (companySettings) {
      const technicalSessions = sessionScores.filter(s => s.type === 'technical');
      const behavioralSessions = sessionScores.filter(s => s.type === 'behavioral');
      
      const avgTech = technicalSessions.length > 0 
        ? technicalSessions.reduce((acc, s) => acc + s.avg_score, 0) / technicalSessions.length 
        : 0;
      
      const avgBehav = behavioralSessions.length > 0
        ? behavioralSessions.reduce((acc, s) => acc + s.avg_score, 0) / behavioralSessions.length
        : 0;

      const scoreGap = companySettings.readiness_threshold - finalScore;
      
      gapAnalysis = {
        company: companySettings.company_name,
        score_gap: scoreGap,
        technical_gap: Number((companySettings.min_technical_score - avgTech).toFixed(1)),
        behavioral_gap: Number((companySettings.min_behavioral_score - avgBehav).toFixed(1)),
        hard_sessions_gap: companySettings.hard_session_requirement - hardSessions.length,
        estimated_sessions_to_ready: scoreGap > 0 ? Math.ceil(scoreGap / 3.5) : 0,
        threshold: companySettings.readiness_threshold,
        hard_req: companySettings.hard_session_requirement
      };
    }

    // P6.01 FIX 5: Null-safety — check if too many sessions have pending feedback
    const last10ForStaleCheck = sessions.slice(0, 10);
    let pendingCount = 0;
    for (const s of last10ForStaleCheck) {
      const allFb = s.answers?.flatMap(a => a.feedback || []) || [];
      const hasPending = allFb.some(fb => fb.generation_status === 'pending_retry');
      const hasNoRealScore = allFb.length === 0 || allFb.every(fb => !fb.overall_score);
      if (hasPending || hasNoRealScore) pendingCount++;
    }
    const staleFraction = last10ForStaleCheck.length > 0 ? pendingCount / last10ForStaleCheck.length : 0;
    const isStale = staleFraction > 0.5; // >50% sessions have pending/missing feedback

    // Save to DB
    if (saveToDb) {
      if (isStale) {
        // Don't overwrite score — just mark it as stale
        console.warn(`Readiness score stale: ${pendingCount}/${last10ForStaleCheck.length} sessions have pending feedback`);
        await supabase.from('users').update({ 
          readiness_score_stale: true 
        }).eq('id', userId);
      } else {
        await supabase.from('users').update({ 
          readiness_score: finalScore, 
          readiness_updated_at: new Date().toISOString(),
          readiness_score_stale: false,
          gap_analysis_json: gapAnalysis
        }).eq('id', userId);
      }
    }

    return {
      score: finalScore,
      signals: signals,
      gap_analysis: gapAnalysis
    };

  } catch (error) {
    console.error("Failed to recalculate readiness:", error);
    return null;
  }
}
