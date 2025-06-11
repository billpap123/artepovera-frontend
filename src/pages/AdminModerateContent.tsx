// src/pages/AdminModerateContent.tsx
import React, { useState, useEffect } from 'react';
import axios, { AxiosResponse } from 'axios'; // Import AxiosResponse for better typing
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { formatDate } from '../utils/formatDate';
import '../styles/AdminDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// --- Interfaces for the data we will fetch ---
interface ReviewForAdmin {
    review_id: number;
    overall_rating: number;
    specific_answers?: { comment?: string };
    createdAt: string;
    reviewer: { user_id: number; fullname: string; };
    reviewed: { user_id: number; fullname: string; };
}

interface CommentForAdmin {
    comment_id: number;
    comment_text: string;
    createdAt: string;
    commenterArtist: { user_id: number; fullname: string; };
    commentedProfileUser: { user_id: number; fullname: string; };
}

interface PortfolioForAdmin {
    portfolio_id: number;
    image_url: string;
    description: string;
    createdAt: string;
    artist?: { // This comes from the 'include' in the backend
        user?: {
            user_id: number;
            fullname: string;
        }
    }
}

interface JobForAdmin {
    job_id: number;
    title: string;
    description: string;
    createdAt: string;
    employer?: { // This comes from the 'include' in the backend
        user?: {
            user_id: number;
            fullname: string;
        }
    }
}

