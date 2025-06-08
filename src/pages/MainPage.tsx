// src/pages/MainPage.tsx
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import Navbar from '../components/Navbar';
import JobFeed from './JobFeed';
import '../styles/MainPage.css';
import { FaEye, FaBriefcase, FaPenSquare, FaMapMarkedAlt, FaPlusCircle, FaCommentDots } from 'react-icons/fa'; // <<< ADD FaCommentDots

const MainPage = () => {
  const navigate = useNavigate();
  const { userType, userId, fullname } = useUserContext(); // <<< 'fullname' is now available

  useEffect(() => {
    // This check ensures that if context is still loading (userId is null)
    // and there's no token, we redirect. Your ProtectedRoute likely handles this too.
    if (!userId) {
      const timer = setTimeout(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
        }
      }, 500); // A small delay gives context time to load
      return () => clearTimeout(timer);
    }
  }, [userId, navigate]);

  // Use the fullname from context for the welcome message
  const welcomeName = fullname ? `, ${fullname.split(' ')[0]}` : '';

  return (
    <>
      <Navbar />
      <div className="main-page-container">
        <header className="main-page-header">
          <h1>Welcome back{welcomeName}!</h1>
          <p>Here's what's happening in the Arte Povera community today.</p>
        </header>

        <div className="dashboard-grid">
          {userType === 'Artist' ? (
            <>
              {/* Artist Cards */}
              <Link to={`/user-profile/${userId}`} className="dashboard-card stat-card">
                <FaEye size={24} className="stat-icon" />
                <div className="stat-text">
                  <h3>My Public Profile</h3>
                  <p>View and share your profile</p>
                </div>
              </Link>
              <Link to="/artist-profile/edit" className="dashboard-card stat-card">
                <FaPenSquare size={24} className="stat-icon" />
                <div className="stat-text">
                  <h3>Edit My Profile</h3>
                  <p>Update your bio, CV, and photo</p>
                </div>
              </Link>
              <Link to="/portfolio" className="dashboard-card stat-card">
                <FaPenSquare size={24} className="stat-icon" />
                <div className="stat-text">
                  <h3>Edit My Portfolio</h3>
                  <p>Showcase your best work</p>
                </div>
              </Link>
            </>
          ) : (
            <>
              {/* Employer Cards */}
              <Link to={`/user-profile/${userId}`} className="dashboard-card stat-card">
                <FaEye size={24} className="stat-icon" />
                <div className="stat-text">
                  <h3>My Public Profile</h3>
                  <p>View your employer profile</p>
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
                <FaBriefcase size={24} className="stat-icon" />
                <div className="stat-text">
                  <h3>My Job Postings</h3>
                  <p>Manage your active jobs</p>
                </div>
              </Link>
            </>
          )}

          {/* Job Feed Card */}
          <div className="dashboard-card job-feed-card">
            <h2>Job Feed</h2>
            <JobFeed />
          </div>

          {/* Map Card */}
          <div className="dashboard-card map-card">
            <h3>Discover the Community</h3>
            <p>Find artists and employers near you.</p>
            <Link to="/map" className="action-button">
              Explore Map <FaMapMarkedAlt style={{ marginLeft: '8px' }} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainPage;