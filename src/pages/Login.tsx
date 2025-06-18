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
    
    // --- STEP 1: Get the new 'loginUser' function from the context ---
    // We no longer need the individual setters here.
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

            // --- STEP 2: Prepare the user data to match the context's expectation ---
            // The context's `loginUser` function expects a flat object.
            const userDataForContext = {
                user_id: user.user_id,
                user_type: user.user_type,
                fullname: user.fullname,
                // Use optional chaining (?.) for safety in case profile is missing
                artist_id: user.artistProfile?.artist_id, 
                employer_id: user.employerProfile?.employer_id,
            };

            // --- STEP 3: Call the single context function ---
            // This one line replaces all the manual localStorage.setItem and set... calls.
            // It updates the state and localStorage at the same time.
            loginUser(userDataForContext, token);
            
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

    // The rest of your component's JSX remains exactly the same.
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