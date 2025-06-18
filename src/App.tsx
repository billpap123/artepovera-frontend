// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useUserContext } from "./context/UserContext"; // We only need the hook here now

// Page imports (All original imports are kept)
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

// We have merged AppContent into App for a simpler and more stable structure.
const App = () => {
  // Logic from AppContent is now here. We use the context as the single source of truth.
  const { userId, userType } = useUserContext();
  const isLoggedIn = !!userId; // This is now reactive. It will be true if userId is a number.

  return (
    <>
      <ScrollToTop />

      {/* The entire Routes block from your original file is preserved below */}
      <Routes>
        {/* Initial navigation is now based on the reactive 'isLoggedIn' state from context */}
        <Route
          path="/"
          element={isLoggedIn ? <Navigate to="/main" replace /> : <LandingPage />}
        />

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
          <Route
            path="/map"
            element={
              // These props now come directly from the context hook above
              <MapView
                userType={userType}
                loggedInUserId={userId}
              />
            }
          />
          <Route path="/post-job" element={<PostJobPage />} />
        </Route>
        <Route path="/my-jobs" element={<MyJobPostingsPage />} />

        {/* Admin Protected Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/content" element={<AdminModerateContent />} />
        </Route>

        {/* Catch-all route also uses the reactive isLoggedIn state */}
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? "/main" : "/"} replace />}
        />
      </Routes>
    </>
  );
};

export default App;