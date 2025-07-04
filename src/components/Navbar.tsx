import React, { useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import axios from "axios";
import { FaHome, FaUserAlt, FaBell, FaMapMarkerAlt } from "react-icons/fa";
import { useUserContext } from '../context/UserContext';
import '../styles/Navbar.css';
import { useTranslation, Trans } from 'react-i18next';

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://artepovera2.vercel.app";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation(); // Initialize useLocation hook

  // --- 1. Get notifications and the setter from the global context ---
  const {
    userId,
    userType,
    notifications,
    setNotifications,
    setUserId,
    setArtistId,
    setEmployerId,
    setUserType
  } = useUserContext();

  const token = localStorage.getItem('token');

  // --- 2. ALL local state and useEffects for notifications and sockets are now DELETED from this file. ---
  // The UserContext handles everything.

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  // This function now updates the GLOBAL state via the context's setNotifications
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

  // --- NEW FUNCTION: Handle navigation link clicks for refresh behavior ---
  const handleNavLinkClick = (path: string) => {
    // Close the mobile menu
    setIsMenuOpen(false);

    // If the user is already on the target path, scroll to the top
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // NavLink usually handles navigation implicitly if isActive is false,
    // so no explicit `navigate(path)` is needed here.
  };

  // This function also updates the GLOBAL state
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
      // Clear all user state and storage first
      setUserId(null);
      setArtistId(null);
      setEmployerId(null);
      setUserType(null);
      setNotifications([]);

      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // 3. Use navigate for a smooth, client-side transition without a page reload
      navigate('/');
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

  const changeLanguage = (lng: 'en' | 'el') => {
    i18n.changeLanguage(lng);
    setIsMenuOpen(false);
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
              <NavLink
                to="/main"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={() => handleNavLinkClick("/main")}
              >
                <FaHome className="nav-icon" />
                <span className="nav-text">{t('navbar.links.home')}</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/map"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={() => handleNavLinkClick("/map")}
              >
                <FaMapMarkerAlt className="nav-icon" />
                <span className="nav-text">{t('navbar.links.map')}</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to={profilePath}
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={() => handleNavLinkClick(profilePath)}
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
                  {/* We can remove the loading/error state as the context handles it */}
                  {notifications.length > 0 ? (
                    <ul>
                      {notifications.map((notif) => (
                        <li key={notif.notification_id} className={notif.read_status ? "read" : "unread"}>
                          <div className="notification-item">
                            <Trans
                              i18nKey={notif.message_key}
                              values={{ ...notif.message_params }}
                              components={{
                                a: <Link to={notif.message_params?.chatLink || notif.message_params?.profileLink || notif.message_params?.artistProfileLink || '#'} />
                              }}
                            />
                            <div className="timestamp">{new Date(notif.createdAt).toLocaleString()}</div>
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
            <li className="language-switcher2 nav-link">
              <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>{t('navbar.language.en')}</button>
              <span className="lang-separator"></span>
              <button onClick={() => changeLanguage('el')} className={i18n.language === 'el' ? 'active' : ''}>{t('navbar.language.el')}</button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink
                to="/login"
                className="nav-link"
                onClick={() => handleNavLinkClick("/login")}
              >
                {t('navbar.actions.login')}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/register"
                className="nav-button register-button"
                onClick={() => handleNavLinkClick("/register")}
              >
                {t('navbar.actions.register')}
              </NavLink>
            </li>
            <li className="language-switcher2 nav-link">
              <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>{t('navbar.language.en')}</button>
              <span className="lang-separator"></span>
              <button onClick={() => changeLanguage('el')} className={i18n.language === 'el' ? 'active' : ''}>{t('navbar.language.el')}</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;