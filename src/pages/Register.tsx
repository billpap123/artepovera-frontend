import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserContext';
import "../styles/Register.css";
import '../styles/Global.css';

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

  // ─────────────────────────────────────────────────────────
  // 1) OPTIONAL: Student Artist Checkbox
  // ─────────────────────────────────────────────────────────
  const [isStudent, setIsStudent] = useState(false);

  // ─────────────────────────────────────────────────────────
  // 2) OPTIONAL: Location Checkbox & State
  // ─────────────────────────────────────────────────────────
  const [enableLocation, setEnableLocation] = useState(false);
  const [coords, setCoords] = useState<[number, number] | null>(null);

  // Whenever enableLocation is checked, try to get user’s location
  useEffect(() => {
    if (enableLocation) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            // Longitude first, then latitude for your "POINT(lon lat)" usage
            setCoords([longitude, latitude]);
          },
          (error) => {
            console.error("Geolocation error:", error);
          }
        );
      } else {
        console.error("Geolocation not supported by this browser.");
      }
    } else {
      // If user unchecks location, remove coords
      setCoords(null);
    }
  }, [enableLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ─────────────────────────────────────────────────────────
      // 3) Build the request payload
      // ─────────────────────────────────────────────────────────
      const requestBody: any = {
        username,
        email,
        password,
        fullname,
        phone_number,
        user_type
      };

      // If location is enabled & we have coordinates, include them
      if (coords) {
        requestBody.location = {
          coordinates: coords,
        };
      }

      // If you want to send "isStudent" to the backend,
      // you need to store it in the DB or do something with it.
      // For now, let's just pass it along:
      if (isStudent) {
        requestBody.isStudent = true;
      }

      // ─────────────────────────────────────────────────────────
      // 4) Register the user with our new requestBody
      // ─────────────────────────────────────────────────────────
      const response = await axios.post(`${API_BASE_URL}/api/users/register`, requestBody);

      const { user_id, artist_id, employer_id, token } = response.data;

      // Store the token for authentication
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data));

      // Set userId in context
      setUserId(user_id);

      // Navigate based on user type
      if (user_type === 'Artist' && artist_id) {
        setArtistId(artist_id);
        navigate('/artist-profile'); 
      } else if (user_type === 'Employer' && employer_id) {
        setEmployerId(employer_id);
        navigate('/employer-profile'); 
      } else {
        navigate('/main'); // Fallback
      }
    } catch (err) {
      setError('Error registering user');
      if (axios.isAxiosError(err) && err.response) {
        console.error('Registration error details:', err.response.data);
      } else {
        console.error(err);
      }
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>Register</h2>
        <div>
          <label>Username:</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Full Name:</label>
          <input 
            type="text" 
            value={fullname} 
            onChange={(e) => setFullname(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Phone Number:</label>
          <input 
            type="tel" 
            value={phone_number} 
            onChange={(e) => setPhoneNumber(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>User Type:</label>
          <select value={user_type} onChange={(e) => setUserType(e.target.value)}>
            <option value="Artist">Artist</option>
            <option value="Employer">Employer</option>
          </select>
        </div>

        {/* ─────────────────────────────────────────────────────────
            5) Student Artist Checkbox
            (only relevant if user_type === 'Artist'—but that’s up to you)
        ───────────────────────────────────────────────────────── */}
        {user_type === 'Artist' && (
          <div style={{ margin: '10px 0' }}>
            <label>
              <input 
                type="checkbox" 
                checked={isStudent} 
                onChange={(e) => setIsStudent(e.target.checked)}
              />
              I am a student artist
            </label>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            6) Enable Location Checkbox
        ───────────────────────────────────────────────────────── */}
        <div style={{ margin: '10px 0' }}>
          <label>
            <input 
              type="checkbox" 
              checked={enableLocation} 
              onChange={(e) => setEnableLocation(e.target.checked)}
            />
            Share my current location
          </label>
        </div>

        <button type="submit">Register</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <p style={{ marginTop: '20px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#007BFF', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
