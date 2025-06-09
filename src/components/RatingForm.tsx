// src/components/RatingForm.tsx
import React, { useState } from 'react';
import axios from 'axios';
import '../styles/RatingForm.css'; // You'll need to create this CSS file

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// Define the shape of a Review object returned from the backend
// This should match the interfaces in your other files for consistency
interface Review {
    review_id: number;
    overall_rating: number;
    specific_answers?: { comment?: string };
    created_at: string;
    reviewer?: { user_id: number; fullname: string; profile_picture: string | null; };
}

interface RatingFormProps {
  reviewerId: number;
  reviewedUserId: number;
  reviewedUserName: string;
  // This prop now expects the new review object on success
  onClose: (submittedSuccessfully: boolean, newReview?: Review) => void;
}

const StarRatingInput = ({ rating, setRating }: { rating: number; setRating: (r: number) => void; }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="star-rating-input">
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                    <button
                        type="button"
                        key={ratingValue}
                        className={ratingValue <= (hover || rating) ? "star on" : "star off"}
                        onClick={() => setRating(ratingValue)}
                        onMouseEnter={() => setHover(ratingValue)}
                        onMouseLeave={() => setHover(0)}
                    >
                        &#9733;
                    </button>
                );
            })}
        </div>
    );
};


const RatingForm: React.FC<RatingFormProps> = ({ reviewerId, reviewedUserId, reviewedUserName, onClose }) => {
    const [ratings, setRatings] = useState({
        overall: 0,
        professionalism: 0,
        quality: 0,
        communication: 0,
    });
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleRatingChange = (field: keyof typeof ratings, value: number) => {
        setRatings(prev => ({...prev, [field]: value}));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (ratings.overall === 0) {
            setError("Please provide an overall star rating.");
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const payload = {
                reviewedUserId: reviewedUserId,
                overallRating: ratings.overall,
                specificAnswers: { 
                    comment: comment.trim(),
                    professionalism: ratings.professionalism,
                    quality: ratings.quality,
                    communication: ratings.communication,
                }
            };

            const response = await axios.post(`${API_BASE_URL}/api/reviews`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // --- On success, call onClose with true AND the new review data ---
            onClose(true, response.data.review);

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "Failed to submit review.";
            setError(errorMessage);
            console.error("Error submitting review:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rating-form-modal">
            <div className="rating-form-header">
                <h3>Rate your collaboration with {reviewedUserName}</h3>
                <button onClick={() => onClose(false)} className="close-btn">×</button>
            </div>
            <form onSubmit={handleSubmit} className="rating-form-content">
                <div className="form-group">
                    <label>Overall Rating *</label>
                    <StarRatingInput rating={ratings.overall} setRating={(r) => handleRatingChange('overall', r)} />
                </div>
                <hr />
                <p className="rating-form-subtext">Optional Detailed Ratings:</p>
                <div className="form-group">
                    <label>Professionalism</label>
                    <StarRatingInput rating={ratings.professionalism} setRating={(r) => handleRatingChange('professionalism', r)} />
                </div>
                <div className="form-group">
                    <label>Quality of Work</label>
                    <StarRatingInput rating={ratings.quality} setRating={(r) => handleRatingChange('quality', r)} />
                </div>
                 <div className="form-group">
                    <label>Communication</label>
                    <StarRatingInput rating={ratings.communication} setRating={(r) => handleRatingChange('communication', r)} />
                </div>
                
                 <div className="form-group">
                     <label htmlFor="comment">Additional comments (optional):</label>
                     <textarea
                         id="comment"
                         rows={4}
                         value={comment}
                         onChange={(e) => setComment(e.target.value)}
                         placeholder="Share details of your experience..."
                     />
                 </div>

                {error && <p className="error-message">{error}</p>}

                <div className="form-actions">
                    <button type="submit" disabled={isSubmitting} className="submit-btn">
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RatingForm;