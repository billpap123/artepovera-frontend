// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserContext';
import '../styles/Login.css';
import { useTranslation } from "react-i18next";
import LanguageSwitcher from '../components/LanguageSwitcher';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { loginUser } = useUserContext();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/login`, {
                email,
                password,
            });
            
            const { token, user } = response.data;

            // --- THIS IS THE FIX ---
            // The 'user' object from your API is already perfect.
            // We remove the broken "flattening" logic and pass it directly.
            loginUser(user, token);
            
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
            <LanguageSwitcher />
            <Link to="/" className="auth-logo-corner">
                <img src="/images/logo2.png" alt={t('loginPage.altText.logo')} />
            </Link>
    
            <div className="auth-form-container">
                <div className="auth-form-header">
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