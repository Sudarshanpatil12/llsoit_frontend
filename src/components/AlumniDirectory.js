// src/components/AlumniDirectory.js
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, GraduationCap, Mail, Phone, Linkedin, X } from 'lucide-react';
import apiService from '../services/api';
import { sampleAlumni } from '../data/sampleAlumni';
import { useAuth } from '../context/AuthContext';

const normalizeAlumniRecord = (alumni, index = 0) => ({
  id: alumni.id || alumni._id || `sample-${index}`,
  name: alumni.name || 'Alumni Member',
  email: alumni.email || '',
  enrollmentNumber: alumni.enrollmentNumber || '',
  mobile: alumni.mobile || '',
  graduationYear: alumni.graduationYear || '',
  department: alumni.department || 'Not specified',
  jobTitle: alumni.jobTitle || 'Role not specified',
  company: alumni.company || 'Company not specified',
  linkedinUrl: alumni.linkedinUrl || '',
  location: alumni.location || 'Location not specified',
  bio: alumni.bio || '',
  profileImage: alumni.profileImage || '',
  skills: Array.isArray(alumni.skills) ? alumni.skills : [],
  experience: Array.isArray(alumni.experience) ? alumni.experience : [],
  careerHistory: Array.isArray(alumni.careerHistory) ? alumni.careerHistory : [],
  status: alumni.status || 'approved'
});

const fallbackDirectoryData = sampleAlumni.map((alumni, index) => normalizeAlumniRecord(alumni, index));

const buildExperienceSections = (alumni) => {
  if (Array.isArray(alumni.careerHistory) && alumni.careerHistory.length) {
    return alumni.careerHistory.map((entry, index) => ({
      id: `${entry.company || 'company'}-${index}`,
      company: entry.company || alumni.company || 'Company not available',
      companyMeta: entry.location || alumni.location || 'Location not available',
      role: entry.title || alumni.jobTitle || 'Role not available',
      duration: entry.isCurrent
        ? `${entry.startDate || 'Start date not added'} - Present`
        : `${entry.startDate || 'Start date not added'} - ${entry.endDate || 'End date not added'}`,
      summary: entry.summary || '',
      skills: Array.isArray(alumni.skills) ? alumni.skills.slice(0, 4) : []
    }));
  }

  return [{
    id: `${alumni.company || 'company'}-fallback`,
    company: alumni.company || 'Company not available',
    companyMeta: alumni.location || 'Location not available',
    role: alumni.jobTitle || 'Role not available',
    duration: alumni.graduationYear ? `Batch ${alumni.graduationYear} onward` : 'Career details not added',
    summary: alumni.bio || '',
    skills: Array.isArray(alumni.skills) ? alumni.skills.slice(0, 4) : []
  }];
};

