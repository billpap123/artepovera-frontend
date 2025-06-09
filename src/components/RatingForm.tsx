// src/components/RatingForm.tsx
import React, { useState } from 'react';
import axios from 'axios';
import '../styles/RatingForm.css'; // We will provide the CSS for this

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// Define the shape of a Review object returned from the backend
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
  onClose: (submittedSuccessfully: boolean, newReview?: Review) => void;
  chatId?: number | null; // Keep as optional for flexibility
}

// A reusable Star Rating input component
const StarRatingInput = ({ rating, setRating, labelId }: { rating: number; setRating: (r: number) => void; labelId: string }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="star-rating" role="radiogroup" aria-labelledby={labelId}>
            {[1, 2, 3, 4, 5].map((starValue) => (
                <span
                    key={starValue}
                    className={starValue <= (hover || rating) ? 'star active' : 'star'}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHover(starValue)}
                    onMouseLeave={() => setHover(0)}
                    role="radio"
                    aria-checked={starValue === rating}
                    aria-label={`${starValue} out of 5 stars`}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setRating(starValue); }}
                >
                    ★
                </span>
            ))}
        </div>
    );
};


const RatingForm: React.FC<RatingFormProps> = ({ chatId, reviewerId, reviewedUserId, reviewedUserName, onClose }) => {
    const [dealMade, setDealMade] = useState<'yes' | 'no' | null>(null);
    const [noDealReason, setNoDealReason] = useState("");
    const [professionalism, setProfessionalism] = useState(0);
    const [quality, setQuality] = useState(0);
    const [communication, setCommunication] = useState(0);
    const [overall, setOverall] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (dealMade === null) { setError("Please indicate if you worked together."); return; }
        if (dealMade === 'yes' && overall === 0) { setError("Please provide an overall star rating."); return; }

        setIsSubmitting(true);

        const token = localStorage.getItem("token");
        if (!token) { setError("Authentication error."); setIsSubmitting(false); return; }

        const specificAnswers = {
            dealMade,
            noDealReason: dealMade === 'no' ? noDealReason.trim() : undefined,
            professionalism: dealMade === 'yes' ? professionalism : undefined,
            quality: dealMade === 'yes' ? quality : undefined,
            communication: dealMade === 'yes' ? communication : undefined,
            comment: comment.trim() || undefined,
        };

        const payload = {
            chatId: chatId || null,
            reviewedUserId,
            overallRating: dealMade === 'yes' ? overall : 0, // Send 0 if no deal, backend can handle
            specificAnswers,
        };

        try {
            const response = await axios.post(`${API_BASE_URL}/api/reviews`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Review submitted successfully!");
            onClose(true, response.data.review); // Pass success and the new review back
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to submit review.";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rating-form-container">
            <h3>Rate your collaboration with {reviewedUserName}</h3>
            <p className="rating-form-subtext">Your feedback helps the community.</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group form-group-radio">
                    <label id="deal-made-label">Did you end up working together? *</label>
                    <div className="radio-options">
                       <label><input type="radio" name="dealMade" value="yes" checked={dealMade === 'yes'} onChange={() => setDealMade('yes')} /> Yes</label>
                       <label><input type="radio" name="dealMade" value="no" checked={dealMade === 'no'} onChange={() => setDealMade('no')} /> No</label>
                    </div>
                </div>

                {dealMade === 'no' && (
                    <div className="form-group fade-in">
                        <label htmlFor="no-deal-reason">Why didn't you work together? (Optional)</label>
                        <textarea id="no-deal-reason" value={noDealReason} onChange={(e) => setNoDealReason(e.target.value)} rows={3} placeholder="e.g., Budget mismatch, different styles..." />
                    </div>
                )}

                {dealMade === 'yes' && (
                    <div className="follow-up-questions fade-in">
                         <hr />
                         <p className="rating-form-subtext">Please rate the following aspects:</p>
                         <div className="form-group"><label id="prof-label">Professionalism *</label><StarRatingInput rating={professionalism} setRating={setProfessionalism} labelId="prof-label" /></div>
                         <div className="form-group"><label id="qual-label">Quality of work / brief *</label><StarRatingInput rating={quality} setRating={setQuality} labelId="qual-label"/></div>
                         <div className="form-group"><label id="comm-label">Communication *</label><StarRatingInput rating={communication} setRating={setCommunication} labelId="comm-label"/></div>
                         <div className="form-group"><label id="overall-label">Overall collaboration rating *</label><StarRatingInput rating={overall} setRating={setOverall} labelId="overall-label"/></div>
                    </div>
                )}

                 {dealMade !== null && (
                     <div className="form-group fade-in">
                         <label htmlFor="comment">Additional comments (Optional):</label>
                         <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder={dealMade === 'yes' ? "Any other feedback about the collaboration?" : "Any other comments?"} />
                     </div>
                 )}

                {error && <p className="error-message">{error}</p>}

                <div className="form-actions">
                    <button type="button" onClick={() => onClose(false)} disabled={isSubmitting} className="cancel-btn">Cancel</button>
                    <button type="submit" disabled={isSubmitting || dealMade === null} className="submit-btn">
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RatingForm;