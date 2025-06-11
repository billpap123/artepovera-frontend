// src/pages/MyApplicationsPage.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaBriefcase, FaExternalLinkAlt } from 'react-icons/fa';
import Navbar from '../components/Navbar'; // Import Navbar
import '../styles/MyApplications.css'; // We will use a new CSS file

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// --- Interfaces for the application data ---
interface JobPostingForApplication {
    job_id: number;
    title: string;
    description: string | null; // Added description
    employer: {
        user: {
            user_id: number;
            fullname: string;
        }
    };
}

interface Application {
    application_id: number;
    jobPosting: JobPostingForApplication;
}

const MyApplicationsPage: React.FC = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMyApplications = async () => {
            setIsLoading(true);
            setError(null);
            const token = localStorage.getItem("token");
            if (!token) {
                setError("You must be logged in to view your applications.");
                setIsLoading(false);
                return;
            }
            try {
                const response = await axios.get<Application[]>(`${API_URL}/api/my-applications`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setApplications(response.data);
            } catch (err) {
                console.error("Failed to fetch applications:", err);
                setError("Could not load your applications. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchMyApplications();
    }, []);

    if (isLoading) {
        return <div className="loading-container"><div className="spinner"></div><p>Loading your applications...</p></div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <>
            <Navbar />
            <div className="my-applications-page">
                <header className="page-header">
                    <h1>My Applications</h1>
                    <p>A list of all the jobs you've applied for.</p>
                </header>
                
                {applications.length === 0 ? (
                    <div className="empty-state-container">
                        <FaBriefcase size={60} className="empty-state-icon" />
                        <h2>No Applications Found</h2>
                        <p>You haven't applied to any jobs yet. When you do, they'll show up here.</p>
                        <Link to="/main" className="btn-primary">Browse Jobs</Link>
                    </div>
                ) : (
                    <div className="applications-list">
                        {applications.map((app) => (
                            <div key={app.application_id} className="application-list-item">
                                <div className="item-main-content">
                                    <h2 className="job-title">{app.jobPosting.title}</h2>
                                    <p className="employer-name">
                                        by <Link to={`/user-profile/${app.jobPosting.employer.user.user_id}`}>{app.jobPosting.employer.user.fullname}</Link>
                                    </p>
                                    <p className="job-description">
                                        {app.jobPosting.description 
                                            ? `${app.jobPosting.description.substring(0, 200)}...` 
                                            : 'No description available.'}
                                    </p>
                                </div>
                                <div className="item-actions">
                                    <Link to={`/jobs/${app.jobPosting.job_id}`} className="view-job-button">
                                        View Job Details <FaExternalLinkAlt />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default MyApplicationsPage;