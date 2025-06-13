// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserContext'; // <-- 1. IMPORT THE HOOK
import '../styles/Global.css';
import '../styles/Login.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    
    // --- THIS IS THE FIX (PART 1) ---
    // Get the setFullname function from your context as well.
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
            
            // --- THIS IS THE FIX (PART 2) ---
            // Update all relevant user data in the global context *before* navigating.
            setUserId(user.user_id);
            setUserType(user.user_type);
            setFullname(user.fullname); // This is the critical line you were missing.

            // Check for nested profile objects to set the correct ID
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
            <div className="auth-logo-container">
                <Link to="/">
                    <img src="/images/logo2.png" alt="Artepovera Home" className="auth-logo" />
                    <span style={{ marginLeft: '8px' }}>Back to main page</span>
                </Link>
            </div>

            <div className="login-container auth-form-container">
                <form onSubmit={handleSubmit} className="login-form auth-form">
                    <h2 className="login-title">Login to your account</h2>
                    <div className="form-group">
                        <label htmlFor="login-email">Email:</label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="login-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="login-password">Password:</label>
                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="login-input"
                        />
                    </div>
                    <button type="submit" className="login-button auth-button">Login</button>
                    {error && <p className="login-error error-message">{error}</p>}
                </form>

                <p className="register-link auth-switch-link">
                    Don't have an account?{' '}
                    <Link to="/register">
                        Register now
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
