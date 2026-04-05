import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, ExternalLink, MapPin, Search, Users } from 'lucide-react';
import apiService from '../services/api';

const formatSalary = (job) => {
  if (job.salaryLabel) {
    return job.salaryLabel;
  }
  if (job.salary) {
    return `INR ${(job.salary / 100000).toFixed(1)} LPA`;
  }
  return 'Compensation shared during hiring';
};

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await apiService.getJobs({ limit: 200 });
        const nextJobs = Array.isArray(response.data) ? response.data : [];
        setJobs(nextJobs);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load job opportunities.');
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  const categories = useMemo(() => ['all', ...new Set(jobs.map((job) => job.category).filter(Boolean))], [jobs]);
  const locations = useMemo(() => ['all', ...new Set(jobs.map((job) => job.location).filter(Boolean))], [jobs]);
  const featuredCompanies = useMemo(
    () => [...new Set(jobs.map((job) => job.company).filter(Boolean))].slice(0, 6),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch = !search || [
        job.title,
        job.company,
        job.location,
        job.description
      ].some((value) => String(value || '').toLowerCase().includes(search));

      const matchesCategory = category === 'all' || job.category === category;
      const matchesLocation = location === 'all' || job.location === location;

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [jobs, searchTerm, category, location]);

  const css = `
    .jobs-shell {
      min-height: 100vh;
      background:
        radial-gradient(circle at top right, rgba(14, 116, 144, 0.14), transparent 26%),
        linear-gradient(180deg, #f5f7fb 0%, #edf2f8 100%);
      color: #102033;
      padding: 34px 16px 56px;
      font-family: 'Segoe UI', sans-serif;
    }
    .jobs-wrap {
      max-width: 1220px;
      margin: 0 auto;
    }
    .jobs-hero,
    .jobs-toolbar,
    .jobs-card,
    .jobs-detail {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(148, 163, 184, 0.2);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      border-radius: 24px;
    }
    .jobs-hero {
      padding: 28px;
      margin-bottom: 22px;
      background: linear-gradient(135deg, #0b3b60, #155e75);
      color: white;
    }
    .jobs-hero h1 {
      margin: 0 0 10px;
      font-size: clamp(2rem, 3vw, 2.7rem);
    }
    .jobs-hero p {
      margin: 0;
      max-width: 780px;
      line-height: 1.6;
      color: rgba(255,255,255,0.82);
    }
    .jobs-toolbar {
      padding: 18px;
      display: grid;
      grid-template-columns: minmax(260px, 1.6fr) repeat(2, minmax(180px, 1fr));
      gap: 14px;
      margin-bottom: 22px;
    }
    .jobs-search {
      position: relative;
    }
    .jobs-search svg {
      position: absolute;
      top: 50%;
      left: 14px;
      transform: translateY(-50%);
      color: #64748b;
    }
    .jobs-input,
    .jobs-select {
      width: 100%;
      border: 1px solid #d7e0e8;
      border-radius: 14px;
      background: #f8fbfd;
      padding: 13px 14px;
      font-size: 0.95rem;
      outline: none;
      color: #102033;
    }
    .jobs-search .jobs-input {
      padding-left: 42px;
    }
    .jobs-input:focus,
    .jobs-select:focus {
      border-color: #0f766e;
      box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.12);
      background: white;
    }
    .jobs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 18px;
    }
    .jobs-company-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 0 0 22px;
    }
    .jobs-company-chip {
      padding: 9px 14px;
      border-radius: 999px;
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(148, 163, 184, 0.24);
      color: #0b3b60;
      font-weight: 700;
    }
    .jobs-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 22px;
    }
    .jobs-stat-card {
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(148, 163, 184, 0.24);
      border-radius: 22px;
      padding: 18px;
      box-shadow: 0 16px 34px rgba(15, 23, 42, 0.07);
    }
    .jobs-stat-card strong {
      display: block;
      font-size: 1.9rem;
      margin-bottom: 6px;
      color: #0b3b60;
    }
    .jobs-card {
      padding: 20px;
      cursor: pointer;
    }
    .jobs-card h3 {
      margin: 0 0 8px;
      font-size: 1.1rem;
    }
    .jobs-company {
      color: #0f766e;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .jobs-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 14px;
      color: #526173;
      font-size: 0.9rem;
    }
    .jobs-meta span {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      padding: 7px 10px;
      border-radius: 999px;
      background: #f1f5f9;
    }
    .jobs-detail {
      padding: 24px;
    }
    .jobs-detail-top {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      align-items: flex-start;
      margin-bottom: 18px;
    }
    .jobs-badge {
      padding: 8px 12px;
      border-radius: 999px;
      background: #e6f4f1;
      color: #0f766e;
      font-weight: 700;
    }
    .jobs-list {
      margin: 12px 0 0;
      padding-left: 18px;
      color: #42556a;
    }
    .jobs-empty,
    .jobs-error {
      padding: 22px;
      border-radius: 18px;
      text-align: center;
    }
    .jobs-empty {
      background: rgba(255,255,255,0.85);
      border: 1px dashed #cbd5e1;
      color: #526173;
    }
    .jobs-error {
      background: #fff1f2;
      color: #b91c1c;
      border: 1px solid #fecdd3;
    }
    @media (max-width: 900px) {
      .jobs-toolbar {
        grid-template-columns: 1fr;
      }
    }
  `;

  return (
    <div className="jobs-shell">
      <style>{css}</style>
      <div className="jobs-wrap">
        <section className="jobs-hero">
          <h1>Jobs and Opportunities</h1>
          <p>
            Explore verified openings shared by the alumni network. Every listing here has already
            passed through admin review before being published.
          </p>
        </section>

        <section className="jobs-toolbar">
          <div className="jobs-search">
            <Search size={18} />
            <input
              className="jobs-input"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by role, company, or keyword"
            />
          </div>
          <select className="jobs-select" value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item} value={item}>{item === 'all' ? 'All categories' : item}</option>)}
          </select>
          <select className="jobs-select" value={location} onChange={(event) => setLocation(event.target.value)}>
            {locations.map((item) => <option key={item} value={item}>{item === 'all' ? 'All locations' : item}</option>)}
          </select>
        </section>

        {!loading && !error ? (
          <>
            <section className="jobs-stats">
              <div className="jobs-stat-card">
                <strong>{jobs.length}</strong>
                <span>Total approved jobs</span>
              </div>
              <div className="jobs-stat-card">
                <strong>{featuredCompanies.length}</strong>
                <span>Companies hiring</span>
              </div>
              <div className="jobs-stat-card">
                <strong>{categories.length - 1}</strong>
                <span>Categories</span>
              </div>
            </section>

            <div className="jobs-company-strip">
              {featuredCompanies.map((company) => (
                <button
                  key={company}
                  type="button"
                  className="jobs-company-chip"
                  onClick={() => setSearchTerm(company)}
                >
                  {company}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {loading ? <div className="jobs-empty">Loading opportunities...</div> : null}
        {error ? <div className="jobs-error">{error}</div> : null}

        {!loading && !error && !selectedJob ? (
          filteredJobs.length ? (
            <section className="jobs-grid">
              {filteredJobs.map((job) => (
                <article key={job._id} className="jobs-card" onClick={() => setSelectedJob(job)}>
                  <h3>{job.title}</h3>
                  <div className="jobs-company">{job.company}</div>
                  <div className="jobs-meta">
                    <span><MapPin size={14} /> {job.location}</span>
                    <span><Briefcase size={14} /> {job.type}</span>
                    <span><Users size={14} /> {job.experienceRequired}+ years</span>
                  </div>
                  <p style={{ color: '#526173', lineHeight: 1.6 }}>{job.description}</p>
                  <div style={{ marginTop: 14, fontWeight: 700, color: '#0b3b60' }}>{formatSalary(job)}</div>
                </article>
              ))}
            </section>
          ) : (
            <div className="jobs-empty">No approved jobs match your filters yet.</div>
          )
        ) : null}

        {!loading && !error && selectedJob ? (
          <section className="jobs-detail">
            <div className="jobs-detail-top">
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  style={{ marginBottom: 14, background: 'none', border: 'none', color: '#0b3b60', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Back to all jobs
                </button>
                <h2 style={{ margin: 0 }}>{selectedJob.title}</h2>
                <div className="jobs-company" style={{ marginTop: 8 }}>{selectedJob.company}</div>
              </div>
              <div className="jobs-badge">{selectedJob.category || 'Opportunity'}</div>
            </div>

            <div className="jobs-meta" style={{ marginBottom: 20 }}>
              <span><MapPin size={14} /> {selectedJob.location}</span>
              <span><Briefcase size={14} /> {selectedJob.type}</span>
              <span><Users size={14} /> {selectedJob.companySize || 'Company size not specified'}</span>
            </div>

            <div style={{ display: 'grid', gap: 18 }}>
              <div>
                <strong>Compensation</strong>
                <p style={{ margin: '8px 0 0', color: '#526173' }}>{formatSalary(selectedJob)}</p>
              </div>
              <div>
                <strong>Role overview</strong>
                <p style={{ margin: '8px 0 0', color: '#526173', lineHeight: 1.7 }}>{selectedJob.description}</p>
              </div>
              <div>
                <strong>Requirements</strong>
                {selectedJob.requirements?.length ? (
                  <ul className="jobs-list">
                    {selectedJob.requirements.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : (
                  <p style={{ margin: '8px 0 0', color: '#526173' }}>Requirements will be shared during the interview process.</p>
                )}
              </div>
              <div>
                <strong>Key skills</strong>
                {selectedJob.skills?.length ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                    {selectedJob.skills.map((skill) => (
                      <span key={skill} className="jobs-badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>{skill}</span>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: '8px 0 0', color: '#526173' }}>No specific skills were listed.</p>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <a className="jobs-badge" href={selectedJob.applyLink} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  Apply Now <ExternalLink size={14} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
                </a>
                <span className="jobs-badge" style={{ background: '#f8fafc', color: '#334155' }}>{selectedJob.contactEmail}</span>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default JobsPage;
