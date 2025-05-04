// src/pages/EmployerProfile.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // Import your Navbar
import "../styles/EmployerProfile.css"; // Make sure this CSS file exists

const EmployerProfile: React.FC = () => {
  const { userId, setUserId, employerId, setEmployerId } = useUserContext();

  // State for displaying & editing
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null); // Use null default

  // Data for editing
  const [newBio, setNewBio] = useState("");
  const [newProfilePicFile, setNewProfilePicFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false); // <<< State for delete loading

  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  // Fetch the current user’s Employer data
  useEffect(() => {
    const fetchEmployerProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("No token found. Please log in.");
          navigate("/login"); return;
        }
        const response = await axios.get(`${BACKEND_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { user_id, employer } = response.data;
        if (!userId) setUserId(user_id);

        if (employer && employer.employer_id) {
          setEmployerId(employer.employer_id);
          setBio(employer.bio || "");
          setProfilePicture(employer.profile_picture || null); // Set null if empty/null
          setNewBio(employer.bio || "");
        }
      } catch (error) {
        console.error("Error fetching user/employer data:", error);
        alert("Could not retrieve employer profile. Please log in again.");
      } finally {
        setLoading(false);
      }
    };
     // Only fetch if needed data isn't already in context
    if (!employerId) { // Assuming employerId means profile is loaded
        fetchEmployerProfile();
    } else {
        setLoading(false);
    }
  }, [userId, employerId, setUserId, setEmployerId, BACKEND_URL, navigate]);

  // Toggle Edit Mode
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) { setNewBio(bio); setNewProfilePicFile(null); }
  };

  // Handle file selection
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      setNewProfilePicFile(file);
    } else {
      alert("Please upload a valid image file (PNG or JPG).");
      e.target.value = ""; // Clear the input if file is invalid
    }
  };

  // Save changes (upload new picture, update bio)
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      if (!token) { /* handle no token */ setSaving(false); return; }

      const formData = new FormData();
      formData.append("bio", newBio);
      if (newProfilePicFile) {
        formData.append("profile_picture", newProfilePicFile);
      }

      const url = `${BACKEND_URL}/api/employers/profile`; // Correct endpoint
      const response = await axios.post(url, formData, { headers: { Authorization: `Bearer ${token}` } });
      const updatedEmployerData = response.data?.employer;

      if (updatedEmployerData) {
         setBio(updatedEmployerData.bio || "");
         setProfilePicture(updatedEmployerData.profile_picture || null); // Use null
         setNewBio(updatedEmployerData.bio || "");
      } else {
          setBio(newBio);
          if (newProfilePicFile) { // Re-fetch if needed
             const meResponse = await axios.get(`${BACKEND_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
             setProfilePicture(meResponse.data?.employer?.profile_picture || null); // Use null
          }
      }
      setNewProfilePicFile(null);
      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error saving changes:", error);
      const message = error.response?.data?.message || "Something went wrong saving profile.";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  // --- ADD DELETE PICTURE FUNCTION ---
  const handleDeletePicture = async () => {
    if (!window.confirm("Are you sure you want to delete your profile picture?")) {
      return;
    }
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { alert("Authentication token not found."); setDeleting(false); return; }

      // IMPORTANT: Make sure this endpoint exists on your backend!
      const url = `${BACKEND_URL}/api/employers/profile/picture`;
      await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });

      // Update frontend state
      setProfilePicture(null); // Set to null to show default
      setNewProfilePicFile(null); // Clear any staged file

      alert("Profile picture deleted successfully.");
      // Optional: remain in edit mode or exit
      // setIsEditing(false);

    } catch (error: any) {
      console.error("Error deleting profile picture:", error);
      const message = error.response?.data?.message || "Failed to delete profile picture.";
      alert(message);
    } finally {
      setDeleting(false);
    }
  };
  // --- END DELETE PICTURE FUNCTION ---

  if (loading) {
    // Consider a more visual loading state (spinner, skeleton)
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading employer profile...</div>;
  }

  return (
    <>
      <Navbar />
      {/* Use a consistent class name */}
      <div className="profile-container employer-profile-container"> {/* Added base 'profile-container' */}
        <h2 className="profile-title">My Employer Profile</h2>

        <div className="profile-picture-wrapper">
          <img
            // Use ternary operator for clarity with null state
            src={profilePicture ? profilePicture : "/default-profile.png"}
            alt="Employer Profile"
            className="profile-picture"
          />
        </div>

        {!isEditing ? (
          // Display Mode
          <div className="profile-display">
            <div className="profile-section">
                <h4>Bio</h4>
                <p className="bio-text">{bio || "No bio provided yet."}</p>
            </div>
            {/* Add display for other employer fields if needed */}
            <button className="edit-btn" onClick={handleEditToggle}>
              Edit Profile
            </button>
          </div>
        ) : (
          // Editing Mode
          <div className="edit-form">
            <div className="form-field-group"> {/* Wrap fields */}
                <label htmlFor="employerBio">Bio:</label>
                <textarea
                  id="employerBio"
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  rows={4}
                  className="bio-input" // Use consistent class names if defined in CSS
                />
            </div>

            <div className="form-field-group"> {/* Wrap fields */}
                <label htmlFor="employerPic">Update Profile Picture (PNG/JPG):</label>
                <input
                  id="employerPic"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleProfilePictureChange}
                  className="file-input" // Use consistent class names if defined in CSS
                />
            </div>

            {/* --- ADD DELETE BUTTON --- */}
            {/* Only show if a picture currently exists */}
            {profilePicture && (
              <div style={{ marginTop: '15px', textAlign: 'left' }}> {/* Align left */}
                  <button
                    type="button"
                    className="delete-btn" // Needs styling in EmployerProfile.css
                    onClick={handleDeletePicture}
                    disabled={deleting || saving} // Disable if deleting or saving
                  >
                    {deleting ? "Deleting..." : "Delete Picture"}
                  </button>
              </div>
            )}
            {/* --- END ADD DELETE BUTTON --- */}

            <div className="btn-row" style={{marginTop: '25px'}}> {/* Consistent spacing */}
              <button
                className="save-btn" // Needs styling
                onClick={handleSaveChanges}
                disabled={saving || deleting} // Disable if saving or deleting
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                className="cancel-btn" // Needs styling
                onClick={handleEditToggle}
                disabled={saving || deleting} // Disable if busy
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

export default EmployerProfile;
