// src/components/RatingForm.tsx
import React, { useState } from 'react';
import axios from 'axios';
import '../styles/RatingForm.css'; // Make sure you have created this CSS file
import { useTranslation } from "react-i18next";


const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

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
    onClose: (submittedSuccessfully: boolean, newReview?: Review) => void;
    chatId?: number | null;
}

const StarRatingInput = ({ rating, onRatingChange, labelId }: { rating: number; onRatingChange: (r: number) => void; labelId: string; }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="star-rating-input" role="radiogroup" aria-labelledby={labelId}>
            {[1, 2, 3, 4, 5].map((starValue) => (
                <span
                    key={starValue}
                    className={starValue <= (hover || rating) ? 'star active' : 'star'}
                    onClick={() => onRatingChange(starValue)}
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

const RatingForm: React.FC<RatingFormProps> = (
    
    {
    
    chatId,
    reviewerId,
    reviewedUserId,
    reviewedUserName,
    onClose
}) => {
    // All state variables from your file are now included
    const [dealMade, setDealMade] = useState<'yes' | 'no' | null>(null);
    const [noDealPrimaryReason, setNoDealPrimaryReason] = useState<string>("");
    const [professionalismRating, setProfessionalismRating] = useState<number>(0);
    const [qualityRating, setQualityRating] = useState<number>(0);
    const [communicationRating, setCommunicationRating] = useState<number>(0);
    const [overallRating, setOverallRating] = useState<number>(0);
    const [comment, setComment] = useState(""); // This is the single source of truth for comments now
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();

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
            professionalism: dealMade === 'yes' ? professionalismRating : undefined,
            quality: dealMade === 'yes' ? qualityRating : undefined,
            communication: dealMade === 'yes' ? communicationRating : undefined,
            noDealPrimaryReason: dealMade === 'no' ? noDealPrimaryReason : undefined,
            communicationRating_noDeal: dealMade === 'no' ? communicationRating : undefined,
            comment: comment.trim() || undefined, // Simplified to use the single 'comment' state
        };
        
        const payload = {
            chatId: chatId || null,
            reviewedUserId: reviewedUserId,
            overallRating: dealMade === 'yes' ? overallRating : undefined,
            specificAnswers: specificAnswers
        };
            
        try {
            const response = await axios.post(`${API_BASE_URL}/api/reviews`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Review submitted successfully!");
            onClose(true, response.data.review);

        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to submit review.";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rating-form-container">
            <div className="rating-form-header">
                <h3>{t('ratingForm.title', { name: reviewedUserName })}</h3>
                <button onClick={() => onClose(false)} className="close-btn">{t('ratingForm.closeButton')}</button>
            </div>
            <form onSubmit={handleSubmit} className="rating-form-content">
                <div className="form-group form-group-radio">
                    <label id="deal-made-label">{t('ratingForm.dealQuestion')}</label>
                    <div className="radio-options">
                       <label><input type="radio" name="dealMade" value="yes" checked={dealMade === 'yes'} onChange={() => setDealMade('yes')} required /> {t('ratingForm.dealOptions.yes')}</label>
                       <label><input type="radio" name="dealMade" value="no" checked={dealMade === 'no'} onChange={() => setDealMade('no')} required /> {t('ratingForm.dealOptions.no')}</label>
                    </div>
                </div>
    
                {dealMade === 'no' && (
                    <div className="follow-up-questions fade-in">
                        <hr />
                        <p className="rating-form-subtext">{t('ratingForm.noDeal.subtext')}</p>
                        <div className="form-group">
                            <label id="comm-no-deal-label">{t('ratingForm.noDeal.communicationLabel')}</label>
                            <StarRatingInput rating={communicationRating} onRatingChange={setCommunicationRating} labelId="comm-no-deal-label" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="no-deal-primary-reason">{t('ratingForm.noDeal.reasonLabel')}</label>
                            <select id="no-deal-primary-reason" value={noDealPrimaryReason} onChange={(e) => setNoDealPrimaryReason(e.target.value)} required>
                                <option value="" disabled>{t('ratingForm.noDeal.reasonPlaceholder')}</option>
                                <option value="Budget Mismatch">{t('ratingForm.noDeal.reasons.budget')}</option>
                                <option value="Scheduling Conflict">{t('ratingForm.noDeal.reasons.scheduling')}</option>
                                <option value="Creative Differences">{t('ratingForm.noDeal.reasons.creative')}</option>
                                <option value="Poor Communication">{t('ratingForm.noDeal.reasons.communication')}</option>
                                <option value="Chose Another Option">{t('ratingForm.noDeal.reasons.direction')}</option>
                                <option value="Other">{t('ratingForm.noDeal.reasons.other')}</option>
                            </select>
                        </div>
                    </div>
                )}
    
                {dealMade === 'yes' && (
                    <div className="follow-up-questions fade-in">
                         <hr />
                         <p className="rating-form-subtext">{t('ratingForm.yesDeal.subtext')}</p>
                         <div className="form-group"><label id="prof-label">{t('ratingForm.yesDeal.professionalismLabel')}</label><StarRatingInput rating={professionalismRating} onRatingChange={setProfessionalismRating} labelId="prof-label" /></div>
                         <div className="form-group"><label id="qual-label">{t('ratingForm.yesDeal.qualityLabel')}</label><StarRatingInput rating={qualityRating} onRatingChange={setQualityRating} labelId="qual-label"/></div>
                         <div className="form-group"><label id="comm-label">{t('ratingForm.yesDeal.communicationLabel')}</label><StarRatingInput rating={communicationRating} onRatingChange={setCommunicationRating} labelId="comm-label"/></div>
                         <div className="form-group"><label id="overall-label">{t('ratingForm.yesDeal.overallLabel')}</label><StarRatingInput rating={overallRating} onRatingChange={setOverallRating} labelId="overall-label"/></div>
                    </div>
                )}
    
                 {dealMade !== null && (
                     <div className="form-group fade-in">
                         <label htmlFor="comment">{t('ratingForm.commentLabel')}</label>
                         <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            placeholder={dealMade === 'yes' ? t('ratingForm.commentPlaceholder.yes') : t('ratingForm.commentPlaceholder.no')}
                         />
                     </div>
                 )}
    
                {error && <p className="error-message">{error}</p>}
    
                <div className="form-actions">
                    <button type="button" onClick={() => onClose(false)} disabled={isSubmitting} className="cancel-btn">{t('ratingForm.buttons.cancel')}</button>
                    <button type="submit" disabled={isSubmitting || dealMade === null} className="submit-btn">
                        {isSubmitting ? t('ratingForm.buttons.submitting') : t('ratingForm.buttons.submit')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RatingForm;
