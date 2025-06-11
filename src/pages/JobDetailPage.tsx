// src/pages/JobDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { formatDate } from '../utils/formatDate';
import { useUserContext } from '../context/UserContext';
import { getImageUrl } from '../utils/getImageUrl';
import { 
    FaMapMarkerAlt, FaGlobe, FaBuilding, FaEuroSign, FaCalendarAlt, 
    FaTools, FaUserGraduate, FaLanguage, FaFileContract, FaRegClock
} from 'react-icons/fa';
import '../styles/JobDetailPage.css';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// --- Interfaces for Job data ---
interface JobRequirements {
  military_service?: 'Completed' | 'Not Required' | 'Not Applicable';
  university_degree?: { required: boolean; details?: string; };
  foreign_languages?: { language: string; certificate: string; }[];
  experience_years?: '0-3' | '4-7' | '7-10' | '>10';
}
interface Job {
    job_id: number; title: string; category: string; description?: string | null; location?: string | null;
    presence: 'Physical' | 'Online' | 'Both'; start_date?: string | null; end_date?: string | null;
    application_deadline?: string | null; payment_total: number; payment_is_monthly?: boolean;
    payment_monthly_amount?: number | null; number_of_months?: number | null; insurance?: boolean | null; 
    desired_keywords?: string | null; requirements?: JobRequirements | null; createdAt: string;
    employer?: { user?: { user_id: number; fullname: string; profile_picture: string | null; } }
}

const JobDetailPage: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const { userType, userId } = useUserContext();
    const isArtist = userType === 'Artist';

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isApplied, setIsApplied] = useState(false);
    const [isApplying, setIsApplying] = useState(false);

    useEffect(() => {
        if (!jobId) return;
        let isMounted = true;
        const fetchJobDetails = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get<Job>(`${API_URL}/api/job-postings/${jobId}`, { headers });
                if (!isMounted) return;
                setJob(response.data);

                if (isArtist && userId) {
                    const appsResponse = await axios.get<{ appliedJobIds: number[] }>(`${API_URL}/api/artists/my-applications`, { headers });
                    if (isMounted && appsResponse.data.appliedJobIds.includes(Number(jobId))) {
                        setIsApplied(true);
                    }
                }
            } catch (err) {
                setError("Failed to load job details.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchJobDetails();
        return () => { isMounted = false; };
    }, [jobId, isArtist, userId]);

    const handleApply = async () => {
        if (isApplying || isApplied) return;
        setIsApplying(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Please log in to apply.");
            const response = await axios.post(`${API_URL}/api/job-postings/${jobId}/apply`, {}, { headers: { Authorization: `Bearer ${token}` } });
            alert(response.data.message || "Application successful!");
            setIsApplied(true);
        } catch (error: any) {
            if (error.response?.status === 409) setIsApplied(true);
            alert(error.response?.data?.message || "Failed to apply.");
        } finally {
            setIsApplying(false);
        }
    };

    if (loading) return <><Navbar /><div className="page-container"><p>Loading Job Details...</p></div></>;
    if (error) return <><Navbar /><div className="page-container error-message">{error}</div></>;
    if (!job) return <><Navbar /><div className="page-container"><p>Job not found.</p></div></>;

    return (
        <>
            <Navbar />
            <div className="job-detail-page-container">
                {/* --- NEW LAYOUT: Column 1 (Details Sidebar) --- */}
                <aside className="job-detail-sidebar">
                    <div className="sidebar-card details-card">
                        <h4><FaCalendarAlt /> Duration</h4>
                        <ul>
                            <li><strong>Starts:</strong><span>{formatDate(job.start_date)}</span></li>
                            <li><strong>Ends:</strong><span>{formatDate(job.end_date)}</span></li>
                        </ul>
                    </div>

                    <div className="sidebar-card details-card">
                        <h4><FaMapMarkerAlt /> Location & Presence</h4>
                         <ul>
                            <li><strong>Presence:</strong><span>{job.presence}</span></li>
                            {job.location && <li><strong>Location:</strong><span>{job.location}</span></li>}
                        </ul>
                    </div>

                    <div className="sidebar-card details-card">
                        <h4><FaEuroSign /> Compensation</h4>
                        <ul>
                            {job.payment_is_monthly ? (
                                <>
                                    <li><strong>Salary:</strong><span>€{Number(job.payment_monthly_amount).toFixed(2)} / month</span></li>
                                    <li><strong>For:</strong><span>{job.number_of_months} month(s)</span></li>
                                </>
                            ) : (
                                <li><strong>Total Pay:</strong><span>€{Number(job.payment_total).toFixed(2)}</span></li>
                            )}
                            <li><strong>Insurance:</strong><span>{job.insurance ? 'Provided' : 'Not Provided'}</span></li>
                        </ul>
                    </div>
                     {isArtist && (
                        <div className="sidebar-card apply-card">
                            <h4>Ready to Apply?</h4>
                            {job.application_deadline && <p className="deadline-text"><FaRegClock /> Deadline: {formatDate(job.application_deadline)}</p>}
                            <button onClick={handleApply} disabled={isApplied || isApplying} className="apply-button-large">
                                {isApplying ? 'Submitting...' : isApplied ? 'Applied' : 'Apply Now'}
                            </button>
                        </div>
                    )}
                </aside>

                {/* --- NEW LAYOUT: Column 2 (Main Content) --- */}
                <main className="job-detail-main">
                    <div className="sidebar-card employer-card">
                        <Link to={`/user-profile/${job.employer?.user?.user_id}`} className="employer-link">
                            <img src={getImageUrl(job.employer?.user?.profile_picture)} alt={job.employer?.user?.fullname} />
                            <div>
                                <span className="posted-by-label">Posted by</span>
                                <span className="employer-name">{job.employer?.user?.fullname || 'N/A'}</span>
                            </div>
                        </Link>
                    </div>

                    <div className="job-detail-header">
                        <span className="job-detail-category">{job.category}</span>
                        <h1>{job.title}</h1>
                        <p className="job-detail-post-date">Posted on {formatDate(job.createdAt)}</p>
                    </div>

                    {job.description && (
                        <section className="job-detail-section">
                            <h2>Project Description</h2>
                            <p>{job.description}</p>
                        </section>
                    )}

                    {job.requirements && (
                        <section className="job-detail-section">
                            <h2>Requirements</h2>
                            <ul className="requirements-list">
                                {job.requirements.experience_years && <li><FaTools /><span><strong>Experience:</strong> {job.requirements.experience_years} years</span></li>}
                                {job.requirements.university_degree?.required && <li><FaUserGraduate /><span><strong>Degree:</strong> {job.requirements.university_degree.details || 'Required'}</span></li>}
                                {job.requirements.military_service && job.requirements.military_service !== 'Not Applicable' && <li><span><strong>Military Service:</strong> {job.requirements.military_service}</span></li>}
                                {job.requirements.foreign_languages && job.requirements.foreign_languages.length > 0 && (
                                    <li><FaLanguage /><span><strong>Languages:</strong> {job.requirements.foreign_languages.map(l => `${l.language} (${l.certificate})`).join(', ')}</span></li>
                                )}
                            </ul>
                        </section>
                    )}

                    {job.desired_keywords && (
                        <section className="job-detail-section">
                            <h2>Desired Skills & Keywords</h2>
                            <div className="keywords-container">
                                {job.desired_keywords.split(',').map((keyword, index) => (
                                    <span key={index} className="keyword-tag">{keyword.trim()}</span>
                                ))}
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </>
    );
};

export default JobDetailPage;
