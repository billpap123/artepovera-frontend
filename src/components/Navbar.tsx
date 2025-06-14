import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaHome, FaUserAlt, FaBell, FaMapMarkerAlt } from "react-icons/fa";
import { useUserContext } from '../context/UserContext';
import '../styles/Navbar.css';
import { useTranslation } from "react-i18next";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://artepovera2.vercel.app";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // --- THIS IS THE FIX ---
  // Ensure you get both `t` and `i18n` from the hook.
  // The `i18n` object is what controls the language.
  const { t, i18n } = useTranslation();

  const { userId, userType, setUserId, setArtistId, setEmployerId, setUserType } = useUserContext();
  const token = localStorage.getItem('token');

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
        setError(t('navbar.errors.fetchNotifications'));
      } finally {
        setLoadingNotifications(false);
      }
    };
    if (userId) {
        fetchNotifications();
    }
  }, [userId, token, API_BASE_URL, t]);

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
    if (window.confirm(t('navbar.alerts.logoutConfirm'))) {
      setUserId(null);
      setArtistId(null);
      setEmployerId(null);
      setUserType(null);
      
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      window.location.href = '/login'; 
    }
  };

  const isLoggedIn = !!userId;

  let profilePath = "/";
  if (isLoggedIn) {
    if (userType === 'Artist') {
      profilePath = "/artist-profile/edit";
    } else if (userType === 'Employer') {
      profilePath = "/employer-profile/edit";
    } else {
      profilePath = `/user-profile/${userId}`; 
    }
  }

  // --- LANGUAGE SWITCHER LOGIC ---
  const changeLanguage = (lng: 'en' | 'el') => {
    i18n.changeLanguage(lng);
    setIsMenuOpen(false); // Close mobile menu on language change
  };

  return (
    <nav className="navbar">
      <Link to={isLoggedIn ? "/main" : "/"} className="logo-link">
        <img src="/images/logo2.png" alt={t('navbar.altText.logo')} className="logo-image" />
      </Link>
      
      <div className={`hamburger ${isMenuOpen ? "open" : ""}`} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <ul className={`nav-links ${isMenuOpen ? "open" : ""}`}>
        {isLoggedIn ? (
          <>
            <li>
              <NavLink to="/main" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setIsMenuOpen(false)}>
                <FaHome className="nav-icon" />
                <span className="nav-text">{t('navbar.links.home')}</span>
              </NavLink>
            </li>

            <li>
              <NavLink to="/map" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setIsMenuOpen(false)}>
                <FaMapMarkerAlt className="nav-icon" />
                <span className="nav-text">{t('navbar.links.map')}</span>
              </NavLink>
            </li>

            <li>
              <NavLink 
                to={profilePath}
                className={({ isActive }) => (isActive ? "active" : "")} 
                onClick={() => setIsMenuOpen(false)}
              >
                <FaUserAlt className="nav-icon" />
                <span className="nav-text">{t('navbar.links.profile')}</span>
              </NavLink>
            </li>

            <li className="notifications">
              <button className="notifications-button" onClick={toggleDropdown}>
                <FaBell className="bell-icon" />
                {notifications.filter(n => !n.read_status).length > 0 && (
                  <span className="notification-badge">{notifications.filter(n => !n.read_status).length}</span>
                )}
              </button>

              {showDropdown && (
                <div className="notifications-dropdown">
                   {loadingNotifications ? ( <p>{t('navbar.notifications.loading')}</p> )
                   : error ? ( <p className="error">{error}</p> )
                   : notifications.length > 0 ? (
                    <ul>
                      {notifications.map((notif) => (
                        <li key={notif.notification_id} className={notif.read_status ? "read" : "unread"}>
                          <div className="notification-item">
                            <div dangerouslySetInnerHTML={{ __html: notif.message }} />
                            <div className="timestamp">{new Date(notif.created_at).toLocaleString()}</div>
                            <div className="notification-actions">
                              {!notif.read_status && ( <button className="mark-read-btn" onClick={() => markAsRead(notif.notification_id)}>{t('navbar.notifications.markAsRead')}</button> )}
                              <button className="delete-notif-btn" onClick={() => deleteNotification(notif.notification_id)}>{t('navbar.notifications.delete')}</button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : ( <p>{t('navbar.notifications.none')}</p> )}
                </div>
              )}
            </li>
            <li>
              <button onClick={() => {handleLogout(); setIsMenuOpen(false);}} className="logout-button">
                {t('navbar.actions.logout')}
              </button>
            </li>
            <li className="language-switcher">
              <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>{t('navbar.language.en')}</button>
              <span>/</span>
              <button onClick={() => changeLanguage('el')} className={i18n.language === 'el' ? 'active' : ''}>{t('navbar.language.el')}</button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/login" className="nav-link">{t('navbar.actions.login')}</NavLink>
            </li>
            <li>
              <NavLink to="/register" className="nav-button register-button">{t('navbar.actions.register')}</NavLink>
            </li>
            <li className="language-switcher">
              <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>{t('navbar.language.en')}</button>
              <span>/</span>
              <button onClick={() => changeLanguage('el')} className={i18n.language === 'el' ? 'active' : ''}>{t('navbar.language.el')}</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
