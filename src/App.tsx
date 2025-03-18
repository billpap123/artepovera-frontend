import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./context/UserContext";

// Pages & Components
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

const App = () => {
  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(localStorage.getItem("user") || "{}") : null;

  return (
    <UserProvider>
      <Routes>
        {/* If logged in, go to /main, else LandingPage */}
        <Route
          path="/"
          element={
            token ? (
              <Navigate to="/main" replace />
            ) : (
              <LandingPage />
            )
          }
        />

        {/* Public routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes (must be logged in) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/main" element={<MainPage />} />
          <Route path="/artist-profile" element={<ArtistProfile />} />
          <Route path="/employer-profile" element={<EmployerProfile />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route
            path="/portfolio"
            element={<Portfolio artistId={user?.user_id || 0} />}
          />
          <Route path="/user-profile/:userId" element={<UserProfilePage />} />
          <Route path="/job-listings" element={<JobListings />} />
        </Route>

        {/* If your “Post Job” route is protected, wrap it in ProtectedRoute, 
            otherwise you can leave it as a public route */}
        <Route path="/post-job" element={<PostJobPage />} />

        {/* Catch-all route: if logged in => /main, else => /login */}
        <Route
          path="*"
          element={<Navigate to={token ? "/main" : "/login"} replace />}
        />
      </Routes>
    </UserProvider>
  );
};

export default App;
