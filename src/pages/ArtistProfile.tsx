import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // Import your Navbar
import "../styles/ArtistProfile.css";

const ArtistProfile: React.FC = () => {
  const { userId, setUserId, artistId, setArtistId } = useUserContext();

  // State for displaying & editing
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<string>(""); // existing pic
  const [isStudent, setIsStudent] = useState(false);

  // State for updating
  const [newBio, setNewBio] = useState("");
  const [newProfilePicFile, setNewProfilePicFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  // ─────────────────────────────────────────────────────────────
  // Fetch the current user’s Artist data
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchArtistProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("No token found. Please log in.");
          navigate("/login");
          return;
        }

        // Get /users/me to retrieve user + artist data
        const response = await axios.get(`${BACKEND_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { user_id, artist } = response.data;
        if (!userId) setUserId(user_id);

        // If the user is an artist, store their data
        if (artist && artist.artist_id) {
          setArtistId(artist.artist_id);
          setBio(artist.bio || "");
          setProfilePicture(artist.profile_picture || "");
          setIsStudent(!!artist.is_student);
          setNewBio(artist.bio || ""); // so the edit form is pre-filled
        } else {
          // If no artist data found, we can keep these empty
          // Or redirect if the user is actually an Employer
        }
      } catch (error) {
        console.error("Error fetching user/artist data:", error);
        alert("Could not retrieve artist profile. Please log in again.");
      } finally {
        setLoading(false);
      }
    };

    if (!userId || !artistId) {
      // If we don’t have them, attempt to fetch from /users/me
      fetchArtistProfile();
    } else {
      setLoading(false);
    }
  }, [userId, artistId, setUserId, setArtistId, BACKEND_URL, navigate]);

  // ─────────────────────────────────────────────────────────────
  // Toggle Edit Mode
  // ─────────────────────────────────────────────────────────────
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    // If we cancel editing, revert changes
    if (isEditing) {
      setNewBio(bio);
      setNewProfilePicFile(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Handle file selection
  // ─────────────────────────────────────────────────────────────
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      setNewProfilePicFile(file);
    } else {
      alert("Please upload a valid image file (PNG or JPG).");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Save changes (upload new picture, update bio)
  // ─────────────────────────────────────────────────────────────
  const handleSaveChanges = async () => {
    try {
      if (!artistId && !userId) {
        alert("No valid Artist ID or User ID. Please log in again.");
        return;
      }

      setSaving(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found. Please log in.");
        return;
      }

      // Build form data
      const formData = new FormData();
      formData.append("bio", newBio);
      if (newProfilePicFile) {
        formData.append("profile_picture", newProfilePicFile);
      }

      // Post to /api/artists/profile/:artistId
      const idToUse = artistId || userId;
      await axios.post(`${BACKEND_URL}/api/artists/profile/${idToUse}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      // Update state so UI shows new data
      setBio(newBio);
      if (newProfilePicFile) {
        // Re-fetch from /users/me to show updated pic
        const meResponse = await axios.get(`${BACKEND_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { artist } = meResponse.data;
        if (artist) {
          setProfilePicture(artist.profile_picture || "");
        }
      }

      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading artist profile...</p>;
  }

  return (
    <>
      <Navbar />
      <div className="artist-profile-container">
        <h2 className="profile-title">My artist profile</h2>

        {/* If is_student is true, show a badge */}
        {isStudent && (
          <div className="student-badge">STUDENT ARTIST</div>
        )}

        {/* Display the current profile picture */}
        <div className="profile-picture-wrapper">
          <img
            src={profilePicture || "/default-profile.png"}
            alt="Artist Profile"
            className="profile-picture"
          />
        </div>

        {!isEditing ? (
          <>
            <p className="bio-text">{bio || "No bio provided yet."}</p>
            <button className="edit-btn" onClick={handleEditToggle}>
              Edit Profile
            </button>
          </>
        ) : (
          <div className="edit-form">
            <label>Bio:</label>
            <textarea
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              rows={4}
              className="bio-input"
            />

            <label>Update Profile Picture (PNG/JPG):</label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleProfilePictureChange}
              className="file-input"
            />

            <div className="btn-row">
              <button
                className="save-btn"
                onClick={handleSaveChanges}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button className="cancel-btn" onClick={handleEditToggle}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ArtistProfile;
