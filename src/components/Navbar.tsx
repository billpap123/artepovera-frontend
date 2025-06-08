// src/components/Navbar.tsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaHome, FaUserAlt, FaBell, FaMapMarkerAlt } from "react-icons/fa";
import { useUserContext } from '../context/UserContext'; // Your context hook
import '../styles/Navbar.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // --- GET USER DETAILS AND SETTERS FROM CONTEXT ---
  // Get the specific values and setters your context provides
  const { 
    userId, 
    setUserId, 
    setArtistId, 
    setEmployerId, 
    setUserType 
  } = useUserContext();
  
  const token = localStorage.getItem('token');
  // --- END CONTEXT USAGE ---

  useEffect(() => {
    const fetchNotifications = async () => {
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
    if (userId) {
        fetchNotifications();
    }
  }, [userId, token, API_BASE_URL]);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  const markAsRead = async (notificationId: number) => { /* ... your existing logic ... */ };
  const deleteNotification = async (notificationId: number) => { /* ... your existing logic ... */ };

  // --- CORRECTED LOGOUT HANDLER ---
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      // Use the individual setters from the context to clear the global state
      setUserId(null);
      setArtistId(null);
      setEmployerId(null);
      setUserType(null);
      
      // Also clear all storage
      localStorage.clear();
      sessionStorage.clear();
      // ... (your cookie clearing logic if needed) ...

      // Navigate to login or landing page
      navigate("/login");
    }
  };
  // --- END CORRECTION ---

  const isLoggedIn = !!userId;

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
                to={`/user-profile/${userId}`} // Dynamic link to user's own profile
                className={({ isActive }) => (isActive ? "active" : "")} 
                onClick={() => setIsMenuOpen(false)}
              >
                <FaUserAlt className="nav-icon" />
                <span className="nav-text">My Profile</span>
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
                   {/* ... your existing notifications JSX ... */}
                   {loadingNotifications ? <p>Loading...</p> : notifications.length === 0 ? <p>No new notifications</p> : (
                     <ul>
                       {notifications.map(notif => (
                         <li key={notif.notification_id} className={notif.read_status ? "read" : "unread"}>
                           {/* ... notif item ... */}
                         </li>
                       ))}
                     </ul>
                   )}
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