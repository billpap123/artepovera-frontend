import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/MainPage.css';
import Navbar from '../components/Navbar';
import JobFeed from './JobFeed';
import MapView from './MapView';
import '../styles/Global.css';

const MainPage = () => {
  const navigate = useNavigate();
  
  // ✅ Ensure user data is valid
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!user || !user.user_type) {
      navigate('/login'); // Redirect if not authenticated
    }
  }, [navigate, user]);

  return (
    <>
      <Navbar />
      {/* A layout that holds sidebar + job feed side by side */}
      <div className="layout">
        <aside className="sidebar">
          <ul>
            {user?.user_type === 'Artist' ? (
              <>
                <li>
                  <Link to="/portfolio">My portfolio</Link>
                </li>
                <li>
                  <Link to="/chat">My chat</Link>
                </li>
              </>
            ) : (
              <>
                
                <li>
                  <Link to="/post-job">Post a job</Link>
                </li>
                <li>
                  <Link to="/chat">My chat</Link>
                </li>
              </>
            )}
          </ul>
        </aside>

        {/* Job Feed Section to the right */}
        <div className="job-feed-section">
          <h2>Job feed</h2>
          <JobFeed />
        </div>
      </div>

     
    </>
  );
};

export default MainPage;
