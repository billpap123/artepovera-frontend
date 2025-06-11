// src/App.tsx
import React from "react"; // useEffect might be needed if you add context loading check
import { Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUserContext } from "./context/UserContext"; // Correct import

// Page imports
import JobDetailPage from './pages/JobDetailPage'; // Make sure this page is imported
import MyApplicationsPage from './pages/MyApplicationsPage';
import MyJobPostingsPage from './pages/MyJobPostingsPage';
import LandingPage from "./pages/LandingPage";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ArtistProfile from "./pages/ArtistProfile"; // This might be a self-profile editing page
import EmployerProfile from "./pages/EmployerProfile"; // This might be a self-profile editing page
import MainPage from "./pages/MainPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Portfolio from "./pages/Portfolio"; // Component for viewing/editing a portfolio
import UserProfilePage from "./pages/UserProfilePage"; // Component for viewing any user's profile
import JobListings from "./pages/JobListings";
import ChatPage from "./pages/ChatPage";
import PostJobPage from "./pages/PostJobPage";
import MapView from "./pages/MapView";
import AdminRoute from './components/AdminRoute';       // <<< 1. IMPORT your new AdminRoute
import AdminDashboard from "./pages/AdminDashboard";   // <<< 2. IMPORT the new AdminDashboard page (we will create this next)
import AdminModerateContent from './pages/AdminModerateContent'; // <<< IMPORT NEW PAGE

const AppContent = () => {
  const token = localStorage.getItem("token"); // Keep for initial navigation guard

  // --- Use the context to get user details ---
  const {
    userId: contextLoggedInUserId,
    userType: contextLoggedInUserType,
    // isLoading: isUserContextLoading // Uncomment if your UserContext provides this
  } = useUserContext();
  // --- End using context ---

  // Example: Show a global loader while context initializes (if it has isLoading state)
  // if (isUserContextLoading) {
  //   return <div className="app-loading-spinner">Loading session...</div>;
  // }

  const loggedInUserTypeForRoutes = contextLoggedInUserType;
  const loggedInUserIdForRoutes = contextLoggedInUserId; // Type: number | null

  return (
    <Routes>
      {/* Initial navigation based on token presence */}
      <Route
        path="/"
        element={token ? <Navigate to="/main" replace /> : <LandingPage />}
      />

      {/* Public routes */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* Protected routes (user must be logged in) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/main" element={<MainPage />} />

        {/* Routes for users to edit their own specific profiles if these are distinct components */}
        {/* These might need more specific logic based on userType from context if they are for "my profile" */}
        <Route path="/artist-profile/edit" element={<ArtistProfile />} />
        <Route path="/employer-profile/edit" element={<EmployerProfile />} />

        <Route path="/chat" element={<ChatPage />} />
        <Route path="/my-applications" element={<MyApplicationsPage />} />

        <Route
          path="/portfolio" // Assumed to be "my portfolio" for logged-in artist
          element={
            <Portfolio
              artistId={
                loggedInUserTypeForRoutes === 'Artist'
                  ? (loggedInUserIdForRoutes === null ? 0 : loggedInUserIdForRoutes) // If Artist & ID is null, pass 0 (or undefined)
                  : 0 // If not an Artist, pass 0 (Portfolio needs to handle artistId=0 if it means "no specific artist" or "not applicable")
              }
            />
          }
        />
        {/* Route to view any user's profile by their ID */}
        <Route path="/user-profile/:userId" element={<UserProfilePage />} />
        <Route path="/jobs/:jobId" element={<JobDetailPage />} /> {/* <<< ENSURE THIS ROUTE EXISTS */}

        <Route path="/job-listings" element={<JobListings />} />
        <Route
          path="/map"
          element={
            <MapView
              userType={loggedInUserTypeForRoutes}
              loggedInUserId={loggedInUserIdForRoutes}
            />
          }
        />
        <Route path="/post-job" element={<PostJobPage />} /> {/* Moved PostJobPage to protected as it often requires login */}
      </Route>
      <Route path="/my-jobs" element={<MyJobPostingsPage />} />

      {/* --- 3. ADD ADMIN PROTECTED ROUTE --- */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        {/* You can add more admin-only pages here later, e.g., /admin/users, /admin/jobs */}
      </Route>

// --- ADMIN PROTECTED ROUTE ---
<Route element={<AdminRoute />}>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/content" element={<AdminModerateContent />} /> {/* <<< ADD THIS ROUTE */}
</Route>

      {/* Catch-all route */}
      <Route
        path="*"
        element={<Navigate to={token ? "/main" : "/"} replace />} // Navigate to landing if no token, else to main
      />
    </Routes>
  );
};

const App = () => {
  return (
    <UserProvider> {/* UserProvider wraps AppContent, so useUserContext works inside */}
      <AppContent />
    </UserProvider>
  );
};

export default App;