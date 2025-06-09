// src/pages/JobDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
// --- IMPORT THE REUSABLE COMPONENTS AND TYPES ---
import JobPostings, { JobPosting } from './JobPostings'; // <<< IMPORT JobPosting TYPE HERE
import '../styles/JobDetailPage.css'; // Create this new CSS file

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// --- REMOVE THE LOCAL, EMPTY INTERFACE ---
// interface Job { /* ... Paste the full Job interface here from JobPostings.tsx ... */ } // DELETE THIS

const JobDetailPage = () => {
    const { jobId } = useParams<{ jobId: string }>();
    // --- USE THE IMPORTED JobPosting TYPE ---
    const [job, setJob] = useState<JobPosting | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!jobId) {
            setError("No job ID provided.");
            setLoading(false);
            return;
        }

        const fetchJobDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                // Use your backend endpoint to get a single job by its ID
                const response = await axios.get<JobPosting>(`${API_URL}/api/job-postings/${jobId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                setJob(response.data);
            } catch (err: any) {
                console.error("Error fetching job details:", err);
                setError(err.response?.data?.message || "Failed to load job details.");
            } finally {
                setLoading(false);
            }
        };

        fetchJobDetails();
    }, [jobId]);

    if (loading) return <><Navbar /><div className="page-container"><p className="loading-message">Loading Job Details...</p></div></>;
    if (error) return <><Navbar /><div className="page-container"><p className="error-message">{error}</p></div></>;
    if (!job) return <><Navbar /><div className="page-container"><p className="no-jobs-message">Job not found.</p></div></>;

    return (
        <>
            <Navbar />
            <div className="job-detail-page-container">
                {/* We pass an array containing our single fetched job
                    to the reusable JobPostings component.
                */}
                <JobPostings jobs={[job]} />
            </div>
        </>
    );
};

export default JobDetailPage;