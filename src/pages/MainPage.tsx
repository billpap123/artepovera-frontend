// src/pages/MainPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserContext';
import Navbar from '../components/Navbar';
import JobFeed from './JobFeed';
import JobFilters, { Filters } from '../components/JobFilters';
import '../styles/MainPage.css';
import { 
  FaEye, FaBriefcase, FaUserEdit, FaMapMarkedAlt, 
  FaPlusCircle, FaCommentDots, FaImages, FaUsersCog, FaThList, FaClipboardList 
} from 'react-icons/fa';
import { useTranslation } from "react-i18next";



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
  const { t } = useTranslation();
  const { userType, userId, fullname } = useUserContext();

  // --- State for Job Feed ---
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  
  // --- THIS IS THE FIX ---
  // Local state to hold the welcome name, ensuring it reacts to context changes.
  const [welcomeName, setWelcomeName] = useState('');

  // This effect listens for changes to `fullname` from the context
  useEffect(() => {
    if (fullname) {
      setWelcomeName(`, ${fullname.split(' ')[0]}`);
    } else {
      setWelcomeName('');
    }
  }, [fullname]); // The dependency array ensures this runs whenever fullname changes.
  // --- END OF FIX ---


  useEffect(() => {
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
    
    if (userType && userType !== 'Admin') {
        fetchAllJobs();
    } else {
        setIsLoadingJobs(false);
    }
  }, [userType]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };
  
  const filteredJobs = useMemo(() => {
    if (!filters) return allJobs;

    return allJobs.filter(job => {
        if (filters.keywords) {
            const searchString = filters.keywords.toLowerCase();
            const inTitle = job.title.toLowerCase().includes(searchString);
            const inDescription = job.description?.toLowerCase().includes(searchString) || false;
            const inKeywords = job.desired_keywords?.toLowerCase().includes(searchString) || false;
            if (!inTitle && !inDescription && !inKeywords) return false;
        }
        if (filters.location && !job.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
        if (filters.minPayment !== '' && job.payment_total < filters.minPayment) return false;
        if (filters.maxPayment !== '' && job.payment_total > filters.maxPayment) return false;
        if (filters.category && job.category !== filters.category) return false;
        if (filters.presence && job.presence !== filters.presence) return false;
        if (filters.experience && job.requirements?.experience_years !== filters.experience) return false;
        if (filters.insurance === 'yes' && job.insurance !== true) return false;
        if (filters.insurance === 'no' && job.insurance === true) return false;

        return true;
    });
  }, [allJobs, filters]);

  return (
    <>
      <Navbar />
      <div className="main-page-container">
        <header className="main-page-header">
          <h1>{userType === 'Admin' ? t('mainPage.header.adminTitle') : t('mainPage.header.welcome', { name: welcomeName })}</h1>
          <p>{userType === 'Admin' ? t('mainPage.header.adminSubtitle') : t('mainPage.header.userSubtitle')}</p>
        </header>

        <div className="dashboard-grid">
          {userType === 'Artist' && (
            <>
              <Link to={`/user-profile/${userId}`} className="dashboard-card stat-card"><FaEye size={24} className="stat-icon" /><div><h3>{t('mainPage.artist.publicProfile')}</h3><p>{t('mainPage.artist.publicProfileDesc')}</p></div></Link>
              <Link to="/artist-profile/edit" className="dashboard-card stat-card"><FaUserEdit size={24} className="stat-icon" /><div><h3>{t('mainPage.artist.editProfile')}</h3><p>{t('mainPage.artist.editProfileDesc')}</p></div></Link>
              <Link to="/portfolio" className="dashboard-card stat-card"><FaImages size={24} className="stat-icon" /><div><h3>{t('mainPage.artist.editPortfolio')}</h3><p>{t('mainPage.artist.editPortfolioDesc')}</p></div></Link>
              <Link to="/chat" className="dashboard-card stat-card"><FaCommentDots size={24} className="stat-icon" /><div><h3>{t('mainPage.artist.messages')}</h3><p>{t('mainPage.artist.messagesDesc')}</p></div></Link>
              <Link to="/my-applications" className="dashboard-card card-bg-jobs">
                <div>
                  <h3>{t('mainPage.artist.applications')}</h3>
                  <p>{t('mainPage.artist.applicationsDesc')}</p>
                </div>
              </Link>
              <Link to="/map" className="dashboard-card card-bg-map">
                <div>
                  <h3>{t('mainPage.artist.map')}</h3>
                  <p>{t('mainPage.artist.mapDesc')}</p>
                </div>
              </Link>
            </>
          )}

          {userType === 'Employer' && (
            <>
              <Link to={`/user-profile/${userId}`} className="dashboard-card stat-card"><FaEye size={24} className="stat-icon" /><div><h3>{t('mainPage.employer.publicProfile')}</h3><p>{t('mainPage.employer.publicProfileDesc')}</p></div></Link>
              <Link to="/employer-profile/edit" className="dashboard-card stat-card"><FaUserEdit size={24} className="stat-icon" /><div><h3>{t('mainPage.employer.editProfile')}</h3><p>{t('mainPage.employer.editProfileDesc')}</p></div></Link>
              <Link to="/post-job" className="dashboard-card stat-card"><FaPlusCircle size={24} className="stat-icon" /><div><h3>{t('mainPage.employer.postJob')}</h3><p>{t('mainPage.employer.postJobDesc')}</p></div></Link>
              <Link to="/chat" className="dashboard-card stat-card"><FaCommentDots size={24} className="stat-icon" /><div><h3>{t('mainPage.employer.messages')}</h3><p>{t('mainPage.employer.messagesDesc')}</p></div></Link>
              <Link to="/my-jobs" className="dashboard-card  card-bg-jobs">
                <FaClipboardList />
                <div>
                  <h3>{t('mainPage.employer.jobPostings')}</h3>
                  <p>{t('mainPage.employer.jobPostingsDesc')}</p>
                </div>
              </Link>
              <Link to="/map" className="dashboard-card image-link-card">
                <div>
                  <h3>{t('mainPage.employer.map')}</h3>
                  <p>{t('mainPage.employer.mapDesc')}</p>
                </div>
              </Link>
            </>
          )}

          {userType === 'Admin' && (
            <>
              <Link to="/admin" className="dashboard-card stat-card admin-card"><FaUsersCog size={24} className="stat-icon" /><div><h3>{t('mainPage.admin.manageUsers')}</h3><p>{t('mainPage.admin.manageUsersDesc')}</p></div></Link>
              <Link to="/admin/content" className="dashboard-card stat-card admin-card"><FaThList size={24} className="stat-icon" /><div><h3>{t('mainPage.admin.moderateContent')}</h3><p>{t('mainPage.admin.moderateContentDesc')}</p></div></Link>
            </>
          )}

          {userType !== 'Admin' && (
            <>
              <div className="dashboard-card job-feed-card">
                <h2>{t('mainPage.jobFeed.title')}</h2>
                <JobFilters onFilterChange={handleFilterChange} />
                <hr className="filter-divider" />
                <JobFeed jobs={filteredJobs} isLoading={isLoadingJobs} error={jobsError} />
              </div>
            </>
          )}
          
          {userType === 'Admin' && (
            <div className="dashboard-card admin-overview-card">
              <h2>{t('mainPage.admin.overviewTitle')}</h2>
              <p>{t('mainPage.admin.overviewDesc')}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MainPage;
