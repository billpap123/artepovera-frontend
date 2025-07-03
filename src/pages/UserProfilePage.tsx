// src/pages/UserProfilePage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import RatingForm, { Review as RatingFormReview } from '../components/RatingForm'; // Import the specific Review type from RatingForm
import '../styles/UserProfilePage.css';
import {
  FaFilePdf, FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart, FaCommentDots,
  FaMapMarkerAlt, FaGlobe, FaTimes, FaBuilding
} from 'react-icons/fa'; // Make sure FaHeart is imported
import { useTranslation } from "react-i18next";
import ReactMarkdown from 'react-markdown';

import remarkGfm from 'remark-gfm';




const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// --- Interfaces ---

interface LoggedInUser {
  user_id: number;
  user_type: string;
  fullname: string;
  profile_picture?: string | null; // <-- ADD THIS
}

interface Reviewer {
  user_id: number;
  fullname: string;
  user_type?: string;
  // This matches the nested structure from your backend response
  artistProfile?: { profile_picture: string | null; };
  employerProfile?: { profile_picture: string | null; };
  profile_picture?: string | null; // Adding this for simplicity if backend sends it directly
}

interface ReviewData {
  review_id: number;
  overall_rating: number | null; // Can be null for "no deal" reviews
  specific_answers?: {
    dealMade?: 'yes' | 'no';
    noDealPrimaryReason?: string;
    communicationRating_noDeal?: number;
    comment?: string;
    // You can also add the "yes" path questions if you need them
    professionalism?: number;
    quality?: number;
    communication?: number;
  };
  created_at: string;
  reviewer?: Reviewer;
}

interface ArtistComment {
  comment_id: number;
  comment_text: string;
  created_at: string;
  support_rating: number; // <-- ADD THIS
  commenter?: Reviewer;
}


interface JobPosting {
  job_id: number;
  title: string;
  description?: string | null;
  category: string;
  location?: string | null;
  presence: 'Physical' | 'Online' | 'Both';
  payment_total: number;
  createdAt: string;
}
interface PortfolioItem {
  createdAt: string; portfolio_id: number; image_url?: string; description?: string;
}
// --- THIS IS THE UPDATED JobPosting INTERFACE ---


interface ArtistProfileData { artist_id: number; bio?: string; profile_picture?: string; is_student?: boolean; cv_url?: string | null; cv_public_id?: string | null; }
interface EmployerProfileData { employer_id: number; bio?: string; profile_picture?: string; }

interface UserProfile {
  user_id: number;
  fullname: string;
  user_type: string;
  artistProfile?: ArtistProfileData | null;
  employerProfile?: EmployerProfileData | null;
  city?: string;
}


