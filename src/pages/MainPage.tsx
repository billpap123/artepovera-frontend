// src/pages/MainPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import Navbar from '../components/Navbar';
import '../styles/MainPage.css';
import {
  FaEye,
  FaUserEdit,
  FaMapMarkedAlt,
  FaPlusCircle,
  FaCommentDots,
  FaImages,
  FaUsersCog,
  FaThList,
  FaClipboardList, // A better icon for "My Job Postings"
} from 'react-icons/fa';

const MainPage = () => {
  const { userType, userId, fullname } = useUserContext();

  const welcomeName = fullname ? `, ${fullname.split(' ')[0]}` : '';

  return (
    <>
      <Navbar />
      <div className="main-page-container">
        <header className="main-page-header">
          <h1>{userType === 'Admin' ? 'Administrator Control Panel' : `Welcome back${welcomeName}!`}</h1>
          <p>{userType === 'Admin' ? 'Manage users and content.' : "Here's your personal dashboard."}</p>
        </header>

        <div className="dashboard-grid">
          {/* =========================================== */}
          {/* === ARTIST VIEW - CORRECTED 2x3 LAYOUT ==== */}
          {/* =========================================== */}
          {userType === 'Artist' && (
            <>
              {/* --- ROW 1 --- */}
              <Link to={`/user-profile/${userId}`} className="dashboard-card stat-card">
                <FaEye size={24} className="stat-icon" />
                <div>
                  <h3>My Public Profile</h3>
                  <p>View and share your profile</p>
                </div>
              </Link>

              <Link to="/chat" className="dashboard-card stat-card">
                <FaCommentDots size={24} className="stat-icon" />
                <div>
                  <h3>My Messages</h3>
                  <p>Check your conversations</p>
                </div>
              </Link>

              <Link to="/artist-profile/edit" className="dashboard-card stat-card">
                <FaUserEdit size={24} className="stat-icon" />
                <div>
                  <h3>Edit My Profile</h3>
                  <p>Update your bio, CV, and photo</p>
                </div>
              </Link>

              {/* --- ROW 2 (Slightly larger cards) --- */}
              <Link to="/portfolio" className="dashboard-card image-card portfolio-card">
                <div>
                  <h3>Edit My Portfolio</h3>
                  <p>Showcase your best work</p>
                </div>
                <FaImages className="image-card-icon" />
              </Link>

              {/* CORRECTED LINK FOR "MY APPLICATIONS" */}
              <Link to="/my-applications" className="dashboard-card image-card applications-card">
                <div>
                  <h3>My Applications</h3>
                  <p>Track job application status</p>
                </div>
                <FaThList className="image-card-icon" />
              </Link>

              <Link to="/map" className="dashboard-card image-card map-card">
                <div>
                  <h3>Community Map</h3>
                  <p>Discover artists & employers</p>
                </div>
                <FaMapMarkedAlt className="image-card-icon" />
              </Link>
            </>
          )}

          {/* =========================================== */}
          {/* === EMPLOYER VIEW - CLEANED UP ============ */}
          {/* =========================================== */}
          {userType === 'Employer' && (
             <>
              {/* You can arrange these 4 cards in a 2x2 grid in the future */}
              <Link to={`/user-profile/${userId}`} className="dashboard-card stat-card">
                <FaEye size={24} className="stat-icon" />
                <div><h3>My Public Profile</h3><p>View your employer profile</p></div>
              </Link>
              <Link to="/employer-profile/edit" className="dashboard-card stat-card">
                <FaUserEdit size={24} className="stat-icon" />
                <div><h3>Edit My Profile</h3><p>Update your bio and photo</p></div>
              </Link>
              <Link to="/post-job" className="dashboard-card stat-card">
                <FaPlusCircle size={24} className="stat-icon" />
                <div><h3>Post a New Job</h3><p>Find the perfect artist</p></div>
              </Link>
              <Link to="/my-job-postings" className="dashboard-card stat-card">
                <FaClipboardList size={24} className="stat-icon" />
                <div><h3>My Job Postings</h3><p>View all your active jobs</p></div>
              </Link>
            </>
          )}

          {/* =========================================== */}
          {/* === ADMIN VIEW - UNCHANGED ================== */}
          {/* =========================================== */}
          {userType === 'Admin' && (
            <>
              <Link to="/admin" className="dashboard-card stat-card admin-card">
                <FaUsersCog size={24} className="stat-icon" />
                <div><h3>Manage Users</h3></div>
              </Link>
              <Link to="/admin/content" className="dashboard-card stat-card admin-card">
                <FaThList size={24} className="stat-icon" />
                <div><h3>Moderate Content</h3></div>
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MainPage;