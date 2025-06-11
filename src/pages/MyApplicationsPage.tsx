import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaBriefcase, FaBuilding, FaCalendarAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { formatDate } from '../utils/formatDate'; // Assuming you have this utility
import '../styles/MyApplications.css'; // We will create this CSS file next

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// --- Interfaces for the application data ---

// Defines the possible statuses for a job application
type ApplicationStatus = 'pending' | 'viewed' | 'accepted' | 'rejected';

// A simplified version of the JobPosting, containing only what we need for this page
interface JobPostingForApplication {
    job_id: number;
    title: string;
    employer: {
        user: {
            user_id: number;
            fullname: string;
            profile_picture: string | null;
        }
    };
}

// The main interface for a single application record
interface Application {
    application_id: number;
    application_date: string;
    status: ApplicationStatus;
    jobPosting: JobPostingForApplication; // Nested job posting details
}

// --- The React Component ---

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
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
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
    }, []); // Empty dependency array means this runs once on component mount

    // --- Conditional Rendering ---

    if (isLoading) {
        return <div className="loading-container"><div className="spinner"></div><p>Loading your applications...</p></div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (applications.length === 0) {
        return (
            <div className="empty-state-container">
                <FaBriefcase size={60} className="empty-state-icon" />
                <h2>No Applications Found</h2>
                <p>You haven't applied to any jobs yet. When you do, they'll show up here.</p>
                <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
            </div>
        );
    }

    // --- Main Render ---
    
    return (
        <div className="my-applications-page">
            <header className="page-header">
                <h1>My Applications</h1>
                <p>Track the status of all your submitted job applications.</p>
            </header>
            <div className="applications-grid">
                {applications.map((app) => (
                    <div key={app.application_id} className="application-card">
                        <div className="card-content">
                            <h3 className="job-title">{app.jobPosting.title}</h3>
                            <p className="employer-info">
                                <FaBuilding />
                                <Link to={`/user-profile/${app.jobPosting.employer.user.user_id}`}>
                                    {app.jobPosting.employer.user.fullname}
                                </Link>
                            </p>
                            
                            <div className="application-details">
                                <div className="detail-item">
                                    <FaCalendarAlt />
                                    <span>Applied on: {formatDate(app.application_date)}</span>
                                </div>
                                <div className="detail-item">
                                    <strong>Status:</strong>
                                    <span className={`status-badge status-${app.status}`}>
                                        {app.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="card-actions">
                            <Link to={`/job-details/${app.jobPosting.job_id}`} className="view-job-link">
                                View Original Job <FaExternalLinkAlt />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyApplicationsPage;