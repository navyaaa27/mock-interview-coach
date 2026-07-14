import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import './OnboardingPage.css';

const JOB_ROLES = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'Designer',
  'DevOps Engineer',
  'Other',
];

const EXPERIENCE_LEVELS = [
  { value: 'entry',  icon: 'fa-solid fa-seedling',      title: 'Entry Level',      desc: '0–2 years. Core DSA, basics, internships.' },
  { value: 'mid',    icon: 'fa-solid fa-laptop-code',   title: 'Mid Level',        desc: '2–5 years. Systems, design, autonomy.' },
  { value: 'senior', icon: 'fa-solid fa-chart-line',    title: 'Senior Level',     desc: '5+ years. Tech leadership, architecture.' },
  { value: 'staff',  icon: 'fa-solid fa-chess-knight',  title: 'Staff / Principal', desc: 'Organisation scope, strategies.' },
];

const GOALS = [
  { value: 'Get my first job',      icon: 'fa-solid fa-graduation-cap',  label: 'First Job'    },
  { value: 'Switch to a new role',  icon: 'fa-solid fa-repeat',           label: 'Switch Role'  },
  { value: 'Get promoted',          icon: 'fa-solid fa-arrow-trend-up',   label: 'Get Promoted' },
  { value: 'Crack FAANG',           icon: 'fa-solid fa-award',            label: 'Crack FAANG'  },
];

export default function OnboardingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]     = useState(1);
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [fullName,        setFullName]        = useState('');
  const [jobRole,         setJobRole]         = useState('');
  const [experienceLevel, setExperienceLevel] = useState('mid');
  const [companies,       setCompanies]       = useState('');
  const [interviewGoal,   setInterviewGoal]   = useState('Get my first job');

  // ── Step navigation with validation ─────────────────────────────────────
  function goToStep(target) {
    setError('');
    if (target === 2) {
      if (!fullName.trim()) { setError('Please enter your full name.'); return; }
      if (!jobRole)         { setError('Please select a target job role.'); return; }
    }
    if (target === 4) {
      if (!companies.trim()) { setError('Please enter at least one target company.'); return; }
    }
    setStep(target);
  }

  // ── Final submission ─────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!companies.trim()) { setError('Please enter at least one target company.'); return; }

    setSaving(true);
    try {
      // A. Upsert full_name into public.users
      const { error: userErr } = await supabase
        .from('users')
        .upsert({ id: currentUser.id, email: currentUser.email, full_name: fullName.trim(), plan: 'free' });
      if (userErr) throw userErr;

      // B. Insert profile row into public.profiles
      const targetCompanies = companies.split(',').map(c => c.trim()).filter(Boolean);
      const { error: profileErr } = await supabase
        .from('profiles')
        .insert({
          user_id:          currentUser.id,
          job_role:         jobRole,
          experience_level: experienceLevel,
          target_companies: targetCompanies,
          interview_goal:   interviewGoal,
        });
      if (profileErr) throw profileErr;

      // C. Navigate to dashboard via React Router (not window.location)
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(`Failed to save profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  // ── Step indicator labels ────────────────────────────────────────────────
  const STEPS = ['About you', 'Experience', 'Goal'];

  return (
    <div className="ob-shell">
      {/* Ambient background orb */}
      <div className="ob-orb" />

      <div className="ob-card">
        {/* ── Step indicator ── */}
        <div className="ob-step-header">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`ob-step-ind ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}
            >
              <span className="ob-step-num">
                {step > i + 1
                  ? <i className="fa-solid fa-check" />
                  : i + 1}
              </span>
              {label}
            </div>
          ))}
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="ob-error">
            <i className="fa-solid fa-circle-exclamation" /> {error}
          </div>
        )}

        {/* ══════════════ STEP 1 — About You ══════════════ */}
        {step === 1 && (
          <div className="ob-step">
            <h2 className="ob-title">Tell us <span>about yourself</span></h2>
            <p className="ob-sub">We personalise questions, difficulty and scenarios based on your background.</p>

            <div className="ob-field">
              <label htmlFor="ob-name">Full Name</label>
              <div className="ob-input-wrap">
                <i className="fa-regular fa-user" />
                <input
                  id="ob-name"
                  type="text"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && goToStep(2)}
                  autoFocus
                />
              </div>
            </div>

            <div className="ob-field">
              <label htmlFor="ob-role">Job role you are targeting</label>
              <div className="ob-select-wrap">
                <select
                  id="ob-role"
                  value={jobRole}
                  onChange={e => setJobRole(e.target.value)}
                >
                  <option value="" disabled>Select your target role</option>
                  {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <i className="fa-solid fa-chevron-down ob-select-arrow" />
              </div>
            </div>

            <button className="ob-btn-primary" onClick={() => goToStep(2)}>
              Continue <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        )}

        {/* ══════════════ STEP 2 — Experience ══════════════ */}
        {step === 2 && (
          <div className="ob-step">
            <h2 className="ob-title">Select your <span>experience level</span></h2>
            <p className="ob-sub">This adjusts core technical difficulty and expectation guidelines during mock rounds.</p>

            <div className="ob-option-grid">
              {EXPERIENCE_LEVELS.map(lvl => (
                <button
                  key={lvl.value}
                  className={`ob-option-card ${experienceLevel === lvl.value ? 'active' : ''}`}
                  onClick={() => setExperienceLevel(lvl.value)}
                  type="button"
                >
                  <i className={lvl.icon} />
                  <div className="ob-option-title">{lvl.title}</div>
                  <div className="ob-option-desc">{lvl.desc}</div>
                </button>
              ))}
            </div>

            <div className="ob-btn-row">
              <button className="ob-btn-secondary" onClick={() => goToStep(1)} type="button">
                <i className="fa-solid fa-arrow-left" /> Back
              </button>
              <button className="ob-btn-primary" onClick={() => goToStep(3)} type="button">
                Continue <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════ STEP 3 — Goal ══════════════ */}
        {step === 3 && (
          <form className="ob-step" onSubmit={handleSubmit}>
            <h2 className="ob-title">Complete your <span>onboarding</span></h2>
            <p className="ob-sub">Define target companies and what you want to achieve through practising.</p>

            <div className="ob-field">
              <label htmlFor="ob-companies">Target Companies <span className="ob-label-hint">(comma-separated)</span></label>
              <div className="ob-input-wrap">
                <i className="fa-regular fa-building" />
                <input
                  id="ob-companies"
                  type="text"
                  placeholder="e.g. Google, Meta, Netflix"
                  value={companies}
                  onChange={e => setCompanies(e.target.value)}
                />
              </div>
            </div>

            <div className="ob-field">
              <label>Interview practice goal</label>
              <div className="ob-goal-grid">
                {GOALS.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    className={`ob-goal-card ${interviewGoal === g.value ? 'active' : ''}`}
                    onClick={() => setInterviewGoal(g.value)}
                  >
                    <i className={g.icon} />
                    <div className="ob-option-title">{g.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="ob-btn-row">
              <button className="ob-btn-secondary" onClick={() => goToStep(2)} type="button">
                <i className="fa-solid fa-arrow-left" /> Back
              </button>
              <button className="ob-btn-primary" type="submit" disabled={saving}>
                {saving
                  ? <><i className="fa-solid fa-circle-notch fa-spin" /> Saving…</>
                  : <>Complete Onboarding <i className="fa-solid fa-check" /></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
