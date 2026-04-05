import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const departments = [
  'Computer Science (CSE)',
  'Electronics & Communication (ECE)',
  'Mechanical Engineering (ME)',
  'Information Technology (IT)',
  'Civil Engineering (CE)',
  'Electrical Engineering (EE)',
  'Biotechnology (BT)',
  'Chemical Engineering (CHE)',
  'Computer Science & Business Systems (CSBS)',
  'AI & Machine Learning (AIML)',
  'CSE Data Science (CSE-DS)',
  'Cybersecurity',
  'IoT & Automation (IoTA)'
];

const emptyCareerEntry = () => ({
  company: '',
  title: '',
  location: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  summary: ''
});

const emptyJobForm = {
  title: '',
  company: '',
  companyLogo: '',
  location: '',
  type: 'Full-time',
  category: 'Technology',
  salary: '',
  salaryLabel: '',
  experienceRequired: '',
  companySize: '',
  description: '',
  requirementsText: '',
  skillsText: '',
  applyLink: '',
  contactEmail: ''
};

const splitLines = (value) => value
  .split('\n')
  .map((item) => item.trim())
  .filter(Boolean);

const formatMonth = (value) => value || 'Present';

const AlumniPortal = () => {
  const { user, userType, loginAlumni, updateProfile, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [loginData, setLoginData] = useState({ enrollmentNumber: '', password: '' });
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    enrollmentNumber: '',
    mobile: '',
    graduationYear: '',
    department: '',
    profileImage: '',
    jobTitle: '',
    company: '',
    location: '',
    linkedinUrl: '',
    bio: '',
    skillsText: '',
    experienceText: '',
    careerHistory: [emptyCareerEntry()]
  });
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [myJobs, setMyJobs] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [submittingJob, setSubmittingJob] = useState(false);

  const loadMyJobs = async () => {
    try {
      const response = await apiService.getMyJobs();
      setMyJobs(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      console.error('Failed to load alumni jobs:', loadError);
    }
  };

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location.state]);

  useEffect(() => {
    if (user && userType === 'alumni') {
      const nextCareerHistory = Array.isArray(user.careerHistory) && user.careerHistory.length
        ? user.careerHistory
        : [emptyCareerEntry()];

      setProfileData({
        name: user.name || '',
        email: user.email || '',
        enrollmentNumber: user.enrollmentNumber || '',
        mobile: user.mobile || '',
        graduationYear: user.graduationYear || '',
        department: user.department || '',
        profileImage: user.profileImage || '',
        jobTitle: user.jobTitle || '',
        company: user.company || '',
        location: user.location || '',
        linkedinUrl: user.linkedinUrl || '',
        bio: user.bio || '',
        skillsText: Array.isArray(user.skills) ? user.skills.join('\n') : '',
        experienceText: Array.isArray(user.experience) ? user.experience.join('\n') : '',
        careerHistory: nextCareerHistory
      });

      setJobForm((current) => ({
        ...current,
        company: user.company || current.company,
        location: user.location || current.location,
        contactEmail: user.email || current.contactEmail
      }));

      loadMyJobs();
    }
  }, [user, userType]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const result = await loginAlumni(loginData.enrollmentNumber.trim().toUpperCase(), loginData.password);
    if (!result.success) {
      setError(result.error || 'Unable to log in.');
      return;
    }

    setMessage('Login successful.');
  };

  const setField = (field) => (event) => {
    setProfileData((current) => ({ ...current, [field]: event.target.value }));
  };

  const setCareerField = (index, field, value) => {
    setProfileData((current) => ({
      ...current,
      careerHistory: current.careerHistory.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      ))
    }));
  };

  const addCareerEntry = () => {
    setProfileData((current) => ({
      ...current,
      careerHistory: [...current.careerHistory, emptyCareerEntry()]
    }));
  };

  const removeCareerEntry = (index) => {
    setProfileData((current) => ({
      ...current,
      careerHistory: current.careerHistory.length === 1
        ? [emptyCareerEntry()]
        : current.careerHistory.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSavingProfile(true);

    const payload = {
      name: profileData.name,
      email: profileData.email,
      mobile: profileData.mobile,
      graduationYear: Number(profileData.graduationYear),
      department: profileData.department,
      profileImage: profileData.profileImage,
      jobTitle: profileData.jobTitle,
      company: profileData.company,
      location: profileData.location,
      linkedinUrl: profileData.linkedinUrl,
      bio: profileData.bio,
      skills: splitLines(profileData.skillsText),
      experience: splitLines(profileData.experienceText),
      careerHistory: profileData.careerHistory
        .map((item) => ({
          ...item,
          company: item.company.trim(),
          title: item.title.trim(),
          location: item.location.trim(),
          startDate: item.startDate.trim(),
          endDate: item.isCurrent ? '' : item.endDate.trim(),
          summary: item.summary.trim()
        }))
        .filter((item) => item.company || item.title || item.summary)
    };

    const result = await updateProfile(payload);
    setSavingProfile(false);

    if (!result.success) {
      setError(result.error || 'Unable to submit profile changes.');
      return;
    }

    setMessage(result.message || 'Profile changes submitted for admin approval.');
  };

  const handleJobChange = (field) => (event) => {
    setJobForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmitJob = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmittingJob(true);

    try {
      const response = await apiService.createJob({
        title: jobForm.title,
        company: jobForm.company,
        companyLogo: jobForm.companyLogo,
        location: jobForm.location,
        type: jobForm.type,
        category: jobForm.category,
        salary: Number(jobForm.salary || 0),
        salaryLabel: jobForm.salaryLabel,
        experienceRequired: Number(jobForm.experienceRequired || 0),
        companySize: jobForm.companySize,
        description: jobForm.description,
        requirements: splitLines(jobForm.requirementsText),
        skills: splitLines(jobForm.skillsText),
        applyLink: jobForm.applyLink,
        contactEmail: jobForm.contactEmail
      });

      setJobForm((current) => ({
        ...emptyJobForm,
        company: current.company,
        location: current.location,
        contactEmail: current.contactEmail
      }));
      setMessage(response.message || 'Job submitted for admin approval.');
      await loadMyJobs();
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit the job.');
    } finally {
      setSubmittingJob(false);
    }
  };

  const skillChips = useMemo(() => splitLines(profileData.skillsText), [profileData.skillsText]);

  const css = `
    .alumni-shell {
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(15, 118, 110, 0.14), transparent 28%),
        linear-gradient(180deg, #f5f7fb 0%, #eaf0f7 100%);
      color: #102033;
      font-family: 'Segoe UI', sans-serif;
      padding: 32px 16px 56px;
    }
    .alumni-wrap {
      max-width: 1180px;
      margin: 0 auto;
    }
    .alumni-login-card,
    .alumni-panel,
    .alumni-section,
    .alumni-job-card {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(148, 163, 184, 0.22);
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
      border-radius: 24px;
    }
    .alumni-login-card {
      max-width: 460px;
      margin: 40px auto;
      overflow: hidden;
    }
    .alumni-login-head,
    .alumni-hero {
      background: linear-gradient(135deg, #0b3b60, #155e75);
      color: white;
    }
    .alumni-login-head {
      padding: 24px;
    }
    .alumni-login-body {
      padding: 24px;
      display: grid;
      gap: 16px;
    }
    .alumni-grid {
      display: grid;
      gap: 20px;
      grid-template-columns: 340px minmax(0, 1fr);
      align-items: start;
    }
    .alumni-hero {
      display: grid;
      grid-template-columns: 120px minmax(0, 1fr) auto;
      gap: 20px;
      padding: 28px;
      margin-bottom: 22px;
      align-items: center;
    }
    .alumni-avatar {
      width: 120px;
      height: 120px;
      border-radius: 32px;
      background: rgba(255, 255, 255, 0.16);
      overflow: hidden;
      display: grid;
      place-items: center;
      font-size: 2.3rem;
      font-weight: 800;
    }
    .alumni-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .alumni-hero h1 {
      margin: 0 0 8px;
      font-size: clamp(1.9rem, 3vw, 2.6rem);
    }
    .alumni-hero p {
      margin: 0;
      color: rgba(255, 255, 255, 0.84);
      line-height: 1.6;
    }
    .alumni-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 14px;
    }
    .alumni-meta span {
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.14);
      font-size: 0.88rem;
    }
    .alumni-panel {
      padding: 22px;
    }
    .alumni-section {
      padding: 22px;
      margin-bottom: 20px;
    }
    .alumni-section h2,
    .alumni-panel h2 {
      margin: 0 0 14px;
      font-size: 1.08rem;
    }
    .alumni-muted {
      color: #5b6c7f;
      line-height: 1.6;
    }
    .alumni-chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .alumni-chip {
      padding: 8px 12px;
      border-radius: 999px;
      background: #e6f4f1;
      color: #0f766e;
      font-weight: 600;
      font-size: 0.88rem;
    }
    .alumni-timeline {
      display: grid;
      gap: 14px;
    }
    .alumni-timeline-item {
      border-left: 3px solid #0f766e;
      padding: 0 0 0 14px;
    }
    .alumni-timeline-item strong {
      display: block;
      margin-bottom: 6px;
    }
    .alumni-form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .alumni-field {
      display: grid;
      gap: 8px;
    }
    .alumni-field.full {
      grid-column: 1 / -1;
    }
    .alumni-label {
      font-size: 0.84rem;
      font-weight: 700;
      color: #42556a;
    }
    .alumni-input,
    .alumni-select,
    .alumni-textarea {
      width: 100%;
      border: 1px solid #d7e0e8;
      border-radius: 14px;
      background: #f8fbfd;
      color: #102033;
      padding: 13px 14px;
      font-size: 0.95rem;
      outline: none;
    }
    .alumni-input:focus,
    .alumni-select:focus,
    .alumni-textarea:focus {
      border-color: #0f766e;
      box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.12);
      background: white;
    }
    .alumni-textarea {
      min-height: 110px;
      resize: vertical;
    }
    .alumni-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: space-between;
      align-items: center;
      margin-top: 18px;
    }
    .alumni-button {
      border: none;
      border-radius: 14px;
      padding: 12px 16px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .alumni-button.primary {
      background: #0b3b60;
      color: white;
    }
    .alumni-button.secondary {
      background: white;
      color: #102033;
      border: 1px solid #d7e0e8;
    }
    .alumni-button.ghost {
      background: #f1f5f9;
      color: #244257;
    }
    .alumni-alert {
      padding: 12px 14px;
      border-radius: 16px;
      margin-bottom: 16px;
      font-weight: 600;
    }
    .alumni-alert.error {
      background: #fff1f2;
      color: #b91c1c;
      border: 1px solid #fecdd3;
    }
    .alumni-alert.success {
      background: #ecfdf5;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .alumni-card-list {
      display: grid;
      gap: 14px;
    }
    .alumni-job-card {
      padding: 18px;
    }
    .alumni-job-top {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .alumni-status {
      padding: 7px 10px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: capitalize;
      background: #e2e8f0;
      color: #334155;
    }
    .alumni-status.pending {
      background: #fef3c7;
      color: #a16207;
    }
    .alumni-status.approved {
      background: #dcfce7;
      color: #166534;
    }
    .alumni-status.rejected {
      background: #fee2e2;
      color: #b91c1c;
    }
    @media (max-width: 900px) {
      .alumni-grid,
      .alumni-form-grid,
      .alumni-hero {
        grid-template-columns: 1fr;
      }
    }
  `;

  if (!isAuthenticated() || userType !== 'alumni') {
    return (
      <div className="alumni-shell">
        <style>{css}</style>
        <div className="alumni-wrap">
          <div className="alumni-login-card">
            <div className="alumni-login-head">
              <h1 style={{ margin: 0 }}>Alumni Login</h1>
              <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.8)' }}>
                Use your enrollment number and password to manage your alumni profile.
              </p>
            </div>
            <form onSubmit={handleLogin} className="alumni-login-body">
              {error ? <div className="alumni-alert error">{error}</div> : null}
              {message ? <div className="alumni-alert success">{message}</div> : null}
              <div className="alumni-field">
                <label className="alumni-label">Enrollment Number</label>
                <input
                  className="alumni-input"
                  value={loginData.enrollmentNumber}
                  onChange={(event) => setLoginData((current) => ({ ...current, enrollmentNumber: event.target.value }))}
                  required
                />
              </div>
              <div className="alumni-field">
                <label className="alumni-label">Password</label>
                <input
                  className="alumni-input"
                  type="password"
                  value={loginData.password}
                  onChange={(event) => setLoginData((current) => ({ ...current, password: event.target.value }))}
                  required
                />
              </div>
              <div className="alumni-actions">
                <div className="alumni-muted">
                  New member? <Link to="/register">Create your alumni account</Link>
                </div>
                <button type="submit" className="alumni-button primary">Login</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="alumni-shell">
      <style>{css}</style>
      <div className="alumni-wrap">
        <section className="alumni-hero">
          <div className="alumni-avatar">
            {profileData.profileImage ? (
              <img src={profileData.profileImage} alt={profileData.name} />
            ) : (
              (profileData.name || 'A').slice(0, 1).toUpperCase()
            )}
          </div>
          <div>
            <h1>{profileData.name || 'Alumni Member'}</h1>
            <p>{profileData.jobTitle || 'Professional role'} at {profileData.company || 'Company not set'}</p>
            <div className="alumni-meta">
              <span>{profileData.location || 'Location not set'}</span>
              <span>{profileData.department || 'Department not set'}</span>
              <span>Batch {profileData.graduationYear || 'N/A'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="alumni-button secondary" onClick={logout}>Sign Out</button>
          </div>
        </section>

        {error ? <div className="alumni-alert error">{error}</div> : null}
        {message ? <div className="alumni-alert success">{message}</div> : null}

        <div className="alumni-grid">
          <div>
            <section className="alumni-section">
              <h2>About</h2>
              <p className="alumni-muted">
                {profileData.bio || 'Add a professional summary so students and fellow alumni can understand your background.'}
              </p>
            </section>

            <section className="alumni-section">
              <h2>Skills</h2>
              {skillChips.length ? (
                <div className="alumni-chip-row">
                  {skillChips.map((skill) => <span key={skill} className="alumni-chip">{skill}</span>)}
                </div>
              ) : (
                <p className="alumni-muted">Add your core skills to make your profile more useful.</p>
              )}
            </section>

            <section className="alumni-section">
              <h2>Career Timeline</h2>
              <div className="alumni-timeline">
                {profileData.careerHistory
                  .filter((item) => item.company || item.title || item.summary)
                  .map((item, index) => (
                    <div key={`${item.company}-${index}`} className="alumni-timeline-item">
                      <strong>{item.title || 'Role not set'} at {item.company || 'Company not set'}</strong>
                      <div className="alumni-muted">
                        {formatMonth(item.startDate)} - {item.isCurrent ? 'Present' : formatMonth(item.endDate)} • {item.location || 'Location not set'}
                      </div>
                      <p className="alumni-muted" style={{ marginTop: 8 }}>{item.summary || 'No summary added yet.'}</p>
                    </div>
                  ))}
              </div>
            </section>
          </div>

          <div>
            <section className="alumni-panel">
              <h2>Edit Profile</h2>
              <p className="alumni-muted" style={{ marginBottom: 16 }}>
                Profile changes are submitted to the admin team first. Once approved, your updates appear in the directory.
              </p>
              <form onSubmit={handleSaveProfile}>
                <div className="alumni-form-grid">
                  <div className="alumni-field">
                    <label className="alumni-label">Full Name</label>
                    <input className="alumni-input" value={profileData.name} onChange={setField('name')} required />
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Email</label>
                    <input className="alumni-input" type="email" value={profileData.email} onChange={setField('email')} required />
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Enrollment Number</label>
                    <input className="alumni-input" value={profileData.enrollmentNumber} readOnly />
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Mobile</label>
                    <input className="alumni-input" value={profileData.mobile} onChange={setField('mobile')} required />
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Graduation Year</label>
                    <input className="alumni-input" type="number" value={profileData.graduationYear} onChange={setField('graduationYear')} required />
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Department</label>
                    <select className="alumni-select" value={profileData.department} onChange={setField('department')} required>
                      <option value="">Select department</option>
                      {departments.map((department) => <option key={department} value={department}>{department}</option>)}
                    </select>
                  </div>
                  <div className="alumni-field full">
                    <label className="alumni-label">Profile Photo URL</label>
                    <input className="alumni-input" value={profileData.profileImage} onChange={setField('profileImage')} placeholder="https://..." />
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Current Role</label>
                    <input className="alumni-input" value={profileData.jobTitle} onChange={setField('jobTitle')} required />
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Current Company</label>
                    <input className="alumni-input" value={profileData.company} onChange={setField('company')} required />
                  </div>
                  <div className="alumni-field full">
                    <label className="alumni-label">Location</label>
                    <input className="alumni-input" value={profileData.location} onChange={setField('location')} required />
                  </div>
                  <div className="alumni-field full">
                    <label className="alumni-label">LinkedIn Profile</label>
                    <input className="alumni-input" value={profileData.linkedinUrl} onChange={setField('linkedinUrl')} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div className="alumni-field full">
                    <label className="alumni-label">About</label>
                    <textarea className="alumni-textarea" value={profileData.bio} onChange={setField('bio')} />
                  </div>
                  <div className="alumni-field full">
                    <label className="alumni-label">Skills</label>
                    <textarea className="alumni-textarea" value={profileData.skillsText} onChange={setField('skillsText')} placeholder="One skill per line" />
                  </div>
                  <div className="alumni-field full">
                    <label className="alumni-label">Highlights</label>
                    <textarea className="alumni-textarea" value={profileData.experienceText} onChange={setField('experienceText')} placeholder="One achievement or experience highlight per line" />
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <h2 style={{ marginBottom: 14 }}>Career History</h2>
                  <div className="alumni-card-list">
                    {profileData.careerHistory.map((entry, index) => (
                      <div key={`career-entry-${index}`} className="alumni-job-card">
                        <div className="alumni-form-grid">
                          <div className="alumni-field">
                            <label className="alumni-label">Company</label>
                            <input className="alumni-input" value={entry.company} onChange={(event) => setCareerField(index, 'company', event.target.value)} />
                          </div>
                          <div className="alumni-field">
                            <label className="alumni-label">Role</label>
                            <input className="alumni-input" value={entry.title} onChange={(event) => setCareerField(index, 'title', event.target.value)} />
                          </div>
                          <div className="alumni-field">
                            <label className="alumni-label">Start</label>
                            <input className="alumni-input" type="month" value={entry.startDate} onChange={(event) => setCareerField(index, 'startDate', event.target.value)} />
                          </div>
                          <div className="alumni-field">
                            <label className="alumni-label">End</label>
                            <input className="alumni-input" type="month" value={entry.endDate} onChange={(event) => setCareerField(index, 'endDate', event.target.value)} disabled={entry.isCurrent} />
                          </div>
                          <div className="alumni-field">
                            <label className="alumni-label">Location</label>
                            <input className="alumni-input" value={entry.location} onChange={(event) => setCareerField(index, 'location', event.target.value)} />
                          </div>
                          <div className="alumni-field" style={{ alignContent: 'end' }}>
                            <label className="alumni-label">Current Role</label>
                            <label className="alumni-muted" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input type="checkbox" checked={entry.isCurrent} onChange={(event) => setCareerField(index, 'isCurrent', event.target.checked)} />
                              Mark as current
                            </label>
                          </div>
                          <div className="alumni-field full">
                            <label className="alumni-label">Role Summary</label>
                            <textarea className="alumni-textarea" value={entry.summary} onChange={(event) => setCareerField(index, 'summary', event.target.value)} />
                          </div>
                        </div>
                        <div className="alumni-actions">
                          <span className="alumni-muted">Show every company switch here so your journey reads like a professional profile.</span>
                          <button type="button" className="alumni-button ghost" onClick={() => removeCareerEntry(index)}>Remove entry</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="alumni-actions">
                    <span className="alumni-muted">Add each company move separately.</span>
                    <button type="button" className="alumni-button ghost" onClick={addCareerEntry}>Add another role</button>
                  </div>
                </div>

                <div className="alumni-actions">
                  <span className="alumni-muted">Submitted profile updates stay pending until an admin approves them.</span>
                  <button type="submit" className="alumni-button primary" disabled={savingProfile}>
                    {savingProfile ? 'Submitting...' : 'Submit profile changes'}
                  </button>
                </div>
              </form>
            </section>

            <section className="alumni-panel" style={{ marginTop: 20 }}>
              <h2>Post a Job Opportunity</h2>
              <p className="alumni-muted" style={{ marginBottom: 16 }}>
                Submitted jobs go to the admin panel first. They appear on the jobs page only after approval.
              </p>
              <form onSubmit={handleSubmitJob}>
                <div className="alumni-form-grid">
                  <div className="alumni-field">
                    <label className="alumni-label">Job Title</label>
                    <input className="alumni-input" value={jobForm.title} onChange={handleJobChange('title')} required />
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Company</label>
                    <input className="alumni-input" value={jobForm.company} onChange={handleJobChange('company')} required />
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Location</label>
                    <input className="alumni-input" value={jobForm.location} onChange={handleJobChange('location')} required />
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Job Type</label>
                    <select className="alumni-select" value={jobForm.type} onChange={handleJobChange('type')}>
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                      <option>Internship</option>
                      <option>Remote</option>
                    </select>
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Category</label>
                    <input className="alumni-input" value={jobForm.category} onChange={handleJobChange('category')} />
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Experience Required (years)</label>
                    <input className="alumni-input" type="number" min="0" value={jobForm.experienceRequired} onChange={handleJobChange('experienceRequired')} />
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Salary</label>
                    <input className="alumni-input" type="number" min="0" value={jobForm.salary} onChange={handleJobChange('salary')} placeholder="Optional numeric salary" />
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Salary Label</label>
                    <input className="alumni-input" value={jobForm.salaryLabel} onChange={handleJobChange('salaryLabel')} placeholder="e.g. 18-24 LPA" />
                  </div>
                  <div className="alumni-field full">
                    <label className="alumni-label">Company Logo URL</label>
                    <input className="alumni-input" value={jobForm.companyLogo} onChange={handleJobChange('companyLogo')} placeholder="https://..." />
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Company Size</label>
                    <input className="alumni-input" value={jobForm.companySize} onChange={handleJobChange('companySize')} />
                  </div>
                  <div className="alumni-field">
                    <label className="alumni-label">Contact Email</label>
                    <input className="alumni-input" type="email" value={jobForm.contactEmail} onChange={handleJobChange('contactEmail')} required />
                  </div>
                  <div className="alumni-field full">
                    <label className="alumni-label">Apply Link</label>
                    <input className="alumni-input" value={jobForm.applyLink} onChange={handleJobChange('applyLink')} placeholder="https://..." required />
                  </div>
                  <div className="alumni-field full">
                    <label className="alumni-label">Description</label>
                    <textarea className="alumni-textarea" value={jobForm.description} onChange={handleJobChange('description')} required />
                  </div>
                  <div className="alumni-field full">
                    <label className="alumni-label">Requirements</label>
                    <textarea className="alumni-textarea" value={jobForm.requirementsText} onChange={handleJobChange('requirementsText')} placeholder="One requirement per line" />
                  </div>
                  <div className="alumni-field full">
                    <label className="alumni-label">Skills</label>
                    <textarea className="alumni-textarea" value={jobForm.skillsText} onChange={handleJobChange('skillsText')} placeholder="One skill per line" />
                  </div>
                </div>
                <div className="alumni-actions">
                  <span className="alumni-muted">Your submission is visible to the admin review queue immediately.</span>
                  <button type="submit" className="alumni-button primary" disabled={submittingJob}>
                    {submittingJob ? 'Submitting...' : 'Submit job for approval'}
                  </button>
                </div>
              </form>
            </section>

            <section className="alumni-panel" style={{ marginTop: 20 }}>
              <h2>My Submitted Jobs</h2>
              <div className="alumni-card-list">
                {myJobs.length ? myJobs.map((job) => (
                  <div key={job._id} className="alumni-job-card">
                    <div className="alumni-job-top">
                      <div>
                        <strong>{job.title}</strong>
                        <div className="alumni-muted">{job.company} • {job.location}</div>
                      </div>
                      <span className={`alumni-status ${job.status}`}>{job.status}</span>
                    </div>
                    <p className="alumni-muted">{job.description}</p>
                    {job.rejectionReason ? (
                      <p className="alumni-muted" style={{ marginTop: 10 }}>
                        Rejection note: {job.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                )) : (
                  <p className="alumni-muted">No job submissions yet.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniPortal;
