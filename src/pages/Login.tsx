// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserContext';
import '../styles/Global.css';
import '../styles/Login.css'; // We will replace the content of this file
import { useTranslation } from "react-i18next";
import LanguageSwitcher from '../components/LanguageSwitcher';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { setUserId, setUserType, setArtistId, setEmployerId, setFullname } = useUserContext();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/login`, {
                email,
                password,
            });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            setUserId(user.user_id);
            setUserType(user.user_type);
            setFullname(user.fullname);

            if (user.user_type === 'Artist' && user.artistProfile) {
                setArtistId(user.artistProfile.artist_id);
            } else if (user.user_type === 'Employer' && user.employerProfile) {
                setEmployerId(user.employerProfile.employer_id);
            }
            
            navigate('/main');
        } catch (err: any) {
            console.error('Login error:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.message || 'Invalid email or password.');
            } else {
                setError('An unexpected error occurred during login.');
            }
        }
    };

    return (
        <div className="auth-page-container">
            {/* These elements are positioned relative to the full page */}
            <LanguageSwitcher />
            <Link to="/" className="auth-logo-corner">
                <img src="/images/logo2.png" alt={t('loginPage.altText.logo')} />
            </Link>
    
            {/* This is the centered white form box */}
            <div className="auth-form-container">
                <div className="auth-form-header">
                     <img src="/images/logo2.png" alt={t('loginPage.altText.logo')} className="auth-form-logo" />
                     <h2 className="login-title">{t('loginPage.title')}</h2>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="login-email">{t('loginPage.emailLabel')}</label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="login-password">{t('loginPage.passwordLabel')}</label>
                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-input"
                        />
                    </div>
                    <button type="submit" className="auth-button">{t('loginPage.loginButton')}</button>
                    {error && <p className="error-message">{error}</p>}
                </form>
    
                <p className="auth-switch-link">
                    {t('loginPage.registerPrompt')}{' '}
                    <Link to="/register">
                        {t('loginPage.registerLink')}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;