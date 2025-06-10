// src/components/RatingForm.tsx
import React, { useState } from 'react';
import axios from 'axios';
import '../styles/RatingForm.css'; // Make sure you have created this CSS file

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// This should match the interface used in your other components
export interface Review {
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
    // Updated onClose to pass the new review back to the parent component
    onClose: (submittedSuccessfully: boolean, newReview?: Review) => void;
    chatId?: number | null;
}

// Star Rating Sub-Component - Corrected
const StarRatingInput = ({ rating, onRatingChange, labelId }: { rating: number; onRatingChange: (r: number) => void; labelId: string; }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="star-rating-input" role="radiogroup" aria-labelledby={labelId}>
            {[1, 2, 3, 4, 5].map((starValue) => (
                <span
                    key={starValue}
                    className={starValue <= (hover || rating) ? 'star active' : 'star'}
                    onClick={() => onRatingChange(starValue)} // Use the passed-in handler
                    onMouseEnter={() => setHover(starValue)}
                    onMouseLeave={() => setHover(0)}
                    role="radio"
                    aria-checked={starValue === rating}
                    aria-label={`${starValue} out of 5 stars`}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') onRatingChange(starValue);}}
                    style={{ cursor: 'pointer', fontSize: '2.2rem', color: starValue <= (hover || rating) ? '#ffc107' : '#e0e0e0', marginRight: '4px' }}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

const RatingForm: React.FC<RatingFormProps> = ({
    chatId,
    reviewerId, // reviewerId is passed but wasn't used in the old payload, it comes from the token on the backend.
    reviewedUserId,
    reviewedUserName,
    onClose
}) => {
    const [dealMade, setDealMade] = useState<'yes' | 'no' | null>(null);
    const [noDealReason, setNoDealReason] = useState("");
        // --- ADD THIS NEW STATE ---
        const [noDealPrimaryReason, setNoDealPrimaryReason] = useState<string>("");
        // --- END NEW STATE ---
    
    const [professionalismRating, setProfessionalismRating] = useState<number>(0);
    const [qualityRating, setQualityRating] = useState<number>(0);
    const [communicationRating, setCommunicationRating] = useState<number>(0);
    const [overallRating, setOverallRating] = useState<number>(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (dealMade === null) { setError("Please indicate if you ended up working together."); return; }
        if (dealMade === 'yes' && overallRating === 0) { setError("Please provide an overall star rating for the collaboration."); return; }
        
        setIsSubmitting(true);
        const token = localStorage.getItem("token");
        if (!token) { setError("Authentication error. Please log in."); setIsSubmitting(false); return; }

        // Construct the detailed answers object
        const specificAnswers = {
            dealMade,
            // YES path
            professionalism: dealMade === 'yes' ? professionalismRating : undefined,
            quality: dealMade === 'yes' ? qualityRating : undefined,
            communication: dealMade === 'yes' ? communicationRating : undefined, // Note: you now have two communication states.
            // NO path
            noDealPrimaryReason: dealMade === 'no' ? noDealPrimaryReason : undefined,
            communicationRating_noDeal: dealMade === 'no' ? communicationRating : undefined,
        
            // General comment
            comment: comment.trim() || noDealReason.trim() || undefined
        };
        

        const payload = {
            chatId: chatId || null,
            reviewedUserId: reviewedUserId,
            // This logic is still correct: send the overall rating for 'yes', omit for 'no'
            overallRating: dealMade === 'yes' ? overallRating : undefined,
            specificAnswers: specificAnswers
        };
            
        try {
            const response = await axios.post(`${API_BASE_URL}/api/reviews`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Review submitted successfully!");
            // Pass success and the new review data back to the parent
            onClose(true, response.data.review);

        } catch (err: any) {
            console.error("Error submitting review:", err);
            const message = err.response?.data?.message || "Failed to submit review.";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rating-form-container"> {/* Use a container class for better styling control */}
            <div className="rating-form-header">
                <h3>Rate your collaboration with {reviewedUserName}</h3>
                <button onClick={() => onClose(false)} className="close-btn">×</button>
            </div>
            <form onSubmit={handleSubmit} className="rating-form-content">
                <div className="form-group form-group-radio">
                    <label id="deal-made-label">Did you end up working together? *</label>
                    <div className="radio-options">
                       <label><input type="radio" name="dealMade" value="yes" checked={dealMade === 'yes'} onChange={() => setDealMade('yes')} required /> Yes</label>
                       <label><input type="radio" name="dealMade" value="no" checked={dealMade === 'no'} onChange={() => setDealMade('no')} required /> No</label>
                    </div>
                </div>

                {dealMade === 'no' && (
    <div className="follow-up-questions fade-in">
        <hr />
        <p className="rating-form-subtext">
            Please provide feedback on your interaction.
        </p>
        
        {/* New Star Rating for Communication */}
        <div className="form-group">
            <label id="comm-no-deal-label">Communication Quality *</label>
            <StarRatingInput 
                rating={communicationRating} 
                onRatingChange={setCommunicationRating} 
                labelId="comm-no-deal-label" 
            />
        </div>

        {/* New Dropdown for Primary Reason */}
        <div className="form-group">
            <label htmlFor="no-deal-primary-reason">Primary reason for not working together? *</label>
            <select
                id="no-deal-primary-reason"
                value={noDealPrimaryReason}
                onChange={(e) => setNoDealPrimaryReason(e.target.value)}
                required
            >
                <option value="" disabled>-- Please select a reason --</option>
                <option value="Budget Mismatch">Budget mismatch</option>
                <option value="Scheduling Conflict">Scheduling/timeline conflict</option>
                <option value="Creative Differences">Creative differences</option>
                <option value="Poor Communication">Unresponsive / poor communication</option>
                <option value="Chose Another Option">Decided to go another direction</option>
                <option value="Other">Other (please specify below)</option>
            </select>
        </div>
        
        {/* The existing text area, now for additional context */}
        <div className="form-group">
            <label htmlFor="no-deal-reason">Additional comments (Optional)</label>
            <textarea 
                id="no-deal-reason" 
                value={noDealReason} 
                onChange={(e) => setNoDealReason(e.target.value)} 
                rows={3} 
                placeholder="Provide more details here..." 
            />
        </div>
    </div>
)}

                {dealMade === 'yes' && (
                    <div className="follow-up-questions fade-in">
                         <hr />
                         <p className="rating-form-subtext">Please rate the following aspects:</p>
                         <div className="form-group"><label id="prof-label">Professionalism *</label><StarRatingInput rating={professionalismRating} onRatingChange={setProfessionalismRating} labelId="prof-label" /></div>
                         <div className="form-group"><label id="qual-label">Quality of work / brief *</label><StarRatingInput rating={qualityRating} onRatingChange={setQualityRating} labelId="qual-label"/></div>
                         <div className="form-group"><label id="comm-label">Communication *</label><StarRatingInput rating={communicationRating} onRatingChange={setCommunicationRating} labelId="comm-label"/></div>
                         <div className="form-group"><label id="overall-label">Overall collaboration rating *</label><StarRatingInput rating={overallRating} onRatingChange={setOverallRating} labelId="overall-label"/></div>
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