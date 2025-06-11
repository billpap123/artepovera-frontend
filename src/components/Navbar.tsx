// src/components/Navbar.tsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaHome, FaUserAlt, FaBell, FaMapMarkerAlt } from "react-icons/fa";
import { useUserContext } from '../context/UserContext'; // Import your custom context hook
import '../styles/Navbar.css'; // Make sure you have this CSS file

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Get user details and setters from your global context
  const { userId, userType, setUserId, setArtistId, setEmployerId, setUserType } = useUserContext();
  
  const token = localStorage.getItem('token'); // Still needed for API authorization headers

  useEffect(() => {
    const fetchNotifications = async () => {
      // Use userId from context for dependency and fetching
      if (!token || !userId) {
        setLoadingNotifications(false);
        return;
      }
      setLoadingNotifications(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/notifications/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNotifications(response.data.notifications || []);
        setError("");
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to fetch notifications.");
      } finally {
        setLoadingNotifications(false);
      }
    };
    if (userId) { // Fetch only if userId from context exists
        fetchNotifications();
    }
  }, [userId, token, API_BASE_URL]);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  const markAsRead = async (notificationId: number) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/notifications/${notificationId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notification_id === notificationId
            ? { ...notif, read_status: true }
            : notif
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.filter((n) => n.notification_id !== notificationId)
      );
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      // Use context setters to clear global state
      setUserId(null);
      setArtistId(null);
      setEmployerId(null);
      setUserType(null);
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Navigate to login or landing page
      navigate("/login");
    }
  };

  const isLoggedIn = !!userId; // A simple boolean to check if a user is logged in

  // --- DYNAMICALLY DETERMINE THE PROFILE PATH ---
  let profilePath = "/"; // A safe fallback
  if (isLoggedIn) {
    if (userType === 'Artist') {
      profilePath = "/artist-profile/edit"; // Your route for ArtistProfile.tsx
    } else if (userType === 'Employer') {
      profilePath = "/employer-profile/edit"; // Your route for EmployerProfile.tsx
    } else {
      // Fallback for a logged-in user with no type, goes to their public profile
      profilePath = `/user-profile/${userId}`; 
    }
  }
  // --- END DYNAMIC PATH LOGIC ---

  return (
    <nav className="navbar">
      <Link to={isLoggedIn ? "/main" : "/"} className="logo-link">
        <img src="/images/logo2.png" alt="Artepovera Home" className="logo-image" />
      </Link>
      
      <div className="hamburger" onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <ul className={`nav-links ${isMenuOpen ? "open" : ""}`}>
        {isLoggedIn ? (
          <>
            {/* --- LOGGED-IN LINKS --- */}
            <li>
              <NavLink to="/main" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setIsMenuOpen(false)}>
                <FaHome className="nav-icon" />
                <span className="nav-text">Home</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/map" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setIsMenuOpen(false)}>
                <FaMapMarkerAlt className="nav-icon" />
                <span className="nav-text">Map</span>
              </NavLink>
            </li>

            <li>
              <NavLink 
                to={profilePath} // <<< USE THE DYNAMIC profilePath VARIABLE
                className={({ isActive }) => (isActive ? "active" : "")} 
                onClick={() => setIsMenuOpen(false)}
              >
                <FaUserAlt className="nav-icon" />
                <span className="nav-text">My profile</span>
              </NavLink>
            </li>

            <li className="notifications">
              <button className="notifications-button" onClick={() => {toggleDropdown(); setIsMenuOpen(false);}}>
                <FaBell className="bell-icon" />
                {notifications.filter(n => !n.read_status).length > 0 && (
                  <span className="notification-badge">{notifications.filter(n => !n.read_status).length}</span>
                )}
              </button>

              {showDropdown && (
                <div className="notifications-dropdown">
                   {loadingNotifications ? ( <p>Loading...</p> )
                   : error ? ( <p className="error">{error}</p> )
                   : notifications.length > 0 ? (
                    <ul>
                      {notifications.map((notif) => (
                        <li key={notif.notification_id} className={notif.read_status ? "read" : "unread"}>
                          <div className="notification-item">
                            <div dangerouslySetInnerHTML={{ __html: notif.message }} />
                            <div className="timestamp">{new Date(notif.created_at).toLocaleString()}</div>
                            <div className="notification-actions">
                              {!notif.read_status && ( <button className="mark-read-btn" onClick={() => markAsRead(notif.notification_id)}> Mark as Read </button> )}
                              <button className="delete-notif-btn" onClick={() => deleteNotification(notif.notification_id)}> Delete </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : ( <p>No new notifications</p> )}
                </div>
              )}
            </li>
            <li>
              <button onClick={() => {handleLogout(); setIsMenuOpen(false);}} className="logout-button">
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            {/* --- LOGGED-OUT LINKS --- */}
            <li>
              <NavLink to="/login" className="nav-link">Login</NavLink>
            </li>
            <li>
              <NavLink to="/register" className="nav-button register-button">Register</NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;