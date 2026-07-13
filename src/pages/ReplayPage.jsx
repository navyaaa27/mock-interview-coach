import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './ReplayPage.css';

export default function ReplayPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('geminiApiKey');

  useEffect(() => {
    async function loadSession() {
      if (!currentUser || !sessionId) return;
      
      try {
        setLoading(true);
        // Safely fetch session + answers + feedback in one go.
        // This bypasses the RLS bug in the legacy code since the join works securely.
        const { data: sess, error: sessErr } = await supabase
          .from('sessions')
          .select('*, answers(*, feedback(*))')
          .eq('id', sessionId)
          .single();

        if (sessErr) throw sessErr;
        if (!sess) throw new Error("Session not found");
        
        // Let's get the signed URLs for videos if they exist
        const answers = sess.answers || [];
        for (const ans of answers) {
          if (ans.answer_video_url) {
            try {
              const urlObj = new URL(ans.answer_video_url);
              const pathSegments = urlObj.pathname.split('interview-videos/');
              if (pathSegments.length > 1) {
                const filePath = pathSegments[1];
                const { data: newUrlData } = await supabase.storage.from('interview-videos').createSignedUrl(filePath, 604800);
                if (newUrlData && newUrlData.signedUrl) {
                  ans.fresh_video_url = newUrlData.signedUrl;
                }
              }
            } catch (e) {
              console.error("Failed to sign video URL", e);
            }
          }
        }
        
        // Sort answers chronologically
        sess.answers = answers.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setSessionData(sess);
      } catch (err) {
        console.error("Error loading replay", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadSession();
    
    // We can also subscribe to changes in case feedback is still generating
    const channel = supabase.channel('feedback_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'feedback'
      }, () => {
        // If a feedback row is inserted (e.g. Gemini finishes after user ended early), reload
        loadSession();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'feedback'
      }, () => {
        loadSession();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, currentUser]);

  if (loading) {
    return (
      <div className="replay-page">
        <div className="loading-container">
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '48px', color: '#a78bfa' }}></i>
          <h2>Alex is assembling your replay...</h2>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="replay-page">
        <div className="loading-container">
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '48px', color: '#ef4444' }}></i>
          <h2>Could not load replay</h2>
          <p>{error}</p>
          <button className="btn-back" onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  // Calculate aggregates
  let sumO = 0, sumC = 0, sumD = 0, sumS = 0;
  let count = 0;
  
  const allStrengths = [];
  const allImprovements = [];
  let pendingCount = 0;

  sessionData.answers.forEach(a => {
    if (a.feedback && a.feedback.length > 0) {
      const fb = a.feedback[0];
      if (fb.generation_status === 'pending_retry' || fb.generation_status === 'pending') {
        pendingCount++;
      } else {
        sumO += fb.overall_score || 0;
        sumC += fb.clarity_score || 0;
        sumD += fb.depth_score || 0;
        sumS += fb.structure_score || 0;
        count++;
        
        if (fb.overall_score >= 8 && Array.isArray(fb.strengths)) allStrengths.push(...fb.strengths);
        if (fb.overall_score < 6 && Array.isArray(fb.improvements)) allImprovements.push(...fb.improvements);
      }
    } else {
      pendingCount++;
    }
  });

  const avg = (sum, c) => c > 0 ? (sum / c).toFixed(1) : '0.0';

  const retryPendingFeedback = async () => {
    if (isRetrying || pendingCount === 0 || !GEMINI_API_KEY) return;
    setIsRetrying(true);
    try {
      const pendingAnswers = sessionData.answers.filter(a => !a.feedback || a.feedback.length === 0 || a.feedback[0].generation_status === 'pending_retry' || a.feedback[0].generation_status === 'pending');
      
      for (const ans of pendingAnswers) {
        const qText = ans.custom_question_text || 'Tell me about yourself.';
        const aText = ans.answer_text || '(no answer provided)';
        const interviewType = sessionData.interview_type || 'behavioral';
        
        const userMessage = `Question: ${qText}\nAnswer: ${aText}\nInterview type: ${interviewType}\nExperience level: mid\nEvaluate the answer. For company_fit, return an empty object {}.`;
        const systemPrompt = `You are an expert interview coach who has reviewed thousands of interview transcripts. Your job is to analyse a candidate's answer and give structured, honest, specific feedback.

You receive one answer at a time. For each answer you must return a JSON object with exactly these fields — no extra text, no preamble, no markdown:

{
  "overall_score": <number 1-10>,
  "clarity_score": <number 1-10>,
  "depth_score": <number 1-10>,
  "structure_score": <number 1-10>,
  "feedback_text": "<3-5 sentences of specific, actionable feedback. Reference what they actually said. Do not be vague.>",
  "model_answer": "<a concise model answer for this question, 3-6 sentences>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
  "company_fit": {}
}

Scoring rubric:
- overall_score: weighted average of the three sub-scores
- clarity_score: Was the answer easy to follow? Clear structure, no rambling, no filler?
- depth_score: Did they go deep enough? Did they explain WHY, not just WHAT? Did they use specifics?
- structure_score (behavioral only): Did they follow STAR format?

Be honest. A score of 7 means genuinely good. Reserve 9-10 for exceptional answers. Most answers should score 5-7.

CRITICAL: Return ONLY the raw JSON object. No markdown code blocks, no extra text. Just the JSON.`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
            generationConfig: { 
              temperature: 0.3, 
              maxOutputTokens: 2048,
              responseMimeType: "application/json"
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
          const firstBrace = raw.indexOf('{');
          const lastBrace = raw.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            raw = raw.substring(firstBrace, lastBrace + 1);
          }
          
          try {
            const parsed = JSON.parse(raw);
            const safeInt = (val) => (typeof val === 'number' && val >= 1 && val <= 10) ? Math.round(val) : 5;
            
            const payload = {
              overall_score: safeInt(parsed.overall_score),
              clarity_score: safeInt(parsed.clarity_score),
              depth_score: safeInt(parsed.depth_score),
              structure_score: safeInt(parsed.structure_score),
              feedback_text: parsed.feedback_text || 'Feedback generated.',
              model_answer: parsed.model_answer || '',
              company_fit: parsed.company_fit || {},
              generation_status: 'complete'
            };
            
            if (ans.feedback && ans.feedback.length > 0) {
              const { error: updErr } = await supabase.from('feedback').update(payload).eq('id', ans.feedback[0].id);
              if (updErr) alert("DB Update Error: " + updErr.message);
            } else {
              const { error: insErr } = await supabase.from('feedback').insert({ 
                ...payload, 
                answer_id: ans.id,
                user_id: currentUser.id,
                session_id: sessionData.id
              });
              if (insErr) alert("DB Insert Error: " + insErr.message);
            }
          } catch (e) {
            console.error("Parse error", e);
            alert("Failed to parse Gemini response: " + e.message + "\nRaw: " + raw);
          }
        } else {
          const errText = await res.text();
          alert("Gemini API Error: " + res.status + " " + errText);
          if (res.status === 429) {
            break; // Stop spamming if rate limited
          }
        }
      }
    } catch (err) {
      alert("Error regenerating: " + err.message);
    } finally {
      setIsRetrying(false);
      window.location.reload();
    }
  };
  
  const dateStr = new Date(sessionData.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const typeStr = sessionData.interview_type.toUpperCase();
  const diffStr = sessionData.difficulty.toUpperCase();

  return (
    <div className="replay-page">
      <div className="replay-header-row">
        <div>
          <div className="replay-sub">Session Replay & Feedback</div>
          <h1 className="replay-title">Interview Analysis</h1>
        </div>
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          <i className="fa-solid fa-arrow-left" style={{ marginRight: 8 }}></i> Back to Dashboard
        </button>
      </div>
      
      {pendingCount > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className="fa-solid fa-clock"></i>
            Feedback generation timed out for some answers. Click to regenerate.
          </div>
          <button 
            onClick={retryPendingFeedback} 
            disabled={isRetrying || !GEMINI_API_KEY}
            style={{
              background: '#f59e0b', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px',
              fontWeight: 'bold', cursor: isRetrying ? 'not-allowed' : 'pointer', opacity: isRetrying ? 0.7 : 1
            }}
          >
            {isRetrying ? 'Regenerating...' : 'Regenerate Feedback'}
          </button>
        </div>
      )}

      {/* Redesigned Horizontal Score Card */}
      <div className="horizontal-score-card">
        <div className="metric-row">
          <div className="metric-label">Overall Score</div>
          <div className="metric-bar-bg">
            <div className="metric-bar fill-green" style={{ width: `${avg(sumO, count) * 10}%` }}></div>
          </div>
        </div>
        
        <div className="metric-row">
          <div className="metric-label">Eye Contact</div>
          <div className="metric-bar-bg">
            {/* Compute avg eye contact from feedback */}
            <div className="metric-bar fill-purple" style={{ 
              width: `${(() => {
                let sumE = 0, cE = 0;
                sessionData.answers.forEach(a => {
                  if (a.feedback && a.feedback[0] && a.feedback[0].eye_contact_percent) {
                    sumE += a.feedback[0].eye_contact_percent; cE++;
                  }
                });
                return cE > 0 ? (sumE / cE) : 0;
              })()}%` 
            }}></div>
          </div>
        </div>
        
        <div className="metric-row">
          <div className="metric-label">Confidence</div>
          <div className="metric-bar-bg">
            <div className="metric-bar fill-blue" style={{ width: `${avg(sumC, count) * 10}%` }}></div>
          </div>
        </div>
        
        <div className="metric-row">
          <div className="metric-label">Technical Accuracy</div>
          <div className="metric-bar-bg">
            <div className="metric-bar fill-orange" style={{ width: `${avg(sumD, count) * 10}%` }}></div>
          </div>
        </div>

        <div className="phase-tags-row">
          <span className="phase-tag">{typeStr}</span>
          <span className="phase-tag">{diffStr}</span>
          <span className="phase-tag">{dateStr}</span>
        </div>

        {sessionData.difficulty_history && sessionData.difficulty_history.length > 0 && (
          <div className="diff-history">
            <span className="diff-label">Difficulty Progression</span>
            <div className="diff-row">
              {sessionData.difficulty_history.map((diff, idx) => {
                let color = '#4ade80';
                let bg = 'rgba(74, 222, 128, 0.2)';
                if (diff === 'medium') { color = '#4fc3f7'; bg = 'rgba(79, 195, 247, 0.2)'; }
                if (diff === 'hard') { color = '#f59e0b'; bg = 'rgba(245, 158, 11, 0.2)'; }
                
                return (
                  <React.Fragment key={idx}>
                    <span style={{ background: bg, color: color, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', border: `1px solid ${color}44` }}>
                      {diff}
                    </span>
                    {idx < sessionData.difficulty_history.length - 1 && (
                      <i className="fa-solid fa-arrow-right" style={{ color: 'var(--text-secondary)', fontSize: '10px' }}></i>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Strengths / Improvements (Generated dynamically from all answers) */}
      <div className="feedback-grid">
        <div className="fb-card fb-green">
          <h3><i className="fa-solid fa-arrow-trend-up"></i> Key Strengths</h3>
          {allStrengths.length > 0 ? (
            <ul>{Array.from(new Set(allStrengths)).slice(0, 5).map((s, i) => <li key={i}>{s}</li>)}</ul>
          ) : (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: 0, fontStyle: 'italic' }}>Answer more questions with high scores to identify key strengths.</p>
          )}
        </div>
        <div className="fb-card fb-amber">
          <h3><i className="fa-solid fa-screwdriver-wrench"></i> Areas to Improve</h3>
          {allImprovements.length > 0 ? (
            <ul>{Array.from(new Set(allImprovements)).slice(0, 5).map((s, i) => <li key={i}>{s}</li>)}</ul>
          ) : (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: 0, fontStyle: 'italic' }}>No critical areas to improve identified yet.</p>
          )}
        </div>
      </div>

      {/* Question Breakdown */}
      <h2 className="q-breakdown-title">Question Breakdown</h2>
      <div>
        {sessionData.answers.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No questions were answered during this session.</div>
        )}
        
        {sessionData.answers.map((ans, index) => {
          const fb = (ans.feedback && ans.feedback.length > 0) ? ans.feedback[0] : null;
          const isPending = !fb || fb.generation_status === 'pending_retry' || fb.generation_status === 'pending';
          
          return (
            <div key={ans.id} className="q-card">
              <div className="q-header">
                <h3 className="q-title">Question {index + 1}</h3>
                {fb && !isPending && (
                  <div className="q-score">{fb.overall_score}/10</div>
                )}
                {isPending && (
                  <div className="q-score" style={{ color: '#fcd34d', background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' }}>
                    <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '6px' }}></i> Generating
                  </div>
                )}
              </div>
              
              <div className="q-text">"{ans.question_text}"</div>
              
              {ans.fresh_video_url && (
                <video className="q-video" src={ans.fresh_video_url} controls playsInline preload="metadata"></video>
              )}
              
              <div className="q-answer-box">
                <div className="q-answer-title">Your Answer</div>
                <div className="q-answer-text">{ans.answer_text}</div>
              </div>
              
              {fb && fb.words_per_minute && (
                <div className="q-metrics">
                  <div className="q-metric-badge"><i className="fa-solid fa-gauge-high"></i> {fb.words_per_minute} wpm</div>
                  <div className="q-metric-badge"><i className="fa-solid fa-stopwatch"></i> {fb.answer_duration_seconds}s</div>
                  {fb.filler_word_count !== null && (
                    <div className="q-metric-badge"><i className="fa-solid fa-comment-dots"></i> {fb.filler_word_count} fillers</div>
                  )}
                  {fb.eye_contact_percent !== null && fb.eye_contact_percent > 0 && (
                    <div className="q-metric-badge"><i className="fa-solid fa-eye"></i> {fb.eye_contact_percent}% eye contact</div>
                  )}
                </div>
              )}
              
              {fb && !isPending && (
                <div className="q-feedback-box">
                  <div className="q-feedback-title"><i className="fa-solid fa-bolt"></i> AI Feedback</div>
                  <div className="q-feedback-text">{fb.feedback_text}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
