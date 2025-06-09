// src/pages/JobPostings.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/JobPostings.css'; // We'll create this new CSS file
import { FaMapMarkerAlt, FaGlobe, FaBuilding, FaEuroSign, FaFileContract, FaCalendarAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { formatDate } from '../utils/formatDate'; // Assuming you have this utility

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
  employerId?: number; // To show jobs for a specific employer, e.g., on their profile
}

const JobPostings: React.FC<JobPostingsProps> = ({ employerId }) => {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isArtist = storedUser?.user_type === 'Artist';

  useEffect(() => {
    const fetchJobPostings = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        let url = `${API_URL}/api/job-postings`;

        if (employerId) {
          // Assuming your backend can filter by employer_id
          url += `?employer_id=${employerId}`;
        }

        const response = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        setJobPostings(response.data || []);
      } catch (err) {
        console.error('Error fetching job postings:', err);
        setError('Failed to load job postings.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobPostings();
  }, [employerId]);

  const handleApply = async (jobId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !isArtist) {
        alert("You must be logged in as an artist to apply.");
        return;
      }

      // --- CORRECTED API PATH ---
      const response = await axios.post(
        `${API_URL}/api/job-postings/${jobId}/apply`, // The route is /job-postings/:jobId/apply
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
              <p className="employer-name">
                Posted by: <Link to={`/user-profile/${job.employer?.user?.user_id}`}>{job.employer?.user?.fullname || 'N/A'}</Link>
              </p>
              <span className="post-date">Posted on {formatDate(job.createdAt)}</span>
            </div>

            <div className="job-card-tags">
                <span className="tag-item category-tag">{job.category}</span>
                {job.location && <span className="tag-item"><FaMapMarkerAlt /> {job.location}</span>}
                {job.presence === 'Online' && <span className="tag-item"><FaGlobe /> Online</span>}
                {job.presence === 'Physical' && <span className="tag-item"><FaBuilding /> On-Site</span>}
                {job.presence === 'Both' && <span className="tag-item"><FaGlobe />/<FaBuilding /> Hybrid</span>}
            </div>

            {job.description && <p className="job-card-description">{job.description}</p>}

            <div className="job-card-details-grid">
                <div className="detail-item">
                    <strong>Total Payment:</strong>
                    <span><FaEuroSign /> {job.payment_total.toFixed(2)} {job.payment_is_monthly && `(€${job.payment_monthly_amount?.toFixed(2)}/month)`}</span>
                </div>
                <div className="detail-item">
                    <strong>Duration:</strong>
                    <span>{formatDate(job.start_date)} to {formatDate(job.end_date)}</span>
                </div>
                <div className="detail-item">
                    <strong>Insurance:</strong>
                    <span>{job.insurance ? <><FaCheckCircle color="green" /> Included</> : <><FaTimesCircle color="gray" /> Not Included</>}</span>
                </div>
                {job.application_deadline && <div className="detail-item">
                    <strong>Apply by:</strong>
                    <span><FaCalendarAlt /> {formatDate(job.application_deadline)}</span>
                </div>}
            </div>
            
            {job.requirements && <div className="job-card-requirements">
                <h4>Requirements</h4>
                <ul>
                    {job.requirements.experience_years && <li>Experience: <strong>{job.requirements.experience_years} years</strong></li>}
                    {job.requirements.university_degree?.required && <li>Degree: <strong>{job.requirements.university_degree.details || 'Required'}</strong></li>}
                    {job.requirements.military_service && job.requirements.military_service !== 'Not Applicable' && <li>Military Service: <strong>{job.requirements.military_service}</strong></li>}
                    {job.requirements.foreign_languages && job.requirements.foreign_languages.length > 0 && (
                        <li>Languages: {job.requirements.foreign_languages.map(l => `${l.language} (${l.certificate})`).join(', ')}</li>
                    )}
                </ul>
            </div>}

            {job.desired_keywords && <div className="job-card-keywords">
                <h4>Desired Keywords</h4>
                <p>{job.desired_keywords}</p>
            </div>}
            
            {isArtist && (
              <div className="job-card-actions">
                <button onClick={() => handleApply(job.job_id)} className="apply-button-detailed">
                  Apply Now
                </button>
              </div>
            )}
          </div>
        ))
      ) : (
        <p>No job postings available matching your criteria.</p>
      )}
    </div>
  );
};

export default JobPostings;