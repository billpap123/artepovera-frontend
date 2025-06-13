// src/pages/JobFeed.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaGlobe, FaBuilding, FaEuroSign, FaCalendarAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { formatDate } from '../utils/formatDate';
import { useUserContext } from '../context/UserContext';
import '../styles/JobFeed.css';
import { useTranslation } from "react-i18next";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// --- Interfaces (can be moved to a shared types file) ---
interface JobRequirements {
    military_service?: 'Completed' | 'Not Required' | 'Not Applicable';
    university_degree?: { required: boolean; details?: string; };
    foreign_languages?: { language: string; certificate: string; }[];
    experience_years?: '0-3' | '4-7' | '7-10' | '>10';
}

interface Job {
    job_id: number;
    title: string;
    category: string;
    description?: string | null;
    location?: string | null;
    presence: 'Physical' | 'Online' | 'Both';
    start_date?: string | null;
    end_date?: string | null;
    application_deadline?: string | null;
    payment_total: number;
    payment_is_monthly?: boolean;
    payment_monthly_amount?: number | null;
    insurance?: boolean | null;
    desired_keywords?: string | null;
    requirements?: JobRequirements | null;
    createdAt: string;
    employer?: {
        user?: {
            user_id: number;
            fullname: string;
            profile_picture: string | null;
        }
    }
}

// --- Define Props for this component ---
interface JobFeedProps {
    jobs: Job[]; // It now receives the jobs array as a prop
    isLoading: boolean;
    error: string | null;
}

