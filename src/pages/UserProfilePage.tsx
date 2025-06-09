// src/pages/UserProfilePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import RatingForm from '../components/RatingForm';
import '../styles/UserProfilePage.css';
import { 
  FaFilePdf, FaHeart, FaRegHeart, FaCommentDots, 
  FaMapMarkerAlt, FaGlobe, FaBuilding 
} from 'react-icons/fa';


const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// --- Interfaces ---
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

interface PortfolioItem { portfolio_id: number; image_url?: string; description?: string;}
// --- THIS IS THE UPDATED JobPosting INTERFACE ---
interface JobPosting {
  job_id: number;
  title: string;
  description?: string | null;
  category: string;
  location?: string | null;
  presence: 'Physical' | 'Online' | 'Both';
  payment_total: number;
  createdAt: string; // The backend now sends createdAt
}

interface ArtistProfileData { artist_id: number; bio?: string; profile_picture?: string; is_student?: boolean; cv_url?: string | null; cv_public_id?: string | null;}
interface EmployerProfileData { employer_id: number; bio?: string; profile_picture?: string;}

interface UserProfile {
  user_id: number;
  fullname: string;
  user_type: string;
  artistProfile?: ArtistProfileData | null;
  employerProfile?: EmployerProfileData | null;
  city?: string;
}

interface LoggedInUser { // For storing more details of the logged-in user
    user_id: number;
    user_type: string;
    fullname: string;
}

// Interface for Artist Comments
interface CommenterDetails {
  user_id: number;
  fullname: string;
  profile_picture: string | null;
  user_type?: string;
}

interface ArtistComment {
  comment_id: number;
  profile_user_id: number; // User ID of the profile being commented on
  commenter_user_id: number; // User ID of the artist who made the comment
  comment_text: string;
  created_at: string;
  updated_at?: string;
  commenter?: CommenterDetails; // Details of the commenter
}
// --- End Interfaces ---

// --- Helper Functions ---
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) { return 'Date unknown'; }
  try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) { return 'Invalid Date'; }
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) { console.error("Error parsing date:", dateString, e); return 'Invalid Date'; }
};

