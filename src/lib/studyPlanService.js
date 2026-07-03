import { supabase } from './supabase';

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

export async function generateStudyPlan(userId) {
  // 1. Rate Limiting Check
  // A user can only regenerate their study plan once per 24 hours.
  const { data: existingPlan, error: existingErr } = await supabase
    .from('study_plans')
    .select('id, generated_at, plan_json')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('generated_at', { ascending: false })
    .maybeSingle();

  if (existingErr) throw new Error("Failed to fetch existing study plan: " + existingErr.message);

  if (existingPlan) {
    const generatedAt = new Date(existingPlan.generated_at);
    const hoursSince = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      return {
        success: false,
        message: `Plan generated ${Math.round(hoursSince)} hours ago. Next regeneration available in ${Math.round(24 - hoursSince)} hours.`,
        plan: existingPlan.plan_json
      };
    }
  }

  // 2. Data Aggregation
  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('job_role, experience_level, target_companies, interview_date')
    .eq('user_id', userId)
    .maybeSingle();

  // Fetch user streak
  const { data: user } = await supabase
    .from('users')
    .select('current_streak')
    .eq('id', userId)
    .maybeSingle();

  // Fetch all completed sessions with feedback
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, interview_type,
      answers ( feedback ( overall_score, words_per_minute, eye_contact_percent ) )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed');

  // Fetch progress to get weak areas
  const { data: progressRows } = await supabase
    .from('progress')
    .select('weak_areas')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(10);

  // Aggregate stats
  let totalScore = 0, totalCount = 0;
  const byType = { behavioral: { s: 0, c: 0 }, technical: { s: 0, c: 0 }, system_design: { s: 0, c: 0 }, hr: { s: 0, c: 0 } };
  const deliveryStats = { paceSum: 0, eyeSum: 0, count: 0 };

  (sessions || []).forEach(s => {
    const feedbacks = s.answers?.flatMap(a => a.feedback || []) || [];
    feedbacks.forEach(f => {
      if (f.overall_score) {
        totalScore += f.overall_score;
        totalCount++;
        if (byType[s.interview_type]) {
          byType[s.interview_type].s += f.overall_score;
          byType[s.interview_type].c++;
        }
      }
      if (f.words_per_minute) deliveryStats.paceSum += f.words_per_minute;
      if (f.eye_contact_percent) deliveryStats.eyeSum += f.eye_contact_percent;
      if (f.words_per_minute || f.eye_contact_percent) deliveryStats.count++;
    });
  });

  const avg = (sum, count) => count > 0 ? (Math.round((sum / count) * 10) / 10) : 0;
  
  const avg_overall = avg(totalScore, totalCount);
  const avg_behavioral = avg(byType.behavioral.s, byType.behavioral.c);
  const avg_technical = avg(byType.technical.s, byType.technical.c);
  const avg_system_design = avg(byType.system_design.s, byType.system_design.c);
  const avg_hr = avg(byType.hr.s, byType.hr.c);

  const avg_pace = avg(deliveryStats.paceSum, deliveryStats.count);
  const avg_eye = avg(deliveryStats.eyeSum, deliveryStats.count);
  const delivery_issues = [];
  if (avg_pace > 0 && avg_pace < 130) delivery_issues.push("Speaking pace is too slow");
  if (avg_pace > 170) delivery_issues.push("Speaking pace is too fast");
  if (avg_eye > 0 && avg_eye < 60) delivery_issues.push("Low eye contact");

  const weakAreaCounts = {};
  (progressRows || []).forEach(r => {
    (r.weak_areas || []).forEach(w => {
      weakAreaCounts[w] = (weakAreaCounts[w] || 0) + 1;
    });
  });
  const weak_areas_list = Object.entries(weakAreaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(x => x[0])
    .join(', ');

  let weeks_until_interview = 4;
  if (profile?.interview_date) {
    const diffTime = Math.abs(new Date(profile.interview_date) - new Date());
    weeks_until_interview = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  }

  // 3. Claude API Call
  if (!CLAUDE_API_KEY) {
    throw new Error("Missing VITE_CLAUDE_API_KEY in environment variables.");
  }

  const systemPrompt = "You are an expert interview coach who creates personalised, realistic study plans. You analyse a candidate's actual performance data and build a week-by-week practice schedule that targets their specific weaknesses. You always return valid JSON only — no markdown, no preamble, no explanation outside the JSON.";

  const userPrompt = `Generate a personalised interview study plan for this candidate.

Candidate profile:
- Name: User
- Target role: ${profile?.job_role || 'General'}
- Experience level: ${profile?.experience_level || 'mid'}
- Target company: ${(profile?.target_companies || []).join(', ') || 'Various'}
- Interview date: ${profile?.interview_date || 'Not set'} (${weeks_until_interview} weeks away)

Performance summary (last 10 sessions):
- Average overall score: ${avg_overall || 'N/A'}
- Behavioral avg: ${avg_behavioral || 'N/A'}
- Technical avg: ${avg_technical || 'N/A'}
- System design avg: ${avg_system_design || 'N/A'}
- HR avg: ${avg_hr || 'N/A'}
- Most flagged weak areas: ${weak_areas_list || 'None'}
- Delivery issues: ${delivery_issues.join(', ') || 'None'}
- Current streak: ${user?.current_streak || 0} days

Return a JSON object with exactly this structure:
{
  "summary": "<2 sentences — honest assessment of where they are and what they need most>",
  "readiness_trajectory": "<string>",
  "weeks": [
    {
      "week_number": 1,
      "focus": "<string>",
      "daily_sessions": [
        {
          "day": "Monday",
          "session_type": "behavioral",
          "difficulty": "medium",
          "duration_minutes": 25,
          "focus_area": "<string>",
          "why": "<string>"
        }
      ],
      "weekly_goal": "<string>",
      "resources": ["<string>", "<string>"]
    }
  ],
  "total_sessions_planned": 5,
  "predicted_score_at_interview": 8.5,
  "top_3_priorities": ["<string>", "<string>", "<string>"]
}`;

  console.log("Calling Claude API...");
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errText}`);
  }

  const claudeData = await response.json();
  const rawContent = claudeData.content[0].text;
  
  // 4. Parse & Save
  let parsedPlan;
  try {
    // Strip markdown fences if Claude ignored instructions
    let cleanJson = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
    parsedPlan = JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse Claude output as JSON. Raw output:", rawContent);
    throw new Error("Failed to parse study plan from AI. " + e.message);
  }

  // Set old active plans to false
  await supabase
    .from('study_plans')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true);

  // Insert new plan
  const { data: newPlan, error: insertErr } = await supabase
    .from('study_plans')
    .insert({
      user_id: userId,
      generated_at: new Date().toISOString(),
      interview_date: profile?.interview_date || null,
      weeks_until_interview,
      plan_json: parsedPlan,
      is_active: true
    })
    .select('plan_json')
    .single();

  if (insertErr) throw new Error("Failed to save study plan to database: " + insertErr.message);

  return {
    success: true,
    message: "New study plan generated successfully.",
    plan: newPlan.plan_json
  };
}
