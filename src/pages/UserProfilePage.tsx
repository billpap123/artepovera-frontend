// src/pages/UserProfilePage.tsx
import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import axios from 'axios';
import Navbar from '../components/Navbar';
import '../styles/UserProfilePage.css'; // Ensure this file exists and has styles

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// --- Interfaces (Reviewer, ReviewData - can be moved to a types file) ---
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
    // Add other fields your backend might return from specificAnswers
  };
  created_at: string;
  reviewer?: Reviewer;
}
// --- End Interfaces ---

// --- Helper Functions (formatDate, DisplayStars - can be moved to a utils file) ---
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
// --- End Helper Functions ---


// --- Original Interfaces from your file ---
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
interface ArtistProfileData { // Renamed to avoid conflict
  artist_id: number;
  bio?: string;
  profile_picture?: string;
  is_student?: boolean;
}
interface EmployerProfileData { // Renamed to avoid conflict
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
  // Potentially add city here if your /api/users/profile/:userId returns it
  city?: string;
}
// --- End Original Interfaces ---

const UserProfilePage: React.FC = () => {
  const { userId: userIdFromParams } = useParams<{ userId: string }>(); // Renamed for clarity

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [liked, setLiked] = useState<boolean>(false);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- ADD State for Ratings/Reviews ---
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);
  // --- END ADD ---

  const navigate = useNavigate(); // Added useNavigate

  // Helper function for full image URL (keep as is)
  const getImageUrl = (path?: string | null) => {
    if (!path) return '/default-profile.png';
    if (path.startsWith('http')) return path;
    // Ensure API_BASE_URL is not prepended if path is already a full Cloudinary URL
    // This check is good, but profile_picture should ideally always be a full URL from backend
    return `${API_BASE_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
  };

  // Fetch Like Status (keep as is, but ensure it uses userIdFromParams)
  const fetchLikeStatus = useCallback(async (profileUserId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API_BASE_URL}/api/users/${profileUserId}/like`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLiked(response.data.liked);
    } catch (err) { console.error('Error fetching like status:', err); }
  }, [API_BASE_URL]); // Added API_BASE_URL dependency

  // Handle Liking User (keep as is, but ensure it uses userIdFromParams)
  const handleLike = async () => {
    if (!userIdFromParams) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) { alert("You must be logged in to like someone."); return; }
      // If already liked, potentially implement unlike, or disable button
      // For now, just prevents re-liking if `liked` state is true
      if (liked) { console.log("Already liked"); return; }

      await axios.post(`${API_BASE_URL}/api/users/${userIdFromParams}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLiked(true); // Optimistic update or use backend response
    } catch (err) { console.error('Error liking user:', err); alert('Failed to like. Check console for details.'); }
  };

  // Fetch User Profile, Portfolio/Jobs, AND Ratings/Reviews
  useEffect(() => {
    if (!userIdFromParams) {
      setError("Invalid user ID provided in URL.");
      setLoading(false);
      setReviewsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchAllData = async () => {
      setLoading(true);
      setReviewsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        // Profile can be public, but like status needs token
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // 1. Fetch main user profile
        const profileResponse = await axios.get(`${API_BASE_URL}/api/users/profile/${userIdFromParams}`, { headers });
        if (!isMounted) return;
        setUserProfile(profileResponse.data);
        const fetchedUserProfile = profileResponse.data as UserProfile; // Cast for easier access

        // 2. Fetch like status (if logged in)
        if (token) {
          fetchLikeStatus(userIdFromParams);
        }

        // 3. Fetch Portfolio or Job Postings based on user type
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

        // --- ADD: Fetch Average Rating and Reviews ---
        const ratingPromise = axios.get(`${API_BASE_URL}/api/users/${userIdFromParams}/average-rating`, { headers }); // Headers optional if public
        const reviewsPromise = axios.get(`${API_BASE_URL}/api/users/${userIdFromParams}/reviews`, { headers }); // Headers optional if public

        const [ratingResponse, reviewsResponse] = await Promise.all([ratingPromise, reviewsPromise]);
        if (isMounted) {
          setAverageRating(ratingResponse.data.averageRating);
          setReviewCount(ratingResponse.data.reviewCount);
          setReviews(reviewsResponse.data.reviews || []);
        }
        // --- END ADD ---

      } catch (err: any) {
        console.error('Error fetching user data:', err);
        if (isMounted) setError(err.response?.data?.message || 'Error fetching user profile.');
      } finally {
        if (isMounted) {
          setLoading(false);
          setReviewsLoading(false);
        }
      }
    };

    fetchAllData();
    return () => { isMounted = false; };
  }, [userIdFromParams, API_BASE_URL, fetchLikeStatus]); // fetchLikeStatus is a dependency now


  if (loading) return <><Navbar /><p className="loading-message">Loading user profile...</p></>;
  if (error) return <><Navbar /><p className="error-message">{error}</p></>;
  if (!userProfile) return <><Navbar /><p className="loading-message">No user profile data found.</p></>;

  const isArtistProfile = userProfile.user_type === 'Artist';
  const bio = isArtistProfile ? userProfile.artistProfile?.bio : userProfile.employerProfile?.bio;
  const profilePic = isArtistProfile ? userProfile.artistProfile?.profile_picture : userProfile.employerProfile?.profile_picture;
  const isStudent = isArtistProfile && userProfile.artistProfile?.is_student === true;

  return (
    <>
      <Navbar />
      <div className="user-profile-page"> {/* Main container */}
        <div className="profile-card"> {/* Card for the profile content */}

          <div className="profile-header-public"> {/* New class for layout */}
            <img
              className="user-profile-img"
              src={getImageUrl(profilePic)}
              alt={userProfile.fullname || "Profile"}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-profile.png'; }}
            />
            <div className="profile-summary-public">
              <h3 className="user-fullname">{userProfile.fullname}</h3>
              <p className="user-type-public">{userProfile.user_type}</p>
              {isStudent && ( <span className="student-badge-public">STUDENT ARTIST</span> )}

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

              <button onClick={handleLike} disabled={liked} className={`like-button ${liked ? 'liked' : ''}`}>
                {liked ? 'Liked' : 'Like'}
              </button>
            </div>
          </div>

          <div className="profile-content-public">
            <div className="profile-section-public">
              <h4>Bio</h4>
              <p className="user-bio">{bio || 'No bio available.'}</p>
            </div>

            {/* --- ADD Reviews Section --- */}
            <div className="reviews-section profile-section-public">
                 <h4>Reviews received ({reviewCount})</h4>
                 {reviewsLoading ? ( <p>Loading reviews...</p> )
                  : reviews.length > 0 ? (
                     <div className="reviews-list">
                         {reviews.map((review) => (
                            <div key={review.review_id} className="review-item">
                                <div className="review-header">
                                    <img src={review.reviewer?.profile_picture || '/default-profile.png'} alt={review.reviewer?.fullname || 'Reviewer'} className="reviewer-pic"/>
                                    <div className="reviewer-info">
                                        <strong>{review.reviewer?.fullname || 'Anonymous'}</strong>
                                        <span className="review-date">{formatDate(review.created_at || (review as any).createdAt)}</span>
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
            {/* --- END Reviews Section --- */}


            {isArtistProfile ? (
              <div className="portfolio-section profile-section-public">
                <h4>Portfolio</h4>
                {portfolio.length === 0 ? ( <p>No portfolio items.</p> ) : (
                  <div className="portfolio-items"> {/* This needs grid styling */}
                    {portfolio.map((item) => (
                      <div key={item.portfolio_id} className="portfolio-item-card"> {/* Card style for item */}
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
                {jobPostings.length === 0 ? ( <p>No job postings.</p> ) : (
                  <div className="job-postings-list"> {/* This needs list/card styling */}
                    {jobPostings.map((job) => (
                      <div key={job.job_id} className="job-posting-item-card"> {/* Card style for item */}
                        <h5>{job.title}</h5>
                        <p>{job.description || 'No description'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfilePage;