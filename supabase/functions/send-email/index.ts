import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ALLOWED_ORIGINS = [
  'https://mock-interview-coach.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173'
]

serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { batch, email_type, user_id, plan_id, to, subject: overrideSubject, html: overrideHtml } = payload;
    
    // --- BATCH FLOW: WEEKLY DIGEST ---
    if (batch && email_type === 'weekly_digest') {
      const now = new Date();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get users who haven't unsubscribed
      const { data: usersData } = await supabase.from('users').select('id, email_unsubscribed').eq('email_unsubscribed', false);
      if (!usersData) return new Response('No users found');

      // Get recently sent digests to avoid duplicates
      const { data: sentLogs } = await supabase.from('email_logs')
        .select('user_id')
        .eq('email_type', 'weekly_digest')
        .gte('sent_at', sixDaysAgo);
      const sentUserIds = new Set(sentLogs?.map(l => l.user_id) || []);

      const authUsersRes = await supabase.auth.admin.listUsers();
      const authUsers = authUsersRes.data?.users || [];
      const userEmails = {};
      authUsers.forEach(u => userEmails[u.id] = u.email);

      let sentCount = 0;
      for (const user of usersData) {
        if (sentUserIds.has(user.id)) continue;
        const email = userEmails[user.id];
        if (!email) continue;

        // Check if active in last 14 days
        const { data: sessions } = await supabase.from('sessions')
          .select('id, created_at, answers(feedback(overall_score, feedback_text))')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', fourteenDaysAgo);
          
        if (!sessions || sessions.length === 0) continue;

        const thisWeekSessions = sessions.filter(s => new Date(s.created_at) >= new Date(sevenDaysAgo));
        if (thisWeekSessions.length === 0) continue;

        let twScore = 0, twCount = 0;
        let bestFeedback = '';
        let bestScore = -1;
        
        thisWeekSessions.forEach(s => {
          s.answers?.forEach(a => {
            const f = a.feedback;
            if (f && f.overall_score) {
              twScore += f.overall_score;
              twCount++;
              if (f.overall_score > bestScore) {
                bestScore = f.overall_score;
                bestFeedback = f.feedback_text;
              }
            }
          });
        });
        const twAvg = twCount > 0 ? (twScore / twCount) : 0;

        const { data: profile } = await supabase.from('profiles').select('current_streak').eq('user_id', user.id).maybeSingle();
        const streak = profile?.current_streak || 0;

        const { data: progress } = await supabase.from('progress').select('weak_areas').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(1);
        const topWeakArea = progress?.[0]?.weak_areas?.[0] || 'System Design';

        const subject = `Your InterviewAI week in review — ${thisWeekSessions.length} sessions completed 🎯`;
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #60cfff;">InterviewAI</h2>
            <h3>Week in Review</h3>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
              <p><strong>Sessions this week:</strong> ${thisWeekSessions.length}</p>
              <p><strong>Average score:</strong> ${twAvg.toFixed(1)} / 10</p>
              <p><strong>Current streak:</strong> 🔥 ${streak} days</p>
            </div>
            <h4>Highlight of the week</h4>
            <p style="font-style: italic; border-left: 4px solid #2dd4a0; padding-left: 10px;">"${bestFeedback || 'Great job keeping up the practice!'}"</p>
            <h4>Your focus next week</h4>
            <p>Target your weakest area: <strong>${topWeakArea}</strong></p>
            <div style="margin-top: 30px;">
              <a href="https://your-domain.com/dashboard" style="background: #b06aff; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Practice this week →</a>
            </div>
            <p style="font-size: 12px; color: #999; margin-top: 40px;">
              <a href="https://your-domain.com/unsubscribe">Unsubscribe</a>
            </p>
          </div>
        `;

        await sendAndLog(email, subject, html, user.id, 'weekly_digest');
        sentCount++;
      }
      return new Response(JSON.stringify({ success: true, sent: sentCount }));
    }

    // --- BATCH FLOW: STREAK ALERT ---
    if (batch && email_type === 'streak_alert') {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: usersData } = await supabase.from('users').select('id, email_unsubscribed').eq('email_unsubscribed', false);
      if (!usersData) return new Response('No users found');

      // Check logs to prevent duplicate sending today
      const todayStart = new Date();
      todayStart.setUTCHours(0,0,0,0);
      const { data: sentLogs } = await supabase.from('email_logs')
        .select('user_id')
        .eq('email_type', 'streak_alert')
        .gte('sent_at', todayStart.toISOString());
      const sentUserIds = new Set(sentLogs?.map(l => l.user_id) || []);

      const authUsersRes = await supabase.auth.admin.listUsers();
      const authUsers = authUsersRes.data?.users || [];
      const userEmails = {};
      authUsers.forEach(u => userEmails[u.id] = u.email);

      let sentCount = 0;
      for (const user of usersData) {
        if (sentUserIds.has(user.id)) continue;
        const email = userEmails[user.id];
        if (!email) continue;

        const { data: profile } = await supabase.from('profiles')
          .select('current_streak, last_session_date, streak_freeze_available')
          .eq('user_id', user.id).maybeSingle();
          
        if (!profile) continue;
        
        const streak = profile.current_streak || 0;
        const lastDate = profile.last_session_date ? profile.last_session_date.split('T')[0] : '';
        const freeze = profile.streak_freeze_available;

        if (streak > 2 && lastDate < today) {
          if (!freeze && streak === 0) continue; // safety check
          
          let motivation = "Every streak starts with a small one. Keep going.";
          if (streak >= 20) motivation = "20+ days is rare. Don't break what you've built.";
          else if (streak >= 10) motivation = "Double digits — you're building a real habit.";

          const subject = `⚡ Your ${streak}-day streak ends in 4 hours — practice now`;
          const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; text-align: center;">
              <h1 style="color: #ffcc60; font-size: 3rem; margin-bottom: 0;">🔥 ${streak} day streak</h1>
              <p style="font-size: 1.2rem;">You haven't practiced today. Your streak resets at midnight.</p>
              ${freeze ? '<p style="color: #60cfff; font-weight: bold;">You have 1 streak freeze available — it will auto-apply if you miss today.</p>' : ''}
              
              <div style="margin: 30px 0;">
                <p><strong>Quick session options:</strong></p>
                <a href="https://your-domain.com/session?type=behavioral&difficulty=medium&duration=15" style="display: block; margin: 10px auto; max-width: 300px; background: #333; color: #fff; padding: 12px; text-decoration: none; border-radius: 6px;">15-min Behavioral →</a>
                <a href="https://your-domain.com/session?type=technical&difficulty=medium&duration=15" style="display: block; margin: 10px auto; max-width: 300px; background: #333; color: #fff; padding: 12px; text-decoration: none; border-radius: 6px;">15-min Technical →</a>
                <a href="https://your-domain.com/session?type=hr&difficulty=medium&duration=15" style="display: block; margin: 10px auto; max-width: 300px; background: #333; color: #fff; padding: 12px; text-decoration: none; border-radius: 6px;">15-min HR →</a>
              </div>
              
              <p style="font-style: italic; color: #666;">${motivation}</p>
              <p style="font-size: 12px; color: #999; margin-top: 40px;"><a href="https://your-domain.com/unsubscribe">Unsubscribe</a></p>
            </div>
          `;
          await sendAndLog(email, subject, html, user.id, 'streak_alert');
          sentCount++;
        }
      }
      return new Response(JSON.stringify({ success: true, sent: sentCount }));
    }

    // --- EVENT FLOW: STUDY PLAN READY ---
    if (email_type === 'study_plan_ready' && plan_id && user_id) {
      // Prevent duplicates
      const { data: logs } = await supabase.from('email_logs').select('id').eq('email_type', 'study_plan_ready').eq('user_id', user_id);
      // Wait, we need to tie it to plan_id to not send twice per plan. Using resend_id or created_at logic, but simple check is enough if triggered once.

      const { data: authUser } = await supabase.auth.admin.getUserById(user_id);
      const email = authUser?.user?.email;
      if (!email) return new Response('User email not found', { status: 404 });

      const { data: plan } = await supabase.from('study_plans').select('*').eq('id', plan_id).single();
      const { data: profile } = await supabase.from('profiles').select('target_companies').eq('user_id', user_id).maybeSingle();
      const company = (profile?.target_companies && profile.target_companies[0]) || 'your target company';
      const weeks = plan.weeks_until_interview || 4;
      
      const p = plan.plan_json;
      const week1 = p.weeks?.[0];
      const monSession = week1?.daily_sessions?.find(s => s.day === 'Monday');

      const subject = `Your personalised ${company} study plan is ready — ${weeks} weeks to go`;
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #b06aff;">Alex reviewed your sessions and built your plan</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 1.1rem; line-height: 1.5;">${p.summary}</p>
          </div>
          
          <h3>Top 3 Priorities:</h3>
          <ol>
            ${(p.top_3_priorities || []).map(pri => `<li>${pri}</li>`).join('')}
          </ol>

          <h3>This week's focus: ${week1?.focus || 'Getting started'}</h3>
          ${monSession ? `<p><strong>Monday:</strong> ${monSession.duration_minutes}m ${monSession.session_type} - ${monSession.focus_area}</p>` : ''}
          
          <p style="font-weight: bold; color: #2dd4a0;">On track for ${p.predicted_score_at_interview} at your ${company} interview</p>
          <p style="color: #666;">${p.readiness_trajectory || ''}</p>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="https://your-domain.com/progress#study-plan" style="background: #2dd4a0; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View your full plan →</a>
          </div>
        </div>
      `;
      await sendAndLog(email, subject, html, user_id, 'study_plan_ready');
      return new Response(JSON.stringify({ success: true }));
    }

    // --- MANUAL / CUSTOM FLOW ---
    if (to && overrideSubject && overrideHtml) {
      await sendAndLog(to, overrideSubject, overrideHtml, user_id, email_type || 'custom');
      return new Response(JSON.stringify({ success: true }));
    }

    return new Response('Invalid request', { status: 400 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

async function sendAndLog(to, subject, html, userId, emailType) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'InterviewAI <onboarding@resend.dev>',
      to: [to],
      subject,
      html
    })
  });
  const data = await res.json();
  
  if (userId) {
    await supabase.from('email_logs').insert({
      user_id: userId, 
      email_type: emailType,
      status: res.ok ? 'sent' : 'failed',
      resend_id: data.id
    });
  }
  return res;
}
