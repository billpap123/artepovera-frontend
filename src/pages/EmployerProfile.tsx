// src/pages/EmployerProfile.tsx
import React, { useState, useEffect, useMemo } from "react"; // Added useMemo if needed
import axios from "axios";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/EmployerProfile.css"; // Ensure this file exists and has styles

// --- ADD Review Interface ---
// (Adjust based on your actual Review model attributes and API response)
interface Reviewer {
  user_id: number;
  fullname: string;
  profile_picture: string | null;
}
interface ReviewData {
  review_id: number;
  overall_rating: number;
  specific_answers?: { // Make optional as it might be null/empty
    comment?: string;
    // Add other specific answers if you have them
  };
  created_at: string; // Should be a date string
  reviewer?: Reviewer; // Assuming backend includes reviewer info
}
// --- END Review Interface ---

// --- ADD Star Display Component ---
// (Simple display-only version - move to shared utils?)
const DisplayStars = ({ rating }: { rating: number | null }) => {
    if (rating === null || typeof rating !== 'number' || rating <= 0) {
        return <span className="no-rating">(No rating yet)</span>;
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
  const { userId, setUserId, employerId, setEmployerId } = useUserContext();

  // State for displaying & editing
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profileUserName, setProfileUserName] = useState(""); // Store fetched name

  // Data for editing
  const [newBio, setNewBio] = useState("");
  const [newProfilePicFile, setNewProfilePicFile] = useState<File | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true); // For initial profile load
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false); // For saving changes
  const [deleting, setDeleting] = useState(false); // For deleting picture

  // --- ADD State for Ratings/Reviews ---
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);
  // --- END ADD ---


  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  // --- UPDATED useEffect to Fetch Profile AND Ratings ---
  useEffect(() => {
    let isMounted = true;

    const fetchProfileAndRatings = async () => {
      setLoading(true);
      setReviewsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) { alert("Authentication required."); navigate("/login"); return; }

        // 1. Get base user/profile data
        const profileResponse = await axios.get(`${BACKEND_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { user_id, employer, fullname } = profileResponse.data;
        let currentEmployerId = null;

        if (isMounted) {
            setProfileUserName(fullname || "");
            if (!userId) setUserId(user_id);

            if (employer && employer.employer_id) {
               setEmployerId(employer.employer_id); // Set context/state
               currentEmployerId = employer.employer_id; // Use this ID for context
               setBio(employer.bio || "");
               setProfilePicture(employer.profile_picture || null);
               setNewBio(employer.bio || "");
            } else {
                console.warn("Logged in user does not have an associated employer profile.");
                // Handle non-employer user
            }
        }

         // 2. Fetch ratings/reviews using the user_id from the profile fetch
         const profileOwnerUserId = user_id;
         if (profileOwnerUserId && isMounted) {
             const ratingPromise = axios.get(`${BACKEND_URL}/api/users/${profileOwnerUserId}/average-rating`);
             const reviewsPromise = axios.get(`${BACKEND_URL}/api/users/${profileOwnerUserId}/reviews`);

             const [ratingResponse, reviewsResponse] = await Promise.all([ratingPromise, reviewsPromise]);

             if (isMounted) {
                 setAverageRating(ratingResponse.data.averageRating);
                 setReviewCount(ratingResponse.data.reviewCount);
                 setReviews(reviewsResponse.data.reviews || []);
             }
         } else if (isMounted) {
             setAverageRating(null); setReviewCount(0); setReviews([]);
         }

      } catch (error) {
        console.error("Error fetching profile or ratings:", error);
        // setError("Failed to load profile data."); // Use error state if available
      } finally {
        if (isMounted) { setLoading(false); setReviewsLoading(false); }
      }
    };

    fetchProfileAndRatings();

    // Cleanup
    return () => { isMounted = false; };

  }, [userId, setUserId, setEmployerId, BACKEND_URL, navigate]); // Removed employerId dependency
  // --- END UPDATED useEffect ---


  // --- Handler Functions (Keep as is) ---
  const handleEditToggle = () => { /* ... */ setIsEditing(!isEditing); if (isEditing) { setNewBio(bio); setNewProfilePicFile(null); } };
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
  const handleSaveChanges = async () => { /* ... */ };
  const handleDeletePicture = async () => { /* ... */ };
  // --- End Handler Functions ---


  if (loading) {
    return (
        <>
            <Navbar />
            <div className="profile-container employer-profile-container" style={{textAlign: 'center', padding: '40px'}}>
                Loading employer profile...
            </div>
        </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="profile-container employer-profile-container">
        <h2 className="profile-title">{isEditing ? "Edit Profile" : (profileUserName || "My Employer Profile")}</h2>

        {/* --- Profile Header --- */}
        <div className="profile-header">
            <div className="profile-picture-wrapper">
              <img
                src={profilePicture ? profilePicture : "/default-profile.png"}
                alt="Employer Profile"
                className="profile-picture"
              />
              {isEditing && (
                   <div className="edit-picture-options">
                       <label htmlFor="profilePicUpload" className="upload-pic-btn">Change</label>
                       <input id="profilePicUpload" type="file" accept="image/png, image/jpeg" onChange={handleProfilePictureChange} style={{display: 'none'}} />
                       {profilePicture && (
                          <button type="button" className="delete-btn small" onClick={handleDeletePicture} disabled={deleting || saving}>
                              {deleting ? "..." : "Remove"}
                          </button>
                       )}
                   </div>
              )}
            </div>

            <div className="profile-summary">
                
                {/* --- ADD Average Rating Display --- */}
                <div className="average-rating-display">
                    {reviewsLoading ? ( <span>Loading rating...</span> )
                     : reviewCount > 0 ? (
                         <>
                             <DisplayStars rating={averageRating} />
                             <span className="rating-value">{averageRating?.toFixed(1)}</span>
                             <span className="review-count">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                         </>
                     ) : (
                         <span className="no-rating">No reviews yet</span>
                     )}
                </div>
                {/* --- END Average Rating Display --- */}

                {!isEditing && (
                    <button className="edit-btn" onClick={handleEditToggle}>
                        Edit Profile
                    </button>
                )}
            </div>
        </div>

        {/* --- Main Profile Content --- */}
        <div className="profile-content">
            {!isEditing ? (
              // --- Display Mode ---
              <>
                <div className="profile-section">
                    <h4>Bio</h4>
                    <p className="bio-text">{bio || "No bio provided yet."}</p>
                </div>

                {/* --- ADD Reviews Section --- */}
                <div className="reviews-section profile-section">
                     <h4>Reviews Received ({reviewCount})</h4>
                     {reviewsLoading ? ( <p>Loading reviews...</p> )
                      : reviews.length > 0 ? (
                         <div className="reviews-list">
                             {reviews.map((review) => (
                                <div key={review.review_id} className="review-item">
                                    <div className="review-header">
                                        <img src={review.reviewer?.profile_picture || '/default-profile.png'} alt={review.reviewer?.fullname || 'Reviewer'} className="reviewer-pic"/>
                                        <div className="reviewer-info">
                                            <strong>{review.reviewer?.fullname || 'Anonymous'}</strong>
                                            <span className="review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="review-stars">
                                            <DisplayStars rating={review.overall_rating} />
                                        </div>
                                    </div>
                                    {review.specific_answers?.comment && (
                                        <p className="review-comment">"{review.specific_answers.comment}"</p>
                                    )}
                                    {/* Display other specific answers if needed */}
                                </div>
                             ))}
                         </div>
                     ) : ( <p className="no-reviews">No reviews have been submitted for this employer yet.</p> )}
                </div>
                {/* --- END Reviews Section --- */}
              </>

            ) : (
              // --- Editing Mode ---
              <div className="edit-form">
                <div className="form-field-group">
                    <label htmlFor="employerBio">Bio:</label>
                    <textarea id="employerBio" value={newBio} onChange={(e) => setNewBio(e.target.value)} rows={5} className="bio-input" />
                </div>
                {/* File input handled near picture */}
                <div className="btn-row form-actions">
                  <button className="save-btn submit-btn" onClick={handleSaveChanges} disabled={saving || deleting}> {saving ? "Saving..." : "Save Changes"} </button>
                  <button type="button" className="cancel-btn" onClick={handleEditToggle} disabled={saving || deleting}> Cancel </button>
                </div>
              </div>
              // --- End Editing Mode ---
            )}
        </div>
      </div>
    </>
  );
};

export default EmployerProfile;

// Add/reuse CSS for:
// .profile-container, .profile-header, .profile-picture-wrapper, .profile-picture,
// .edit-picture-options, .upload-pic-btn, .delete-btn.small,
// .profile-summary, .profile-name, .average-rating-display, etc...
// .profile-content, .profile-section, h4, .bio-text, .edit-btn
// .reviews-section, .reviews-list, .review-item, .review-header, .reviewer-pic,
// .reviewer-info, .review-date, .review-stars, .review-comment, .no-reviews
// .edit-form, .form-field-group, .bio-input, .btn-row, .form-actions, .save-btn, .cancel-btn