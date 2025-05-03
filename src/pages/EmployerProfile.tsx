import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"; // Import your Navbar
import "../styles/EmployerProfile.css";

const EmployerProfile: React.FC = () => {
  const { userId, setUserId, employerId, setEmployerId } = useUserContext();

  // Existing data for display
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<string>("");

  // Data for editing
  const [newBio, setNewBio] = useState("");
  const [newProfilePicFile, setNewProfilePicFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

  // ─────────────────────────────────────────────────────────────
  // Fetch the current user’s Employer data
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEmployerProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("No token found. Please log in.");
          navigate("/login");
          return;
        }

        // Get /users/me to retrieve user + employer data
        const response = await axios.get(`${BACKEND_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { user_id, employer } = response.data;
        if (!userId) setUserId(user_id);

        // If the user is an employer, store their data
        if (employer && employer.employer_id) {
          setEmployerId(employer.employer_id);
          setBio(employer.bio || "");
          setProfilePicture(employer.profile_picture || "");
          setNewBio(employer.bio || "");
        } else {
          // If no employer data found, optionally redirect if user is actually an Artist
        }
      } catch (error) {
        console.error("Error fetching user/employer data:", error);
        alert("Could not retrieve employer profile. Please log in again.");
      } finally {
        setLoading(false);
      }
    };

    // If we don’t have them, attempt to fetch from /users/me
    if (!userId || !employerId) {
      fetchEmployerProfile();
    } else {
      setLoading(false);
    }
  }, [userId, employerId, setUserId, setEmployerId, BACKEND_URL, navigate]);

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
      // Keep check for token
      setSaving(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found. Please log in.");
        setSaving(false);
        return;
      }

      // Build form data
      const formData = new FormData();
      formData.append("bio", newBio); // Send current bio text
      if (newProfilePicFile) {
        // Use 'profile_picture' field name matching backend middleware
        formData.append("profile_picture", newProfilePicFile);
      }

      // --- CORRECTED URL ---
      // Post to /api/employers/profile (No ID needed in URL path)
      const url = `${BACKEND_URL}/api/employers/profile`;
      // --- END CORRECTION ---

      const response = await axios.post(url, formData, {
        headers: {
          // 'Content-Type': 'multipart/form-data', // Axios sets this for FormData
          Authorization: `Bearer ${token}`,
        },
      });

      // Update state with data returned from backend (preferred)
      const updatedEmployerData = response.data?.employer; // Assuming backend returns updated data

      if (updatedEmployerData) {
         setBio(updatedEmployerData.bio || "");
         setProfilePicture(updatedEmployerData.profile_picture || ""); // Use the new Cloudinary URL
         setNewBio(updatedEmployerData.bio || ""); // Reset edit form field
      } else {
          // Fallback if backend doesn't return data
          setBio(newBio);
          // Need to re-fetch if pic changed and backend didn't return it
          if (newProfilePicFile) {
              // Re-fetching '/users/me' is a safe way
              const meResponse = await axios.get(`${BACKEND_URL}/api/users/me`, {
                  headers: { Authorization: `Bearer ${token}` },
              });
              setProfilePicture(meResponse.data?.employer?.profile_picture || "");
          }
      }

      setNewProfilePicFile(null); // Clear selected file
      alert("Profile updated successfully!");
      setIsEditing(false); // Exit editing mode

    } catch (error: any) { // Added type
      console.error("Error saving changes:", error);
      const message = error.response?.data?.message || "Something went wrong. Please try again.";
      alert(message);
    } finally {
      setSaving(false); // Ensure saving state is always reset
    }
  };

  if (loading) {
    return <p>Loading employer profile...</p>;
  }

  return (
    <>
      <Navbar />
      <div className="employer-profile-container">
        <h2 className="profile-title">My employer profile</h2>

        {/* Display the current profile picture */}
        <div className="profile-picture-wrapper">
          <img
            src={profilePicture || "/default-profile.png"}
            alt="Employer Profile"
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

export default EmployerProfile;
