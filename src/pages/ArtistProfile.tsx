// src/pages/ArtistProfile.tsx
import React, { useState, useEffect, useMemo } from "react"; // Added useMemo if needed by context
import axios from "axios";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/ArtistProfile.css"; // Assuming you add styles for ratings/reviews here too

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
  specific_answers?: {
    comment?: string;
    // Add other fields you might return, like dealMade, etc.
  };
  created_at: string; // Should be a date string
  reviewer?: Reviewer; // Make optional as include might fail
}
// --- END Review Interface ---

// --- ADD Star Display Component ---
// (Simple display-only version)
const DisplayStars = ({ rating }: { rating: number | null }) => {
    if (rating === null || typeof rating !== 'number' || rating <= 0) {
        // Return null or a placeholder if no valid rating
        return <span className="no-rating">(No rating yet)</span>;
    }
    const fullStars = Math.floor(rating);
    // Simple half star: round to nearest .5, check if decimal is .5
    const halfStar = Math.round(rating * 2) % 2 !== 0 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    // Ensure stars don't exceed 5 if rating is somehow > 5
    const validFull = Math.max(0, fullStars);
    const validHalf = Math.max(0, halfStar);
    const validEmpty = Math.max(0, 5 - validFull - validHalf);


    return (
        <div className="star-display" title={`${rating.toFixed(1)} out of 5 stars`}>
            {[...Array(validFull)].map((_, i) => <span key={`full-${i}`} className="star filled">★</span>)}
            {validHalf === 1 && <span key="half" className="star half">★</span>} {/* Needs CSS for half appearance */}
            {[...Array(validEmpty)].map((_, i) => <span key={`empty-${i}`} className="star empty">☆</span>)}
        </div>
    );
};
// --- END Star Display Component ---