const AdminModerateContent = () => {
    // --- State for all content types ---
    const [reviews, setReviews] = useState<ReviewForAdmin[]>([]);
    const [comments, setComments] = useState<CommentForAdmin[]>([]);
    const [portfolios, setPortfolios] = useState<PortfolioForAdmin[]>([]);
    const [jobs, setJobs] = useState<JobForAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAllContent = async () => {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            try {
                // Define all your promises first, with explicit types for their expected data
                const reviewsPromise = axios.get<ReviewForAdmin[]>(`${API_BASE_URL}/api/admin/reviews`, { headers });
                const commentsPromise = axios.get<CommentForAdmin[]>(`${API_BASE_URL}/api/admin/comments`, { headers });
                const portfoliosPromise = axios.get<PortfolioForAdmin[]>(`${API_BASE_URL}/api/admin/portfolios`, { headers });
                const jobsPromise = axios.get<JobForAdmin[]>(`${API_BASE_URL}/api/admin/jobs`, { headers });

                // --- THIS IS THE CORRECTED PART ---
                // Ensure you are awaiting the PROMISE variables defined above.
                const [
                    reviewsResponse,
                    commentsResponse,
                    portfoliosResponse,
                    jobsResponse // This variable is declared here...
                ] = await Promise.all([
                    reviewsPromise,
                    commentsPromise,
                    portfoliosPromise,
                    jobsPromise // ... and the `jobsPromise` variable is correctly used here.
                ]);
                // --- END CORRECTION ---

                setReviews(reviewsResponse.data);
                setComments(commentsResponse.data);
                setPortfolios(portfoliosResponse.data);
                setJobs(jobsResponse.data);

            } catch (err: any) {
                console.error("Failed to fetch content for moderation:", err);
                setError(err.response?.data?.message || "Could not load content. Ensure you are an administrator.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllContent();
    }, []);

    // --- Delete Handlers for each content type ---
    const handleDeleteReview = async (reviewId: number) => {
        if (!window.confirm(`Are you sure you want to delete review #${reviewId}?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/admin/reviews/${reviewId}`, { headers: { Authorization: `Bearer ${token}` } });
            setReviews(prev => prev.filter(r => r.review_id !== reviewId));
            alert("Review deleted successfully.");
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete review.");
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!window.confirm(`Are you sure you want to delete comment #${commentId}?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/admin/comments/${commentId}`, { headers: { Authorization: `Bearer ${token}` } });
            setComments(prev => prev.filter(c => c.comment_id !== commentId));
            alert("Comment deleted successfully.");
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete comment.");
        }
    };

    const handleDeletePortfolioItem = async (portfolioId: number) => {
        if (!window.confirm(`Are you sure you want to delete portfolio item #${portfolioId}?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/admin/portfolios/${portfolioId}`, { headers: { Authorization: `Bearer ${token}` } });
            setPortfolios(prev => prev.filter(p => p.portfolio_id !== portfolioId));
            alert("Portfolio item deleted successfully.");
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete portfolio item.");
        }
    };

    const handleDeleteJob = async (jobId: number) => {
        if (!window.confirm(`Are you sure you want to delete job posting #${jobId}?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/admin/jobs/${jobId}`, { headers: { Authorization: `Bearer ${token}` } });
            setJobs(prev => prev.filter(j => j.job_id !== jobId));
            alert("Job posting deleted successfully.");
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete job posting.");
        }
    };

    return (
        <>
            <Navbar />
            <div className="admin-dashboard-container">
                <header className="admin-header">
                    <h1>Moderate Content</h1>
                    <p>Manage user-submitted reviews, viewpoints, portfolios, and job postings.</p>
                </header>

                {loading && <p className="loading-message">Loading all content...</p>}
                {error && <p className="error-message">{error}</p>}
                
                {!loading && !error && (
                    <>
                        {/* Portfolio Table */}
                        <section className="admin-section">
                            <h2>Portfolio Items ({portfolios.length})</h2>
                            <div className="admin-table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Image</th>
                                            <th style={{minWidth: '200px'}}>Description</th>
                                            <th>Artist</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {portfolios.map(item => (
                                            <tr key={`port-${item.portfolio_id}`}>
                                                <td>{item.portfolio_id}</td>
                                                <td><a href={item.image_url} target="_blank" rel="noopener noreferrer"><img src={item.image_url} alt="Portfolio item" className="admin-table-thumbnail" /></a></td>
                                                <td className="content-cell">{item.description}</td>
                                                <td><Link to={`/user-profile/${item.artist?.user?.user_id}`}>{item.artist?.user?.fullname || 'N/A'}</Link></td>
                                                <td>{formatDate(item.createdAt)}</td>
                                                <td><button className="delete-button" onClick={() => handleDeletePortfolioItem(item.portfolio_id)}>Delete</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Job Postings Table */}
                        <section className="admin-section">
                            <h2>Job Postings ({jobs.length})</h2>
                            <div className="admin-table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th style={{minWidth: '200px'}}>Title</th>
                                            <th>Posted By</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map(job => (
                                            <tr key={`job-${job.job_id}`}>
                                                <td>{job.job_id}</td>
                                                <td className="content-cell">{job.title}</td>
                                                <td><Link to={`/user-profile/${job.employer?.user?.user_id}`}>{job.employer?.user?.fullname || 'N/A'}</Link></td>
                                                <td>{formatDate(job.createdAt)}</td>
                                                <td><button className="delete-button" onClick={() => handleDeleteJob(job.job_id)}>Delete</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                        
                        {/* Reviews Table */}
                        <section className="admin-section">
                            <h2>All Reviews ({reviews.length})</h2>
                            <div className="admin-table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Reviewer</th>
                                            <th>Reviewed</th>
                                            <th>Rating</th>
                                            <th style={{minWidth: '200px'}}>Comment</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reviews.map(review => (
                                            <tr key={`rev-${review.review_id}`}>
                                                <td>{review.review_id}</td>
                                                <td><Link to={`/user-profile/${review.reviewer?.user_id}`}>{review.reviewer?.fullname || 'N/A'}</Link></td>
                                                <td><Link to={`/user-profile/${review.reviewed?.user_id}`}>{review.reviewed?.fullname || 'N/A'}</Link></td>
                                                <td>{review.overall_rating} ★</td>
                                                <td className="content-cell">{review.specific_answers?.comment || '-'}</td>
                                                <td>{formatDate(review.createdAt)}</td>
                                                <td><button className="delete-button" onClick={() => handleDeleteReview(review.review_id)}>Delete</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Artistic Viewpoints Table */}
                        <section className="admin-section">
                            <h2>All Artistic viewpoints ({comments.length})</h2>
                            <div className="admin-table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Commenter</th>
                                            <th>On profile of</th>
                                            <th style={{minWidth: '200px'}}>Viewpoint</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comments.map(comment => (
                                            <tr key={`com-${comment.comment_id}`}>
                                                <td>{comment.comment_id}</td>
                                                <td><Link to={`/user-profile/${comment.commenterArtist?.user_id}`}>{comment.commenterArtist?.fullname || 'N/A'}</Link></td>
                                                <td><Link to={`/user-profile/${comment.commentedProfileUser?.user_id}`}>{comment.commentedProfileUser?.fullname || 'N/A'}</Link></td>
                                                <td className="content-cell">{comment.comment_text}</td>
                                                <td>{formatDate(comment.createdAt)}</td>
                                                <td><button className="delete-button" onClick={() => handleDeleteComment(comment.comment_id)}>Delete</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </>
    );
};

export default AdminModerateContent;