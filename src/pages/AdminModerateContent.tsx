// src/pages/AdminModerateContent.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { formatDate } from '../utils/formatDate';
import '../styles/AdminDashboard.css'; // We can reuse the same styles

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// Define shapes for the data
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

const AdminModerateContent = () => {
    const [reviews, setReviews] = useState<ReviewForAdmin[]>([]);
    const [comments, setComments] = useState<CommentForAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAllContent = async () => {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            try {
                const reviewsPromise = axios.get(`${API_BASE_URL}/api/admin/reviews`, { headers });
                const commentsPromise = axios.get(`${API_BASE_URL}/api/admin/comments`, { headers });

                const [reviewsResponse, commentsResponse] = await Promise.all([reviewsPromise, commentsPromise]);
                
                setReviews(reviewsResponse.data);
                setComments(commentsResponse.data);
            } catch (err: any) {
                console.error("Failed to fetch content for moderation:", err);
                setError(err.response?.data?.message || "Could not load content.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllContent();
    }, []);

    const handleDeleteReview = async (reviewId: number) => {
        if (!window.confirm(`Are you sure you want to delete review ${reviewId}?`)) return;
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
        if (!window.confirm(`Are you sure you want to delete comment ${commentId}?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/admin/comments/${commentId}`, { headers: { Authorization: `Bearer ${token}` } });
            setComments(prev => prev.filter(c => c.comment_id !== commentId));
            alert("Comment deleted successfully.");
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete comment.");
        }
    };

    return (
        <>
            <Navbar />
            <div className="admin-dashboard-container">
                <header className="admin-header">
                    <h1>Moderate Content</h1>
                    <p>Review and manage user-submitted reviews and artistic viewpoints.</p>
                </header>

                {loading && <p className="loading-message">Loading content...</p>}
                {error && <p className="error-message">{error}</p>}
                
                {!loading && !error && (
                    <>
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
                                            <th>Comment</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reviews.map(review => (
                                            <tr key={`rev-${review.review_id}`}>
                                                <td>{review.review_id}</td>
                                                <td>{review.reviewer?.fullname || 'N/A'}</td>
                                                <td>{review.reviewed?.fullname || 'N/A'}</td>
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

                        <section className="admin-section">
                            <h2>All Artistic Viewpoints ({comments.length})</h2>
                            <div className="admin-table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Commenter</th>
                                            <th>On Profile of</th>
                                            <th>Viewpoint</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comments.map(comment => (
                                            <tr key={`com-${comment.comment_id}`}>
                                                <td>{comment.comment_id}</td>
                                                <td>{comment.commenterArtist?.fullname || 'N/A'}</td>
                                                <td>{comment.commentedProfileUser?.fullname || 'N/A'}</td>
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