const JobFeed: React.FC<JobFeedProps> = ({ jobs, isLoading, error }) => {
  const { userType, userId } = useUserContext();
  const isArtist = userType === 'Artist';
  const { t } = useTranslation();

  // State for application logic (which buttons are loading, which jobs are applied to)
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [applyingToJobId, setApplyingToJobId] = useState<number | null>(null);

  // This useEffect fetches the user's existing applications to disable buttons correctly
  useEffect(() => {
    let isMounted = true;
    if (isArtist && userId) {
        const fetchAppliedJobs = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };
                const appsResponse = await axios.get<{ appliedJobIds: number[] }>(`${API_URL}/api/artists/my-applications`, { headers });
                if (isMounted) {
                    setAppliedJobIds(new Set(appsResponse.data.appliedJobIds || []));
                }
            } catch (err) {
                console.error("Could not fetch applied jobs status.", err);
            }
        };
        fetchAppliedJobs();
    }
    return () => { isMounted = false; };
  }, [isArtist, userId]);
  

  const handleApply = async (jobId: number) => {
    if (applyingToJobId === jobId) return;
    setApplyingToJobId(jobId);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to apply for jobs.");
        setApplyingToJobId(null);
        return;
      }
      const response = await axios.post(`${API_URL}/api/job-postings/${jobId}/apply`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert(response.data.message || "Application successful!");
      setAppliedJobIds(prev => new Set(prev).add(jobId)); // Update UI immediately
    } catch (error: any) {
      console.error(`Error applying to job ${jobId}:`, error);
      if (error.response?.status === 409) { // Handle "Already Applied" error
          setAppliedJobIds(prev => new Set(prev).add(jobId));
      }
      alert(error.response?.data?.message || "Failed to apply.");
    } finally {
      setApplyingToJobId(null);
    }
  };

  if (isLoading) return <p className="loading-message">Loading job feed...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="job-feed-display-container">
      {jobs.length > 0 ? (
        jobs.map((job) => (
          <div key={job.job_id} className="job-card-detailed">
            <div className="job-card-header">
              <h3>{job.title}</h3>
              <p className="employer-name">
                {t('jobFeed.card.postedBy')}{' '}
                <Link to={`/user-profile/${job.employer?.user?.user_id}`}>
                  {job.employer?.user?.fullname || t('jobFeed.card.notAvailable')}
                </Link>
              </p>
              <span className="post-date">
                {t('jobFeed.card.postedOn')} {formatDate(job.createdAt)}
              </span>
            </div>

            <div className="job-card-tags">
              <span className="tag-item category-tag">{job.category}</span>
              {job.location && <span className="tag-item"><FaMapMarkerAlt /> {job.location}</span>}
              {job.presence === 'Online' && <span className="tag-item"><FaGlobe /> {t('jobFeed.card.online')}</span>}
              {job.presence === 'Physical' && <span className="tag-item"><FaBuilding /> {t('jobFeed.card.onSite')}</span>}
              {job.presence === 'Both' && <span className="tag-item"><FaGlobe />/<FaBuilding /> {t('jobFeed.card.hybrid')}</span>}
            </div>

            {job.description && <p className="job-card-description">{job.description}</p>}

            <div className="job-card-details-grid">
              <div className="detail-item">
                <strong>{t('jobFeed.card.totalPayment')}</strong>
                <span>
                  <FaEuroSign /> {job.payment_total != null ? Number(job.payment_total).toFixed(2) : t('jobFeed.card.notAvailable')}{' '}
                  {job.payment_is_monthly && `(€${job.payment_monthly_amount != null ? Number(job.payment_monthly_amount).toFixed(2) : t('jobFeed.card.notAvailable')}${t('jobFeed.card.perMonth')})`}
                </span>
              </div>
              <div className="detail-item">
                <strong>{t('jobFeed.card.duration')}</strong>
                <span>
                  {formatDate(job.start_date)} {t('jobFeed.card.to')} {formatDate(job.end_date)}
                </span>
              </div>
              <div className="detail-item">
                <strong>{t('jobFeed.card.insurance')}</strong>
                <span>
                  {job.insurance ? (
                    <><FaCheckCircle color="green" /> {t('jobFeed.card.included')}</>
                  ) : (
                    <><FaTimesCircle color="gray" /> {t('jobFeed.card.notIncluded')}</>
                  )}
                </span>
              </div>
              {job.application_deadline && (
                <div className="detail-item">
                  <strong>{t('jobFeed.card.applyBy')}</strong>
                  <span><FaCalendarAlt /> {formatDate(job.application_deadline)}</span>
                </div>
              )}
            </div>

            {job.requirements && (
              <div className="job-card-requirements">
                <h4>{t('jobFeed.card.requirements')}</h4>
                <ul>
                  {job.requirements.experience_years && <li>{t('jobFeed.card.experience')} <strong>{job.requirements.experience_years} {t('jobFeed.card.years')}</strong></li>}
                  {job.requirements.university_degree?.required && <li>{t('jobFeed.card.degree')} <strong>{job.requirements.university_degree.details || t('jobFeed.card.required')}</strong></li>}
                  {job.requirements.military_service && job.requirements.military_service !== 'Not Applicable' && <li>{t('jobFeed.card.militaryService')} <strong>{job.requirements.military_service}</strong></li>}
                  {job.requirements.foreign_languages && job.requirements.foreign_languages.length > 0 && (
                    <li>{t('jobFeed.card.languages')} {job.requirements.foreign_languages.map(l => `${l.language} (${l.certificate})`).join(', ')}</li>
                  )}
                </ul>
              </div>
            )}

            {job.desired_keywords && (
              <div className="job-card-keywords">
                <h4>{t('jobFeed.card.desiredKeywords')}</h4>
                <p>{job.desired_keywords}</p>
              </div>
            )}

            {isArtist && (
              <div className="job-card-actions">
                <button
                  onClick={() => handleApply(job.job_id)}
                  className="apply-button-detailed"
                  disabled={appliedJobIds.has(job.job_id) || applyingToJobId === job.job_id}
                >
                  {applyingToJobId === job.job_id
                    ? t('jobFeed.actions.applying')
                    : appliedJobIds.has(job.job_id)
                    ? t('jobFeed.actions.applied')
                    : t('jobFeed.actions.applyNow')}
                </button>
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="no-jobs-message">{t('jobFeed.status.noJobs')}</p>
      )}
    </div>
  );
};

export default JobFeed;