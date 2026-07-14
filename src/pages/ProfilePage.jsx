import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import './ProfilePage.css';

const JOB_ROLES = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'Designer',
  'DevOps Engineer',
  'Other',
];

const EXPERIENCE_LEVELS = [
  { value: 'entry',  label: 'Entry Level (0-2 yrs)' },
  { value: 'mid',    label: 'Mid Level (2-5 yrs)' },
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [fullName, setFullName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('mid');
  const [companies, setCompanies] = useState('');
  const [interviewGoal, setInterviewGoal] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [emailUnsubscribed, setEmailUnsubscribed] = useState(false);

  // Read-only stats
  const [streakStats, setStreakStats] = useState({
    current: 0,
    longest: 0,
    freezeAvailable: false
  });

  useEffect(() => {
    async function loadProfile() {
      if (!currentUser) return;
      try {
        const [userRes, profileRes] = await Promise.all([
          supabase.from('users').select('full_name, email_unsubscribed').eq('id', currentUser.id).single(),
          supabase.from('profiles').select('*').eq('user_id', currentUser.id).single()
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
          setStreakStats({
            current: p.current_streak || 0,
            longest: p.longest_streak || 0,
            freezeAvailable: p.streak_freeze_available || false
          });
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!companies.trim()) { setError('Please enter at least one target company.'); return; }
    
    setSaving(true);
    setError(null);
    setSuccessMsg('');

    try {
      // 1. Update users table (full_name, email_unsubscribed)
      const { error: userErr } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          email_unsubscribed: emailUnsubscribed
        })
        .eq('id', currentUser.id);
        
      if (userErr) throw userErr;

      // 2. Update profiles table
      const targetCompanies = companies.split(',').map(c => c.trim()).filter(Boolean);
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          job_role: jobRole,
          experience_level: experienceLevel,
          target_companies: targetCompanies,
          interview_goal: interviewGoal,
          interview_date: interviewDate || null
        })
        .eq('user_id', currentUser.id);

      if (profileErr) throw profileErr;

      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    // Stub per requirements
    alert("Please contact support at hello@interview.ai to delete your account.");
  };

  // Compute countdown
  let countdownText = null;
  let countdownColor = 'var(--text-tertiary)';
  if (interviewDate) {
    const d = new Date(interviewDate);
    if (!isNaN(d.getTime())) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const diffMs = d - today;
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (days < 0)       { countdownText = 'Interview date passed'; }
      else if (days === 0){ countdownText = 'Interview is today!'; countdownColor = '#2dd4a0'; }
      else if (days <= 3) { countdownText = `⚡ ${days}d left`; countdownColor = '#f87171'; }
      else                { countdownText = `${days} days to interview`; countdownColor = 'var(--accent-blue)'; }
    }
  }

  if (loading) {
    return (
      <div className="prof-page">
        <div className="prof-skeleton" />
      </div>
    );
  }

  return (
    <div className="prof-page">
      <div className="prof-header">
        <h1 className="prof-heading">Profile Settings</h1>
        <p className="prof-subheading">Manage your account and interview preferences.</p>
      </div>

      {error && <div className="prof-alert error"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
      {successMsg && <div className="prof-alert success"><i className="fa-solid fa-circle-check" /> {successMsg}</div>}

      <div className="prof-grid">
        {/* Left Column: Form */}
        <div className="prof-card">
          <div className="prof-card-title"><i className="fa-solid fa-user-pen" style={{color: '#a78bfa'}}/> Account Information</div>
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
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
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
                  {EXPERIENCE_LEVELS.map(lvl => <option key={lvl.value} value={lvl.value}>{lvl.label}</option>)}
                </select>
                <i className="fa-solid fa-chevron-down prof-select-arrow" />
              </div>
            </div>

            <div className="prof-field">
              <label>Target Companies (comma-separated)</label>
              <div className="prof-input-wrap">
                <i className="fa-regular fa-building" />
                <input type="text" value={companies} onChange={e => setCompanies(e.target.value)} placeholder="Google, Meta..." required />
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

        {/* Right Column: Cards */}
        <div className="prof-side-col">
          
          {/* Interview Date */}
          <div className="prof-card">
            <div className="prof-card-title"><i className="fa-regular fa-calendar" style={{color: '#4fc3f7'}}/> Interview Date</div>
            <div className="prof-field" style={{marginBottom: 0}}>
              <label>When is your upcoming interview?</label>
              <div className="prof-input-wrap">
                <input 
                  type="date" 
                  value={interviewDate} 
                  onChange={e => setInterviewDate(e.target.value)} 
                />
              </div>
              {countdownText && (
                <div className="prof-countdown" style={{ color: countdownColor, marginTop: '8px', fontSize: '13px', fontWeight: 600 }}>
                  {countdownText}
                </div>
              )}
              <button 
                className="prof-btn-secondary" 
                style={{marginTop: '12px', width: '100%'}} 
                onClick={handleSave} 
                disabled={saving}
              >
                Update Date
              </button>
            </div>
          </div>

          {/* Streak Status */}
          <div className="prof-card">
            <div className="prof-card-title"><i className="fa-solid fa-fire" style={{color: '#f59e0b'}}/> Streak Status</div>
            <div className="prof-stats-row">
              <div className="prof-stat">
                <div className="prof-stat-val">{streakStats.current}</div>
                <div className="prof-stat-label">Current Streak</div>
              </div>
              <div className="prof-stat">
                <div className="prof-stat-val">{streakStats.longest}</div>
                <div className="prof-stat-label">Longest Streak</div>
              </div>
            </div>
            {streakStats.freezeAvailable && (
              <div className="prof-freeze-badge">
                <i className="fa-regular fa-snowflake" /> Streak freeze available
              </div>
            )}
          </div>

          {/* Preferences & Actions */}
          <div className="prof-card">
            <div className="prof-card-title"><i className="fa-solid fa-gear" style={{color: '#94a3b8'}}/> Preferences & Account</div>
            
            <div className="prof-toggle-row">
              <div>
                <div className="prof-toggle-label">Weekly Progress Emails</div>
                <div className="prof-toggle-desc">Receive progress digest and streak reminders</div>
              </div>
              <label className="prof-switch">
                <input 
                  type="checkbox" 
                  checked={!emailUnsubscribed} 
                  onChange={e => setEmailUnsubscribed(!e.target.checked)} 
                />
                <span className="prof-slider"></span>
              </label>
            </div>
            
            <div className="prof-actions-divider" />
            
            <button className="prof-btn-secondary" style={{width: '100%', marginBottom: '12px'}} onClick={signOut}>
              <i className="fa-solid fa-arrow-right-from-bracket" /> Sign Out
            </button>
            
            <button className="prof-btn-danger" style={{width: '100%'}} onClick={handleDeleteAccount}>
              Delete Account
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
