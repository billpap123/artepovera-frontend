// src/pages/MainPage.tsx
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import Navbar from '../components/Navbar';
import JobFeed from './JobFeed';
import '../styles/MainPage.css';
// --- ADDED NEW ICONS for Admin and to differentiate cards ---
import { 
  FaEye, 
  FaBriefcase, 
  FaUserEdit, 
  FaMapMarkedAlt, 
  FaPlusCircle, 
  FaCommentDots,
  FaImages,         // For Portfolio
  FaUsersCog,       // For Admin - Manage Users
  FaThList          // For Admin - Moderate Content
} from 'react-icons/fa';

const MainPage = () => {
  const navigate = useNavigate();
  const { userType, userId, fullname } = useUserContext();

  useEffect(() => {
    // This check ensures that if context is still loading (userId is null)
    // and there's no token, we redirect. Your ProtectedRoute likely handles this too.
    if (!userId) {
      const timer = setTimeout(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userId, navigate]);

  const welcomeName = fullname ? `, ${fullname.split(' ')[0]}` : '';

  return (
    <>
      <Navbar />
      <div className="main-page-container">
        <header className="main-page-header">
          {/* Welcome message now changes based on role */}
          <h1>{userType === 'Admin' ? 'Administrator Control Panel' : `Welcome back${welcomeName}!`}</h1>
          <p>{userType === 'Admin' ? 'Manage users, content, and application data.' : "Here's what's happening in the Arte Povera community today."}</p>
        </header>

        <div className="dashboard-grid">

          {/* --- Artist View (4 Cards) --- */}
          {userType === 'Artist' && (
            <>
              <Link to={`/user-profile/${userId}`} className="dashboard-card stat-card">
                <FaEye size={24} className="stat-icon" />
                <div className="stat-text">
                  <h3>My Public Profile</h3>
                  <p>View and share your profile</p>
                </div>
              </Link>
              <Link to="/artist-profile/edit" className="dashboard-card stat-card">
                <FaUserEdit size={24} className="stat-icon" />
                <div className="stat-text">
                  <h3>Edit My Profile</h3>
                  <p>Update your bio, CV, and photo</p>
                </div>
              </Link>
              <Link to="/portfolio" className="dashboard-card stat-card">
                <FaImages size={24} className="stat-icon" />
                <div className="stat-text">
                  <h3>Edit My Portfolio</h3>
                  <p>Showcase your best work</p>
                </div>
              </Link>
              <Link to="/chat" className="dashboard-card stat-card">
                <FaCommentDots size={24} className="stat-icon" />
                <div className="stat-text">
                  <h3>My Messages</h3>
                  <p>Check your conversations</p>
                </div>
              </Link>
            </>
          )}

          {/* --- Employer View (4 Cards) --- */}
          {userType === 'Employer' && (
            <>
              <Link to={`/user-profile/${userId}`} className="dashboard-card stat-card">
                <FaEye size={24} className="stat-icon" />
                <div className="stat-text">
                  <h3>My Public Profile</h3>
                  <p>View your employer profile</p>
                </div>
              </Link>
              <Link to="/employer-profile/edit" className="dashboard-card stat-card">
                <FaUserEdit size={24} className="stat-icon" />
                <div className="stat-text">
                  <h3>Edit My Profile</h3>
                  <p>Update your bio and photo</p>
                </div>
              </Link>
              <Link to="/post-job" className="dashboard-card stat-card">
                <FaPlusCircle size={24} className="stat-icon" />
                <div className="stat-text">
                  <h3>Post a New Job</h3>
                  <p>Find the perfect artist</p>
                </div>
              </Link>
              <Link to="/chat" className="dashboard-card stat-card">
                <FaCommentDots size={24} className="stat-icon" />
                <div className="stat-text">
                  <h3>My Messages</h3>
                  <p>Check applicant conversations</p>
                </div>
              </Link>
            </>
          )}

          {/* --- Admin View --- */}
          {userType === 'Admin' && (
            <>
              <Link to="/admin" className="dashboard-card stat-card admin-card">
                <FaUsersCog size={24} className="stat-icon" />
                <div className="stat-text">
                  <h3>Manage Users</h3>
                  <p>View, edit, or delete users</p>
                </div>
              </Link>
              <Link to="/admin/content" className="dashboard-card stat-card admin-card">
                <FaThList size={24} className="stat-icon" />
                <div className="stat-text">
                  <h3>Moderate Content</h3>
                  <p>Manage reviews and comments</p>
                </div>
              </Link>
              {/* You can add more admin-specific cards here later */}
            </>
          )}


          {/* --- Main Content Area (Job Feed and Map are hidden for Admins) --- */}
          {userType !== 'Admin' ? (
            <>
              <div className="dashboard-card job-feed-card">
                <h2>Job Feed</h2>
                <JobFeed />
              </div>

              <div className="dashboard-card map-card">
                <h3>Discover the Community</h3>
                <p>Find artists and employers near you.</p>
                <Link to="/map" className="action-button">
                  Explore Map <FaMapMarkedAlt style={{ marginLeft: '8px' }} />
                </Link>
              </div>
            </>
          ) : (
            // For Admin, show an overview card instead of the job feed and map
            <div className="dashboard-card admin-overview-card">
              <h2>Application Overview</h2>
              <p>This is your central hub for managing the application. Use the links above to navigate to different management sections.</p>
              {/* In the future, you could fetch and display stats from your /api/admin/stats endpoint here */}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MainPage;