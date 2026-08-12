import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import './ProfilePage.css';

const JOB_ROLES = ['Software Engineer', 'Product Manager', 'Data Scientist', 'Designer', 'DevOps Engineer', 'Other'];
const EXPERIENCE_LEVELS = [
  { value: 'entry',  label: 'Entry Level (0–2 yrs)' },
  { value: 'mid',    label: 'Mid Level (2–5 yrs)' },
  { value: 'senior', label: 'Senior Level (5+ yrs)' },
  { value: 'staff',  label: 'Staff / Principal' },
];
const GOALS = [
  { value: 'Get my first job',     label: 'First Job' },
  { value: 'Switch to a new role', label: 'Switch Role' },
  { value: 'Get promoted',         label: 'Get Promoted' },
  { value: 'Crack FAANG',          label: 'Crack FAANG' },
];

export default function ProfilePage() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState(null);
  const [successMsg,       setSuccessMsg]       = useState('');
  const [fullName,         setFullName]         = useState('');
  const [jobRole,          setJobRole]          = useState('');
  const [experienceLevel,  setExperienceLevel]  = useState('mid');
  const [companies,        setCompanies]        = useState('');
  const [interviewGoal,    setInterviewGoal]    = useState('');
  const [interviewDate,    setInterviewDate]    = useState('');
  const [emailUnsubscribed,setEmailUnsubscribed]= useState(false);
  const [streakStats,      setStreakStats]      = useState({ current: 0, longest: 0, freezeAvailable: false });

  useEffect(() => {
    async function loadProfile() {
      if (!currentUser) return;
      try {
        const [userRes, profileRes] = await Promise.all([
          supabase.from('users').select('full_name, email_unsubscribed').eq('id', currentUser.id).single(),
          supabase.from('profiles').select('*').eq('user_id', currentUser.id).single(),
        ]);
        if (userRes.data) {
          setFullName(userRes.data.full_name || '');
          setEmailUnsubscribed(!!userRes.data.email_unsubscribed);
        }
        if (profileRes.data) {
          const p = profileRes.data;
          setJobRole(p.job_role || '');
          setExperienceLevel(p.experience_level || 'mid');
          setCompanies((p.target_companies || []).join(', '));
          setInterviewGoal(p.interview_goal || '');
          setInterviewDate(p.interview_date || '');
          setStreakStats({ current: p.current_streak || 0, longest: p.longest_streak || 0, freezeAvailable: p.streak_freeze_available || false });
        }
      } catch (err) {
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [currentUser]);

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!companies.trim()) { setError('Please enter at least one target company.'); return; }
    setSaving(true); setError(null); setSuccessMsg('');
    try {
      const { error: userErr } = await supabase.from('users')
        .update({ full_name: fullName.trim(), email_unsubscribed: emailUnsubscribed })
        .eq('id', currentUser.id);
      if (userErr) throw userErr;
      const targetCompanies = companies.split(',').map(c => c.trim()).filter(Boolean);
      const { error: profileErr } = await supabase.from('profiles')
        .update({ job_role: jobRole, experience_level: experienceLevel, target_companies: targetCompanies, interview_goal: interviewGoal, interview_date: interviewDate || null })
        .eq('user_id', currentUser.id);
      if (profileErr) throw profileErr;
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => alert('Please contact support at hello@interview.ai to delete your account.');

  // Countdown
  let countdownText = null, countdownColor = 'var(--text-tertiary)';
  if (interviewDate) {
    const d = new Date(interviewDate + (interviewDate.includes('T') ? '' : 'T00:00:00'));
    if (!isNaN(d.getTime())) {
      const today = new Date(); today.setHours(0,0,0,0);
      const days = Math.ceil((d - today) / 86400000);
      if (days < 0)       { countdownText = 'Interview date passed'; }
      else if (days === 0){ countdownText = 'Interview is today!'; countdownColor = '#2dd4a0'; }
      else if (days <= 3) { countdownText = `⚡ ${days}d left`; countdownColor = '#f87171'; }
      else                { countdownText = `${days} days to go`; countdownColor = '#4fc3f7'; }
    }
  }

  if (loading) return (
    <div className="prof-page">
      <div className="prof-skel-title" />
      <div className="prof-skel-note" />
      <div className="prof-skel-strip" />
      <div className="prof-skel-grid">
        <div className="prof-skel-card" style={{ height: 440 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="prof-skel-card" style={{ height: 140 }} />
          <div className="prof-skel-card" style={{ height: 140 }} />
          <div className="prof-skel-card" style={{ height: 140 }} />
        </div>
      </div>
    </div>
  );

  const displayName = fullName || currentUser?.email?.split('@')[0] || 'User';

  return (
    <div className="prof-page">

      {/* ── Title ──────────────────────────────────────────────────────── */}
      <h1 className="prof-title">Your account.</h1>

      {/* ── Alex's note ────────────────────────────────────────────────── */}
      <div className="prof-alex-note">
        <div className="prof-alex-avatar">A</div>
        <div className="prof-alex-body">
          <div className="prof-alex-label">Alex's Note</div>
          <p className="prof-alex-text">
            Hey <strong>{displayName.split(' ')[0]}</strong>. Keep your target companies updated — that's what tunes the difficulty and coaching
            {interviewDate
              ? `. Interview locked in. ${countdownText ? countdownText + '.' : 'Keep the momentum.'}`
              : `. Set an interview date and I'll make sure you're ready for it.`}
          </p>
        </div>
      </div>

      {/* ── Streak strip ───────────────────────────────────────────────── */}
      <div className="prof-strip">
        <div className="prof-strip-item">
          <div className="prof-strip-value" style={{ color: '#ff7a45' }}>
            {streakStats.current}&nbsp;<span style={{ fontSize: 22 }}>🔥</span>
          </div>
          <div className="prof-strip-label">Current Streak</div>
        </div>
        <div className="prof-strip-divider" />
        <div className="prof-strip-item">
          <div className="prof-strip-value">{streakStats.longest}</div>
          <div className="prof-strip-label">Longest Streak</div>
        </div>
        <div className="prof-strip-divider" />
        <div className="prof-strip-item">
          <div className="prof-strip-value" style={{ color: countdownText ? countdownColor : 'rgba(255,255,255,0.2)', fontSize: interviewDate ? 18 : 34 }}>
            {interviewDate
              ? (countdownText || new Date(interviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
              : '—'}
          </div>
          <div className="prof-strip-label">Interview Date</div>
        </div>
        <div className="prof-strip-divider" />
        <div className="prof-strip-item">
          {streakStats.freezeAvailable
            ? <div className="prof-strip-value" style={{ fontSize: 22 }}>❄️ <span style={{ fontSize: 16, fontWeight: 700, color: '#4fc3f7', verticalAlign: 'middle' }}>Available</span></div>
            : <div className="prof-strip-value" style={{ color: 'rgba(255,255,255,0.2)' }}>—</div>}
          <div className="prof-strip-label">Streak Freeze</div>
        </div>
      </div>

      {/* ── Alerts ─────────────────────────────────────────────────────── */}
      {error      && <div className="prof-alert error"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
      {successMsg && <div className="prof-alert success"><i className="fa-solid fa-circle-check" /> {successMsg}</div>}

      {/* ── Main grid ──────────────────────────────────────────────────── */}
      <div className="prof-grid">

        {/* ── Left: account form ───────────────────────────────────────── */}
        <div className="prof-card">
          <div className="prof-card-title">
            <i className="fa-solid fa-user-pen" style={{ color: '#a78bfa' }} /> Account Information
          </div>
          <form onSubmit={handleSave} className="prof-form">

            <div className="prof-field">
              <label>Email Address</label>
              <div className="prof-input-wrap readonly">
                <i className="fa-regular fa-envelope" />
                <input type="text" value={currentUser?.email || ''} readOnly />
              </div>
            </div>

            <div className="prof-field">
              <label>Full Name</label>
              <div className="prof-input-wrap">
                <i className="fa-regular fa-user" />
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" required />
              </div>
            </div>

            <div className="prof-field">
              <label>Target Job Role</label>
              <div className="prof-select-wrap">
                <select value={jobRole} onChange={e => setJobRole(e.target.value)} required>
                  <option value="" disabled>Select role</option>
                  {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <i className="fa-solid fa-chevron-down prof-select-arrow" />
              </div>
            </div>

            <div className="prof-field">
              <label>Experience Level</label>
              <div className="prof-select-wrap">
                <select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
                  {EXPERIENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <i className="fa-solid fa-chevron-down prof-select-arrow" />
              </div>
            </div>

            <div className="prof-field">
              <label>Target Companies <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(comma-separated)</span></label>
              <div className="prof-input-wrap">
                <i className="fa-regular fa-building" />
                <input type="text" value={companies} onChange={e => setCompanies(e.target.value)} placeholder="Google, Meta, Apple..." required />
              </div>
            </div>

            <div className="prof-field">
              <label>Interview Goal</label>
              <div className="prof-select-wrap">
                <select value={interviewGoal} onChange={e => setInterviewGoal(e.target.value)}>
                  {GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
                <i className="fa-solid fa-chevron-down prof-select-arrow" />
              </div>
            </div>

            <div className="prof-form-actions">
              <button type="submit" className="prof-btn-primary" disabled={saving}>
                {saving ? <><i className="fa-solid fa-circle-notch fa-spin" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Right: side cards ────────────────────────────────────────── */}
        <div className="prof-side-col">

          {/* Interview Date */}
          <div className="prof-card">
            <div className="prof-card-title">
              <i className="fa-regular fa-calendar" style={{ color: '#4fc3f7' }} /> Interview Date
            </div>
            <div className="prof-field" style={{ marginBottom: 0 }}>
              <label>When is your upcoming interview?</label>
              <div className="prof-input-wrap">
                <input type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} />
              </div>
              {countdownText && (
                <div className="prof-countdown" style={{ color: countdownColor }}>
                  {countdownText}
                </div>
              )}
              <button className="prof-btn-secondary" style={{ marginTop: 12, width: '100%' }} onClick={handleSave} disabled={saving}>
                Update Date
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="prof-card">
            <div className="prof-card-title">
              <i className="fa-solid fa-gear" style={{ color: '#94a3b8' }} /> Preferences
            </div>
            <div className="prof-toggle-row">
              <div>
                <div className="prof-toggle-label">Weekly Progress Emails</div>
                <div className="prof-toggle-desc">Progress digest and streak reminders</div>
              </div>
              <label className="prof-switch">
                <input type="checkbox" checked={!emailUnsubscribed} onChange={e => setEmailUnsubscribed(!e.target.checked)} />
                <span className="prof-slider" />
              </label>
            </div>
          </div>

          {/* Danger zone */}
          <div className="prof-card">
            <div className="prof-card-title">
              <i className="fa-solid fa-right-from-bracket" style={{ color: '#94a3b8' }} /> Account Actions
            </div>
            <button className="prof-btn-secondary" style={{ width: '100%', marginBottom: 12 }} onClick={signOut}>
              <i className="fa-solid fa-arrow-right-from-bracket" /> Sign Out
            </button>
            <button className="prof-btn-danger" style={{ width: '100%' }} onClick={handleDeleteAccount}>
              Delete Account
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
