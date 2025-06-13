import React, { useState, useEffect, useCallback } from "react"; // Added useEffect, useCallback
import axios from "axios";
import { useTranslation } from "react-i18next";



interface LikeButtonProps {
  // userId: number; // Logged-in user ID comes from token, not needed as prop
  likedUserId: number; // The ID of the profile being viewed/liked
}

const LikeButton: React.FC<LikeButtonProps> = ({ likedUserId }) => {
  const [isLiked, setIsLiked] = useState<boolean | null>(null); // Use null for initial loading state
  const [isLoading, setIsLoading] = useState(false); // Prevent double clicks
  const { t } = useTranslation();
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  // --- Fetch initial like status ---
  const checkInitialLike = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !likedUserId) {
      setIsLiked(false); // Can't like if not logged in or no target
      return;
    }
    try {
      // Use the backend checkLike endpoint
      const response = await axios.get(`${BACKEND_URL}/api/users/${likedUserId}/like`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsLiked(response.data.liked); // Set initial state based on response
    } catch (error) {
      console.error("Error checking initial like status:", error);
      setIsLiked(false); // Default to not liked on error
    }
  }, [likedUserId, BACKEND_URL]);

  useEffect(() => {
    checkInitialLike();
  }, [checkInitialLike]); // Run once on mount


  // --- Handle Like/Unlike Click ---
  const handleLikeToggle = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to like users.");
      setIsLoading(false);
      return;
    }

    try {
      // Call the backend toggleLike endpoint (liking the likedUserId)
      // Send empty body {} as data isn't needed, user identified by token, liked user by URL
      const response = await axios.post(`${BACKEND_URL}/api/users/${likedUserId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update state based on backend response (which should indicate the new status)
      setIsLiked(response.data.liked); // Assuming backend returns { liked: boolean }

      // Optionally show match alert based on response
      if (response.data.message?.includes("mutual")) {
         alert("It's a match! You can now chat.");
      } else if (response.data.liked === true) {
         // alert("User liked!"); // Maybe too noisy
      } else {
         // alert("Like removed."); // Maybe too noisy
      }

    } catch (error: any) {
      console.error("Error toggling like:", error);
      const message = error.response?.data?.message || error.response?.data?.error || "Failed to update like status.";
      alert(`An error occurred: ${message}`);
      // Optionally revert state on error, or re-fetch state
      // checkInitialLike(); // Re-fetch to be sure
    } finally {
      setIsLoading(false);
    }
  };

  // --- REMOVED createChat function - Backend handles this ---

  // Handle loading state for the button
  // Handle loading state for the button
  if (isLiked === null) {
    return <button disabled>{t('likeButton.status.loading')}</button>;
  }
  
  return (
    <button onClick={handleLikeToggle} disabled={isLoading}>
      {isLoading ? t('likeButton.status.toggling') : (isLiked ? t('likeButton.status.liked') : t('likeButton.status.like'))}
    </button>
  );
}

export default LikeButton;