const AlumniDirectory = () => {
  const { user, userType, updateProfile, isAuthenticated } = useAuth();
  const [alumniData, setAlumniData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [photoDraft, setPhotoDraft] = useState('');
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoMessage, setPhotoMessage] = useState('');

  useEffect(() => {
    loadAlumniData();
  }, []);

  const loadAlumniData = async () => {
    try {
      const response = await apiService.getAlumni({ page: 1, limit: 500, status: 'approved' });
      const approvedAlumni = Array.isArray(response.data)
        ? response.data.map((alumni, index) => normalizeAlumniRecord(alumni, index))
        : [];

      if (approvedAlumni.length) {
        const merged = [...approvedAlumni];
        const seenEmails = new Set(approvedAlumni.map((alumni) => alumni.email).filter(Boolean));

        fallbackDirectoryData.forEach((alumni) => {
          if (!alumni.email || !seenEmails.has(alumni.email)) {
            merged.push(alumni);
          }
        });

        setAlumniData(merged);
      } else {
        setAlumniData(fallbackDirectoryData);
      }
      setLoadError('');
    } catch (error) {
      console.error('Failed to load alumni directory:', error);
      setAlumniData(fallbackDirectoryData);
      setLoadError('');
    }
  };

  const departments = [
    { value: 'all', label: 'All Departments' },
    ...[...new Set(alumniData.map((alumni) => alumni.department).filter(Boolean))]
      .sort()
      .map((department) => ({ value: department, label: department }))
  ];

  const graduationYears = [
    { value: 'all', label: 'All Years' },
    ...[...new Set(alumniData.map((alumni) => alumni.graduationYear).filter(Boolean))]
      .sort((a, b) => b - a)
      .map((year) => ({ value: year.toString(), label: year.toString() }))
  ];

  const filteredAlumni = alumniData.filter(alumni => {
    const matchesSearch = 
      alumni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alumni.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alumni.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alumni.department || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = selectedDepartment === 'all' || alumni.department === selectedDepartment;
    const matchesYear = selectedYear === 'all' || alumni.graduationYear.toString() === selectedYear;

    return matchesSearch && matchesDepartment && matchesYear;
  });

  // Close modal when clicking outside
  useEffect(() => {
    if (selectedAlumni) {
      document.body.style.overflow = 'hidden';
      setPhotoDraft(selectedAlumni.profileImage || '');
      setPhotoMessage('');
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedAlumni]);

  const isOwnProfile = Boolean(
    selectedAlumni &&
    isAuthenticated() &&
    userType === 'alumni' &&
    (
      selectedAlumni.id === user?._id ||
      selectedAlumni.id === user?.id ||
      (selectedAlumni.email && user?.email && selectedAlumni.email === user.email)
    )
  );

  const handlePhotoUpdate = async () => {
    if (!photoDraft.trim()) {
      setPhotoMessage('Enter a profile photo URL first.');
      return;
    }

    setPhotoSaving(true);
    setPhotoMessage('');

    const result = await updateProfile({ profileImage: photoDraft.trim() });
    setPhotoSaving(false);

    if (!result.success) {
      setPhotoMessage(result.error || 'Unable to submit the profile photo update.');
      return;
    }

    setPhotoMessage(result.message || 'Profile photo update submitted for admin approval.');
  };

  const selectedExperienceSections = selectedAlumni ? buildExperienceSections(selectedAlumni) : [];
  const selectedSkills = Array.isArray(selectedAlumni?.skills) ? selectedAlumni.skills : [];
  const selectedHighlights = Array.isArray(selectedAlumni?.experience) ? selectedAlumni.experience : [];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Alumni Directory</h1>
        <p style={styles.headerSubtitle}>
          Connect with approved UIT RGPV alumni across the globe
        </p>
      </div>

      <div style={styles.content}>
        {/* Stats */}
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{alumniData.length}</div>
            <div style={styles.statLabel}>Total Alumni</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>
              {[...new Set(alumniData.map(alum => alum.company))].length}
            </div>
            <div style={styles.statLabel}>Companies</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{departments.length - 1}</div>
            <div style={styles.statLabel}>Departments</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>
              {[...new Set(alumniData.map(alum => (alum.location || '').split(', ').pop()).filter(Boolean))].length}
            </div>
            <div style={styles.statLabel}>Cities</div>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          <div style={styles.searchBox}>
            <Search size={20} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name, company, role, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={styles.select}
          >
            {departments.map(dept => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
          
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={styles.select}
          >
            {graduationYears.map(year => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
        </div>

        {/* Alumni Grid */}
        {loadError && (
          <div style={{ ...styles.noResults, color: '#b91c1c', border: '1px solid #fecaca' }}>
            <h3>Directory unavailable</h3>
            <p>{loadError}</p>
          </div>
        )}

        <div style={styles.grid}>
          {filteredAlumni.map(alumni => (
            <div
              key={alumni.id}
              style={styles.card}
              onClick={() => setSelectedAlumni(alumni)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <img
                src={alumni.profileImage}
                alt={alumni.name}
                style={styles.cardImage}
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={styles.fallbackImage}>
                {alumni.name.split(' ').map(n => n[0]).join('')}
              </div>
              
              <h3 style={styles.cardName}>{alumni.name}</h3>
              <p style={styles.cardJob}>{alumni.jobTitle}</p>
              <p style={styles.cardCompany}>{alumni.company}</p>
              
              <div style={styles.cardDetails}>
                <div style={styles.detailItem}>
                  <GraduationCap size={16} />
                  <span>Batch {alumni.graduationYear}</span>
                </div>
                <div style={styles.detailItem}>
                  <Briefcase size={16} />
                  <span>{alumni.department}</span>
                </div>
                <div style={styles.detailItem}>
                  <MapPin size={16} />
                  <span>{alumni.location}</span>
                </div>
              </div>
              
              <p style={styles.cardBio}>
                {alumni.bio ? `${alumni.bio.substring(0, 120)}${alumni.bio.length > 120 ? '...' : ''}` : 'No professional bio added yet.'}
              </p>
              
              <div style={styles.cardActions}>
                {alumni.linkedinUrl && (
                  <button
                    style={styles.linkedinButton}
                    onClick={e => {
                      e.stopPropagation();
                      window.open(alumni.linkedinUrl, '_blank');
                    }}
                  >
                    <Linkedin size={16} /> LinkedIn
                  </button>
                )}
                {alumni.email && (
                  <button
                    style={styles.emailButton}
                    onClick={e => {
                      e.stopPropagation();
                      window.location.href = `mailto:${alumni.email}`;
                    }}
                  >
                    <Mail size={16} /> Email
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredAlumni.length === 0 && (
          <div style={styles.noResults}>
            <div style={{ fontSize: '3rem' }}>🔍</div>
            <h3>No alumni found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Scrollable Profile Panel */}
      {selectedAlumni && (
        <div style={styles.overlay} onClick={() => setSelectedAlumni(null)}>
          <div style={styles.profilePanel} onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button style={styles.closeButton} onClick={() => setSelectedAlumni(null)}>
              <X size={24} />
            </button>

            {/* Profile Image */}
            <div style={styles.profileImageContainer}>
              <img
                src={selectedAlumni.profileImage}
                alt={selectedAlumni.name}
                style={styles.profileImage}
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={styles.profileFallback}>
                {selectedAlumni.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>

            {/* Profile Content - Scrollable */}
            <div style={styles.profileContent}>
              <h2 style={styles.profileName}>{selectedAlumni.name}</h2>
              <p style={styles.profileJob}>{selectedAlumni.jobTitle}</p>
              <p style={styles.profileCompany}>{selectedAlumni.company}</p>

              {/* Badges */}
              <div style={styles.badges}>
                <span style={styles.badge}>
                  {selectedAlumni.department}
                </span>
                <span style={styles.badge}>
                  Batch {selectedAlumni.graduationYear}
                </span>
              </div>

              <div style={styles.detailsSection}>
                <h3 style={styles.sectionTitle}>Experience</h3>
                <div style={styles.experienceStack}>
                  {selectedExperienceSections.map((item, index) => (
                    <div key={item.id} style={styles.experienceBlock}>
                      <div style={styles.experienceHeader}>
                        <div style={styles.experienceLogo}>
                          {(item.company || 'C').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div style={styles.experienceCompany}>{item.company}</div>
                          <div style={styles.experienceMeta}>{item.companyMeta}</div>
                        </div>
                      </div>

                      <div style={styles.experienceTimeline}>
                        <div style={styles.experienceTimelineDot} />
                        {index !== selectedExperienceSections.length - 1 ? <div style={styles.experienceTimelineLine} /> : null}
                      </div>

                      <div style={styles.experienceContent}>
                        <div style={styles.experienceRole}>{item.role}</div>
                        <div style={styles.experienceDuration}>{item.duration}</div>
                        {item.summary ? <p style={styles.experienceSummary}>{item.summary}</p> : null}
                        {item.skills.length ? (
                          <div style={styles.experienceSkillsRow}>
                            {item.skills.map((skill) => (
                              <span key={`${item.id}-${skill}`} style={styles.experienceSkillChip}>{skill}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.detailsSection}>
                <h3 style={styles.sectionTitle}>Profile Details</h3>
                <div style={styles.detailGrid}>
                  <div style={styles.detailCard}>
                    <GraduationCap size={20} style={styles.detailIcon} />
                    <div>
                      <div style={styles.detailLabel}>Enrollment Number</div>
                      <div style={styles.detailValue}>{selectedAlumni.enrollmentNumber || 'Not available'}</div>
                    </div>
                  </div>

                  <div style={styles.detailCard}>
                    <Mail size={20} style={styles.detailIcon} />
                    <div>
                      <div style={styles.detailLabel}>Email</div>
                      <div style={styles.detailValue}>{selectedAlumni.email || 'Not available'}</div>
                    </div>
                  </div>
                  
                  <div style={styles.detailCard}>
                    <Phone size={20} style={styles.detailIcon} />
                    <div>
                      <div style={styles.detailLabel}>Phone</div>
                      <div style={styles.detailValue}>{selectedAlumni.mobile || 'Not available'}</div>
                    </div>
                  </div>
                  
                  <div style={styles.detailCard}>
                    <MapPin size={20} style={styles.detailIcon} />
                    <div>
                      <div style={styles.detailLabel}>Location</div>
                      <div style={styles.detailValue}>{selectedAlumni.location}</div>
                    </div>
                  </div>
                  
                  <div style={styles.detailCard}>
                    <Briefcase size={20} style={styles.detailIcon} />
                    <div>
                      <div style={styles.detailLabel}>Current Role</div>
                      <div style={styles.detailValue}>{selectedAlumni.jobTitle || 'Not available'}</div>
                    </div>
                  </div>
                  
                  <div style={styles.detailCard}>
                    <Briefcase size={20} style={styles.detailIcon} />
                    <div>
                      <div style={styles.detailLabel}>Current Company</div>
                      <div style={styles.detailValue}>{selectedAlumni.company || 'Not available'}</div>
                    </div>
                  </div>

                  <div style={styles.detailCard}>
                    <GraduationCap size={20} style={styles.detailIcon} />
                    <div>
                      <div style={styles.detailLabel}>Department</div>
                      <div style={styles.detailValue}>{selectedAlumni.department}</div>
                    </div>
                  </div>

                  <div style={styles.detailCard}>
                    <GraduationCap size={20} style={styles.detailIcon} />
                    <div>
                      <div style={styles.detailLabel}>Graduation Year</div>
                      <div style={styles.detailValue}>{selectedAlumni.graduationYear}</div>
                    </div>
                  </div>

                  <div style={styles.detailCard}>
                    <Linkedin size={20} style={styles.detailIcon} />
                    <div>
                      <div style={styles.detailLabel}>LinkedIn</div>
                      <div style={styles.detailValue}>{selectedAlumni.linkedinUrl || 'Not available'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div style={styles.bioSection}>
                <h3 style={styles.sectionTitle}>About</h3>
                <p style={styles.bioText}>{selectedAlumni.bio || 'No professional bio added yet.'}</p>
              </div>

              <div style={styles.bioSection}>
                <h3 style={styles.sectionTitle}>Skills</h3>
                {selectedSkills.length ? (
                  <div style={styles.skillChipRow}>
                    {selectedSkills.map((skill) => (
                      <span key={`${selectedAlumni.id}-${skill}`} style={styles.skillChip}>{skill}</span>
                    ))}
                  </div>
                ) : (
                  <p style={styles.bioText}>No skills listed yet.</p>
                )}
              </div>

              <div style={styles.bioSection}>
                <h3 style={styles.sectionTitle}>Highlights</h3>
                {selectedHighlights.length ? (
                  <div style={styles.highlightList}>
                    {selectedHighlights.map((item) => (
                      <div key={`${selectedAlumni.id}-${item}`} style={styles.highlightItem}>{item}</div>
                    ))}
                  </div>
                ) : (
                  <p style={styles.bioText}>No experience highlights added yet.</p>
                )}
              </div>

              {isOwnProfile && (
                <div style={styles.bioSection}>
                  <h3 style={styles.sectionTitle}>Profile Photo</h3>
                  <p style={styles.photoHint}>
                    Update your profile photo here. It will appear in the directory after admin approval.
                  </p>
                  <div style={styles.photoEditBox}>
                    <input
                      type="url"
                      value={photoDraft}
                      onChange={(event) => setPhotoDraft(event.target.value)}
                      placeholder="https://your-image-url"
                      style={styles.photoInput}
                    />
                    <button
                      type="button"
                      style={styles.photoSaveButton}
                      onClick={handlePhotoUpdate}
                      disabled={photoSaving}
                    >
                      {photoSaving ? 'Submitting...' : 'Submit Photo Update'}
                    </button>
                  </div>
                  {photoMessage ? <p style={styles.photoMessage}>{photoMessage}</p> : null}
                </div>
              )}

              {/* Action Buttons */}
              <div style={styles.actionButtons}>
                {selectedAlumni.linkedinUrl && (
                  <button
                    style={styles.profileLinkedinButton}
                    onClick={() => window.open(selectedAlumni.linkedinUrl, '_blank')}
                  >
                    <Linkedin size={20} />
                    Connect on LinkedIn
                  </button>
                )}
                {selectedAlumni.email && (
                  <button
                    style={styles.profileEmailButton}
                    onClick={() => window.location.href = `mailto:${selectedAlumni.email}`}
                  >
                    <Mail size={20} />
                    Send Email
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    background: 'linear-gradient(135deg, #0a4a7a 0%, #1e6ba8 100%)',
    color: 'white',
    padding: '60px 20px',
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: '800',
    marginBottom: '16px',
  },
  headerSubtitle: {
    fontSize: 'clamp(1rem, 2vw, 1.2rem)',
    opacity: 0.9,
    maxWidth: '600px',
    margin: '0 auto',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '15px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#0a4a7a',
    marginBottom: '8px',
  },
  statLabel: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  filters: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    marginBottom: '40px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    width: '100%',
    padding: '15px 15px 15px 45px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '16px',
    fontFamily: "'Inter', sans-serif",
  },
  searchIcon: {
    position: 'absolute',
    left: '15px',
    color: '#9ca3af',
  },
  select: {
    width: '100%',
    padding: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '16px',
    fontFamily: "'Inter', sans-serif",
    backgroundColor: 'white',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '25px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  cardImage: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '20px',
    border: '3px solid #f0f0f0',
  },
  fallbackImage: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#0a4a7a',
    color: 'white',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  cardName: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '5px',
  },
  cardJob: {
    color: '#0a4a7a',
    fontWeight: '600',
    marginBottom: '5px',
  },
  cardCompany: {
    color: '#6b7280',
    fontSize: '0.9rem',
    marginBottom: '15px',
  },
  cardDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '15px',
    width: '100%',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#6b7280',
    fontSize: '0.85rem',
    justifyContent: 'center',
  },
  cardBio: {
    color: '#4b5563',
    lineHeight: '1.6',
    fontSize: '0.9rem',
    marginBottom: '20px',
    textAlign: 'left',
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
    width: '100%',
    marginTop: 'auto',
  },
  linkedinButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#0077b5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    fontSize: '0.85rem',
    fontWeight: '500',
    transition: 'background-color 0.3s ease',
  },
  emailButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    fontSize: '0.85rem',
    fontWeight: '500',
    transition: 'background-color 0.3s ease',
  },
  noResults: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280',
    backgroundColor: 'white',
    borderRadius: '15px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  
  // Profile Panel Styles
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  profilePanel: {
    backgroundColor: 'white',
    borderRadius: '26px',
    width: '100%',
    maxWidth: '920px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    boxShadow: '0 24px 48px rgba(15, 23, 42, 0.24)',
  },
  closeButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    backgroundColor: 'white',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  profileImageContainer: {
    background: 'linear-gradient(135deg, #0b3b60 0%, #145a86 62%, #0f766e 100%)',
    padding: '42px 40px 34px',
    textAlign: 'center',
  },
  profileImage: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '5px solid white',
    boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
  },
  profileFallback: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    backgroundColor: 'white',
    color: '#0a4a7a',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
    fontWeight: 'bold',
    border: '5px solid white',
    boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
    margin: '0 auto',
  },
  profileContent: {
    padding: '32px',
    overflowY: 'auto',
    flex: 1,
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%)',
  },
  profileName: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: '5px',
    textAlign: 'center',
  },
  profileJob: {
    color: '#0a4a7a',
    fontWeight: '600',
    fontSize: '1.1rem',
    marginBottom: '5px',
    textAlign: 'center',
  },
  profileCompany: {
    color: '#6b7280',
    fontSize: '1rem',
    marginBottom: '20px',
    textAlign: 'center',
  },
  badges: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '34px',
    flexWrap: 'wrap',
  },
  badge: {
    padding: '9px 16px',
    backgroundColor: '#eef6ff',
    color: '#0a4a7a',
    borderRadius: '999px',
    fontSize: '0.9rem',
    fontWeight: '600',
    border: '1px solid #dbeafe',
  },
  detailsSection: {
    marginBottom: '30px',
  },
  experienceStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '22px',
  },
  experienceBlock: {
    display: 'grid',
    gridTemplateColumns: 'auto 26px 1fr',
    gap: '14px',
    alignItems: 'start',
    padding: '18px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  experienceHeader: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    minWidth: '220px',
  },
  experienceLogo: {
    width: '54px',
    height: '54px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #0a4a7a 0%, #1e6ba8 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    fontWeight: '800',
    flexShrink: 0,
  },
  experienceCompany: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px',
  },
  experienceMeta: {
    color: '#6b7280',
    fontSize: '0.95rem',
    lineHeight: '1.6',
  },
  experienceTimeline: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100%',
    paddingTop: '8px',
  },
  experienceTimelineDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#9ca3af',
    flexShrink: 0,
  },
  experienceTimelineLine: {
    width: '2px',
    flex: 1,
    backgroundColor: '#d1d5db',
    marginTop: '6px',
  },
  experienceContent: {
    paddingTop: '2px',
  },
  experienceRole: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '6px',
  },
  experienceDuration: {
    color: '#6b7280',
    fontSize: '0.95rem',
    marginBottom: '10px',
  },
  experienceSummary: {
    color: '#4b5563',
    lineHeight: '1.8',
    fontSize: '0.96rem',
    marginBottom: '12px',
  },
  experienceSkillsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  experienceSkillChip: {
    padding: '7px 12px',
    borderRadius: '999px',
    backgroundColor: '#eef6ff',
    color: '#0a4a7a',
    fontWeight: '600',
    fontSize: '0.85rem',
  },
  sectionTitle: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '20px',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '15px',
  },
  detailCard: {
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)',
  },
  detailIcon: {
    color: '#0a4a7a',
  },
  detailLabel: {
    fontSize: '0.85rem',
    color: '#6b7280',
    marginBottom: '4px',
  },
  detailValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937',
  },
  bioSection: {
    marginBottom: '30px',
  },
  bioText: {
    color: '#4b5563',
    lineHeight: '1.8',
    fontSize: '1rem',
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
  },
  skillChipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  skillChip: {
    padding: '9px 13px',
    borderRadius: '999px',
    backgroundColor: '#eef6ff',
    color: '#0a4a7a',
    fontWeight: '600',
    fontSize: '0.88rem',
    border: '1px solid #dbeafe',
  },
  highlightList: {
    display: 'grid',
    gap: '12px',
  },
  highlightItem: {
    padding: '16px 18px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    color: '#374151',
    lineHeight: '1.7',
    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)',
  },
  photoHint: {
    color: '#4b5563',
    lineHeight: '1.7',
    marginBottom: '14px',
  },
  photoEditBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  photoInput: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    fontFamily: "'Inter', sans-serif",
  },
  photoSaveButton: {
    alignSelf: 'flex-start',
    padding: '12px 18px',
    backgroundColor: '#0a4a7a',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.95rem',
  },
  photoMessage: {
    marginTop: '12px',
    color: '#0a4a7a',
    fontWeight: '500',
    lineHeight: '1.6',
  },
  actionButtons: {
    display: 'flex',
    gap: '15px',
    marginTop: '30px',
  },
  profileLinkedinButton: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#0077b5',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'background-color 0.3s ease',
  },
  profileEmailButton: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#0a4a7a',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'background-color 0.3s ease',
  },
};

export default AlumniDirectory;
