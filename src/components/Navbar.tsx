import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
/* 1) Import your chosen icons from react-icons:
   - FaHome for Home
   - FaUserAlt (or FaUserCircle) for Profile
   - FaBell for Notifications
*/
import { FaHome, FaUserAlt, FaBell } from "react-icons/fa";
import "../styles/Navbar.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Get user & token from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // Read your backend URL from .env (or default)
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  // ─────────────────────────────────────────────────────────
  // Fetch notifications
  // ─────────────────────────────────────────────────────────
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
    fetchNotifications();
  }, [user.user_id, token, BACKEND_URL]);

  // ─────────────────────────────────────────────────────────
  // Menu toggles & Notification handlers
  // ─────────────────────────────────────────────────────────
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  const markAsRead = async (notificationId: number) => {
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

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <nav className="navbar">
      <div className="logo">ARTEPOVERA</div>

      {/* Hamburger for mobile */}
      <div className="hamburger" onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <ul className={`nav-links ${isMenuOpen ? "open" : ""}`}>
        {/* Home Link (with icon) */}
        <li>
          <NavLink to="/main" className={({ isActive }) => (isActive ? "active" : "")}>
            <FaHome className="nav-icon" />
            
          </NavLink>
        </li>

        {/* Conditionally render the Profile link (Artist vs. Employer) */}
        {user?.user_type === "Artist" && (
          <li>
            <NavLink to="/artist-profile" className={({ isActive }) => (isActive ? "active" : "")}>
              <FaUserAlt className="nav-icon" />
              
            
            </NavLink>
          </li>
        )}
        {user?.user_type === "Employer" && (
          <li>
            <NavLink to="/employer-profile" className={({ isActive }) => (isActive ? "active" : "")}>
              <FaUserAlt className="nav-icon" />
              Profile
            </NavLink>
          </li>
        )}

        {/* Notifications with Bell Icon */}
        <li className="notifications">
          <button className="notifications-button" onClick={toggleDropdown}>
            <FaBell className="bell-icon" />
            {/* If we have any notifications, show a small badge */}
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </button>

          {showDropdown && (
            <div className="notifications-dropdown">
              {loadingNotifications ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="error">{error}</p>
              ) : notifications.length > 0 ? (
                <ul>
                  {notifications.map((notif) => (
                    <li
                      key={notif.notification_id}
                      className={notif.read_status ? "read" : "unread"}
                    >
                      <div className="notification-item">
                        <div dangerouslySetInnerHTML={{ __html: notif.message }} />
                        <div className="timestamp">
                          {new Date(notif.created_at).toLocaleString()}
                        </div>
                        <div>
                          {!notif.read_status && (
                            <button onClick={() => markAsRead(notif.notification_id)}>
                              Mark as Read
                            </button>
                          )}
                          <button onClick={() => deleteNotification(notif.notification_id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No notifications</p>
              )}
            </div>
          )}
        </li>

        {/* Logout */}
        <li>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
