// src/pages/JobPostings.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/JobPostings.css'; // Make sure this CSS file exists
import { FaMapMarkerAlt, FaGlobe, FaBuilding, FaEuroSign, FaCalendarAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { formatDate } from '../utils/formatDate';
import { useUserContext } from '../context/UserContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// --- Interfaces (can be moved to a shared types file) ---
interface JobRequirements {
  military_service?: 'Completed' | 'Not Required' | 'Not Applicable';
  university_degree?: { required: boolean; details?: string; };
  foreign_languages?: { language: string; certificate: string; }[];
  experience_years?: '0-3' | '4-7' | '7-10' | '>10';
}

export interface JobPosting { // Exporting so other components can use this type
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

// --- UPDATED PROPS ---
// 'jobs' is now an optional prop. If provided, the component uses it.
// If not provided, it uses employerId to fetch its own data.
interface JobPostingsProps {
  jobs?: JobPosting[];
  employerId?: number;
}

const JobPostings: React.FC<JobPostingsProps> = ({ jobs, employerId }) => {
  const [internalJobPostings, setInternalJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { userType: loggedInUserType, userId: loggedInUserId } = useUserContext();
  const isArtist = loggedInUserType === 'Artist';
  
  // State for application logic
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());

  // Determine which list of jobs to display
  const jobsToDisplay = jobs || internalJobPostings;

  useEffect(() => {
    // --- This effect now handles THREE scenarios ---
    // 1. If 'jobs' prop is provided, we don't need to fetch anything.
    if (jobs) {
      setLoading(false);
      return;
    }

    // 2. If 'employerId' is provided, fetch jobs for that employer.
    if (employerId) {
        const fetchJobPostings = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const url = `${API_URL}/api/job-postings/employer?employer_id=${employerId}`;
                const response = await axios.get(url, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                setInternalJobPostings(response.data || []);
            } catch (err) {
                console.error('Error fetching job postings for employer:', err);
                setError('Failed to load job postings.');
            } finally {
                setLoading(false);
            }
        };
        fetchJobPostings();
    } else {
        // 3. If no props are provided, it does nothing and will show an empty state.
        setLoading(false);
    }
  }, [jobs, employerId]); // Effect runs if the props change

  // This second useEffect fetches the artist's applications once we know they are an artist
  useEffect(() => {
    if (isArtist && loggedInUserId) {
        const fetchAppliedJobs = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };
                const appsResponse = await axios.get<{ appliedJobIds: number[] }>(`${API_URL}/api/artists/my-applications`, { headers });
                setAppliedJobIds(new Set(appsResponse.data.appliedJobIds || []));
            } catch (err) {
                console.error("Could not fetch applied jobs status.", err);
            }
        };
        fetchAppliedJobs();
    }
  }, [isArtist, loggedInUserId]);

  const handleApply = async (jobId: number) => {
    // ... your handleApply logic remains the same ...
  };

  if (loading) return <p className="loading-message">Loading job postings...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="job-postings-container">
      {jobsToDisplay.length > 0 ? (
        jobsToDisplay.map((job) => (
          <div key={job.job_id} className="job-card-detailed">
            <div className="job-card-header">
              <h3>{job.title}</h3>
              {/* Only show "Posted by" if the employer data is available */}
              {job.employer?.user && (
                <p className="employer-name">
                  Posted by: <Link to={`/user-profile/${job.employer.user.user_id}`}>{job.employer.user.fullname}</Link>
                </p>
              )}
              <span className="post-date">Posted on {formatDate(job.createdAt)}</span>
            </div>

            {/* The rest of the card JSX remains exactly the same, displaying all the rich data */}
            <div className="job-card-tags">
                <span className="tag-item category-tag">{job.category}</span>
                {job.location && <span className="tag-item"><FaMapMarkerAlt /> {job.location}</span>}
                {job.presence === 'Online' && <span className="tag-item"><FaGlobe /> Online</span>}
                {job.presence === 'Physical' && <span className="tag-item"><FaBuilding /> On-site</span>}
                {job.presence === 'Both' && <span className="tag-item"><FaGlobe /> / <FaBuilding /> Hybrid</span>}
            </div>

            {job.description && <p className="job-card-description">{job.description}</p>}

            <div className="job-card-details-grid">
                {/* ... all your detail-item divs for payment, duration, etc. ... */}
            </div>
            
            {job.requirements && <div className="job-card-requirements">{/* ... requirements list ... */}</div>}
            {job.desired_keywords && <div className="job-card-keywords">{/* ... keywords ... */}</div>}
            
            {isArtist && (
              <div className="job-card-actions">
                {/* Apply button logic can stay, it will be relevant when viewing other employer's profiles */}
              </div>
            )}
          </div>
        ))
      ) : (
        <p>No job postings to display.</p>
      )}
    </div>
  );
};

export default JobPostings;