const DisplayStars = ({ rating }: { rating: number | null }) => {
    if (rating === null || typeof rating !== 'number' || rating <= 0) {
        return <span className="no-rating">(Not rated yet)</span>;
    }
    const fullStars = Math.floor(rating);
    const halfStar = Math.round(rating * 2) % 2 !== 0 ? 1 : 0;
    const validFull = Math.max(0, fullStars);
    const validHalf = Math.max(0, halfStar);
    const emptyStars = Math.max(0, 5 - validFull - validHalf);
    return (
        <div className="star-display" title={`${rating.toFixed(1)} out of 5 stars`}>
            {[...Array(validFull)].map((_, i) => <span key={`full-${i}`} className="star filled">★</span>)}
            {validHalf === 1 && <span key="half" className="star half">★</span>}
            {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`} className="star empty">☆</span>)}
        </div>
    );
};
// --- End Helper Functions ---

const UserProfilePage: React.FC = () => {
  const { userId: userIdFromParams } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  // --- State Declarations ---
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [liked, setLiked] = useState<boolean>(false);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);

  const [isRatingFormOpen, setIsRatingFormOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null); // Changed from loggedInUserId
  const [alreadyReviewed, setAlreadyReviewed] = useState<boolean>(false);
  const [isLoadingReviewStatus, setIsLoadingReviewStatus] = useState<boolean>(true); // Start true

  const [hasSupported, setHasSupported] = useState<boolean>(false);
  const [supportCount, setSupportCount] = useState<number>(0);
  const [isLoadingSupportStatus, setIsLoadingSupportStatus] = useState<boolean>(true); // Start true
  const [isTogglingSupport, setIsTogglingSupport] = useState<boolean>(false);

  const [profileComments, setProfileComments] = useState<ArtistComment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(true); // Start true
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  // --- End State Declarations ---
// --- ADD THESE NEW STATE VARIABLES ---
const [hasCommented, setHasCommented] = useState<boolean>(false);
const [isLoadingCommentStatus, setIsLoadingCommentStatus] = useState<boolean>(true);
// --- END ADD ---
  // --- Handlers for Rating Form (General Reviews) ---
  const handleOpenRatingForm = () => {
    if (!loggedInUser) { alert("Please log in to leave a review."); navigate(`/login?redirect=/user-profile/${userIdFromParams}`); return; }
    if (userProfile && loggedInUser.user_id === userProfile.user_id) { return; }
    setIsRatingFormOpen(true);
  };
  const handleCloseRatingForm = (submittedSuccessfully: boolean, newReview?: ReviewData) => {
    setIsRatingFormOpen(false); // Always close the modal

    // If a new review was successfully submitted and passed back
    if (submittedSuccessfully && newReview) {
      // Add the new review to the top of the existing reviews list
      setReviews(prevReviews => [newReview, ...prevReviews]);
      // Increment the review count
      setReviewCount(prevCount => prevCount + 1);
      // Mark that this user has now reviewed, to disable the button
      setAlreadyReviewed(true);
      
      alert("Thank you! Your review has been posted.");
    }
  };
  const handleInitiateChat = async () => {
    if (!loggedInUser || !userProfile) {
        alert("You must be logged in to start a chat.");
        return;
    }

    try {
        const token = localStorage.getItem('token');
        // Your backend createChat endpoint should handle finding an existing chat
        // or creating a new one between the two users.
        const response = await axios.post(`${API_BASE_URL}/api/chats`, 
            {
                // Send the ID of the other user. The backend gets your ID from the token.
                receiverId: userProfile.user_id 
            }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // After the chat is found/created, navigate to the chat page.
        // The backend should return the chat object, including its ID.
        const chatId = response.data.chat.chat_id;
        console.log(`Navigating to chat with ID: ${chatId}`);
        navigate(`/chat`); // Or navigate(`/chat?open=${chatId}`);
        
    } catch (err: any) {
        console.error("Error initiating chat:", err);
        alert(err.response?.data?.message || "Could not start a conversation.");
    }
  };
  // --- Handlers for Artist Support ---
  const handleToggleSupport = async () => {
    if (!loggedInUser || loggedInUser.user_type !== 'Artist' || !userProfile || userProfile.user_type !== 'Artist' || loggedInUser.user_id === userProfile.user_id) {
      alert("Only artists can support other artists, and not themselves.");
      return;
    }
    if (isTogglingSupport) return;
    setIsTogglingSupport(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/users/${userProfile.user_id}/support`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHasSupported(response.data.hasSupported);
      setSupportCount(response.data.supportCount);
    } catch (err: any) {
      console.error("Error toggling support:", err);
      alert(err.response?.data?.message || "Failed to update support status.");
    } finally {
      setIsTogglingSupport(false);
    }
  };

  // --- Handlers for Artist Comments ---
// src/pages/UserProfilePage.tsx

const handleCommentSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!userProfile) {
    console.error("Cannot submit comment, user profile data not loaded yet.");
    return; // Exit the function early if profile data is missing
}

  // ... (your validation)
  if (isSubmittingComment) return;
  setIsSubmittingComment(true);
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_BASE_URL}/api/users/${userProfile.user_id}/comments`,
      { comment_text: newComment.trim() },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setProfileComments(prevComments => [response.data.comment, ...prevComments]);
    setNewComment("");
    setHasCommented(true); // <<< ADD THIS LINE to update UI immediately
  } catch (err: any) {
    console.error("Error submitting comment:", err);
    if (err.response?.status === 409) {
        setHasCommented(true); // Also sync state if backend says already commented
    }
    alert(err.response?.data?.message || "Failed to submit comment.");
  } finally {
    setIsSubmittingComment(false);
  }
};

  const getImageUrl = (path?: string | null): string => {
    if (!path) return '/default-profile.png';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
  };

  const fetchLikeStatus = useCallback(async (profileUserId: string, token: string | null) => {
    if (!token || !loggedInUser) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${profileUserId}/like`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLiked(response.data.liked);
    } catch (err) { console.error('Error fetching like status:', err); }
  }, [API_BASE_URL, loggedInUser]); // Dependency on loggedInUser

  const handleLike = async () => {
    if (!userIdFromParams || !loggedInUser) { alert("You must be logged in to like someone."); return; }
    const token = localStorage.getItem('token');
    if (!token) return; // Should be covered by !loggedInUser
    if (liked) { console.log("Already liked/unliking not implemented here."); return; }
    try {
      await axios.post(`${API_BASE_URL}/api/users/${userIdFromParams}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setLiked(true);
    } catch (err: any) { console.error('Error liking user:', err); alert(err.response?.data?.message || 'Failed to like user.'); }
  };

  useEffect(() => {
    const storedUserString = localStorage.getItem('user');
    if (storedUserString) {
      try {
        const parsedUser = JSON.parse(storedUserString);
        if (parsedUser && parsedUser.user_id && parsedUser.user_type && parsedUser.fullname) {
            setLoggedInUser({
                user_id: parsedUser.user_id,
                user_type: parsedUser.user_type,
                fullname: parsedUser.fullname
            });
        } else {
            setLoggedInUser(null);
        }
      } catch (e) { console.error("Failed to parse stored user", e); setLoggedInUser(null); }
    } else {
        setLoggedInUser(null); // No stored user
    }
  }, []);

  // src/pages/UserProfilePage.tsx

  useEffect(() => {
    if (!userIdFromParams) {
      setError("Invalid user ID."); setLoading(false); setReviewsLoading(false); setIsLoadingComments(false); setIsLoadingReviewStatus(false); setIsLoadingSupportStatus(false);
      setIsLoadingCommentStatus(false); // Reset all loading states
      return;
    }
    // Wait until loggedInUser state is determined (null or object)
    if (loggedInUser === undefined) {
        return; 
    }

    let isMounted = true;
    const fetchAllData = async () => {
      // Initialize all loading states at the beginning of a fetch cycle
      setLoading(true); setReviewsLoading(true); setIsLoadingComments(true);
      setIsLoadingReviewStatus(true); setIsLoadingSupportStatus(true); 
      setIsLoadingCommentStatus(true); 
      setError(null);

      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        // These can run in parallel
        const profilePromise = axios.get<UserProfile>(`${API_BASE_URL}/api/users/profile/${userIdFromParams}`, { headers });
        const ratingPromise = axios.get<{ averageRating: number | null, reviewCount: number }>(`${API_BASE_URL}/api/users/${userIdFromParams}/average-rating`, { headers });
        const reviewsPromise = axios.get<{ reviews: ReviewData[] }>(`${API_BASE_URL}/api/users/${userIdFromParams}/reviews`, { headers });
        const commentsPromise = axios.get<{ comments: ArtistComment[] }>(`${API_BASE_URL}/api/users/${userIdFromParams}/comments`, { headers });

        const [profileResponse, ratingResponse, reviewsResponse, commentsResponse] = await Promise.all([
            profilePromise, ratingPromise, reviewsPromise, commentsPromise
        ]);

        if (!isMounted) return;

        const fetchedUserProfile = profileResponse.data;
        setUserProfile(fetchedUserProfile);
        setAverageRating(ratingResponse.data.averageRating);
        setReviewCount(ratingResponse.data.reviewCount);
        setReviews(reviewsResponse.data.reviews || []);
        setProfileComments(commentsResponse.data.comments || []);

        // --- Fetches dependent on loggedInUser and fetchedUserProfile ---
        if (loggedInUser && fetchedUserProfile) {
            if (token) fetchLikeStatus(userIdFromParams, token);

            const isOwnProfile = loggedInUser.user_id === fetchedUserProfile.user_id;

            if (!isOwnProfile) {
                // --- Check "already reviewed" status (for general reviews) ---
                axios.get<{ hasReviewed: boolean }>(`${API_BASE_URL}/api/reviews/check?reviewerId=${loggedInUser.user_id}&reviewedUserId=${fetchedUserProfile.user_id}`, { headers })
                    .then(res => { if (isMounted) setAlreadyReviewed(res.data.hasReviewed); })
                    .catch(err => { console.error('Error checking review status:', err); if (isMounted) setAlreadyReviewed(false); })
                    .finally(() => { if (isMounted) setIsLoadingReviewStatus(false); });

                // --- Checks applicable only when an artist views another artist's profile ---
                if (fetchedUserProfile.user_type === 'Artist' && loggedInUser.user_type === 'Artist') {
                    // Check "artist support" status
                    axios.get<{ hasSupported: boolean, supportCount: number }>(`${API_BASE_URL}/api/users/${fetchedUserProfile.user_id}/support-status`, { headers })
                        .then(res => { if (isMounted) { setHasSupported(res.data.hasSupported); setSupportCount(res.data.supportCount); }})
                        .catch(err => { console.error('Error fetching support status:', err); })
                        .finally(() => { if (isMounted) setIsLoadingSupportStatus(false); });

                    // --- ADDED: Check "has commented" status ---
                    axios.get<{ hasCommented: boolean }>(`${API_BASE_URL}/api/users/${fetchedUserProfile.user_id}/comments/check`, { headers })
                        .then(res => { if (isMounted) setHasCommented(res.data.hasCommented); })
                        .catch(err => { console.error('Error checking comment status:', err); if (isMounted) setHasCommented(false); }) // Default to false on error
                        .finally(() => { if (isMounted) setIsLoadingCommentStatus(false); });

                } else {
                    // If not artist-on-artist view, these aren't loading
                    setIsLoadingSupportStatus(false);
                    setIsLoadingCommentStatus(false);
                }
            } else { // This is the user's own profile
                setAlreadyReviewed(true); // Can't review self
                setHasCommented(true);    // Can't comment on self
                setIsLoadingReviewStatus(false);
                setIsLoadingSupportStatus(false);
                setIsLoadingCommentStatus(false);
            }
        } else { // Not logged in
            setIsLoadingReviewStatus(false);
            setIsLoadingSupportStatus(false);
            setIsLoadingCommentStatus(false);
        }

        // Fetch Portfolio or Job Postings (can be parallel or after profile if IDs are needed)
        if (fetchedUserProfile.user_type === 'Artist' && fetchedUserProfile.artistProfile?.artist_id) {
          axios.get(`${API_BASE_URL}/api/portfolios/${fetchedUserProfile.artistProfile.artist_id}`, { headers })
            .then(res => { if (isMounted) setPortfolio(res.data || []); })
            .catch(err => console.error('Error fetching portfolio:', err));
        } else if (fetchedUserProfile.user_type === 'Employer' && fetchedUserProfile.employerProfile?.employer_id) {
          axios.get(`${API_BASE_URL}/api/job-postings/employer?employer_id=${fetchedUserProfile.employerProfile.employer_id}`, { headers })
            .then(res => { if (isMounted) setJobPostings(res.data || []); })
            .catch(err => console.error('Error fetching job postings:', err));
        }

      } catch (err: any) {
        console.error('Error fetching user page data:', err);
        if (isMounted) setError(err.response?.data?.message || 'Error fetching user profile.');
      } finally {
        if (isMounted) { 
            setLoading(false); 
            setReviewsLoading(false); 
            setIsLoadingComments(false); // For the list of comments
        }
      }
    };
    
    fetchAllData();
    return () => { isMounted = false; };
  }, [userIdFromParams, API_BASE_URL, loggedInUser, fetchLikeStatus]); // Keep fetchLikeStatus in deps if it's memoized with useCallback

  // --- Loading and Error States ---
  if (!userProfile && loading) return <><Navbar /><div className="container loading-message">Loading user profile...</div></>;
  if (error) return <><Navbar /><div className="container error-message">{error}</div></>;
  if (!userProfile) return <><Navbar /><div className="container loading-message">No user profile data found.</div></>;
  console.log("Reviews state:", reviews);
  console.log("Profile Comments state:", profileComments);

  const profile = userProfile; // Alias for convenience
  
  const isOwnProfile = loggedInUser?.user_id === profile.user_id;
  const canLoggedInUserInteract = loggedInUser && loggedInUser.user_id !== profile.user_id;
  const canLoggedInArtistInteractWithArtistProfile = loggedInUser?.user_type === 'Artist' && profile.user_type === 'Artist' && !isOwnProfile;

  const isArtistProfile = profile.user_type === 'Artist'; 
    const bio = isArtistProfile ? profile.artistProfile?.bio : profile.employerProfile?.bio;
  const profilePic = isArtistProfile ? profile.artistProfile?.profile_picture : profile.employerProfile?.profile_picture;
  const isStudent = isArtistProfile && profile.artistProfile?.is_student === true;
  const cvUrl = isArtistProfile ? profile.artistProfile?.cv_url : null;

  return (
    <>
      <Navbar />
      <div className="user-profile-page">
        <div className="profile-card">
          <div className="profile-header-public">
            <img className="user-profile-img" src={getImageUrl(profilePic)} alt={profile.fullname} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-profile.png'; }} />
            <div className="profile-summary-public">
              <h3 className="user-fullname">{profile.fullname}</h3>
              <p className="user-type-public">{profile.user_type}{isStudent && <span className="student-badge-public"> (STUDENT)</span>}</p>
              
              <div className="average-rating-display">
                {reviewsLoading && reviewCount === 0 ? (<span>Loading rating...</span>)
                 : reviewCount > 0 && averageRating !== null ? (
                   <>
                     <DisplayStars rating={averageRating} />
                     <span className="rating-value">{averageRating.toFixed(1)}</span>
                     <span className="review-count">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                   </>
                 ) : (<span className="no-rating">No reviews yet</span>)}
              </div>
              
              <div className="profile-actions">
                 {/* --- ADD THE NEW MESSAGE BUTTON --- */}
      <button onClick={handleInitiateChat} className="interaction-button message-button">
          Message
      </button>
      {/* --- END ADD --- */}
                {/* --- Like Button --- */}
                {/* Shows if user is logged in and not viewing their own profile */}
                {canLoggedInUserInteract && (
                  <button 
                    onClick={handleLike} 
                    disabled={liked} 
                    className={`like-button ${liked ? 'liked' : ''}`}
                  >
                    {liked ? <FaHeart /> : <FaRegHeart />} {liked ? 'Liked' : 'Like'}
                  </button>
                )}

                {/* --- Rate User Button (General Review) --- */}
                {/* Shows if: 
                  1. User is logged in (canLoggedInUserInteract)
                  2. It's NOT their own profile (canLoggedInUserInteract)
                  3. AND it's NOT the case that an Artist is viewing another Artist's profile
                */}
                {canLoggedInUserInteract && !(loggedInUser?.user_type === 'Artist' && isArtistProfile) && (
                  <button
                    onClick={handleOpenRatingForm}
                    disabled={alreadyReviewed || isLoadingReviewStatus}
                    className={`rate-user-button ${alreadyReviewed ? 'reviewed' : ''}`}
                  >
                    {isLoadingReviewStatus
                      ? "..." // Loading state for review status check
                      : alreadyReviewed
                      ? "Reviewed"
                      : "Rate User"}
                  </button>
                )}

                {/* --- Login to Interact Button --- */}
                {/* Shows if user is NOT logged in and viewing someone else's profile */}
                {!loggedInUser && !isOwnProfile && (
                    <button 
                      className="interaction-button" 
                      onClick={() => navigate(`/login?redirect=/user-profile/${userIdFromParams}`)}
                    >
                      Login to Interact
                    </button>
                )}

                {/* --- Artist Support Button --- */}
                {/* Shows if logged-in user is Artist, profile is Artist, and not own profile */}
                {canLoggedInArtistInteractWithArtistProfile && (
                  <button 
                    onClick={handleToggleSupport} 
                    disabled={isTogglingSupport || isLoadingSupportStatus} 
                    className={`support-button ${hasSupported ? 'supported' : ''}`}
                  >
                    {isLoadingSupportStatus ? "..." : isTogglingSupport ? "..." : hasSupported ? <FaHeart color="deeppink"/> : <FaRegHeart />} 
                    {hasSupported ? "Supported" : "Support Artist"}
                    {!isLoadingSupportStatus && <span className="support-count">({supportCount})</span>}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="profile-content-public">
            <div className="profile-section-public"><h4>Bio</h4><p className="user-bio">{bio || 'No bio available.'}</p></div>
            
            {isArtistProfile && cvUrl && (
              <div className="profile-section-public cv-section">
                <h4>Curriculum Vitae (CV)</h4>
                <div className="cv-display">
                  <FaFilePdf className="pdf-icon" />
                  <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="cv-link">Download CV</a>
                </div>
              </div>
            )}
            
            <div className="reviews-section profile-section-public">
                 <h4>Reviews received ({reviewCount})</h4>
                 {reviewsLoading ? ( <p>Loading reviews...</p> )
                  : reviews.length > 0 ? (
                     <div className="reviews-list">
                         {reviews.map((review) => (
                            <div key={review.review_id} className="review-item">
                                <div className="review-header">
                                    <img src={getImageUrl(review.reviewer?.profile_picture)} alt={review.reviewer?.fullname || 'Reviewer'} className="reviewer-pic"/>
                                    <div className="reviewer-info">
                                        <strong>{review.reviewer?.fullname || 'Anonymous'}</strong>
                                        <span className="review-date">{formatDate(review.created_at)}</span>
                                    </div>
                                    <div className="review-stars"><DisplayStars rating={review.overall_rating} /></div>
                                </div>
                                {review.specific_answers?.comment && <p className="review-comment">"{review.specific_answers.comment}"</p>}
                            </div>
                         ))}
                     </div>
                 ) : ( <p className="no-reviews">This user hasn't received any reviews yet.</p> )}
            </div>

            {/* Artist Comments Section */}
            {/* Artist Comments Section */}
            {isArtistProfile && (
              <div className="artist-comments-section profile-section-public">
                <h4>Artistic viewpoints <FaCommentDots /> ({profileComments.length})</h4>
                
                {/* --- MODIFIED: Conditional Rendering for Comment Form --- */}
                {/* This block now handles all cases for the form's visibility */}
                {canLoggedInArtistInteractWithArtistProfile && (
                  <>
                    {isLoadingCommentStatus ? (
                      // 1. Show a loading state while we check
                      <div className="comment-form-placeholder">
                        <p>Loading...</p>
                      </div>
                    ) : hasCommented ? (
                      // 2. If check is done and they have commented, show a message
                      <div className="comment-form-placeholder">
                        <p>You have already shared your viewpoint on this artist.</p>
                      </div>
                    ) : (
                      // 3. If check is done and they have NOT commented, show the form
                      <form onSubmit={handleCommentSubmit} className="comment-form">
                        <textarea
                          placeholder={`Share your artistic viewpoint on ${profile.fullname}'s work...`}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                          disabled={isSubmittingComment}
                        />
                        <button type="submit" disabled={isSubmittingComment || !newComment.trim()}>
                          {isSubmittingComment ? "Posting..." : "Post Viewpoint"}
                        </button>
                      </form>
                    )}
                  </>
                )}
                {/* --- END MODIFICATION --- */}

                {/* The logic for displaying the list of comments remains the same */}
                {isLoadingComments ? (<p>Loading viewpoints...</p>) :
                 profileComments.length > 0 ? (
                  <div className="comments-list">
                    {profileComments.map(comment => (
                      <div key={comment.comment_id} className="comment-item artist-comment-item">
                        <div className="comment-header">
                          <img src={getImageUrl(comment.commenter?.profile_picture)} alt={comment.commenter?.fullname || "Commenter"} className="commenter-pic"/>
                          <div className="commenter-info">
                            <strong>{comment.commenter?.fullname || "An Artist"}</strong>
                            <span className="comment-date">{formatDate(comment.created_at)}</span>
                          </div>
                        </div>
                        <p className="comment-text">{comment.comment_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (<p>No artistic viewpoints have been shared yet for {profile.fullname}.</p>)}
              </div>
            )}

            {isArtistProfile ? (
              <div className="portfolio-section profile-section-public">
                <h4>Portfolio</h4>
                {loading && portfolio.length === 0 ? <p>Loading portfolio...</p> :
                 portfolio.length === 0 ? ( <p>No portfolio items.</p> ) : (
                  <div className="portfolio-items">
                    {portfolio.map((item) => (
                      <div key={item.portfolio_id} className="portfolio-item-card">
                        {item.image_url && (
                          <img className="portfolio-image" src={getImageUrl(item.image_url)} alt="Portfolio item" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-portfolio.png'; }} />
                        )}
                        <p>{item.description || 'No description'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="job-postings-section profile-section-public">
              <h4>Active Job Postings</h4>
              {loading && jobPostings.length === 0 ? (
                <p>Loading job postings...</p>
              ) : jobPostings.length === 0 ? (
                <p>This employer has no active job postings.</p>
              ) : (
                <div className="profile-job-postings-list">
                  {jobPostings.map((job) => (
                    <div key={job.job_id} className="profile-job-item-card">
                      <div className="profile-job-item-header">
                        <h5 className="profile-job-item-title">{job.title}</h5>
                        <span className="profile-job-item-payment">
    €{job.payment_total != null ? Number(job.payment_total).toFixed(2) : 'N/A'}
  </span>

                      </div>
                      <p className="profile-job-item-category">{job.category}</p>
                      <div className="profile-job-item-tags">
                          {job.location && <span className="tag-item compact"><FaMapMarkerAlt /> {job.location}</span>}
                          {job.presence === 'Online' && <span className="tag-item compact"><FaGlobe /> Online</span>}
                          {job.presence === 'Physical' && <span className="tag-item compact"><FaBuilding /> On-site</span>}
                          {job.presence === 'Both' && <span className="tag-item compact"><FaGlobe /> / <FaBuilding /> Hybrid</span>}
                      </div>
                      <div className="profile-job-item-footer">
                        <span className="post-date">Posted {formatDate(job.createdAt)}</span>
                        {/* This link should ideally go to a detailed job page like /jobs/:job_id */}
                        {/* For now, it can link to the main job feed for context */}
                          <Link to={`/jobs/${job.job_id}`} className="view-job-link">View Details</Link>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            )}
          </div> {/* End profile-content-public */}

          {/* Rating Form Modal (General Reviews) */}
          {isRatingFormOpen && loggedInUser && profile && (
            <div className="rating-form-modal-overlay">
                            <RatingForm
                reviewerId={loggedInUser.user_id}
                reviewedUserId={userProfile.user_id}
                reviewedUserName={userProfile.fullname}
                onClose={handleCloseRatingForm}
              />

            </div>
          )}
        </div> {/* End profile-card */}
      </div> {/* End user-profile-page */}
    </>
  );
};

export default UserProfilePage;