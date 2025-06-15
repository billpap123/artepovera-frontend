// src/pages/EmployerProfile.tsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Upload, Trash2 } from 'lucide-react';
import { FaEnvelope, FaKey, FaExclamationTriangle } from 'react-icons/fa'; // <-- CORRECTED IMPORT
import { useTranslation } from "react-i18next";
import "../styles/EmployerProfile.css"; // Ensure this file exists and has styles

// --- Review Interface---
interface Reviewer {
  user_id: number;
  fullname: string;
  profile_picture: string | null;
}
interface ReviewData {
  review_id: number;
  overall_rating: number | null;
  specific_answers?: {
    dealMade?: 'yes' | 'no';
    noDealPrimaryReason?: string;
    comment?: string;
  };
  created_at: string;
  reviewer?: Reviewer;
}
// --- END Review Interface ---

// --- Formatting Function ---
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) { return 'Date unknown'; }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) { return 'Invalid Date'; }
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) { console.error("Error parsing date:", dateString, e); return 'Invalid Date'; }
};
// --- End Formatting Function ---

// --- Star Display Component ---
const DisplayStars = ({ rating }: { rating: number | null }) => {
  if (rating === null || typeof rating !== 'number' || rating <= 0) {
    return null;
  }
  const fullStars = Math.floor(rating);
  const halfStar = Math.round(rating * 2) % 2 !== 0 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  const validFull = Math.max(0, fullStars);
  const validHalf = Math.max(0, halfStar);
  const validEmpty = Math.max(0, 5 - validFull - validHalf);
  return (
    <div className="star-display" title={`${rating.toFixed(1)} out of 5 stars`}>
      {[...Array(validFull)].map((_, i) => <span key={`full-${i}`} className="star filled">★</span>)}
      {validHalf === 1 && <span key="half" className="star half">★</span>}
      {[...Array(validEmpty)].map((_, i) => <span key={`empty-${i}`} className="star empty">☆</span>)}
    </div>
  );
};

// --- END Star Display Component ---

