// src/pages/ArtistProfile.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/ArtistProfile.css"; // Assuming you add .delete-btn styles here

const ArtistProfile: React.FC = () => {
  const { userId, setUserId, artistId, setArtistId } = useUserContext();

  // State for displaying & editing
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null); // Use null for clarity
  const [isStudent, setIsStudent] = useState(false);

  // State for updating
  const [newBio, setNewBio] = useState("");
  const [newProfilePicFile, setNewProfilePicFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false); // <<< State for delete button loading

  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  // Fetch data useEffect... (keep as is, ensure it sets profilePicture correctly)
  useEffect(() => {
    const fetchArtistProfile = async () => {
      setLoading(true); // Ensure loading is true at start
      try {
        const token = localStorage.getItem("token");
        if (!token) { /* ... handle no token ... */ return; }
        const response = await axios.get(`${BACKEND_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { user_id, artist } = response.data;
        if (!userId) setUserId(user_id);
        if (artist && artist.artist_id) {
          setArtistId(artist.artist_id);
          setBio(artist.bio || "");
          setProfilePicture(artist.profile_picture || null); // Set null if empty/null from backend
          setIsStudent(!!artist.is_student);
          setNewBio(artist.bio || "");
        } else {
          // Handle non-artist user if necessary
        }
      } catch (error) { /* ... handle error ... */ }
      finally { setLoading(false); }
    };
    // Only fetch if needed data isn't already in context
    if (!artistId) { // Assuming artistId implies profile is loaded
        fetchArtistProfile();
    } else {
        setLoading(false);
    }
  }, [userId, artistId, setUserId, setArtistId, BACKEND_URL, navigate]);


  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) { setNewBio(bio); setNewProfilePicFile(null); }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (keep as is)
    const file = e.target.files ? e.target.files[0] : null;
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      setNewProfilePicFile(file);
    } else {
      alert("Please upload a valid image file (PNG or JPG).");
    }
  };

  const handleSaveChanges = async () => {
    // ... (keep your existing save logic as is - it seems correct now)
    // It should call POST /api/artists/profile
    try {
        setSaving(true);
        const token = localStorage.getItem("token");
        if (!token) { /* ... handle no token ... */ setSaving(false); return; }
        const formData = new FormData();
        formData.append("bio", newBio);
        if (newProfilePicFile) {
            formData.append("profile_picture", newProfilePicFile);
        }
        const url = `${BACKEND_URL}/api/artists/profile`;
        const response = await axios.post(url, formData, { headers: { Authorization: `Bearer ${token}` } });
        const updatedArtistData = response.data?.artist;
        if (updatedArtistData) {
            setBio(updatedArtistData.bio || "");
            setProfilePicture(updatedArtistData.profile_picture || null); // Use updated URL/null
            setNewBio(updatedArtistData.bio || "");
        } else {
            setBio(newBio); // Fallback
            if (newProfilePicFile) { // Re-fetch if needed and no data returned
               const meResponse = await axios.get(`${BACKEND_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
               setProfilePicture(meResponse.data?.artist?.profile_picture || null);
            }
        }
        setNewProfilePicFile(null);
        alert("Profile updated successfully!");
        setIsEditing(false);
    } catch (error: any) { /* ... handle error ... */ }
    finally { setSaving(false); }
  };

  // --- ADD THIS FUNCTION ---
  const handleDeletePicture = async () => {
    // Confirm action
    if (!window.confirm("Are you sure you want to delete your profile picture?")) {
      return;
    }

    setDeleting(true); // Set loading state for delete button
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication token not found.");
        setDeleting(false);
        return;
      }

      // Send request to the new backend endpoint
      const url = `${BACKEND_URL}/api/artists/profile/picture`; // Matches example backend route
      await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update frontend state immediately
      setProfilePicture(null); // Set to null to show default
      setNewProfilePicFile(null); // Clear any staged file

      alert("Profile picture deleted successfully.");
      // Stay in editing mode or exit? Let's stay for now.
      // setIsEditing(false);

    } catch (error: any) {
      console.error("Error deleting profile picture:", error);
      const message = error.response?.data?.message || "Failed to delete profile picture.";
      alert(message);
    } finally {
      setDeleting(false); // Reset loading state
    }
  };
  // --- END ADDED FUNCTION ---


  if (loading) {
    return <p>Loading artist profile...</p>;
  }

  return (
    <>
      <Navbar />
      <div className="artist-profile-container">
        <h2 className="profile-title">My artist profile</h2>

        {isStudent && (<div className="student-badge">STUDENT ARTIST</div>)}

        <div className="profile-picture-wrapper">
          <img
            // Use null check here
            src={profilePicture ? profilePicture : "/default-profile.png"}
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

            {/* --- ADD DELETE BUTTON --- */}
            {/* Only show delete button if there IS a current picture */}
            {profilePicture && (
              <button
                type="button" // Important: prevent form submission
                className="delete-btn" // Add CSS for this class
                onClick={handleDeletePicture}
                disabled={deleting} // Disable while deleting
                style={{marginTop: '10px', alignSelf: 'flex-start'}} // Basic positioning
              >
                {deleting ? "Deleting..." : "Delete Picture"}
              </button>
            )}
            {/* --- END ADD DELETE BUTTON --- */}


            <div className="btn-row" style={{marginTop: '20px'}}> {/* Added margin top */}
              <button
                className="save-btn"
                onClick={handleSaveChanges}
                disabled={saving || deleting} // Disable save if deleting
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                className="cancel-btn"
                onClick={handleEditToggle}
                disabled={saving || deleting} // Disable cancel if busy
              >
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

// Remember to add styles for .delete-btn in ArtistProfile.css
/* Example CSS in ArtistProfile.css */
/*
.delete-btn {
  background-color: #dc3545; / Red color /
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s ease;
}

.delete-btn:hover {
  background-color: #c82333; / Darker red /
}

.delete-btn:disabled {
  background-color: #e08a93;
  cursor: not-allowed;
}
*/