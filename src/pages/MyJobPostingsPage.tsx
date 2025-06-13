// src/pages/MyJobPostingsPage.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../context/UserContext';
import Navbar from '../components/Navbar';
import { formatDate } from '../utils/formatDate'; // Assuming you have this
import { FaEdit, FaTrash, FaPlusCircle } from 'react-icons/fa';
import '../styles/MyJobPostingsPage.css'; // We will create this CSS file next
import { useTranslation } from "react-i18next";



// Use a shared Job interface, ideally from a types.ts file
interface Job {
  job_id: number;
  title: string;
  category: string;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

const MyJobPostingsPage: React.FC = () => {
    const navigate = useNavigate();
    const { userType } = useUserContext();
    const { t } = useTranslation();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for the confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<number | null>(null);

    useEffect(() => {
        // Redirect if user is not an employer
        if (userType && userType !== 'Employer') {
            navigate('/main');
            return;
        }

        const fetchMyJobs = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get<Job[]>(`${API_URL}/api/job-postings/my`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setJobs(response.data);
            } catch (err: any) {
                console.error("Error fetching my jobs:", err);
                setError(err.response?.data?.message || "Failed to load your job postings.");
            } finally {
                setLoading(false);
            }
        };

        if (userType === 'Employer') {
            fetchMyJobs();
        }
    }, [userType, navigate]);

    const handleDeleteClick = (jobId: number) => {
        setJobToDelete(jobId);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!jobToDelete) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/job-postings/${jobToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Remove the job from the local state for an instant UI update
            setJobs(prevJobs => prevJobs.filter(job => job.job_id !== jobToDelete));
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete job posting.");
        } finally {
            setShowConfirmModal(false);
            setJobToDelete(null);
        }
    };

    return (
        <>
            <Navbar />
            <div className="my-jobs-page-container">
                <header className="my-jobs-header">
                    <h1>{t('myJobPostingsPage.title')}</h1>
                    <Link to="/post-job" className="action-button">
                        <FaPlusCircle /> {t('myJobPostingsPage.postNewJob')}
                    </Link>
                </header>
    
                {loading && <p>{t('myJobPostingsPage.status.loading')}</p>}
                {error && <p className="error-message">{error}</p>}
                
                {!loading && !error && (
                    <div className="job-list-container">
                        {jobs.length > 0 ? (
                            jobs.map(job => (
                                <div key={job.job_id} className="job-management-card">
                                    <div className="job-card-info">
                                        <h3>{job.title}</h3>
                                        <p><strong>{t('myJobPostingsPage.card.category')}</strong> {job.category}</p>
                                        <p className="post-date">{t('myJobPostingsPage.card.postedOn')} {formatDate(job.createdAt)}</p>
                                    </div>
                                    <div className="job-card-actions">
                                        <Link to={`/edit-job/${job.job_id}`} className="edit-btn">
                                            <FaEdit /> {t('myJobPostingsPage.actions.edit')}
                                        </Link>
                                        <button onClick={() => handleDeleteClick(job.job_id)} className="delete-btn">
                                            <FaTrash /> {t('myJobPostingsPage.actions.delete')}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>{t('myJobPostingsPage.status.none')}</p>
                        )}
                    </div>
                )}
            </div>
    
            {/* --- Delete Confirmation Modal --- */}
            {showConfirmModal && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal">
                        <h4>{t('myJobPostingsPage.deleteModal.title')}</h4>
                        <p>{t('myJobPostingsPage.deleteModal.message')}</p>
                        <div className="modal-actions">
                            <button onClick={() => setShowConfirmModal(false)} className="cancel-btn">
                                {t('myJobPostingsPage.deleteModal.cancel')}
                            </button>
                            <button onClick={confirmDelete} className="confirm-delete-btn">
                                {t('myJobPostingsPage.deleteModal.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MyJobPostingsPage;