const EmployerProfile: React.FC = () => {
  const { t } = useTranslation();
  const { userId, setUserId, employerId, setEmployerId, setUserType, setFullname } = useUserContext();

  // Profile State
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profileUserName, setProfileUserName] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");


  // Data for editing
  const [newBio, setNewBio] = useState("");
  const [newProfilePicFile, setNewProfilePicFile] = useState<File | null>(null);

  // --- NEW: Account Settings State ---
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [currentPasswordForConfirm, setCurrentPasswordForConfirm] = useState(""); // Renamed for clarity
  const [accountActionLoading, setAccountActionLoading] = useState(false);


  // Loading states
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // State for Ratings/Reviews
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);

  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  useEffect(() => {
    let isMounted = true;
    const fetchProfileAndRatings = async () => {
      setLoading(true); setReviewsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) { alert("Authentication required."); navigate("/login"); return; }

        const profileResponse = await axios.get(`${BACKEND_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` }, });
        const { user_id, employer, fullname, email } = profileResponse.data;

        if (isMounted) {
          setProfileUserName(fullname || "");
          setCurrentEmail(email || "");
          if (!userId) setUserId(user_id);
          if (employer && employer.employer_id) {
            setEmployerId(employer.employer_id);
            setBio(employer.bio || "");
            setProfilePicture(employer.profile_picture || null);
            setNewBio(employer.bio || "");
          } else { console.warn("Logged in user does not have an associated employer profile."); }
        
            const profileOwnerUserId = user_id;
            if (profileOwnerUserId) {
                const ratingPromise = axios.get(`${BACKEND_URL}/api/users/${profileOwnerUserId}/average-rating`);
                const reviewsPromise = axios.get(`${BACKEND_URL}/api/users/${profileOwnerUserId}/reviews`);
                const [ratingResponse, reviewsResponse] = await Promise.all([ratingPromise, reviewsPromise]);
                if (isMounted) {
                    setAverageRating(ratingResponse.data.averageRating);
                    setReviewCount(ratingResponse.data.reviewCount);
                    setReviews(reviewsResponse.data.reviews || []);
                }
            }
        }
      } catch (error) { console.error("Error fetching profile or ratings:", error); }
      finally { if (isMounted) { setLoading(false); setReviewsLoading(false); } }
    };
    fetchProfileAndRatings();
    return () => { isMounted = false; };
  }, [userId, setUserId, setEmployerId, navigate]);

  const getImageUrl = (path?: string | null): string => {
    if (!path) return '/default-profile.png';
    if (path.startsWith('http')) return path;
    return `${BACKEND_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) { setNewBio(bio); setNewProfilePicFile(null); }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      setNewProfilePicFile(file);
    } else {
      alert("Please upload a valid image file (PNG or JPG).");
      e.target.value = "";
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { alert("Authentication token not found."); setSaving(false); return; }

      const formData = new FormData();
      formData.append("bio", newBio);
      if (newProfilePicFile) {
        formData.append("profile_picture", newProfilePicFile);
      }

      const url = `${BACKEND_URL}/api/employers/profile`;
      const response = await axios.post(url, formData, { headers: { Authorization: `Bearer ${token}` } });
      const updatedEmployerData = response.data?.employer;

      if (updatedEmployerData) {
        setBio(updatedEmployerData.bio || "");
        setProfilePicture(updatedEmployerData.profile_picture || null);
        setNewBio(updatedEmployerData.bio || "");
      }
      setNewProfilePicFile(null);
      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error saving profile changes:", error);
      alert(error.response?.data?.message || "Something went wrong saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePicture = async () => {
    if (!window.confirm("Are you sure you want to delete your profile picture?")) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { alert("Authentication token not found."); setDeleting(false); return; }
      const url = `${BACKEND_URL}/api/employers/profile/picture`;
      await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
      setProfilePicture(null);
      setNewProfilePicFile(null);
      alert("Profile picture deleted successfully.");
    } catch (error: any) {
      console.error("Error deleting profile picture:", error);
      alert(error.response?.data?.message || "Failed to delete profile picture.");
    } finally {
      setDeleting(false);
    }
  };
  
  // --- NEW: Account Action Handlers ---
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail !== confirmEmail) {
      alert(t('employerProfile.account.emailMatchError'));
      return;
    }
    setAccountActionLoading(true);
    console.log("Attempting to change email to:", newEmail);
    alert(t('employerProfile.account.featureNotImplemented'));
    setAccountActionLoading(false);
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert(t('employerProfile.account.passwordMatchError'));
      return;
    }
    if (newPassword.length < 6) {
        alert(t('employerProfile.account.passwordLengthError'));
        return;
    }
    setAccountActionLoading(true);
    console.log("Attempting to change password.");
    alert(t('employerProfile.account.featureNotImplemented'));
    setAccountActionLoading(false);
  };
  
  const handleDeleteAccount = async () => {
    const confirmationText = t('employerProfile.account.deleteConfirmText');
    if (window.confirm(confirmationText)) {
      const password = prompt(t('employerProfile.account.deletePasswordPrompt'));
      if (password) {
        setAccountActionLoading(true);
        console.log("Attempting to delete account.");
        alert(t('employerProfile.account.featureNotImplemented'));
        setAccountActionLoading(false);
      }
    }
  };


  const completedReviews = useMemo(() => reviews.filter((r: ReviewData) => r.specific_answers?.dealMade !== 'no' && r.overall_rating), [reviews]);
  const interactionReviews = useMemo(() => reviews.filter((r: ReviewData) => r.specific_answers?.dealMade === 'no'), [reviews]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="profile-container employer-profile-container" style={{ textAlign: 'center', padding: '40px' }}>
          Loading employer profile...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="profile-container employer-profile-container">

        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-picture-wrapper">
            <img src={getImageUrl(profilePicture)} alt={t('employerProfile.altText')} className="profile-picture" />
            {isEditing && (
              <div className="edit-picture-options flex items-center gap-3">
                <label
                  htmlFor="profilePicUpload"
                  className="flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  <Upload size={16} />
                  {t('employerProfile.change')}
                </label>
                <input id="profilePicUpload" type="file" accept="image/png, image/jpeg" onChange={handleProfilePictureChange} className="hidden" />
                {profilePicture && (
                  <button type="button" className="flex items-center gap-2 delete-btn bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleDeletePicture} disabled={deleting || saving}>
                    <Trash2 size={16} />
                    {deleting ? t('employerProfile.removing') : t('employerProfile.remove')}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="profile-summary">
            <h3 className="profile-name">{profileUserName || t('employerProfile.unnamed')}</h3>
            <div className="average-rating-display">
              {reviewsLoading ? (<span>{t('employerProfile.loadingRating')}</span>)
                : completedReviews.length > 0 && averageRating ? (
                  <>
                    <DisplayStars rating={averageRating} />
                    <span className="rating-value">{averageRating.toFixed(1)}</span>
                    <span className="review-count">({t('employerProfile.projectReviews', { count: completedReviews.length })})</span>
                  </>
                ) : (
                  <span className="no-rating">{t('employerProfile.noProjectReviews')}</span>
                )}
            </div>
            {!isEditing && (<button className="edit-btn" onClick={handleEditToggle}>{t('employerProfile.editProfile')}</button>)}
          </div>
        </div>

        {/* Main Profile Content */}
        <div className="profile-content">
          {!isEditing ? (
            // --- Display Mode ---
            <>
              <div className="profile-section">
                <h4>{t('employerProfile.shortDescription')}</h4>
                <div className="bio-text markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {bio || t('employerProfile.noBio')}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="reviews-section profile-section">
                <h4>{t('employerProfile.projectReviews_plural', { count: completedReviews.length })}</h4>
                {reviewsLoading ? (<p>{t('employerProfile.loadingReviews')}</p>)
                  : completedReviews.length > 0 ? (
                    <div className="reviews-list">
                      {completedReviews.map((review) => (
                        <div key={review.review_id} className="review-item">
                          <div className="review-header">
                            <img src={getImageUrl(review.reviewer?.profile_picture)} alt={review.reviewer?.fullname || t('employerProfile.anonymous')} className="reviewer-pic" />
                            <div className="reviewer-info">
                              <strong>{review.reviewer?.fullname || t('employerProfile.anonymous')}</strong>
                              <span className="review-date">{formatDate(review.created_at)}</span>
                            </div>
                            <div className="review-stars"><DisplayStars rating={review.overall_rating} /></div>
                          </div>
                          {review.specific_answers?.comment && (<p className="review-comment">"{review.specific_answers.comment}"</p>)}
                        </div>
                      ))}
                    </div>
                  ) : ( <p className="no-reviews">{t('employerProfile.noProjectReviewsReceived')}</p> )}
              </div>

              <div className="reviews-section profile-section">
                <h4>{t('employerProfile.interactionFeedback')} ({interactionReviews.length})</h4>
                 {reviewsLoading ? (<p>{t('employerProfile.loadingFeedback')}</p>)
                  : interactionReviews.length > 0 ? (
                    <div className="reviews-list">
                      {interactionReviews.map((review) => (
                        <div key={review.review_id} className="review-item interaction-review">
                          <div className="review-header">
                            <img src={getImageUrl(review.reviewer?.profile_picture)} alt={review.reviewer?.fullname || t('employerProfile.anonymous')} className="reviewer-pic" />
                            <div className="reviewer-info">
                              <strong>{review.reviewer?.fullname || t('employerProfile.anonymous')}</strong>
                              <span className="review-date">{formatDate(review.created_at)}</span>
                            </div>
                          </div>
                          <div className="review-comment">
                            {review.specific_answers?.noDealPrimaryReason && ( <p className="interaction-reason"><strong>{t('employerProfile.reason')}</strong> {review.specific_answers.noDealPrimaryReason}</p> )}
                            {review.specific_answers?.comment && ( <p><strong>{t('employerProfile.comment')}</strong> "{review.specific_answers.comment}"</p> )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : ( <p className="no-reviews">{t('employerProfile.noInteractionFeedback')}</p> )}
              </div>
            </>
          ) : (
            // --- Editing Mode ---
            <div className="edit-form">
              <div className="form-field-group">
                <label htmlFor="employerBio">{t('employerProfile.bioLabel')}</label>
                <textarea id="employerBio" value={newBio} onChange={(e) => setNewBio(e.target.value)} rows={5} className="bio-input" />
              </div>
              <div className="btn-row form-actions">
                <button className="save-btn submit-btn" onClick={handleSaveChanges} disabled={saving || deleting || accountActionLoading}> {saving ? t('employerProfile.saving') : t('employerProfile.saveChanges')} </button>
              </div>
              
              {/* --- NEW ACCOUNT SETTINGS SECTION --- */}
              <div className="account-settings-section">
                  <hr className="section-divider" />
                  <h4>{t('employerProfile.account.title')}</h4>

                  <form onSubmit={handleEmailChange} className="account-form">
                      <label className="account-form-label"><FaEnvelope /> {t('employerProfile.account.changeEmail')}</label>
                      <p className="current-email-display">{t('employerProfile.account.currentEmail')}: <strong>{currentEmail}</strong></p>
                      <div className="form-field-group">
                          <input type="email" placeholder={t('employerProfile.account.newEmailPlaceholder')} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
                          <input type="email" placeholder={t('employerProfile.account.confirmEmailPlaceholder')} value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} required />
                      </div>
                      <button type="submit" className="action-btn" disabled={accountActionLoading || saving}>{t('employerProfile.account.updateEmailButton')}</button>
                  </form>

                  <form onSubmit={handlePasswordChange} className="account-form">
                      <label className="account-form-label"><FaKey /> {t('employerProfile.account.changePassword')}</label>
                      <div className="form-field-group">
                          <input type="password" placeholder={t('employerProfile.account.currentPasswordPlaceholder')} value={currentPasswordForConfirm} onChange={(e) => setCurrentPasswordForConfirm(e.target.value)} required />
                          <input type="password" placeholder={t('employerProfile.account.newPasswordPlaceholder')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                          <input type="password" placeholder={t('employerProfile.account.confirmNewPasswordPlaceholder')} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
                      </div>
                      <button type="submit" className="action-btn" disabled={accountActionLoading || saving}>{t('employerProfile.account.updatePasswordButton')}</button>
                  </form>
                  
                  <div className="account-form delete-account-section">
                      <label className="account-form-label danger-text"><FaExclamationTriangle /> {t('employerProfile.account.dangerZone')}</label>
                      <p>{t('employerProfile.account.deleteWarning')}</p>
                      <button type="button" className="action-btn danger" onClick={handleDeleteAccount} disabled={accountActionLoading || saving}>{t('employerProfile.account.deleteAccountButton')}</button>
                  </div>
              </div>

              <div className="btn-row form-actions">
                  <button type="button" className="cancel-btn" onClick={handleEditToggle} disabled={saving || deleting || accountActionLoading}> {t('employerProfile.cancel')} </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmployerProfile;
