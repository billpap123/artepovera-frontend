// src/pages/Register.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserContext';
import "../styles/Register.css";
import '../styles/Global.css';
import { useTranslation } from "react-i18next";
import LanguageSwitcher from '../components/LanguageSwitcher';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

const Register = () => {
  const { t } = useTranslation();

  // Get all the necessary setters from your context
  const { setUserId, setArtistId, setEmployerId, setUserType, setFullname } = useUserContext();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullnameState, setFullnameState] = useState(''); // Use a different name from context value
  const [phone_number, setPhoneNumber] = useState('');
  const [user_type, setUserTypeState] = useState('Artist'); // Use a different name from context value
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [isStudent, setIsStudent] = useState(false);
  const [enableLocation, setEnableLocation] = useState(false);
  const [coords, setCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (enableLocation) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log("[REGISTER GEOLOCATION] Coordinates fetched:", { longitude, latitude });
            setCoords([longitude, latitude]);
          },
          (geoError) => {
            console.error("Geolocation error:", geoError);
            setEnableLocation(false); // Uncheck if error
            alert(`Could not get location: ${geoError.message}. Location sharing has been disabled.`);
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
        setEnableLocation(false);
        alert("Geolocation is not supported by your browser. Location sharing has been disabled.");
      }
    } else {
      setCoords(null);
      console.log("[REGISTER GEOLOCATION] Location sharing disabled, coords reset.");
    }
  }, [enableLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (!username || !email || !password || !fullnameState) {
        setError("Please fill in all required fields.");
        return;
    }

    try {
      const requestBody: any = {
        username,
        email,
        password,
        fullname: fullnameState,
        phone_number,
        user_type,
      };

      if (coords) {
        requestBody.location = { type: 'Point', coordinates: coords }; // Ensure GeoJSON format
      }

      if (user_type === 'Artist' && isStudent) {
        requestBody.isStudent = true;
      }

      const response = await axios.post(`${API_BASE_URL}/api/users/register`, requestBody);

      const { token, user } = response.data;

      // Set items in local storage for session persistence
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Update the global context with all the new user's details
      if (user && user.user_id) {
        setUserId(user.user_id);
        setUserType(user.user_type);
        setFullname(user.fullname); // Set fullname in context

        // --- CORRECTED NAVIGATION LOGIC ---
        if (user.user_type === 'Artist') {
          console.log("[REGISTER] Navigating to Artist Profile Edit page.");
          setArtistId(user.artist_id || null); // Set artistId in context
          navigate('/artist-profile/edit'); // Navigate to the correct edit page
        } else if (user.user_type === 'Employer') {
          console.log("[REGISTER] Navigating to Employer Profile Edit page.");
          setEmployerId(user.employer_id || null); // Set employerId in context
          navigate('/employer-profile/edit'); // Navigate to the correct edit page
        } else {
          // Fallback just in case, though should not be reached with current form options
          navigate('/main');
        }
        // --- END CORRECTION ---

      } else {
        console.error("[REGISTER] Registration response missing user or user_id:", user);
        setError("Registration successful, but essential user data missing. Please try logging in.");
        navigate('/login');
      }
    } catch (err: any) {
      console.error('[REGISTER] Error in handleSubmit:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Registration failed. Please check your details.');
      } else {
        setError('An unexpected error occurred during registration.');
      }
    }
  };

  return (
    <div className="auth-page-container">
                  <LanguageSwitcher /> {/* <-- ADD THE COMPONENT HERE */}

        <div className="auth-logo-container">
          <Link to="/">
            <img src="/images/logo2.png" alt={t('registerPage.altText.logo')} className="auth-logo" />
            <span style={{ marginLeft: '8px' }}>{t('registerPage.backLink')}</span>
          </Link>
        </div>

        <div className="register-container auth-form-container">
          <form onSubmit={handleSubmit} className="register-form auth-form">
            <h2>{t('registerPage.title')}</h2>

            <div>
              <label htmlFor="username">{t('registerPage.labels.username')}</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="email">{t('registerPage.labels.email')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password">{t('registerPage.labels.password')}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="fullname">{t('registerPage.labels.fullname')}</label>
              <input
                id="fullname"
                type="text"
                value={fullnameState}
                onChange={(e) => setFullnameState(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="phone_number">{t('registerPage.labels.phone')}</label>
              <input
                id="phone_number"
                type="tel"
                value={phone_number}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="user_type">{t('registerPage.labels.userType')}</label>
              <select id="user_type" value={user_type} onChange={(e) => setUserTypeState(e.target.value)}>
                <option value="Artist">{t('registerPage.options.artist')}</option>
                <option value="Employer">{t('registerPage.options.employer')}</option>
              </select>
            </div>

            {user_type === 'Artist' && (
              <div className="checkbox-group">
                <input
                  id="isStudent"
                  type="checkbox"
                  checked={isStudent}
                  onChange={(e) => setIsStudent(e.target.checked)}
                />
                <label htmlFor="isStudent" className="checkbox-label">{t('registerPage.labels.isStudent')}</label>
              </div>
            )}

            <div className="checkbox-group">
              <input
                id="enableLocation"
                type="checkbox"
                checked={enableLocation}
                onChange={(e) => setEnableLocation(e.target.checked)}
              />
              <label htmlFor="enableLocation" className="checkbox-label">{t('registerPage.labels.shareLocation')}</label>
            </div>

            <button type="submit" className="auth-button">{t('registerPage.buttons.register')}</button>
            {error && <p className="error-message">{error}</p>}

            <p className="auth-switch-link">
              {t('registerPage.loginPrompt.text')}{' '}
              <Link to="/login">{t('registerPage.loginPrompt.link')}</Link>
            </p>
          </form>
        </div>
    </div>
  );
};

export default Register;