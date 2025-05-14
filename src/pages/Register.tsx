// src/pages/Register.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserContext';
import "../styles/Register.css"; // Make sure this file includes styles for .auth-page-container etc.
import '../styles/Global.css'; // Keep if you have global styles

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

const Register = () => {
  const { setUserId, setArtistId, setEmployerId } = useUserContext();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [user_type, setUserType] = useState('Artist'); // Default user type
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
            // Provide more informative alert
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
    console.log("[REGISTER SUBMIT - 1] Form submitted. User type:", user_type, "isStudent:", isStudent, "enableLocation:", enableLocation);

    try {
      const requestBody: any = {
        username, email, password, fullname, phone_number, user_type
      };

      if (coords) {
        requestBody.location = { coordinates: coords };
        console.log("[REGISTER SUBMIT - 2] Location included in requestBody:", requestBody.location);
      } else {
        console.log("[REGISTER SUBMIT - 2] No location coordinates to include.");
      }

      if (user_type === 'Artist' && isStudent) {
        requestBody.isStudent = true;
        console.log("[REGISTER SUBMIT - 3] isStudent flag included for Artist.");
      }

      console.log("[REGISTER SUBMIT - 4] Sending registration data to backend:", requestBody);
      const response = await axios.post(`${API_BASE_URL}/api/users/register`, requestBody);

      console.log('[REGISTER SUBMIT - 5] Backend response.data:', JSON.stringify(response.data, null, 2));
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('[REGISTER SUBMIT - 6] User object for navigation & context:', JSON.stringify(user, null, 2));

      if (user && user.user_id) {
        setUserId(user.user_id);
        console.log("[REGISTER SUBMIT - 7] Context userId set to:", user.user_id);

        if (user.user_type === 'Artist' && user.artist_id) {
          console.log("[REGISTER SUBMIT - 8a] Navigating to /artist-profile with artist_id:", user.artist_id);
          setArtistId(user.artist_id);
          navigate('/artist-profile');
        } else if (user.user_type === 'Employer' && user.employer_id) {
          console.log("[REGISTER SUBMIT - 8b] Navigating to /employer-profile with employer_id:", user.employer_id);
          setEmployerId(user.employer_id);
          navigate('/employer-profile');
        } else {
          console.log("[REGISTER SUBMIT - 8c] Fallback navigation to /main. User details:", user);
          navigate('/main');
        }
      } else {
        console.error("[REGISTER SUBMIT - 9] Registration response missing user or user_id:", user);
        setError("Registration successful, but essential user data missing in response. Please try logging in.");
        navigate('/login');
      }
    } catch (err: any) {
      console.error('[REGISTER SUBMIT - E1] Error in handleSubmit catch block:', err);
      if (axios.isAxiosError(err) && err.response) {
        console.error('[REGISTER SUBMIT - E2] Axios error response data:', err.response.data);
        setError(err.response.data.message || 'Registration failed. Please check your details.');
      } else {
        setError('An unexpected error occurred during registration.');
      }
    }
  };

  return (
    <div className="auth-page-container">
        <div className="auth-logo-container">
          <Link to="/"> Back to main page
            <img src="/images/logo2.png" alt="Artepovera Home" className="auth-logo" />
          </Link>
        </div>

        <div className="register-container auth-form-container">
          <form onSubmit={handleSubmit} className="register-form auth-form">
            <h2>Create Your Account</h2>

            <div>
              <label htmlFor="username">Username:</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password">Password:</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="fullname">Full Name:</label>
              <input
                id="fullname"
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="phone_number">Phone Number (Optional):</label>
              <input
                id="phone_number"
                type="tel"
                value={phone_number}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="user_type">Register as:</label>
              <select id="user_type" value={user_type} onChange={(e) => setUserType(e.target.value)}>
                <option value="Artist">Artist</option>
                <option value="Employer">Employer</option>
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
                <label htmlFor="isStudent" className="checkbox-label">I am a student artist</label>
              </div>
            )}

            <div className="checkbox-group">
              <input
                id="enableLocation"
                type="checkbox"
                checked={enableLocation}
                onChange={(e) => setEnableLocation(e.target.checked)}
              />
              <label htmlFor="enableLocation" className="checkbox-label">Share my current location (for better local matches)</label>
            </div>

            <button type="submit" className="auth-button">Register</button>
            {error && <p className="error-message">{error}</p>}

            <p className="auth-switch-link">
              Already have an account?{' '}
              <Link to="/login">Sign In</Link>
            </p>
          </form>
        </div>
    </div>
  );
};

export default Register;