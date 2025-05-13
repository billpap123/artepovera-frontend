// src/pages/EmployerProfile.tsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/EmployerProfile.css"; // Ensure this file exists and has styles

// --- Review Interface ---
interface Reviewer {
  user_id: number;
  fullname: string;
  profile_picture: string | null;
}
interface ReviewData {
  review_id: number;
  overall_rating: number;
  specific_answers?: { comment?: string; };
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
    if (rating === null || typeof rating !== 'number' || rating <= 0) { return <span className="no-rating">(No rating yet)</span>; }
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
  const [profileUserName, setProfileUserName] = useState("");

  // Data for editing
  const [newBio, setNewBio] = useState("");
  const [newProfilePicFile, setNewProfilePicFile] = useState<File | null>(null);

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

  // Fetch Profile AND Ratings
  useEffect(() => {
    let isMounted = true;
    const fetchProfileAndRatings = async () => {
      setLoading(true); setReviewsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) { alert("Authentication required."); navigate("/login"); return; }

        const profileResponse = await axios.get(`${BACKEND_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` }, });
        const { user_id, employer, fullname } = profileResponse.data;
        let currentEmployerId = null;

        if (isMounted) {
            setProfileUserName(fullname || "");
            if (!userId) setUserId(user_id);
            if (employer && employer.employer_id) {
               setEmployerId(employer.employer_id);
               currentEmployerId = employer.employer_id;
               setBio(employer.bio || "");
               setProfilePicture(employer.profile_picture || null);
               setNewBio(employer.bio || "");
            } else { console.warn("Logged in user does not have an associated employer profile."); }
         }

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
         } else if (isMounted) { setAverageRating(null); setReviewCount(0); setReviews([]); }
      } catch (error) { console.error("Error fetching profile or ratings:", error); /* setError("Failed to load profile data."); */ }
      finally { if (isMounted) { setLoading(false); setReviewsLoading(false); } }
    };
    fetchProfileAndRatings();
    return () => { isMounted = false; };
  }, [userId, setUserId, setEmployerId, BACKEND_URL, navigate]);


  // --- Handler Functions ---
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) { setNewBio(bio); setNewProfilePicFile(null); }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      setNewProfilePicFile(file);
       console.log("[PIC CHANGE] New file selected:", file.name);
    } else {
      alert("Please upload a valid image file (PNG or JPG).");
      e.target.value = "";
    }
  };

  // --- UPDATED handleSaveChanges with LOGS ---
  const handleSaveChanges = async () => {
    console.log("[SAVE EMPLOYER - 1] handleSaveChanges called");
    try {
        console.log("[SAVE EMPLOYER - 2] Setting saving = true");
        setSaving(true);
        const token = localStorage.getItem("token");
        console.log("[SAVE EMPLOYER - 3] Token fetched:", token ? "Exists" : "MISSING");
        if (!token) {
            alert("Authentication token not found.");
            setSaving(false);
            console.log("[SAVE EMPLOYER - !] Exiting: No token found");
            return;
        }

        const formData = new FormData();
        console.log("[SAVE EMPLOYER - 4] FormData created");
        formData.append("bio", newBio);
        console.log("[SAVE EMPLOYER - 5] Appended bio:", newBio);

        if (newProfilePicFile) {
            formData.append("profile_picture", newProfilePicFile);
            console.log("[SAVE EMPLOYER - 6] Appended profile picture file:", newProfilePicFile.name);
        } else {
            console.log("[SAVE EMPLOYER - 6] No new profile picture file selected.");
        }

        const url = `${BACKEND_URL}/api/employers/profile`; // Correct Employer endpoint
        console.log(`[SAVE EMPLOYER - 7] Preparing to POST to ${url}`);

        const response = await axios.post(url, formData, { headers: { Authorization: `Bearer ${token}` } });

        console.log("[SAVE EMPLOYER - 8] axios.post successful, response data:", response.data);
        const updatedEmployerData = response.data?.employer; // Use 'employer' key

        if (updatedEmployerData) {
            console.log("[SAVE EMPLOYER - 9a] Updating state from response data");
            setBio(updatedEmployerData.bio || "");
            setProfilePicture(updatedEmployerData.profile_picture || null);
            setNewBio(updatedEmployerData.bio || "");
        } else {
            console.log("[SAVE EMPLOYER - 9b] Response missing employer data, using local state/re-fetching");
            setBio(newBio);
            if (newProfilePicFile) {
               console.log("[SAVE EMPLOYER - 9c] Re-fetching user data after pic upload...");
               const meResponse = await axios.get(`${BACKEND_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
               setProfilePicture(meResponse.data?.employer?.profile_picture || null);
            }
        }
        setNewProfilePicFile(null);
        alert("Profile updated successfully!");
        setIsEditing(false);
        console.log("[SAVE EMPLOYER - 10] Success steps completed");

    } catch (error: any) {
        console.error("[SAVE EMPLOYER - !!!] Error in handleSaveChanges catch block:", error);
        if (error.response) {
            console.error("[!!!] Axios Response Error Data:", error.response.data);
            console.error("[!!!] Axios Response Error Status:", error.response.status);
        } else if (error.request) {
            console.error("[!!!] Axios Request Error (No Response):", error.request);
        } else {
            console.error('[!!!] Axios Error Message:', error.message);
        }
        const message = error.response?.data?.message || "Something went wrong saving profile.";
        alert(message);
    } finally {
        console.log("[SAVE EMPLOYER - 11] Entering finally block, setting saving = false");
        setSaving(false);
    }
  };
  // --- END UPDATED handleSaveChanges ---

  // --- UPDATED handleDeletePicture with LOGS ---
  const handleDeletePicture = async () => {
    console.log("[DELETE EMPLOYER PIC - 1] handleDeletePicture called");
    if (!window.confirm("Are you sure you want to delete your profile picture?")) {
      console.log("[DELETE EMPLOYER PIC - !] User cancelled deletion.");
      return;
    }

    console.log("[DELETE EMPLOYER PIC - 2] Setting deleting = true");
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      console.log("[DELETE EMPLOYER PIC - 3] Token fetched:", token ? "Exists" : "MISSING");
      if (!token) {
        alert("Authentication token not found.");
        setDeleting(false);
        console.log("[DELETE EMPLOYER PIC - !] Exiting: No token found");
        return;
      }

      const url = `${BACKEND_URL}/api/employers/profile/picture`; // Correct Employer endpoint
      console.log(`[DELETE EMPLOYER PIC - 4] Sending DELETE to ${url}`);

      await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });

      console.log("[DELETE EMPLOYER PIC - 5] axios.delete successful");
      setProfilePicture(null); // Set state to null
      setNewProfilePicFile(null); // Clear any staged file
      alert("Profile picture deleted successfully.");
      console.log("[DELETE EMPLOYER PIC - 6] Success steps completed");

    } catch (error: any) {
      console.error("[DELETE EMPLOYER PIC - !!!] Error deleting profile picture:", error);
       if (error.response) {
            console.error("[!!!] Axios Response Error Data:", error.response.data);
            console.error("[!!!] Axios Response Error Status:", error.response.status);
        } else if (error.request) {
            console.error("[!!!] Axios Request Error (No Response):", error.request);
        } else {
            console.error('[!!!] Axios Error Message:', error.message);
        }
      const message = error.response?.data?.message || "Failed to delete profile picture.";
      alert(message);
    } finally {
      console.log("[DELETE EMPLOYER PIC - 7] Entering finally block, setting deleting = false");
      setDeleting(false);
    }
  };
  // --- END UPDATED handleDeletePicture ---


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

        {/* Profile Header */}
        <div className="profile-header">
            <div className="profile-picture-wrapper">
              <img src={profilePicture ? profilePicture : "/default-profile.png"} alt="Employer Profile" className="profile-picture" />
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
                 <h3 className="profile-name">{profileUserName || 'Employer Name'}</h3>
                 {/* Average Rating Display */}
                 <div className="average-rating-display">
                    {reviewsLoading ? ( <span>Loading rating...</span> )
                     : reviewCount > 0 ? ( <> <DisplayStars rating={averageRating} /> <span className="rating-value">{averageRating?.toFixed(1)}</span> <span className="review-count">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span> </> )
                     : ( <span className="no-rating">No reviews yet</span> )}
                 </div>
                 {!isEditing && ( <button className="edit-btn" onClick={handleEditToggle}> Edit Profile </button> )}
            </div>
        </div>

        {/* Main Profile Content */}
        <div className="profile-content">
            {!isEditing ? (
              // --- Display Mode ---
              <> {/* <<< Opening Fragment */}
                <div className="profile-section">
                    <h4>Bio</h4>
                    <p className="bio-text">{bio || "No bio provided yet."}</p>
                </div>
                <div className="reviews-section profile-section">
                     <h4>Reviews Received ({reviewCount})</h4>
                     {reviewsLoading ? ( <p>Loading reviews...</p> )
                      : reviews.length > 0 ? (
                         <div className="reviews-list"> {reviews.map((review) => (
                                <div key={review.review_id} className="review-item">
                                    <div className="review-header">
                                        <img src={review.reviewer?.profile_picture || '/default-profile.png'} alt={review.reviewer?.fullname || 'Reviewer'} className="reviewer-pic"/>
                                        <div className="reviewer-info"> <strong>{review.reviewer?.fullname || 'Anonymous'}</strong> <span className="review-date">{formatDate(review.created_at || (review as any).createdAt)}</span> </div>
                                        <div className="review-stars"> <DisplayStars rating={review.overall_rating} /> </div>
                                    </div>
                                    {review.specific_answers?.comment && ( <p className="review-comment">"{review.specific_answers.comment}"</p> )}
                                </div> ))}
                         </div>
                     ) : ( <p className="no-reviews">No reviews have been submitted for this employer yet.</p> )}
                </div>
              </> // <<< --- FIX: Added missing closing fragment tag ---
            ) : (
              // --- Editing Mode ---
              <div className="edit-form">
                <div className="form-field-group">
                    <label htmlFor="employerBio">Bio:</label>
                    <textarea id="employerBio" value={newBio} onChange={(e) => setNewBio(e.target.value)} rows={5} className="bio-input" />
                </div>
                 {/* Delete button moved near picture */}
                <div className="btn-row form-actions">
                  <button className="save-btn submit-btn" onClick={handleSaveChanges} disabled={saving || deleting}> {saving ? "Saving..." : "Save changes"} </button>
                  <button type="button" className="cancel-btn" onClick={handleEditToggle} disabled={saving || deleting}> Cancel </button>
                </div>
              </div>
              // --- End Editing Mode --- Comment here is fine
            )}
        </div>
      </div>
    </>
  );
};

export default EmployerProfile;