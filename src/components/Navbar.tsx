// src/components/Navbar.tsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom"; // <<< ADD Link HERE
import axios from "axios";
import { FaHome, FaUserAlt, FaBell } from "react-icons/fa";
import "../styles/Navbar.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token || !user.user_id) {
        setLoadingNotifications(false);
        return;
      }
      setLoadingNotifications(true);
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/notifications/${user.user_id}`,
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
    if (user.user_id) { // Only fetch if user_id exists
        fetchNotifications();
    }
  }, [user.user_id, token, BACKEND_URL]); // user.user_id dependency

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  const markAsRead = async (notificationId: number) => {
    // ... (your existing function)
    try {
      await axios.put(
        `${BACKEND_URL}/api/notifications/${notificationId}`,
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
    // ... (your existing function)
    try {
      await axios.delete(`${BACKEND_URL}/api/notifications/${notificationId}`, {
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
    // ... (your existing function)
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      navigate("/login");
    }
  };

  return (
    <nav className="navbar">
      {/* --- UPDATED LOGO --- */}
      <Link to="/main" className="logo-link"> {/* Use Link component, can reuse 'logo' class or new 'logo-link' */}
        {/* Replace '/your-logo.png' with the actual path to your logo image in the public folder */}
        <img src="/images/logo2.png" alt="Artepovera Home" className="logo-image" />
      </Link>
      {/* --- END UPDATED LOGO --- */}

      <div className="hamburger" onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <ul className={`nav-links ${isMenuOpen ? "open" : ""}`}>
        <li>
          <NavLink to="/main" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setIsMenuOpen(false)}>
            <FaHome className="nav-icon" />
            <span className="nav-text">Home</span>
          </NavLink>
        </li>

        {user?.user_type === "Artist" && (
          <li>
            <NavLink to="/artist-profile" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setIsMenuOpen(false)}>
              <FaUserAlt className="nav-icon" />
              <span className="nav-text">Profile</span>
            </NavLink>
          </li>
        )}
        {user?.user_type === "Employer" && (
          <li>
            <NavLink to="/employer-profile" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setIsMenuOpen(false)}>
              <FaUserAlt className="nav-icon" />
              <span className="nav-text">Profile</span>
            </NavLink>
          </li>
        )}
        {/* Fallback if user_type is not Artist or Employer but user is logged in */}
        {!user?.user_type && user?.user_id && (
            <li>
                <NavLink to="/some-default-profile-or-page" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setIsMenuOpen(false)}>
                    <FaUserAlt className="nav-icon" />
                    <span className="nav-text">Profile</span>
                </NavLink>
            </li>
        )}


        {user?.user_id && ( // Only show notifications and logout if user is logged in
          <>
            <li className="notifications">
              <button className="notifications-button" onClick={() => {toggleDropdown(); setIsMenuOpen(false);}}>
                <FaBell className="bell-icon" />
                {notifications.filter(n => !n.read_status).length > 0 && ( // Count only unread
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
        )}
      </ul>
    </nav>
  );
};

export default Navbar;