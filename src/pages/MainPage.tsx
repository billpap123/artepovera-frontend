// src/pages/MainPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserContext';
import Navbar from '../components/Navbar';
import JobFeed from './JobFeed'; // Your new, simpler JobFeed component
import JobFilters, { Filters } from '../components/JobFilters'; // The new, separate JobFilters component
import '../styles/MainPage.css';
import { 
  FaEye, FaBriefcase, FaUserEdit, FaMapMarkedAlt, 
  FaPlusCircle, FaCommentDots, FaImages, FaUsersCog, FaThList, FaClipboardList 
} from 'react-icons/fa';

// Define the Job interface here or import it from a shared types file
interface JobRequirements {
    military_service?: 'Completed' | 'Not Required' | 'Not Applicable';
    university_degree?: { required: boolean; details?: string; };
    foreign_languages?: { language: string; certificate: string; }[];
    experience_years?: '0-3' | '4-7' | '7-10' | '>10';
}
interface Job {
    job_id: number; title: string; category: string; description?: string | null; location?: string | null;
    presence: 'Physical' | 'Online' | 'Both'; start_date?: string | null; end_date?: string | null;
    application_deadline?: string | null; payment_total: number; payment_is_monthly?: boolean;
    payment_monthly_amount?: number | null; insurance?: boolean | null; desired_keywords?: string | null;
    requirements?: JobRequirements | null; createdAt: string;
    employer?: { user?: { user_id: number; fullname: string; profile_picture: string | null; } }
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

const MainPage = () => {
  const navigate = useNavigate();
  const { userType, userId, fullname } = useUserContext();

  // --- State for Job Feed is now managed here in the parent ---
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs once to fetch all job data.
    const fetchAllJobs = async () => {
      setIsLoadingJobs(true);
      setJobsError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<Job[]>(`${API_URL}/api/job-postings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setAllJobs(response.data || []);
      } catch (err: any) {
        console.error("Error fetching all jobs:", err);
        setJobsError("Failed to load job postings.");
      } finally {
        setIsLoadingJobs(false);
      }
    };
    
    // We only fetch jobs if the user is not an Admin
    if (userType && userType !== 'Admin') {
        fetchAllJobs();
    } else {
        setIsLoadingJobs(false); // If admin, no need to load jobs
    }
  }, [userType]); // Re-run if userType changes (e.g., on login)

  // This function is passed down to the JobFilters component
  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };
  
  // The filtering logic now lives in this parent component
  const filteredJobs = useMemo(() => {
    // If filters haven't been set by the child component yet, show all jobs
    if (!filters) return allJobs;

    return allJobs.filter(job => {
        // Keywords filter (searches title, description, and desired keywords)
        if (filters.keywords) {
            const searchString = filters.keywords.toLowerCase();
            const inTitle = job.title.toLowerCase().includes(searchString);
            const inDescription = job.description?.toLowerCase().includes(searchString) || false;
            const inKeywords = job.desired_keywords?.toLowerCase().includes(searchString) || false;
            if (!inTitle && !inDescription && !inKeywords) return false;
        }
        // Location filter (case-insensitive)
        if (filters.location && !job.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
        
        // Payment filter
        if (filters.minPayment !== '' && job.payment_total < filters.minPayment) return false;
        if (filters.maxPayment !== '' && job.payment_total > filters.maxPayment) return false;

        // Dropdown filters
        if (filters.category && job.category !== filters.category) return false;
        if (filters.presence && job.presence !== filters.presence) return false;
        if (filters.experience && job.requirements?.experience_years !== filters.experience) return false;

        // Insurance filter
        if (filters.insurance === 'yes' && job.insurance !== true) return false;
        if (filters.insurance === 'no' && job.insurance === true) return false;

        return true;
    });
  }, [allJobs, filters]);

  const welcomeName = fullname ? `, ${fullname.split(' ')[0]}` : '';

  return (
    <>
      <Navbar />
      <div className="main-page-container">
        <header className="main-page-header">
          <h1>{userType === 'Admin' ? 'Administrator Control Panel' : `Welcome back${welcomeName}!`}</h1>
          <p>{userType === 'Admin' ? 'Manage users, content, and application data.' : "Here's what's happening in the Arte Povera community today."}</p>
        </header>

        <div className="dashboard-grid">
          {/* Your existing conditional cards for Artist, Employer, and Admin */}
          {userType === 'Artist' && (
            <>
              <Link to={`/user-profile/${userId}`} className="dashboard-card stat-card"><FaEye size={24} className="stat-icon" /><div><h3>My public profile</h3><p>View and share your profile</p></div></Link>
              <Link to="/artist-profile/edit" className="dashboard-card stat-card"><FaUserEdit size={24} className="stat-icon" /><div><h3>Edit my profile</h3><p>Update your bio, CV, and photo</p></div></Link>
              <Link to="/portfolio" className="dashboard-card stat-card"><FaImages size={24} className="stat-icon" /><div><h3>Edit my portfolio</h3><p>Showcase your best work</p></div></Link>
              <Link to="/chat" className="dashboard-card stat-card"><FaCommentDots size={24} className="stat-icon" /><div><h3>My messages</h3><p>Check your conversations</p></div></Link>
              
              {/* --- THIS IS THE ONLY ADDITION --- */}
              <Link to="/my-applications" className="dashboard-card image-link-card">
                <div>
                  <h3>My Applications</h3>
                  <p>Track your job applications</p>
                </div>
              </Link>

              {/* --- CARD 2: UPDATED CLASSNAME AND REMOVED ICON --- */}
              <Link to="/map" className="dashboard-card image-link-card">
                <div>
                  <h3>Community Map</h3>
                  <p>Discover artists & employers</p>
                </div>
              </Link>

              {/* --- END OF ADDITION --- */}
            </>
          )}

          {userType === 'Employer' && (
            <>
              <Link to={`/user-profile/${userId}`} className="dashboard-card stat-card"><FaEye size={24} className="stat-icon" /><div><h3>My public profile</h3><p>View your employer profile</p></div></Link>
              <Link to="/employer-profile/edit" className="dashboard-card stat-card"><FaUserEdit size={24} className="stat-icon" /><div><h3>Edit my profile</h3><p>Update your bio and photo</p></div></Link>
              <Link to="/post-job" className="dashboard-card stat-card"><FaPlusCircle size={24} className="stat-icon" /><div><h3>Post a new job</h3><p>Find the perfect artist</p></div></Link>
              <Link to="/chat" className="dashboard-card stat-card"><FaCommentDots size={24} className="stat-icon" /><div><h3>My messages</h3><p>Check applicant conversations</p></div></Link>
            </>
          )}

          {userType === 'Admin' && (
            <>
              <Link to="/admin" className="dashboard-card stat-card admin-card"><FaUsersCog size={24} className="stat-icon" /><div><h3>Manage Users</h3><p>View, edit, or delete users</p></div></Link>
              <Link to="/admin/content" className="dashboard-card stat-card admin-card"><FaThList size={24} className="stat-icon" /><div><h3>Moderate Content</h3><p>Manage reviews and comments</p></div></Link>
            </>
          )}

          {/* Job Feed & Map Area are RESTORED and hidden for Admins */}
          {userType !== 'Admin' && (
            <>
              <div className="dashboard-card job-feed-card">
                <JobFilters onFilterChange={handleFilterChange} />
                <hr className="filter-divider" />
                <JobFeed jobs={filteredJobs} isLoading={isLoadingJobs} error={jobsError} />
              </div>

              
            </>
          )}
          
          {userType === 'Admin' && (
            <div className="dashboard-card admin-overview-card">
              <h2>Application overview</h2>
              <p>This is your central hub for managing the application.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MainPage;