interface CommenterDetails { user_id: number; fullname: string; profile_picture: string | null; user_type?: string; }


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
const DisplayHearts = ({ rating }: { rating: number | null }) => {
  if (rating === null || rating <= 0) return null;
  return (
    <div className="heart-display" title={`${rating.toFixed(1)} out of 5`}>
      {[...Array(Math.round(rating))].map((_, i) => <FaHeart key={`filled-${i}`} className="heart-icon filled" />)}
      {[...Array(5 - Math.round(rating))].map((_, i) => <FaHeart key={`empty-${i}`} className="heart-icon empty" />)}
    </div>
  );
};
const HeartRatingInput = ({ rating, setRating }: { rating: number, setRating: (r: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="heart-rating-input">
      {[1, 2, 3, 4, 5].map((value) => (
        <span
          key={value}
          // --- MODIFY THIS LINE ---
          onClick={() => {
            console.log('Heart clicked! Value:', value); // Add this log
            setRating(value);
          }}
          onMouseEnter={() => setHover(value)}
          onMouseLeave={() => setHover(0)}
        >
          <FaHeart size={28} className={`heart-icon-input ${value <= (hover || rating) ? 'active' : ''}`} />
        </span>
      ))}
    </div>
  );
};


const DisplayStars = ({ rating }: { rating: number | null }) => {
  if (rating === null || typeof rating !== 'number' || rating <= 0) {
    return null; // Return null instead of text to allow for more flexible display
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
  const { t, i18n } = useTranslation();
  const { userId: userIdFromParams } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [supportRating, setSupportRating] = useState(0);

  console.log('Current supportRating state is:', supportRating); // <-- ADD THIS LOG

  // --- State Declarations ---
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [liked, setLiked] = useState<boolean>(false);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ratingFormRef = useRef<HTMLDivElement>(null);

  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const average = (nums: number[]) =>
    nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : null;

  // --- NEW memos ---
  const projectReviews = React.useMemo(
    () => reviews.filter(r => r.specific_answers?.dealMade !== 'no' && typeof r.overall_rating === 'number'),
    [reviews]
  );

  const interactionReviews = React.useMemo(
    () => reviews.filter(r => r.specific_answers?.dealMade === 'no'
      && typeof r.specific_answers?.communicationRating_noDeal === 'number'),
    [reviews]
  );

  const avgProject = React.useMemo(
    () => average(projectReviews.map(r => r.overall_rating!)),
    [projectReviews]
  );

  const avgInteraction = React.useMemo(
    () => average(interactionReviews.map(r => r.specific_answers!.communicationRating_noDeal!)),
    [interactionReviews]
  );

  // απλός (όχι ζυγισμένος) grand-avg
  const grandAverage = React.useMemo(() => {
    const arr = [avgProject, avgInteraction].filter(n => n !== null) as number[];
    return average(arr);
  }, [avgProject, avgInteraction]);
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
  // --- ADD NEW STATE FOR THE FORM AND AVERAGE RATING ---
  const [avgSupportRating, setAvgSupportRating] = useState<number | null>(null);
  const [viewpointCount, setViewpointCount] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const formatDate = useCallback((dateString: string | undefined | null): string => {
    if (!dateString) { return 'Date unknown'; }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) { return 'Invalid Date'; }
      // The i18n.language is passed as the first argument to format the date correctly.
      return date.toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { console.error("Error parsing date:", dateString, e); return 'Invalid Date'; }
  }, [i18n.language]); // This function will only update when the language changes.


  // --- END ADD ---
  // --- Handlers for Rating Form (General Reviews) ---
  const handleOpenRatingForm = () => {
    if (!loggedInUser) { alert("Please log in to leave a review."); navigate(`/login?redirect=/user-profile/${userIdFromParams}`); return; }
    if (userProfile && loggedInUser.user_id === userProfile.user_id) { return; }
    setIsRatingFormOpen(true);
  };
  const handleCloseRatingForm = (submittedSuccessfully: boolean, newReviewFromForm?: RatingFormReview) => {
    setIsRatingFormOpen(false);

    if (submittedSuccessfully && newReviewFromForm && loggedInUser) {

      const newReviewForState: ReviewData = {
        ...newReviewFromForm,

        // --- THIS IS THE FIX ---
        // If newReviewFromForm.created_at is missing (undefined),
        // we use the current time as a fallback.
        // .toISOString() creates a string that our formatDate function can read.
        created_at: newReviewFromForm.created_at || new Date().toISOString(),

        // Manually build the nested 'reviewer' object
        reviewer: {
          user_id: loggedInUser.user_id,
          fullname: loggedInUser.fullname,
          user_type: loggedInUser.user_type,
          profile_picture: loggedInUser.profile_picture,
        }
      };

      setReviews(prevReviews => [newReviewForState, ...prevReviews]);

      setReviewCount(prevCount => prevCount + 1);
      setAlreadyReviewed(true);
      alert("Thank you! Your review has been posted.");
    }
  };
  const openGallery = (index: number) => {
    setCurrentImageIndex(index);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
  };

  const showNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % portfolio.length);
  };

  const showPrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + portfolio.length) % portfolio.length);
  };


  // --- Handlers for Artist Support ---
  const handleSupportArtist = async () => {
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
      return;
    }
    // Validation now correctly checks the rating state and comment text
    if (!newComment.trim() || supportRating === 0) {
      alert("Please provide a rating and a comment for your viewpoint.");
      return;
    }
    if (!loggedInUser || loggedInUser.user_type !== 'Artist' || userProfile.user_type !== 'Artist' || loggedInUser.user_id === userProfile.user_id) {
      alert("Only artists can comment on other artists' profiles.");
      return;
    }

    setIsSubmittingComment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/users/${userProfile.user_id}/comments`,
        {
          comment_text: newComment.trim(),
          support_rating: supportRating // Send the rating
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // --- THIS IS THE FIX ---
      // The backend now returns the complete, perfect comment object with all details.
      // We can use it directly. No more manual object creation is needed!
      const newCommentData = response.data.comment;

      // Add the object from the server directly to our state
      setProfileComments(prevComments => [newCommentData, ...prevComments]);

      // Also update the count locally for an instant UI change
      setViewpointCount(prev => prev + 1);

      // Reset the form
      setNewComment("");
      setSupportRating(0);
      setHasCommented(true);

    } catch (err: any) {
      if (err.response?.status === 409) { setHasCommented(true); }
      alert(err.response?.data?.message || "Failed to submit viewpoint.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getImageUrl = (path?: string | null): string => {
    if (!path) return '/default-profile.png';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}/${path.replace(/^uploads\/uploads\//, 'uploads/')}`;
  };
  const safeLikeOnce = (() => {
    let inFlight = false;
    return async (fn: () => Promise<void>) => {
      if (inFlight) return;          // drop double-clicks
      inFlight = true;
      try { await fn(); }
      finally { inFlight = false; }  // always reset
    };
  })();

  const fetchLikeStatus = useCallback(async (profileUserId: string, token: string | null) => {
    if (!token || !loggedInUser) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${profileUserId}/like`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLiked(response.data.liked);
    } catch (err) { console.error('Error fetching like status:', err); }
  }, [API_BASE_URL, loggedInUser]); // Dependency on loggedInUser

  const handleLike = () =>
    safeLikeOnce(async () => {
      if (!userIdFromParams || !loggedInUser) {
        alert("You must be logged in to like someone.");
        return;
      }

      // ▶▶ optimistic UI
      if (liked) return;               // already liked, nothing to do
      setLiked(true);                  // flip heart immediately

      const token = localStorage.getItem('token');
      try {
        await axios.post(
          `${API_BASE_URL}/api/users/${userIdFromParams}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // ✅ success – nothing else, UI already updated
      } catch (err: any) {
        console.error('Error liking user:', err);
        setLiked(false);               // ⏪ revert
        alert(err.response?.data?.message || 'Failed to like user.');
      }
    });
  const handleCvDownload = async (url: string | null, artistName: string) => {
    if (!url) {
      alert('No CV available to download.');
      return;
    }
    try {
      // Fetch the file as a blob from the provided URL
      const response = await axios.get(url, {
        responseType: 'blob',
      });

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([response.data]));

      // Create a user-friendly filename and force download as .pdf
      const filename = `CV_${artistName.replace(/\s+/g, '_') || 'Artist'}.pdf`;
      link.setAttribute('download', filename);

      // Append to the document, trigger the click, and then remove it
      document.body.appendChild(link);
      link.click();

      // Clean up by removing the link and revoking the object URL
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("CV Download Error:", error);
      alert("Could not download the CV. Please try again later.");
    }
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
            fullname: parsedUser.fullname,
            profile_picture: parsedUser.profile_picture || null // <-- ADD THIS
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGalleryOpen) return;
      if (e.key === 'Escape') {
        closeGallery();
      } else if (e.key === 'ArrowRight') {
        showNextImage();
      } else if (e.key === 'ArrowLeft') {
        showPrevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGalleryOpen, showNextImage, showPrevImage]); // Dependencies ensure functions are up-to-date


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
        const avgSupportPromise = axios.get(`${API_BASE_URL}/api/users/${userIdFromParams}/average-support`, { headers }); // <-- THIS LINE WAS MISSING

        const [profileResponse, ratingResponse, reviewsResponse, commentsResponse] = await Promise.all([
          profilePromise, ratingPromise, reviewsPromise, commentsPromise

        ]);
        const [
          profileRes,
          ratingRes,
          reviewsRes,
          commentsRes,
          avgSupportRes // <-- And get its result here
        ] = await Promise.all([
          profilePromise, ratingPromise, reviewsPromise, commentsPromise, avgSupportPromise
        ]);
        if (!isMounted) return;

        const fetchedUserProfile = profileResponse.data;
        setUserProfile(fetchedUserProfile);
        setAverageRating(ratingResponse.data.averageRating);
        setReviewCount(ratingResponse.data.reviewCount);
        setReviews(reviewsResponse.data.reviews || []);
        setProfileComments(commentsResponse.data.comments || []);

        // And finally, set the state with the new data
        setAvgSupportRating(avgSupportRes.data.averageRating);
        setViewpointCount(avgSupportRes.data.viewpointCount);

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
                .then(res => { if (isMounted) { setHasSupported(res.data.hasSupported); setSupportCount(res.data.supportCount); } })
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
          setIsLoadingComments(false);
          // Also reset these to avoid them getting stuck in a true state on error
          setIsLoadingReviewStatus(false);
          setIsLoadingSupportStatus(false);
          setIsLoadingCommentStatus(false);
        }
      }
    };

    fetchAllData();
    return () => { isMounted = false; };
  }, [userIdFromParams, API_BASE_URL, loggedInUser, fetchLikeStatus]); // Keep fetchLikeStatus in deps if it's memoized with useCallback
  useEffect(() => {
    // Check if the form was just opened and if the ref is attached to the element
    if (isRatingFormOpen && ratingFormRef.current) {
      // Scroll the element into the middle of the view with a smooth animation
      ratingFormRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isRatingFormOpen]); // This effect runs whenever isRatingFormOpen changes


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
  const completedReviews = projectReviews; // --- NEW helper ---

  return (
    <>
      <Navbar />
      <div className="user-profile-page">
        <div className="profile-card">
          <div className="profile-header-public">
            <img className="user-profile-img" src={getImageUrl(profilePic)} alt={profile.fullname} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-profile.png'; }} />
            <div className="profile-summary-public">
              <h3 className="user-fullname">{profile.fullname}</h3>
              <p className="user-type-public">
                {isStudent
                  ? <span className="student-badge-public">{t('userTypes.StudentArtist')}</span>
                  : t(`userTypes.${profile.user_type}`)
                }
              </p>
              <div className="overall-rating-display">
                {grandAverage !== null ? (
                  <>
                    <DisplayStars rating={grandAverage} />
                    <span className="rating-value">{grandAverage.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="no-rating">–</span>
                )}
              </div>





              <div className="profile-actions">
                {canLoggedInUserInteract && (
                  <button
                    onClick={handleLike}
                    disabled={liked}
                    className={`like-button ${liked ? 'liked' : ''}`}
                  >
                    {liked ? <FaHeart /> : <FaRegHeart />} {liked ? t('userProfilePage.actions.liked') : t('userProfilePage.actions.like')}
                  </button>
                )}

                {canLoggedInUserInteract && !(loggedInUser?.user_type === profile.user_type) && (
                  <button
                    onClick={handleOpenRatingForm}
                    disabled={alreadyReviewed || isLoadingReviewStatus}
                    className={`rate-user-button ${alreadyReviewed ? 'reviewed' : ''}`}
                  >
                    {isLoadingReviewStatus
                      ? "..."
                      : alreadyReviewed
                        ? t('userProfilePage.actions.reviewed')
                        : t('userProfilePage.actions.rateUser')}
                  </button>
                )}


                {!loggedInUser && !isOwnProfile && (
                  <button
                    className="interaction-button"
                    onClick={() => navigate(`/login?redirect=/user-profile/${userIdFromParams}`)}
                  >
                    {t('userProfilePage.actions.loginToInteract')}
                  </button>
                )}

                {canLoggedInArtistInteractWithArtistProfile && (
                  <button
                    onClick={handleSupportArtist}
                    disabled={isTogglingSupport || isLoadingSupportStatus || hasSupported}
                    className={`support-button ${hasSupported ? 'supported' : ''}`}
                  >
                    {isLoadingSupportStatus ? "..." : isTogglingSupport ? "..." : hasSupported ? <FaHeart color="deeppink" /> : <FaRegHeart />}
                    {hasSupported ? t('userProfilePage.actions.supported') : t('userProfilePage.actions.supportArtist')}
                    {!isLoadingSupportStatus && <span className="support-count">({supportCount})</span>}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="profile-content-public">
            <div className="profile-section-public"><h4>{t('userProfilePage.content.bio')}</h4>                <div className="bio-text markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                // --- THIS IS THE FIX ---
                // We are telling ReactMarkdown how to render all link (<a>) elements.
                components={{
                  a: (props) => (
                    <a
                      {...props} // This keeps all original properties like 'href'
                      target="_blank" // This tells the browser to open the link in a new tab
                      rel="noopener noreferrer" // Important for security and performance
                    >
                      {props.children}
                    </a>
                  )
                }}
              // --- END OF FIX ---
              >
                {bio || t('artistProfile.noBio')}
              </ReactMarkdown>

            </div>
            </div>

            {isArtistProfile && cvUrl && (
              <div className="profile-section-public cv-section">
                <h4>{t('userProfilePage.content.cv')}</h4>
                <div className="cv-display">
                  <button onClick={() => handleCvDownload(cvUrl, profile.fullname)} className="cv-link">
                    {t('userProfilePage.content.downloadCv')}
                  </button>
                </div>
              </div>
            )}



            {isArtistProfile ? (
              <div className="portfolio-section profile-section-public">
                <h4>{t('userProfilePage.artistContent.portfolio')}</h4>
                {loading && portfolio.length === 0 ? <p>{t('userProfilePage.artistContent.loadingPortfolio')}</p> :
                  portfolio.length === 0 ? (<p>{t('userProfilePage.artistContent.noPortfolio')}</p>) : (
                    <div className="portfolio-items">

                      {portfolio.map((item, index) => {
                        const formattedDate = formatDate(item.createdAt);
                        return (
                          <div key={item.portfolio_id} className="portfolio-item-card">
                            {item.image_url && (
                              <img
                                className="portfolio-image"
                                src={getImageUrl(item.image_url)}
                                alt={t('userProfilePage.gallery.altText')}
                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-portfolio.png'; }}
                                onClick={() => openGallery(index)}
                              />
                            )}
                            <div className="portfolio-item-content">
                              <p className="portfolio-description">{item.description || t('userProfilePage.artistContent.noDescription')}</p>
                              {formattedDate && (
                                <div className="portfolio-item-footer">
                                  <span className="posted-date">

                                    {formattedDate}
                                  </span>                                  </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
              </div>
            ) : (
              <div className="job-postings-section profile-section-public">
                <h4>{t('userProfilePage.employerContent.activeJobs')}</h4>
                {loading && jobPostings.length === 0 ? (
                  <p>{t('userProfilePage.employerContent.loadingJobs')}</p>
                ) : jobPostings.length === 0 ? (
                  <p>{t('userProfilePage.employerContent.noJobs')}</p>
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
                          {job.presence === 'Online' && <span className="tag-item compact"><FaGlobe /> {t('userProfilePage.employerContent.online')}</span>}
                          {job.presence === 'Physical' && <span className="tag-item compact"><FaBuilding /> {t('userProfilePage.employerContent.onSite')}</span>}
                          {job.presence === 'Both' && <span className="tag-item compact"><FaGlobe /> / <FaBuilding /> {t('userProfilePage.employerContent.hybrid')}</span>}
                        </div>
                        <div className="profile-job-item-footer">
                          <span className="post-date">{t('userProfilePage.employerContent.posted')} {formatDate(job.createdAt)}</span>
                          <Link to={`/jobs/${job.job_id}`} className="view-job-link">{t('userProfilePage.actions.viewDetails')}</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="reviews-section profile-section-public">

              <div className="section-header">
                <h4>{t('userProfilePage.content.projectReviews', { count: completedReviews.length })}</h4>
                {averageRating !== null && reviewCount > 0 && (
                  <div className="average-rating">
                    <DisplayStars rating={averageRating} />
                    <span>{averageRating.toFixed(1)} {t('userProfilePage.content.avgRating')}</span>
                  </div>
                )}
              </div>

              {reviewsLoading ? (
                <p>{t('userProfilePage.content.loadingReviews')}</p>
              ) : completedReviews.length > 0 ? (
                <div className="reviews-list">
                  {completedReviews.map((review) => {
                    const reviewerProfilePic = review.reviewer?.profile_picture || null;
                    return (
                      <div key={review.review_id} className="review-item">
                        <div className="review-header">
                          <img
                            src={getImageUrl(reviewerProfilePic)}
                            alt={review.reviewer?.fullname || t('userProfilePage.content.anonymous')}
                            className="reviewer-pic"
                          />
                          <div className="reviewer-info">
                            <strong>{review.reviewer?.fullname || t('userProfilePage.content.anonymous')}</strong>
                            <span className="review-date">{formatDate(review.created_at)}</span>
                          </div>
                          <div className="review-stars"><DisplayStars rating={review.overall_rating} /></div>
                        </div>
                        {review.specific_answers?.comment && <p className="review-comment">"{review.specific_answers.comment}"</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-reviews">{t('userProfilePage.content.noProjectReviews')}</p>
              )}
            </div>

            {interactionReviews.length > 0 && (
  <div className="interaction-feedback-section profile-section-public">
    {/* ---------- section-header με τον μέσο όρο ---------- */}
    <div className="section-header">
      <h4>
        {t('userProfilePage.content.interactionFeedback', {
          count: interactionReviews.length
        })}
      </h4>

      {/* Αν υπάρχει τουλάχιστον 1 review με score επικοινωνίας */}
      {avgInteraction !== null && (
        <div className="average-interaction-rating">
          <DisplayStars rating={avgInteraction} />
          <span className="rating-value">{avgInteraction.toFixed(1)}</span>
        </div>
      )}
    </div>
    {/* ---------------------------------------------------- */}

    {reviewsLoading ? (
      <p>{t('userProfilePage.content.loadingFeedback')}</p>
    ) : interactionReviews.length > 0 ? (
      <div className="reviews-list">
        {interactionReviews.map((review) => {
          const {
            noDealPrimaryReason: primaryReason,
            comment,
            communicationRating_noDeal: communicationRating
          } = review.specific_answers ?? {};

          return (
            <div key={review.review_id} className="review-item interaction-review-item">
              <div className="review-header">
                <img
                  src={getImageUrl(review.reviewer?.profile_picture)}
                  alt={review.reviewer?.fullname || t('userProfilePage.content.anonymous')}
                  className="reviewer-pic"
                />
                <div className="reviewer-info">
                  <strong>{review.reviewer?.fullname || t('userProfilePage.content.anonymous')}</strong>
                  <span className="review-date">{formatDate(review.created_at)}</span>
                </div>
                <span className="interaction-tag">
                  {t('userProfilePage.content.noDealTag')}
                </span>
              </div>

              <div className="review-comment">
                {communicationRating && (
                  <div className="interaction-rating">
                    <strong>
                      {t('userProfilePage.content.communicationRating', 'Communication Quality')}:
                    </strong>
                    <DisplayStars rating={communicationRating} />
                  </div>
                )}

                {primaryReason && (
                  <p className="interaction-reason">
                    <strong>{t('userProfilePage.content.reason')}</strong> {primaryReason}
                  </p>
                )}

                {comment && (
                  <p>
                    <strong>{t('userProfilePage.content.comment')}</strong> “{comment}”
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <p className="no-reviews">
        {t('userProfilePage.content.noInteractionFeedback')}
      </p>
    )}
  </div>
)}

            {isArtistProfile && (
              <div className="artist-comments-section profile-section-public">
                <div className="section-header">
                  <h4>{t('userProfilePage.content.artisticViewpoints')} <FaCommentDots /> ({viewpointCount})</h4>
                  {avgSupportRating !== null && (
                    <div className="average-support-rating">
                      <DisplayHearts rating={avgSupportRating} />
                      <span>{avgSupportRating.toFixed(1)} {t('userProfilePage.content.avgSupport')}</span>
                    </div>
                  )}
                </div>

                {canLoggedInArtistInteractWithArtistProfile && (
                  <>
                    {isLoadingCommentStatus ? (
                      <div className="comment-form-placeholder">
                        <p>{t('userProfilePage.status.loading')}</p>
                      </div>
                    ) : hasCommented ? (
                      <div className="comment-form-placeholder">
                        <p>{t('userProfilePage.content.alreadyCommented')}</p>
                      </div>
                    ) : (
                      <form onSubmit={handleCommentSubmit} className="comment-form">
                        <div className="form-group">
                          <label>{t('userProfilePage.content.commentFormLabel')}</label>
                          <HeartRatingInput rating={supportRating} setRating={setSupportRating} />
                        </div>
                        <textarea
                          placeholder={t('userProfilePage.content.commentFormPlaceholder', { name: profile.fullname })}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                          disabled={isSubmittingComment}
                        />
                        <button type="submit" disabled={isSubmittingComment || !newComment.trim() || supportRating === 0}>
                          {isSubmittingComment ? t('userProfilePage.content.posting') : t('userProfilePage.content.postViewpoint')}
                        </button>
                      </form>
                    )}
                  </>
                )}

                {isLoadingComments ? (<p>{t('userProfilePage.content.loadingViewpoints')}</p>) :
                  profileComments.length > 0 ? (
                    <div className="comments-list">
                      {profileComments.map(comment => (
                        <div key={comment.comment_id} className="comment-item artist-comment-item">
                          <div className="comment-header">
                            <img src={getImageUrl(comment.commenter?.profile_picture)} alt={comment.commenter?.fullname || t('userProfilePage.content.anonymous')} className="commenter-pic" />
                            <div className="commenter-info">
                              <strong>{comment.commenter?.fullname || t('userProfilePage.content.anonymous')}</strong>
                              <span className="comment-date">{formatDate(comment.created_at)}</span>
                            </div>
                            <div className="comment-rating">
                              <DisplayHearts rating={comment.support_rating} />
                            </div>
                          </div>
                          <p className="comment-text">"{comment.comment_text}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (<p>{t('userProfilePage.content.noViewpoints', { name: profile.fullname })}</p>)}
              </div>
            )}

          </div>

          {isGalleryOpen && portfolio.length > 0 && (
            <div className="gallery-overlay" onClick={closeGallery}>
              <button className="gallery-close-btn" onClick={closeGallery} aria-label={t('userProfilePage.gallery.close')}>
                <FaTimes size={30} />
              </button>
              <button
                className="gallery-nav-btn prev"
                onClick={(e) => { e.stopPropagation(); showPrevImage(); }}
                aria-label={t('userProfilePage.gallery.prev')}
              >
                <FaChevronLeft size={40} />
              </button>
              <div className="gallery-content" onClick={(e) => e.stopPropagation()}>
                <img
                  src={getImageUrl(portfolio[currentImageIndex].image_url!)}
                  alt={portfolio[currentImageIndex].description || t('userProfilePage.gallery.altText')}
                />
                <div className="gallery-info">
                  <p className="gallery-description">{portfolio[currentImageIndex].description}</p>
                  <p className="gallery-counter">{currentImageIndex + 1} / {portfolio.length}</p>
                </div>
              </div>
              <button
                className="gallery-nav-btn next"
                onClick={(e) => { e.stopPropagation(); showNextImage(); }}
                aria-label={t('userProfilePage.gallery.next')}
              >
                <FaChevronRight size={40} />
              </button>
            </div>
          )}

          {isRatingFormOpen && loggedInUser && profile && (
            <div ref={ratingFormRef} className="rating-form-modal-overlay">
              <RatingForm
                reviewerId={loggedInUser.user_id}
                reviewedUserId={profile.user_id}
                reviewedUserName={profile.fullname}
                onClose={handleCloseRatingForm}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );


};

export default UserProfilePage;