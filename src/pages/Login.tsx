// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Global.css'; // Keep if you have global styles
import '../styles/Login.css';   // Ensure this file exists and has styles

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    // const { setUserId, setArtistId, setEmployerId } = useUserContext(); // Import if needed for context update

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/login`, {
                email,
                password,
            });

            const { token, user } = response.data; // Assuming backend sends user object

            localStorage.setItem('token', token);
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
                // --- Optional: Update UserContext if you use it after login ---
                // if (setUserId) setUserId(user.user_id);
                // if (user.user_type === 'Artist' && user.artist_id && setArtistId) {
                //     setArtistId(user.artist_id);
                // } else if (user.user_type === 'Employer' && user.employer_id && setEmployerId) {
                //     setEmployerId(user.employer_id);
                // }
                // --- End Optional ---
            } else {
                // This case should ideally not happen if login is successful
                console.error("User data not found in login response");
                setError("Login successful, but failed to retrieve user details.");
                return;
            }

            navigate('/main'); // Redirect to the main page
        } catch (err: any) { // Typed err
            console.error('Login error:', err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.message || 'Invalid email or password.');
            } else {
                setError('An unexpected error occurred during login.');
            }
        }
    };

    return (
        <div className="auth-page-container"> {/* Main page wrapper */}
            <div className="auth-logo-container">
                <Link to="/">
                    <img src="/images/logo2.png" alt="Artepovera Home" className="auth-logo" />
                    <span style={{ marginLeft: '8px' }}>Back to main page</span> {/* Added span for spacing if logo first */}
                </Link>
            </div>

            <div className="login-container auth-form-container"> {/* Container for the form */}
                {/* Keep login-container if it has unique styles, auth-form-container for shared styles */}
                <form onSubmit={handleSubmit} className="login-form auth-form">
                    <h2 className="login-title">Login to Your Account</h2> {/* Specific title */}
                    <div className="form-group"> {/* Consistent class for styling */}
                        <label htmlFor="login-email">Email:</label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="login-input" // Can also use a shared .auth-input class
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
                            className="login-input" // Can also use a shared .auth-input class
                        />
                    </div>
                    <button type="submit" className="login-button auth-button">Login</button> {/* Shared auth-button class */}
                    {error && <p className="login-error error-message">{error}</p>} {/* Shared error-message class */}
                </form>

                <p className="register-link auth-switch-link"> {/* Shared auth-switch-link class */}
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