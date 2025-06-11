// src/pages/ArtistProfile.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/ArtistProfile.css";
import { FaFilePdf } from 'react-icons/fa'; // Assuming you want to use this for PDF icons
import ReactMarkdown from 'react-markdown'; // <<< Import the library
import remarkGfm from 'remark-gfm'; // <<< Import the plugin for tables, links, etc.


// --- Review Interface ---
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
  };
  created_at: string;
  reviewer?: Reviewer;
}
// --- END Review Interface ---

// --- Star Display Component ---
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

const ArtistProfile: React.FC = () => {
  const { userId, setUserId, artistId, setArtistId } = useUserContext();

  // Profile State
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [profileUserName, setProfileUserName] = useState("");

  // Editing State
  const [newBio, setNewBio] = useState("");
  const [newProfilePicFile, setNewProfilePicFile] = useState<File | null>(null);

  // CV State
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [newCvFile, setNewCvFile] = useState<File | null>(null);
  const [cvProcessing, setCvProcessing] = useState(false);

  // General UI State
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  // Reviews State
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);

  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  useEffect(() => {
    let isMounted = true;
    const fetchProfileAndData = async () => {
      setLoading(true); setReviewsLoading(true); setErrorState(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) { alert("Authentication required."); if(isMounted) navigate("/login"); return; }
        const profileResponse = await axios.get(`${BACKEND_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!isMounted) return;
        const { user_id, artist, fullname } = profileResponse.data;
        setProfileUserName(fullname || "");
        if (!userId) setUserId(user_id);
        if (artist && artist.artist_id) {
          setArtistId(artist.artist_id);
          setBio(artist.bio || "");
          setProfilePicture(artist.profile_picture || null);
          setIsStudent(!!artist.is_student);
          setNewBio(artist.bio || "");
          setCvUrl(artist.cv_url || null);
        } else { console.warn("Logged in user does not have an associated artist profile."); }
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
        } else { if(isMounted) {setAverageRating(null); setReviewCount(0); setReviews([]);} }
      } catch (fetchError: any) {
        console.error("Error fetching profile or related data:", fetchError);
        if (isMounted) setErrorState(fetchError.response?.data?.message || "Failed to load profile data.");
      } finally {
        if (isMounted) { setLoading(false); setReviewsLoading(false); }
      }
    };
    fetchProfileAndData();
    return () => { isMounted = false; };
  }, [userId, setUserId, setArtistId, BACKEND_URL, navigate]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) { setNewBio(bio); setNewProfilePicFile(null); setNewCvFile(null); setErrorState(null); }
    else { setNewBio(bio); }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) { setNewProfilePicFile(file); }
    else if (file) { alert("Please upload a valid image file (PNG or JPG)."); e.target.value = ""; setNewProfilePicFile(null); }
    else { setNewProfilePicFile(null); }
  };

  const handleSaveChanges = async () => {
    console.log("[SAVE ARTIST - 1] handleSaveChanges (Bio/Pic) called");
    setErrorState(null);
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
            if (updatedArtistData.cv_url !== undefined) setCvUrl(updatedArtistData.cv_url || null);
        } else {
            setBio(newBio);
            if (newProfilePicFile) {
               const meResponse = await axios.get(`${BACKEND_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
               setProfilePicture(meResponse.data?.artist?.profile_picture || null);
               if (meResponse.data?.artist?.cv_url !== undefined) setCvUrl(meResponse.data.artist.cv_url || null);
            }
        }
        setNewProfilePicFile(null);
        alert("Profile changes (Bio/Photo) saved successfully!");
    } catch (error: any) {
        console.error("Error saving profile changes:", error);
        const message = error.response?.data?.message || "Something went wrong saving profile changes.";
        setErrorState(message); alert(message);
    } finally {
        setSaving(false);
    }
  };

  const handleDeletePicture = async () => {
    if (!window.confirm("Are you sure?")) { return; }
    setDeleting(true); setErrorState(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) { alert("Authentication token not found."); setDeleting(false); return; }
      const url = `${BACKEND_URL}/api/artists/profile/picture`;
      await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
      setProfilePicture(null); setNewProfilePicFile(null);
      alert("Profile picture deleted successfully.");
    } catch (error: any) {
      console.error("Error deleting profile picture:", error);
      const message = error.response?.data?.message || "Failed to delete profile picture.";
      setErrorState(message); alert(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleCvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && file.type === "application/pdf") { setNewCvFile(file); }
    else if (file) { alert("Please upload a valid PDF file for your CV."); e.target.value = ""; setNewCvFile(null); }
    else { setNewCvFile(null); }
  };

  const handleCvUpload = async () => {
    if (!newCvFile) { alert("Please select a PDF file to upload."); return; }
    setCvProcessing(true); setErrorState(null);
    const token = localStorage.getItem("token");
    if (!token) { alert("Authentication required."); setCvProcessing(false); return; }
    const formData = new FormData();
    formData.append("cv", newCvFile);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/artists/profile/cv`, formData, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
      setCvUrl(response.data.cv_url);
      setNewCvFile(null);
      alert("CV uploaded successfully!");
    } catch (err: any) {
      console.error("Error uploading CV:", err);
      const message = err.response?.data?.message || "Failed to upload CV.";
      setErrorState(message); alert(message);
    } finally {
      setCvProcessing(false);
    }
  };

  const handleCvDelete = async () => {
    if (!cvUrl) { alert("No CV to remove."); return; }
    if (!window.confirm("Are you sure you want to remove your CV?")) return;
    setCvProcessing(true); setErrorState(null);
    const token = localStorage.getItem("token");
    if (!token) { alert("Authentication required."); setCvProcessing(false); return; }
    try {
      await axios.delete(`${BACKEND_URL}/api/artists/profile/cv`, { headers: { Authorization: `Bearer ${token}` } });
      setCvUrl(null); setNewCvFile(null);
      alert("CV removed successfully.");
    } catch (err: any) {
      console.error("Error deleting CV:", err);
      const message = err.response?.data?.message || "Failed to delete CV.";
      setErrorState(message); alert(message);
    } finally {
      setCvProcessing(false);
    }
  };

  if (loading) { return ( <> <Navbar /> <div className="profile-container artist-profile-container loading-profile"> <p>Loading artist profile...</p> </div> </> ); }
  if (error && !isEditing && !saving && !deleting && !cvProcessing) {
     return ( <> <Navbar /> <div className="profile-container artist-profile-container error-profile"> <p className="error-message">{error}</p> </div> </> );
  }

  return (
    <>
      <Navbar />
      <div className="profile-container artist-profile-container">
        <h2 className="profile-title">{isEditing ? "Edit Your Profile" : (profileUserName || "My artist profile")}</h2>
        {error && isEditing && <p className="error-message inline-error">{error}</p>}

        <div className="profile-header">
            <div className="profile-picture-wrapper">
              <img src={profilePicture ? profilePicture : "/default-profile.png"} alt="Artist profile" className="profile-picture" />
              {isEditing && ( <div className="edit-picture-options"> <label htmlFor="profilePicUpload" className="upload-pic-btn">Change photo</label> <input id="profilePicUpload" type="file" accept="image/png, image/jpeg" onChange={handleProfilePictureChange} style={{display: 'none'}} /> {profilePicture && (<button type="button" className="delete-btn small" onClick={handleDeletePicture} disabled={deleting || saving || cvProcessing}> {deleting ? "..." : "Remove"} </button> )} </div> )}
            </div>
            <div className="profile-summary">
                 {isStudent && (<span className="student-badge">STUDENT ARTIST</span>)}
                 <div className="average-rating-display"> {reviewsLoading ? ( <span>Loading...</span> ) : reviewCount > 0 ? ( <> <DisplayStars rating={averageRating} /> <span className="rating-value">{averageRating?.toFixed(1)}</span> <span className="review-count">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span> </> ) : ( <span className="no-rating">No reviews yet</span> )} </div>
                 {!isEditing && ( <button className="edit-btn" onClick={handleEditToggle}> Edit profile </button> )}
            </div>
        </div>

        <div className="profile-content">
            {!isEditing ? (
              <>
                <div className="profile-section"> <h4>Short description:</h4>  <div className="bio-text markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {bio || "*No bio provided yet.*"}
                    </ReactMarkdown>
                  </div></div>
                <div className="profile-section cv-section">
                  <h4>Curriculum Vitae (CV)</h4>
                  {cvUrl ? ( <div className="cv-display"> <FaFilePdf className="pdf-icon" /> <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="cv-link"> Download CV </a> </div> )
                   : ( <p className="no-cv-message">No CV uploaded yet.</p> )}
                </div>
                <div className="reviews-section profile-section">
                     <h4>Reviews ({reviewCount})</h4>
                     {reviewsLoading ? ( <p>Loading...</p> ) : reviews.length > 0 ? ( <div className="reviews-list"> {reviews.map((review) => {
                                const dateValue = review.created_at || (review as any).createdAt;
                                return (
                                  <div key={review.review_id} className="review-item">
                                      <div className="review-header">
                                          <img src={review.reviewer?.profile_picture || '/default-profile.png'} alt={review.reviewer?.fullname || 'Reviewer'} className="reviewer-pic"/>
                                          <div className="reviewer-info"> <strong>{review.reviewer?.fullname || 'Anonymous'}</strong> <span className="review-date">{formatDate(dateValue)}</span> </div>
                                          <div className="review-stars"> <DisplayStars rating={review.overall_rating} /> </div>
                                      </div>
                                      {review.specific_answers?.comment && ( <p className="review-comment">"{review.specific_answers.comment}"</p> )}
                                  </div> );
                             })} </div>
                     ) : ( <p className="no-reviews">No reviews yet.</p> )}
                </div>
              </>
            ) : (
              <div className="edit-form">
                <div className="form-field-group"> <label htmlFor="artistBio">Bio:</label> <textarea id="artistBio" value={newBio} onChange={(e) => setNewBio(e.target.value)} rows={5} className="bio-input" /> </div>
                <div className="form-field-group cv-edit-section">
                  <label htmlFor="cvUpload" className="cv-section-title">Update Curriculum Vitae (PDF only):</label> {/* Use specific title class */}
                  <label htmlFor="cvUpload" className="cv-upload-label action-btn"> {/* Styled label for file input */}
                    {newCvFile ? `Selected: ${newCvFile.name.substring(0, 25)}${newCvFile.name.length > 25 ? '...' : ''}` : (cvUrl ? "Change CV File" : "Choose CV File")}
                  </label>
                  <input id="cvUpload" type="file" accept="application/pdf" onChange={handleCvFileChange} style={{ display: 'none' }} className="file-input-hidden" />
                  {newCvFile && ( <button type="button" onClick={handleCvUpload} disabled={cvProcessing || saving || deleting} className="action-btn upload-cv-btn" style={{marginTop: '10px'}}> {cvProcessing && !saving && !deleting ? "Uploading CV..." : `Upload Selected CV`} </button> )}
                  {cvUrl && (
                    <div className="current-cv-display">
                        <span>Current CV: <FaFilePdf className="pdf-icon-inline" /> <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="cv-link-inline">View</a></span>
                        {!newCvFile && ( <button type="button" onClick={handleCvDelete} disabled={cvProcessing || saving || deleting} className="action-btn delete-cv-btn danger"> {cvProcessing && !saving && !deleting ? "Removing..." : "Remove CV"} </button> )}
                    </div>
                  )}
                  {!cvUrl && !newCvFile && <p className="no-cv-message-edit">No CV uploaded yet. Choose one above.</p>}
                </div>
                <div className="btn-row form-actions">
                  {/* This is the button that was causing the error on line 331 */}
                  <button className="save-btn submit-btn" onClick={handleSaveChanges} disabled={saving || deleting || cvProcessing}> {saving ? "Saving Profile..." : "Save Bio/Photo"} </button>
                  <button type="button" className="cancel-btn" onClick={handleEditToggle} disabled={saving || deleting || cvProcessing}> Done Editing </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </>
  );
};

export default ArtistProfile;