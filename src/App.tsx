// src/App.tsx
// --- THIS IS THE COMPLETE, CORRECTED FILE ---

import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUserContext } from "./context/UserContext";
import AccessibilityMenu from './components/AccessibilityMenu';

// Page imports
import ScrollToTop from './components/ScrollToTop';
import EditJobPage from './pages/EditJobPage';
import JobDetailPage from './pages/JobDetailPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import MyJobPostingsPage from './pages/MyJobPostingsPage';
import LandingPage from "./pages/LandingPage";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ArtistProfile from "./pages/ArtistProfile";
import EmployerProfile from "./pages/EmployerProfile";
import MainPage from "./pages/MainPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Portfolio from "./pages/Portfolio";
import UserProfilePage from "./pages/UserProfilePage";
import JobListings from "./pages/JobListings";
import ChatPage from "./pages/ChatPage";
import PostJobPage from "./pages/PostJobPage";
import MapView from "./pages/MapView";
import AdminRoute from './components/AdminRoute';
import AdminDashboard from "./pages/AdminDashboard";
import AdminModerateContent from './pages/AdminModerateContent';

// --- BackToTopButton Component (Inline) ---
const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => { if (window.scrollY > 300) { setIsVisible(true); } else { setIsVisible(false); } };
  const scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };
  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => { window.removeEventListener('scroll', toggleVisibility); };
  }, []);
  return (
    <div className="back-to-top">
      {isVisible && (<button onClick={scrollToTop} className="back-to-top-button">&#8679;</button>)}
    </div>
  );
};

// --- Embedded CSS Styles for BackToTopButton ---
const backToTopStyles = `
  .back-to-top { position: fixed; bottom: 25px; right: 25px; z-index: 11999; }
  .back-to-top-button { background-color: #E2725B; color: white; border: none; border-radius: 50%; width: 50px; height: 50px; font-size: 2rem; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); transition: background-color 0.3s ease, transform 0.2s ease; }
  .back-to-top-button:hover { background-color: #C96A50; transform: translateY(-2px); }
`;


// --- This is the AppContent component you provided, now with the container div inside it ---
const AppContent = () => {
  const token = localStorage.getItem("token");
  const { userId: contextLoggedInUserId, userType: contextLoggedInUserType, } = useUserContext();
  const loggedInUserTypeForRoutes = contextLoggedInUserType;
  const loggedInUserIdForRoutes = contextLoggedInUserId;

  return (
    // This div now wraps all your content, ensuring the filter works everywhere
    <div className="main-app-container">
      <ScrollToTop />
      <style>{backToTopStyles}</style>

      <Routes>
        {/* Initial navigation based on token presence */}
        <Route path="/" element={token ? <Navigate to="/main" replace /> : <LandingPage />} />

        {/* Public routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes (user must be logged in) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/main" element={<MainPage />} />
          <Route path="/artist-profile/edit" element={<ArtistProfile />} />
          <Route path="/employer-profile/edit" element={<EmployerProfile />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/my-applications" element={<MyApplicationsPage />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/user-profile/:userId" element={<UserProfilePage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          <Route path="/edit-job/:job_id" element={<EditJobPage />} />
          <Route path="/job-listings" element={<JobListings />} />
          <Route path="/map" element={ <MapView userType={loggedInUserTypeForRoutes} loggedInUserId={loggedInUserIdForRoutes} /> } />
          <Route path="/post-job" element={<PostJobPage />} />
        </Route>
        <Route path="/my-jobs" element={<MyJobPostingsPage />} />

        {/* Admin Protected Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/content" element={<AdminModerateContent />} />
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to={token ? "/main" : "/"} replace />} />
      </Routes>
      <BackToTopButton />
    </div>
  );
};

// --- This is the main App component, now simplified ---
const App = () => {
  return (
    <UserProvider>
      {/* AppContent now contains the container, so we don't need it here */}
      <AppContent />
      {/* AccessibilityMenu is a sibling, so it's not affected by the filter */}
      <AccessibilityMenu />
    </UserProvider>
  );
};

export default App;