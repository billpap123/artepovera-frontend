import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import "../styles/Global.css";
import "../styles/ArtistProfile.css"; // Create or reuse EmployerProfile.css

const ArtistProfile: React.FC = () => {
  const { userId, setUserId, artistId, setArtistId } = useUserContext();
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);

  // React Router navigation hook
  const navigate = useNavigate();

  // Use your Vite environment variable, fallback to localhost if not set
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        // Fetch the current user data to retrieve user_id and artist_id
        const response = await axios.get(`${BACKEND_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const { user_id, artist } = response.data;
        if (!userId) setUserId(user_id);
        if (artist && artist.artist_id && !artistId) {
          setArtistId(artist.artist_id);
        }
      } catch (error) {
        console.error("Error fetching user ID:", error);
        alert("Could not retrieve user information. Please log in again.");
      }
    };

    // Only fetch if we’re missing either userId or artistId
    if (!userId || !artistId) {
      fetchUserId();
    }
  }, [userId, artistId, setUserId, setArtistId, BACKEND_URL]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      setProfilePicture(file);
    } else {
      alert("Please upload a valid image file (PNG or JPG).");
    }
  };

  const handlePortfolioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      setPortfolioFile(file);
    } else {
      alert("Please upload a valid image file (PNG or JPG).");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure a profile picture is chosen
    if (!profilePicture) {
      alert("Please upload a profile picture.");
      return;
    }

    // If we have an artistId, use that; otherwise, fall back to userId
    const idToUse = artistId || userId;
    if (!idToUse) {
      alert("User ID is missing. Please log in again.");
      return;
    }

    // Build form data
    const formData = new FormData();
    formData.append("bio", bio);
    formData.append("profile_picture", profilePicture);


    try {
      await axios.post(
        `${BACKEND_URL}/api/artists/profile/${idToUse}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      alert("Artist profile updated successfully!");
      navigate("/"); // Redirect to homepage or another route
    } catch (err) {
      console.error("Error updating artist profile:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="artist-profile">
      <h2>Create your artist profile</h2>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Bio:</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Profile picture (PNG or JPG):</label>
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleProfilePictureChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Portfolio (PNG or JPG):</label>
          
        </div>

        <button type="submit">Save profile</button>
      </form>
    </div>
  );
};

export default ArtistProfile;
