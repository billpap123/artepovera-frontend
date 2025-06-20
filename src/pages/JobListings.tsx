// src/pages/JobPostings.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/JobPostings.css'; // Make sure this CSS file exists
import { FaMapMarkerAlt, FaGlobe, FaBuilding, FaEuroSign, FaCalendarAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { formatDate } from '../utils/formatDate'; // Assuming you have this utility
import { useUserContext } from '../context/UserContext'; // To check user type
import { useTranslation } from "react-i18next";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// --- New, Detailed Interfaces ---
interface JobRequirements {
  military_service?: 'Completed' | 'Not Required' | 'Not Applicable';
  university_degree?: {
    required: boolean;
    details?: string;
  };
  foreign_languages?: { language: string; certificate: string; }[];
  experience_years?: '0-3' | '4-7' | '7-10' | '>10';
}

interface JobPosting {
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
  createdAt: string; // From Sequelize timestamps
  employer?: {
      user?: {
          user_id: number;
          fullname: string;
          profile_picture: string | null;
      }
  }
}

interface JobPostingsProps {
  employerId?: number; // This prop determines which employer's jobs to show
}

const JobPostings: React.FC<JobPostingsProps> = ({ employerId }) => {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { userType: loggedInUserType } = useUserContext();
  const isArtist = loggedInUserType === 'Artist';

  useEffect(() => {
    // No need to fetch if an employerId isn't provided to the component
    if (!employerId) {
        setLoading(false);
        setJobPostings([]);
        return;
    }

    const fetchJobPostings = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        // Your backend endpoint to get jobs by a specific employer
        const url = `${API_URL}/api/job-postings/employer?employer_id=${employerId}`;

        const response = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        setJobPostings(response.data || []);
      } catch (err) {
        console.error('Error fetching job postings for employer:', err);
        setError('Failed to load job postings.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobPostings();
  }, [employerId]); // Effect runs when employerId changes

  const handleApply = async (jobId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !isArtist) {
        alert("You must be logged in as an artist to apply.");
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/job-postings/${jobId}/apply`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(response.data.message || "Application successful!");
    } catch (error: any) {
      console.error(`Error applying to job ${jobId}:`, error);
      alert(error.response?.data?.message || "Failed to apply. You may have already applied to this job.");
    }
  };

  if (loading) return <p className="loading-message">Loading job postings...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="job-postings-container">
      {jobPostings.length > 0 ? (
        jobPostings.map((job) => (
          <div key={job.job_id} className="job-card-detailed">
            <div className="job-card-header">
              <h3>{job.title}</h3>
              <span className="post-date">{t('jobPostings.card.postedOn')} {formatDate(job.createdAt)}</span>
            </div>

            <div className="job-card-tags">
                <span className="tag-item category-tag">{job.category}</span>
                {job.location && <span className="tag-item"><FaMapMarkerAlt /> {job.location}</span>}
                {job.presence === 'Online' && <span className="tag-item"><FaGlobe /> {t('jobPostings.card.online')}</span>}
                {job.presence === 'Physical' && <span className="tag-item"><FaBuilding /> {t('jobPostings.card.onSite')}</span>}
                {job.presence === 'Both' && <span className="tag-item"><FaGlobe />/<FaBuilding /> {t('jobPostings.card.hybrid')}</span>}
            </div>

            {job.description && <p className="job-card-description">{job.description}</p>}

            <div className="job-card-details-grid">
                <div className="detail-item">
                    <strong>{t('jobPostings.card.totalPayment')}</strong>
                    <span><FaEuroSign /> {job.payment_total.toFixed(2)} {job.payment_is_monthly && `(€${job.payment_monthly_amount?.toFixed(2)}${t('jobPostings.card.perMonth')})`}</span>
                </div>
                <div className="detail-item">
                    <strong>{t('jobPostings.card.duration')}</strong>
                    <span>{formatDate(job.start_date)} {t('jobPostings.card.to')} {formatDate(job.end_date)}</span>
                </div>
                <div className="detail-item">
                    <strong>{t('jobPostings.card.insurance')}</strong>
                    <span>{job.insurance ? <><FaCheckCircle color="green" /> {t('jobPostings.card.included')}</> : <><FaTimesCircle color="gray" /> {t('jobPostings.card.notIncluded')}</>}</span>
                </div>
                {job.application_deadline && <div className="detail-item">
                    <strong>{t('jobPostings.card.applyBy')}</strong>
                    <span><FaCalendarAlt /> {formatDate(job.application_deadline)}</span>
                </div>}
            </div>
            
            {isArtist && (
              <div className="job-card-actions">
                <button onClick={() => handleApply(job.job_id)} className="apply-button-detailed">
                  {t('jobPostings.actions.applyNow')}
                </button>
              </div>
            )}
          </div>
        ))
      ) : (
        <p>{t('jobPostings.status.none')}</p>
      )}
    </div>
  );
};






















export default JobPostings;