const ArtistProfile: React.FC = () => {
  const { userId, setUserId, artistId, setArtistId } = useUserContext();

  // State for displaying & editing profile
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [profileUserName, setProfileUserName] = useState(""); // To store fetched name

  // State for updating profile
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
    let isMounted = true; // Flag for cleanup

    const fetchProfileAndRatings = async () => {
      setLoading(true);
      setReviewsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Authentication required."); navigate("/login"); return;
        }

        // 1. Get base user/profile data
        const profileResponse = await axios.get(`${BACKEND_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { user_id, artist, fullname } = profileResponse.data;
        let currentArtistId = null; // To store the ID for fetching ratings

        if (isMounted) {
            setProfileUserName(fullname || ""); // Store fullname
             if (!userId) setUserId(user_id);

             if (artist && artist.artist_id) {
                setArtistId(artist.artist_id); // Set context/state
                currentArtistId = artist.artist_id; // Use this ID for ratings
                setBio(artist.bio || "");
                setProfilePicture(artist.profile_picture || null);
                setIsStudent(!!artist.is_student);
                setNewBio(artist.bio || "");
             } else {
                 // Handle case where user logged in isn't an artist profile
                 console.warn("Logged in user does not have an associated artist profile.");
                 // Maybe navigate away or show a message?
             }
         }

         // 2. Fetch ratings/reviews only if we have the user ID (of the profile owner)
         // Since we fetch '/users/me', the profile owner ID is user_id
         const profileOwnerUserId = user_id; // Get the ID from the first response
         if (profileOwnerUserId && isMounted) {
             // Fetch average rating and reviews concurrently
             const ratingPromise = axios.get(`${BACKEND_URL}/api/users/${profileOwnerUserId}/average-rating`);
             const reviewsPromise = axios.get(`${BACKEND_URL}/api/users/${profileOwnerUserId}/reviews`);

             const [ratingResponse, reviewsResponse] = await Promise.all([ratingPromise, reviewsPromise]);

             if (isMounted) {
                 // Process rating data
                 setAverageRating(ratingResponse.data.averageRating);
                 setReviewCount(ratingResponse.data.reviewCount);
                 // Process reviews data
                 setReviews(reviewsResponse.data.reviews || []);
             }
         } else if (isMounted) {
             // No user ID found from profile fetch, cannot fetch ratings
             setAverageRating(null);
             setReviewCount(0);
             setReviews([]);
         }

      } catch (error) {
        console.error("Error fetching profile or ratings:", error);
        // Handle errors appropriately
        if (isMounted) setError("Failed to load profile data."); // Use error state if you have one
      } finally {
        if (isMounted) {
            setLoading(false);
            setReviewsLoading(false);
        }
      }
    };

    fetchProfileAndRatings();

    // Cleanup function
    return () => { isMounted = false; };

    // Dependencies - fetch when component mounts or relevant IDs change (if applicable)
    // Using userId from context ensures we refetch if the logged-in user changes
  }, [userId, setUserId, setArtistId, BACKEND_URL, navigate]);
  // --- END UPDATED useEffect ---


  // --- Handler Functions (handleEditToggle, handleProfilePictureChange, handleSaveChanges, handleDeletePicture) ---
  // Keep these exactly as they were in the previous correct version
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
      e.target.value = ""; // Clear invalid file
    }
  };

  const handleSaveChanges = async () => {
    try {
        setSaving(true);
        const token = localStorage.getItem("token");
        if (!token) { alert("Authentication token not found."); setSaving(false); return; }
        const formData = new FormData();
        formData.append("bio", newBio);
        if (newProfilePicFile) { formData.append("profile_picture", newProfilePicFile); }
        const url = `${BACKEND_URL}/api/artists/profile`;
        const response = await axios.post(url, formData, { headers: { Authorization: `Bearer ${token}` } });
        const updatedArtistData = response.data?.artist;
        if (updatedArtistData) {
            setBio(updatedArtistData.bio || "");
            setProfilePicture(updatedArtistData.profile_picture || null);
            setNewBio(updatedArtistData.bio || "");
        } else {
            setBio(newBio);
            if (newProfilePicFile) { // Re-fetch just to be sure
               const meResponse = await axios.get(`${BACKEND_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
               setProfilePicture(meResponse.data?.artist?.profile_picture || null);
            }
        }
        setNewProfilePicFile(null); alert("Profile updated successfully!"); setIsEditing(false);
    } catch (error: any) { console.error("Error saving changes:", error); const message = error.response?.data?.message || "Something went wrong."; alert(message); }
    finally { setSaving(false); }
  };

  const handleDeletePicture = async () => {
    if (!window.confirm("Are you sure?")) { return; }
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { alert("Authentication token not found."); setDeleting(false); return; }
      const url = `${BACKEND_URL}/api/artists/profile/picture`;
      await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
      setProfilePicture(null); setNewProfilePicFile(null);
      alert("Profile picture deleted successfully.");
    } catch (error: any) { console.error("Error deleting profile picture:", error); const message = error.response?.data?.message || "Failed to delete."; alert(message); }
    finally { setDeleting(false); }
  };
  // --- End Handler Functions ---


  // --- Loading State ---
  // Use the combined 'loading' state for the initial profile data
  if (loading) {
    return (
        <>
            <Navbar />
            <div className="profile-container artist-profile-container" style={{textAlign: 'center', padding: '40px'}}>
                Loading artist profile...
            </div>
        </>
    );
  }
  // --- End Loading State ---

  return (
    <>
      <Navbar />
      <div className="profile-container artist-profile-container"> {/* Use consistent class */}
        <h2 className="profile-title">{isEditing ? "Edit Profile" : (profileUserName || "My Artist Profile")}</h2>

        {/* --- Profile Header Area --- */}
        <div className="profile-header">
            <div className="profile-picture-wrapper">
              <img
                src={profilePicture ? profilePicture : "/default-profile.png"}
                alt="Artist Profile"
                className="profile-picture"
              />
              {/* Display Edit/Delete buttons near picture when editing */}
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
                 {/* Display Name (fetched) */}
                 <h3 className="profile-name">{profileUserName || 'Artist Name'}</h3>

                 {/* Student Badge */}
                 {isStudent && (<span className="student-badge">STUDENT ARTIST</span>)}

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

                {/* Show Edit button only when not editing */}
                {!isEditing && (
                    <button className="edit-btn" onClick={handleEditToggle}>
                        Edit Profile
                    </button>
                )}
            </div>
        </div>


        {/* --- Main Profile Content (Bio/Reviews or Edit Form) --- */}
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
                     <h4>Reviews ({reviewCount})</h4>
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
                                    {/* You could display other specific answers here if needed */}
                                </div>
                             ))}
                         </div>
                     ) : ( <p className="no-reviews">No reviews have been submitted yet.</p> )}
                </div>
                {/* --- END Reviews Section --- */}
              </>

            ) : (
              // --- Editing Mode ---
              <div className="edit-form">
                <div className="form-field-group">
                    <label htmlFor="artistBio">Bio:</label>
                    <textarea id="artistBio" value={newBio} onChange={(e) => setNewBio(e.target.value)} rows={5} className="bio-input" />
                </div>

                {/* File input is now near the image */}
                {/* Delete button is now near the image */}

                <div className="btn-row form-actions"> {/* Use consistent form classes */}
                  <button className="save-btn submit-btn" onClick={handleSaveChanges} disabled={saving || deleting}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleEditToggle} disabled={saving || deleting}>
                    Cancel
                  </button>
                </div>
              </div>
              // --- End Editing Mode ---
            )}
        </div>

      </div>
    </>
  );
};

export default ArtistProfile;

function setError(arg0: string) {
  throw new Error("Function not implemented.");
}

