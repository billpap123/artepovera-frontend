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
  
  // --- STEP 1: Get the new 'loginUser' function from the context ---
  const { loginUser } = useUserContext();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullnameState, setFullnameState] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [user_type, setUserTypeState] = useState('Artist');
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
            setCoords([longitude, latitude]);
          },
          (geoError) => {
            setEnableLocation(false);
            alert(`Could not get location: ${geoError.message}.`);
          }
        );
      } else {
        setEnableLocation(false);
        alert("Geolocation is not supported by your browser.");
      }
    } else {
      setCoords(null);
    }
  }, [enableLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password || !fullnameState) {
        setError("Please fill in all required fields.");
        return;
    }

    try {
      const requestBody: any = {
        username, email, password,
        fullname: fullnameState, phone_number, user_type,
      };
      if (coords) {
        requestBody.location = { type: 'Point', coordinates: coords };
      }
      if (user_type === 'Artist' && isStudent) {
        requestBody.isStudent = true;
      }

      const response = await axios.post(`${API_BASE_URL}/api/users/register`, requestBody);
      const { token, user } = response.data;

      // --- STEP 2: Use the single 'loginUser' function ---
      // This one line replaces all the manual localStorage and context setter calls.
      // It handles everything correctly for us.
      loginUser(user, token);

      // The navigation logic remains the same.
      if (user?.user_type === 'Artist') {
        navigate('/artist-profile/edit');
      } else if (user?.user_type === 'Employer') {
        navigate('/employer-profile/edit');
      } else {
        navigate('/main');
      }

    } catch (err: any) {
      console.error('[REGISTER] Error:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Registration failed.');
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };
  
  // The rest of your component's JSX remains exactly the same.
  return (
    <div className="auth-page-container">
        <LanguageSwitcher />
        <Link to="/" className="auth-logo-corner">
            <img src="/images/logo2.png" alt={t('registerPage.altText.logo')} />
        </Link>

        <div className="auth-form-container register-container">
            <h2 className="register-title">{t('registerPage.title')}</h2>
            <form onSubmit={handleSubmit} className="auth-form">
                {/* Fullname and Username */}
                <div className="form-row">
                    <div className="form-group half-width">
                        <label htmlFor="fullname">{t('registerPage.labels.fullname')}</label>
                        <input id="fullname" type="text" value={fullnameState} onChange={(e) => setFullnameState(e.target.value)} required className="form-input" />
                    </div>
                    <div className="form-group half-width">
                        <label htmlFor="username">{t('registerPage.labels.username')}</label>
                        <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="form-input"/>
                    </div>
                </div>

                {/* Email and Password */}
                <div className="form-group">
                    <label htmlFor="email">{t('registerPage.labels.email')}</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input"/>
                </div>
                <div className="form-group">
                    <label htmlFor="password">{t('registerPage.labels.password')}</label>
                    <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="form-input"/>
                </div>

                {/* Phone Number and User Type */}
                <div className="form-row">
                    <div className="form-group half-width">
                        <label htmlFor="phone_number">{t('registerPage.labels.phone')}</label>
                        <input id="phone_number" type="tel" value={phone_number} onChange={(e) => setPhoneNumber(e.target.value)} className="form-input"/>
                    </div>
                    <div className="form-group half-width">
                        <label htmlFor="user_type">{t('registerPage.labels.userType')}</label>
                        <select id="user_type" value={user_type} onChange={(e) => setUserTypeState(e.target.value)} className="form-input">
                            <option value="Artist">{t('registerPage.options.artist')}</option>
                            <option value="Employer">{t('registerPage.options.employer')}</option>
                        </select>
                    </div>
                </div>

                {/* Checkboxes */}
                <div className="checkbox-options">
                    {user_type === 'Artist' && (
                        <div className="checkbox-group">
                            <input id="isStudent" type="checkbox" checked={isStudent} onChange={(e) => setIsStudent(e.target.checked)} />
                            <label htmlFor="isStudent">{t('registerPage.labels.isStudent')}</label>
                        </div>
                    )}
                    <div className="checkbox-group">
                        <input id="enableLocation" type="checkbox" checked={enableLocation} onChange={(e) => setEnableLocation(e.target.checked)} />
                        <label htmlFor="enableLocation">{t('registerPage.labels.shareLocation')}</label>
                    </div>
                </div>

                <button type="submit" className="auth-button">{t('registerPage.buttons.register')}</button>
                {error && <p className="error-message">{error}</p>}
            </form>

            <p className="auth-switch-link">
                {t('registerPage.loginPrompt.text')}{' '}
                <Link to="/login">{t('registerPage.loginPrompt.link')}</Link>
            </p>
        </div>
    </div>
  );
};

export default Register;