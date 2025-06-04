// src/pages/UserProfilePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import RatingForm from '../components/RatingForm'; // Ensure this component exists and is correctly imported
import '../styles/UserProfilePage.css'; // Ensure this file exists and has styles
import { FaFilePdf } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// --- Interfaces (can be moved to a types file) ---
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

interface PortfolioItem {
  portfolio_id: number;
  image_url?: string;
  description?: string;
}

interface JobPosting {
  job_id: number;
  title: string;
  description?: string;
}

interface ArtistProfileData {
  artist_id: number;
  bio?: string;
  profile_picture?: string;
  is_student?: boolean;
  cv_url?: string | null;
  cv_public_id?: string | null;
}

interface EmployerProfileData {
  employer_id: number;
  bio?: string;
  profile_picture?: string;
}

interface UserProfile {
  user_id: number;
  fullname: string;
  user_type: string;
  artistProfile?: ArtistProfileData | null;
  employerProfile?: EmployerProfileData | null;
  city?: string;
}
// --- End Interfaces ---


// --- Helper Functions (can be moved to a utils file) ---
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
    // Ensure emptyStars calculation is correct
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
  const [loading, setLoading] = useState(true); // For main profile loading
  const [error, setError] = useState<string | null>(null);

  // State for displaying existing reviews
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true); // For loading review list

  // State for Rating Submission functionality
  const [isRatingFormOpen, setIsRatingFormOpen] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState<boolean>(false);
  const [isLoadingReviewStatus, setIsLoadingReviewStatus] = useState<boolean>(false);
  // --- End State Declarations ---

  // --- Handlers for Rating Form ---
  const handleOpenRatingForm = () => {
    if (!loggedInUserId) {
      alert("Please log in to leave a review.");
      // navigate('/login'); // Optionally navigate to login
      return;
    }
    // This check is implicitly handled by the button's disabled state now, but good to have.
    if (userProfile && loggedInUserId === userProfile.user_id) {
      // Button should be hidden/disabled anyway, but as a safeguard:
      // alert("You cannot review your own profile.");
      return;
    }
    setIsRatingFormOpen(true);
  };

  const handleCloseRatingForm = (submittedSuccessfully?: boolean) => { // << CHANGED: Made parameter optional
    setIsRatingFormOpen(false);
    if (submittedSuccessfully === true) { // Explicitly check for true
      setAlreadyReviewed(true); // User has now reviewed
      alert("Thank you for your review!");
      // Optionally, re-fetch averageRating and reviews
      // to show the new review immediately.
      // Example: fetchSpecificUserData(userIdFromParams); // (You would define this function)
    }
  };
  // --- End Handlers for Rating Form ---

  // Helper function for image URL (no changes)
  const getImageUrl = (path?: string | null) => {
    if (!path) return '/default-profile.png';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
  };

  // Fetch Like Status (no changes)
  const fetchLikeStatus = useCallback(async (profileUserId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !loggedInUserId) return; // Ensure loggedInUserId is present for this action
      const response = await axios.get(`${API_BASE_URL}/api/users/${profileUserId}/like`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLiked(response.data.liked);
    } catch (err) { console.error('Error fetching like status:', err); }
  }, [API_BASE_URL, loggedInUserId]); // Added loggedInUserId dependency

  // Handle Liking User (no changes)
  const handleLike = async () => {
    if (!userIdFromParams || !loggedInUserId) { // Ensure loggedInUserId for this action
        alert("You must be logged in to like someone.");
        return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) { /* already handled by loggedInUserId check */ return; }
      if (liked) { console.log("Already liked/unliking not implemented"); return; }

      await axios.post(`${API_BASE_URL}/api/users/${userIdFromParams}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLiked(true);
    } catch (err) { console.error('Error liking user:', err); alert('Failed to like user.'); }
  };

  // Effect to get logged-in user ID on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setLoggedInUserId(parsedUser?.user_id || null);
      } catch (e) {
        console.error("Failed to parse stored user for ID", e);
        setLoggedInUserId(null);
      }
    }
  }, []);


  // Main data fetching useEffect
  useEffect(() => {
    if (!userIdFromParams) {
      setError("Invalid user ID provided in URL.");
      setLoading(false);
      setReviewsLoading(false);
      setIsLoadingReviewStatus(false);
      return;
    }

    let isMounted = true;
    const fetchAllData = async () => {
      setLoading(true);
      setReviewsLoading(true);
      // setIsLoadingReviewStatus(true); // Set this specifically before its API call
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // 1. Fetch main user profile
        const profileResponse = await axios.get(`${API_BASE_URL}/api/users/profile/${userIdFromParams}`, { headers });
        if (!isMounted) return;
        const fetchedUserProfile = profileResponse.data as UserProfile;
        setUserProfile(fetchedUserProfile);

        // 2. Fetch like status (if logged in)
        if (token && loggedInUserId) { // Ensure loggedInUserId is available
          fetchLikeStatus(userIdFromParams);
        }

        // 3. Fetch Portfolio or Job Postings
        if (fetchedUserProfile) {
          if (fetchedUserProfile.user_type === 'Artist' && fetchedUserProfile.artistProfile?.artist_id) {
            axios.get(`${API_BASE_URL}/api/portfolios/${fetchedUserProfile.artistProfile.artist_id}`, { headers })
              .then(res => { if (isMounted) setPortfolio(res.data || []); })
              .catch(err => console.error('Error fetching portfolio:', err));
          } else if (fetchedUserProfile.user_type === 'Employer' && fetchedUserProfile.employerProfile?.employer_id) {
            axios.get(`${API_BASE_URL}/api/job-postings/employer?employer_id=${fetchedUserProfile.employerProfile.employer_id}`, { headers })
              .then(res => { if (isMounted) setJobPostings(res.data || []); })
              .catch(err => console.error('Error fetching job postings:', err));
          }
        }

        // 4. Check if already reviewed (if loggedInUserId is available and it's not own profile)
        if (isMounted && loggedInUserId && fetchedUserProfile && loggedInUserId !== fetchedUserProfile.user_id) {
            setIsLoadingReviewStatus(true);
            try {
                const reviewCheckHeaders = token ? { Authorization: `Bearer ${token}` } : {};
                const reviewStatusRes = await axios.get(
                    `${API_BASE_URL}/api/reviews/check?reviewerId=${loggedInUserId}&reviewedUserId=${fetchedUserProfile.user_id}`,
                    { headers: reviewCheckHeaders }
                );
                if (isMounted) {
                    setAlreadyReviewed(reviewStatusRes.data.hasReviewed);
                }
            } catch (err) {
                console.error('Error checking review status:', err);
                if (isMounted) setAlreadyReviewed(false);
            } finally {
                if (isMounted) setIsLoadingReviewStatus(false);
            }
        } else if (isMounted) {
            if (fetchedUserProfile && loggedInUserId && loggedInUserId === fetchedUserProfile.user_id) {
                setAlreadyReviewed(true); // Cannot review self
            } else {
                setAlreadyReviewed(false);
            }
            setIsLoadingReviewStatus(false);
        }

        // 5. Fetch Average Rating and Reviews for display
        const ratingPromise = axios.get(`${API_BASE_URL}/api/users/${userIdFromParams}/average-rating`, { headers });
        const reviewsPromise = axios.get(`${API_BASE_URL}/api/users/${userIdFromParams}/reviews`, { headers });

        const [ratingResponse, reviewsResponse] = await Promise.all([ratingPromise, reviewsPromise]);
        if (isMounted) {
          setAverageRating(ratingResponse.data.averageRating);
          setReviewCount(ratingResponse.data.reviewCount);
          setReviews(reviewsResponse.data.reviews || []);
        }

      } catch (err: any) {
        console.error('Error fetching user data:', err);
        if (isMounted) setError(err.response?.data?.message || 'Error fetching user profile.');
      } finally {
        if (isMounted) {
          setLoading(false);
          setReviewsLoading(false);
          // isLoadingReviewStatus is handled within its specific block
        }
      }
    };

    if (loggedInUserId !== undefined) { // Ensure loggedInUserId has been initialized (even if null) before fetching all data
        fetchAllData();
    }


    return () => { isMounted = false; };
  }, [userIdFromParams, API_BASE_URL, fetchLikeStatus, loggedInUserId]); // Added loggedInUserId dependency


  // --- Loading and Error States ---
  if (loading && !userProfile) return <><Navbar /><p className="loading-message">Loading user profile...</p></>; // Show initial loading only if userProfile is null
  if (error) return <><Navbar /><p className="error-message">{error}</p></>;
  if (!userProfile && !loading) return <><Navbar /><p className="loading-message">No user profile data found.</p></>; // Handle case where loading finishes but no profile
  if (!userProfile && loading) return <><Navbar /><p className="loading-message">Loading user profile...</p></>; // Fallback if profile is still null during loading


  // --- Render Logic (once userProfile is available) ---
  const isArtistProfile = userProfile?.user_type === 'Artist';
  const bio = isArtistProfile ? userProfile?.artistProfile?.bio : userProfile?.employerProfile?.bio;
  const profilePic = isArtistProfile ? userProfile?.artistProfile?.profile_picture : userProfile?.employerProfile?.profile_picture;
  const isStudent = isArtistProfile && userProfile?.artistProfile?.is_student === true;
  const cvUrl = isArtistProfile ? userProfile?.artistProfile?.cv_url : null;

  return (
    <>
      <Navbar />
      <div className="user-profile-page">
        <div className="profile-card">
          <div className="profile-header-public">
            <img
              className="user-profile-img"
              src={getImageUrl(profilePic)}
              alt={userProfile?.fullname || "Profile"}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-profile.png'; }}
            />
            <div className="profile-summary-public">
              <h3 className="user-fullname">{userProfile?.fullname}</h3>
              <p className="user-type-public">{userProfile?.user_type}</p>
              {isStudent && ( <span className="student-badge-public">STUDENT ARTIST</span> )}

              <div className="average-rating-display">
                  {reviewsLoading && reviewCount === 0 ? ( <span>Loading rating...</span> ) // Show loading only if no reviews yet
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
              
              <div className="profile-actions">
                {/* Rate User Button */}
                {loggedInUserId && userProfile && loggedInUserId !== userProfile.user_id && (
                  <button
                    onClick={handleOpenRatingForm}
                    disabled={alreadyReviewed || isLoadingReviewStatus}
                    className={`rate-user-button ${alreadyReviewed ? 'reviewed' : ''}`}
                  >
                    {isLoadingReviewStatus
                      ? "Loading..."
                      : alreadyReviewed
                      ? "Reviewed"
                      : `Rate ${userProfile.fullname.split(' ')[0]}`}
                  </button>
                )}
                {!loggedInUserId && userProfile && userProfile.user_id !== loggedInUserId && ( // Show if not logged in, viewing others
                    <button className="rate-user-button" onClick={() => navigate('/login?redirect=/user-profile/'+userIdFromParams)} >Login to Rate</button>
                )}

                {/* Like Button: Only show if logged in */}
                {loggedInUserId && userProfile && loggedInUserId !== userProfile.user_id &&(
                  <button onClick={handleLike} disabled={liked} className={`like-button ${liked ? 'liked' : ''}`}>
                    {liked ? 'Liked' : 'Like'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="profile-content-public">
            <div className="profile-section-public">
              <h4>Bio</h4>
              <p className="user-bio">{bio || 'No bio available.'}</p>
            </div>
             {isArtistProfile && (
              <div className="profile-section-public cv-section">
                <h4>Curriculum Vitae (CV)</h4>
                {cvUrl ? (
                  <div className="cv-display">
                    <FaFilePdf className="pdf-icon" />
                    <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="cv-link">
                      View CV
                    </a>
                  </div>
                ) : (
                  <p className="no-cv-message">No CV available.</p>
                )}
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
                                    <div className="review-stars">
                                        <DisplayStars rating={review.overall_rating} />
                                    </div>
                                </div>
                                {review.specific_answers?.comment && (
                                    <p className="review-comment">"{review.specific_answers.comment}"</p>
                                )}
                            </div>
                         ))}
                     </div>
                 ) : ( <p className="no-reviews">No reviews have been submitted for this user yet.</p> )}
            </div>

            {isArtistProfile ? (
              <div className="portfolio-section profile-section-public">
                <h4>Portfolio</h4>
                {loading && portfolio.length === 0 ? <p>Loading portfolio...</p> : // Show loading for portfolio if main loading is true and portfolio is empty
                 portfolio.length === 0 ? ( <p>No portfolio items.</p> ) : (
                  <div className="portfolio-items">
                    {portfolio.map((item) => (
                      <div key={item.portfolio_id} className="portfolio-item-card">
                        {item.image_url && (
                          <img className="portfolio-image" src={getImageUrl(item.image_url)} alt="Portfolio" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-portfolio.png'; }} />
                        )}
                        <p>{item.description || 'No description'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="job-postings-section profile-section-public">
                <h4>Job Postings</h4>
                 {loading && jobPostings.length === 0 ? <p>Loading job postings...</p> : // Show loading for jobs
                  jobPostings.length === 0 ? ( <p>No job postings.</p> ) : (
                  <div className="job-postings-list">
                    {jobPostings.map((job) => (
                      <div key={job.job_id} className="job-posting-item-card">
                        <h5>{job.title}</h5>
                        <p>{job.description || 'No description'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rating Form Modal */}
          {isRatingFormOpen && loggedInUserId && userProfile && (
            <div className="rating-form-modal-overlay">
              <RatingForm
                reviewerId={loggedInUserId}
                reviewedUserId={userProfile.user_id}
                reviewedUserName={userProfile.fullname}
                onClose={handleCloseRatingForm}
                // NO chatId prop is passed
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserProfilePage;