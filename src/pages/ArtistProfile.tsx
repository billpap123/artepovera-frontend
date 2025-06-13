// src/pages/ArtistProfile.tsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/ArtistProfile.css";
import { FaFilePdf } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Upload, Trash2 } from 'lucide-react';

// --- Review Interface ---
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
  const getImageUrl = (path?: string | null): string => {
    if (!path) return '/default-profile.png';
    if (path.startsWith('http')) return path;
    return `${BACKEND_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
  };

  useEffect(() => {
    let isMounted = true;
    const fetchProfileAndData = async () => {
      setLoading(true); setReviewsLoading(true); setErrorState(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) { alert("Authentication required."); if (isMounted) navigate("/login"); return; }
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
        } else { if (isMounted) { setAverageRating(null); setReviewCount(0); setReviews([]); } }
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
  
  // --- NEW: CV Download Handler ---
  const handleCvDownload = async (url: string | null) => {
    if (!url) return;
    try {
      const response = await axios.get(url, {
        responseType: 'blob', // Important to get the file as a blob
      });
      // Create a link element, set the download attribute, and trigger a click
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([response.data]));
      link.setAttribute('download', 'artist-cv.pdf'); // Set the desired file name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href); // Clean up the object URL
    } catch (error) {
      console.error("Error downloading CV:", error);
      alert("Could not download the CV. Please try again.");
    }
  };
  // --- END: CV Download Handler ---

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

  const completedReviews = useMemo(() => reviews.filter((r: ReviewData) => r.specific_answers?.dealMade !== 'no' && r.overall_rating), [reviews]);
  const interactionReviews = useMemo(() => reviews.filter((r: ReviewData) => r.specific_answers?.dealMade === 'no'), [reviews]);

  if (loading) { return (<> <Navbar /> <div className="profile-container artist-profile-container loading-profile"> <p>Loading artist profile...</p> </div> </>); }
  if (error && !isEditing && !saving && !deleting && !cvProcessing) {
    return (<> <Navbar /> <div className="profile-container artist-profile-container error-profile"> <p className="error-message">{error}</p> </div> </>);
  }

  return (
    <>
      <Navbar />
      <div className="profile-container artist-profile-container">

        <div className="profile-header">
            <div className="profile-picture-wrapper">
              <img src={getImageUrl(profilePicture)} alt="Artist profile" className="profile-picture" />
              {isEditing && (
                <div className="edit-picture-options flex items-center gap-3">
                  <label
                    htmlFor="profilePicUpload"
                    className="flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105"
                  >
                    <Upload size={16} />
                    Change
                  </label>
                  <input
                    id="profilePicUpload"
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                  {profilePicture && (
                    <button
                      type="button"
                      className="flex items-center gap-2 delete-btn bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleDeletePicture}
                      disabled={deleting || saving || cvProcessing}
                    >
                      <Trash2 size={16} />
                      {deleting ? "Removing..." : "Remove"}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="profile-summary">
                 <h3 className="profile-name">{profileUserName || 'Artist Name'}</h3>
                 {isStudent && (<span className="student-badge">STUDENT ARTIST</span>)}
                 <div className="average-rating-display">
                    {reviewsLoading ? ( <span>Loading rating...</span> )
                    : completedReviews.length > 0 && averageRating ? (
                        <>
                            <DisplayStars rating={averageRating} />
                            <span className="rating-value">{averageRating.toFixed(1)}</span>
                            <span className="review-count">({completedReviews.length} project review{completedReviews.length !== 1 ? 's' : ''})</span>
                        </>
                    ) : ( <span className="no-rating">No project reviews yet</span> )}
                </div>
                 {!isEditing && ( <button className="edit-btn" onClick={handleEditToggle}> Edit profile </button> )}
            </div>
        </div>

        {error && isEditing && <p className="error-message inline-error">{error}</p>}

        <div className="profile-content">
          {!isEditing ? (
            <>
              <div className="profile-section">
                <h4>Short description:</h4>
                <div className="bio-text markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {bio || "*No bio provided yet.*"}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="profile-section cv-section">
                <h4>Curriculum Vitae (CV)</h4>
                 {/* --- UPDATED CV DISPLAY --- */}
                {cvUrl ? (
                  <div className="cv-display">
                    <FaFilePdf className="pdf-icon" />
                    <button onClick={() => handleCvDownload(cvUrl)} className="cv-link">
                      Download CV
                    </button>
                  </div>
                ) : (
                  <p className="no-cv-message">No CV uploaded yet.</p>
                )}
              </div>

              <div className="reviews-section profile-section">
                     <h4>Project Reviews ({completedReviews.length})</h4>
                     {reviewsLoading ? ( <p>Loading...</p> ) : completedReviews.length > 0 ? ( <div className="reviews-list"> {completedReviews.map((review: ReviewData) => (
                        <div key={review.review_id} className="review-item">
                            <div className="review-header">
                                <img src={getImageUrl(review.reviewer?.profile_picture)} alt={review.reviewer?.fullname || 'Reviewer'} className="reviewer-pic"/>
                                <div className="reviewer-info"> <strong>{review.reviewer?.fullname || 'Anonymous'}</strong> <span className="review-date">{formatDate(review.created_at)}</span> </div>
                                <div className="review-stars"> <DisplayStars rating={review.overall_rating} /> </div>
                            </div>
                            {review.specific_answers?.comment && ( <p className="review-comment">"{review.specific_answers.comment}"</p> )}
                        </div>
                     ))} </div>
                     ) : ( <p className="no-reviews">No project reviews have been submitted for this artist yet.</p> )}
              </div>

              <div className="reviews-section profile-section">
                <h4>Interaction Feedback ({interactionReviews.length})</h4>
                {reviewsLoading ? (<p>Loading feedback...</p>)
                  : interactionReviews.length > 0 ? (
                    <div className="reviews-list">
                      {interactionReviews.map((review: ReviewData) => (
                        <div key={review.review_id} className="review-item interaction-review">
                          <div className="review-header">
                            <img src={getImageUrl(review.reviewer?.profile_picture)} alt={review.reviewer?.fullname} className="reviewer-pic" />
                            <div className="reviewer-info">
                              <strong>{review.reviewer?.fullname || 'Anonymous'}</strong>
                              <span className="review-date">{formatDate(review.created_at)}</span>
                            </div>
                          </div>
                          <div className="review-comment">
                            {review.specific_answers?.noDealPrimaryReason && (
                              <p className="interaction-reason">
                                <strong>Reason:</strong> {review.specific_answers.noDealPrimaryReason}
                              </p>
                            )}
                            {review.specific_answers?.comment && (
                              <p><strong>Comment:</strong> "{review.specific_answers.comment}"</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (<p className="no-reviews">No interaction feedback to show.</p>
                )}
              </div>
            </>

          ) : (
            <div className="edit-form">
              <div className="form-field-group"> <label htmlFor="artistBio">Short description:</label> <textarea id="artistBio" value={newBio} onChange={(e) => setNewBio(e.target.value)} rows={5} className="bio-input" /> </div>
              <div className="form-field-group cv-edit-section">
                <label htmlFor="cvUpload" className="cv-section-title">Update Curriculum Vitae (PDF only):</label>
                <label htmlFor="cvUpload" className="cv-upload-label action-btn">
                  {newCvFile ? `Selected: ${newCvFile.name.substring(0, 25)}${newCvFile.name.length > 25 ? '...' : ''}` : (cvUrl ? "Change CV File" : "Choose CV File")}
                </label>
                <input id="cvUpload" type="file" accept="application/pdf" onChange={handleCvFileChange} style={{ display: 'none' }} className="file-input-hidden" />
                {newCvFile && (<button type="button" onClick={handleCvUpload} disabled={cvProcessing || saving || deleting} className="action-btn upload-cv-btn" style={{ marginTop: '10px' }}> {cvProcessing && !saving && !deleting ? "Uploading CV..." : `Upload Selected CV`} </button>)}
                {cvUrl && (
                  <div className="current-cv-display">
                     {/* --- UPDATED CV DISPLAY (EDIT MODE) --- */}
                    <span>Current CV: <FaFilePdf className="pdf-icon-inline" /> 
                      <button onClick={() => handleCvDownload(cvUrl)} className="cv-link-inline">
                        Download
                      </button>
                    </span>
                    {!newCvFile && (<button type="button" onClick={handleCvDelete} disabled={cvProcessing || saving || deleting} className="action-btn delete-cv-btn danger"> {cvProcessing && !saving && !deleting ? "Removing..." : "Remove CV"} </button>)}
                  </div>
                )}
                {!cvUrl && !newCvFile && <p className="no-cv-message-edit">No CV uploaded yet. Choose one above.</p>}
              </div>
              <div className="btn-row form-actions">
                <button className="save-btn submit-btn" onClick={handleSaveChanges} disabled={saving || deleting || cvProcessing}> {saving ? "Saving Profile..." : "Save changes"} </button>
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
