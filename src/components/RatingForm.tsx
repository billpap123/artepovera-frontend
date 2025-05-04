// src/components/RatingForm.tsx
import React, { useState } from 'react';
import axios from 'axios';
import '../styles/RatingForm.css'; // Make sure you create this CSS file!

interface RatingFormProps {
    chatId: number;
    reviewerId: number;
    reviewedUserId: number;
    reviewedUserName: string;
    onClose: (submitted?: boolean) => void;
}

// Star Rating Sub-Component
const StarRatingInput = ({
    rating,
    setRating,
    labelId
}: {
    rating: number,
    setRating: (r: number) => void,
    labelId: string
}) => {
    const [hoverRating, setHoverRating] = useState(0);
    return (
        <div className="star-rating" role="radiogroup" aria-labelledby={labelId}>
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={star <= (hoverRating || rating) ? 'star active' : 'star'}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    role="radio"
                    aria-checked={star === rating}
                    aria-label={`${star} out of 5 stars`}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setRating(star);}}
                    style={{ cursor: 'pointer', fontSize: '2.2rem', color: star <= (hoverRating || rating) ? '#ffc107' : '#e0e0e0', marginRight: '4px' }}
                >
                    ★
                </span>
            ))}
        </div>
    );
};


const RatingForm: React.FC<RatingFormProps> = ({
    chatId,
    reviewerId,
    reviewedUserId,
    reviewedUserName,
    onClose
}) => {
    const [dealMade, setDealMade] = useState<'yes' | 'no' | null>(null);
    const [noDealReason, setNoDealReason] = useState("");
    const [professionalismRating, setProfessionalismRating] = useState<number>(0);
    const [qualityRating, setQualityRating] = useState<number>(0);
    const [communicationRating, setCommunicationRating] = useState<number>(0);
    const [overallRating, setOverallRating] = useState<number>(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (dealMade === null) { setError("Please indicate if you ended up working together."); return; }
        // Optional: Make reason mandatory if no deal
        // if (dealMade === 'no' && !noDealReason.trim()) { setError("Please provide a brief reason why you didn't work together."); return; }
        if (dealMade === 'yes') {
             if (professionalismRating === 0 || qualityRating === 0 || communicationRating === 0) { setError("Please provide star ratings for Professionalism, Quality, and Communication."); return; }
             if (overallRating === 0) { setError("Please provide an overall star rating for the collaboration."); return; }
        }
        // If dealMade is 'no', overallRating is not strictly required by this validation

        if (isSubmitting) return;
        setIsSubmitting(true);

        const token = localStorage.getItem("token");
        if (!token) { setError("Authentication error. Please log in."); setIsSubmitting(false); return; }

        const specificAnswers = {
            dealMade: dealMade,
            // Only include keys if they have values or are relevant
            ...(dealMade === 'no' && noDealReason.trim() && { noDealReason: noDealReason.trim() }),
            ...(dealMade === 'yes' && { professionalism: professionalismRating }),
            ...(dealMade === 'yes' && { quality: qualityRating }),
            ...(dealMade === 'yes' && { communication: communicationRating }),
            ...(comment.trim() && { comment: comment.trim() })
        };

        const payload = {
            chatId: chatId,
            reviewedUserId: reviewedUserId,
            overallRating: dealMade === 'yes' ? overallRating : 0, // Send 0 if no deal? Or handle null in backend
            specificAnswers: specificAnswers
        };

        try {
            await axios.post(`${API_BASE_URL}/api/reviews`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Review submitted successfully!");
            onClose(true); // Close the form, indicating success

        } catch (err: any) {
            console.error("Error submitting review:", err);
            const message = err.response?.data?.message || "Failed to submit review.";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        // This component is rendered inside the modal overlay div in ChatWindow.tsx
        <div className="rating-form">
            <h3>Rate your collaboration with {reviewedUserName}</h3>
            <p className="rating-form-subtext">Your feedback helps the community.</p>
            <form onSubmit={handleSubmit}>

                {/* Question 1: Deal Made? */}
                <div className="form-group form-group-radio">
                    <label id="deal-made-label">Did you end up working together / making a deal? *</label>
                    <div role="radiogroup" aria-labelledby="deal-made-label" className="radio-options">
                       <label>
                            <input type="radio" name="dealMade" value="yes" checked={dealMade === 'yes'} onChange={() => setDealMade('yes')} required /> Yes
                        </label>
                        <label>
                            <input type="radio" name="dealMade" value="no" checked={dealMade === 'no'} onChange={() => setDealMade('no')} required /> No
                        </label>
                    </div>
                </div>

                {/* Conditional: Reason if NO deal */}
                {dealMade === 'no' && (
                    <div className="form-group fade-in">
                        <label htmlFor={`no-deal-reason-${chatId}`}>Why didn't you work together? (Optional)</label>
                        <textarea id={`no-deal-reason-${chatId}`} value={noDealReason} onChange={(e) => setNoDealReason(e.target.value)} rows={3} placeholder="e.g., Budget mismatch, different styles..." />
                    </div>
                )}

                {/* Conditional: Follow-up questions if YES deal */}
                {dealMade === 'yes' && (
                    <div className="follow-up-questions fade-in">
                         <hr />
                         <p className="rating-form-subtext">Please rate the following aspects:</p>
                         <div className="form-group">
                            <label id="prof-label">Professionalism *</label>
                            <StarRatingInput rating={professionalismRating} setRating={setProfessionalismRating} labelId="prof-label" />
                        </div>
                        <div className="form-group">
                            <label id="qual-label">Quality of Work / Brief *</label>
                            <StarRatingInput rating={qualityRating} setRating={setQualityRating} labelId="qual-label"/>
                        </div>
                         <div className="form-group">
                            <label id="comm-label">Communication *</label>
                            <StarRatingInput rating={communicationRating} setRating={setCommunicationRating} labelId="comm-label"/>
                        </div>
                         <div className="form-group">
                             <label id="overall-label">Overall Collaboration Rating *</label>
                             <StarRatingInput rating={overallRating} setRating={setOverallRating} labelId="overall-label"/>
                         </div>
                    </div>
                )}

                 {/* General Comment (Shown after selection) */}
                 {dealMade !== null && (
                     <div className="form-group fade-in">
                         <label htmlFor={`comment-${chatId}`}>Additional Comments (Optional):</label>
                         <textarea id={`comment-${chatId}`} value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder={dealMade === 'yes' ? "Any other feedback about the collaboration?" : "Any other comments?"} />
                     </div>
                 )}

                {error && <p className="error-message">{error}</p>}

                <div className="form-actions">
                    <button type="submit" disabled={isSubmitting || dealMade === null} className="submit-btn">
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                    <button type="button" onClick={() => onClose()} disabled={isSubmitting} className="cancel-btn">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RatingForm;

// --- REMOVED THE EXAMPLE CSS BLOCK FROM HERE ---