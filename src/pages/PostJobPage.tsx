// src/pages/PostJobPage.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// Artist categories based on your ENUM
const artistCategories = [
  "dancer", "painter", "digital_artist", "graphic_designer", "musician",
  "sculptor", "photographer", "actress", "actor", "comedian", "poet",
  "writer", "illustrator", "calligrapher", "filmmaker", "animator",
  "fashion_designer", "architect", "interior_designer", "jewelry_designer",
  "industrial_designer", "ceramicist", "woodworker",
];

// --- Formatting Helper Function ---
const formatCategoryName = (category: string | undefined): string => {
  if (!category) return '';
  const spacedName = category.replace(/_/g, ' ');
  return spacedName.charAt(0).toUpperCase() + spacedName.slice(1);
};
// --- End Helper Function ---

// --- Embedded CSS Styles for PostJobPage ---
const postJobStyles = `
  .post-job-container {
    max-width: 800px; /* Slightly wider */
    margin: 30px auto; /* More vertical margin */
    padding: 30px; /* More padding */
    border: 1px solid #e0e0e0; /* Lighter border */
    border-radius: 10px; /* Slightly more rounded */
    background-color: #ffffff; /* White background */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); /* Subtle shadow */
    font-family: Arial, sans-serif; /* Consistent font */
  }

  .post-job-container h2 {
    text-align: center;
    margin-bottom: 30px; /* More space below heading */
    color: #333;
    font-weight: 600; /* Bolder heading */
  }

  .post-job-form {
    display: flex;
    flex-direction: column;
    gap: 20px; /* Consistent gap between form elements/groups */
  }

  .form-field-group label {
    display: block;
    margin-bottom: 8px; /* Space between label and input */
    font-weight: 600; /* Bolder labels */
    color: #555;
    font-size: 0.95em;
  }

  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    padding: 12px 15px; /* More padding */
    border: 1px solid #ccc;
    border-radius: 6px; /* Consistent radius */
    box-sizing: border-box;
    font-size: 1rem; /* Standard font size */
    transition: border-color 0.2s ease, box-shadow 0.2s ease; /* Smooth transitions */
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    border-color: #007bff; /* Highlight focus */
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2); /* Focus ring */
    outline: none; /* Remove default outline */
  }

   .form-textarea {
      min-height: 100px; /* Ensure textarea has decent height */
      resize: vertical; /* Allow vertical resize only */
   }

  .form-row {
    display: flex;
    gap: 20px; /* Gap between items in a row */
  }

  /* Make items in a row take equal width */
  .form-row > div {
    flex: 1;
  }

  .form-checkbox-group {
    display: flex;
    align-items: center;
    padding-top: 10px; /* Add some space above checkbox */
  }

  .form-checkbox-group input[type="checkbox"] {
    margin-right: 12px;
    transform: scale(1.3); /* Larger checkbox */
    cursor: pointer;
  }
   .form-checkbox-group label {
      margin-bottom: 0; /* Remove bottom margin for checkbox label */
      font-weight: 500; /* Normal weight */
      cursor: pointer;
   }

  .submit-button {
    padding: 14px 25px; /* Generous padding */
    background-color: #28a745; /* Success green */
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1.1rem; /* Larger font */
    font-weight: 600;
    margin-top: 15px; /* Space above button */
    transition: background-color 0.2s ease, transform 0.1s ease; /* Add transform transition */
    align-self: center; /* Center button */
  }

  .submit-button:hover {
    background-color: #218838; /* Darker green on hover */
  }
  .submit-button:active {
     transform: scale(0.98); /* Slight press effect */
  }

  /* --- Media Query for Responsiveness --- */
  @media (max-width: 600px) {
    .form-row {
      flex-direction: column; /* Stack elements in a row */
      gap: 20px; /* Keep gap consistent */
    }
    .post-job-container {
        padding: 20px; /* Reduce padding on small screens */
        margin: 20px 10px;
    }
     .submit-button {
        width: 100%; /* Make button full width */
     }
  }
`;
// --- End Embedded CSS ---


const PostJobPage: React.FC = () => {
  // State and other logic remains the same...
  const [employerId, setEmployerId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [budget, setBudget] = useState<number | "">(""); // Default to empty string for placeholder
  const [difficulty, setDifficulty] = useState("");
  const [deadline, setDeadline] = useState("");
  const [artistCategory, setArtistCategory] = useState("");
  const [insurance, setInsurance] = useState(false);
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (storedUser && storedUser.user_type === "Employer" && storedUser.employer_id) {
      setEmployerId(storedUser.employer_id);
    } else {
      console.warn("User is not logged in as an employer or employer_id is missing.");
    }
  }, [storedUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     // Basic validation example (can be enhanced)
     if (budget !== "" && Number(budget) < 0) {
         alert("Budget cannot be negative.");
         return;
     }
    try {
      const token = localStorage.getItem("token");
      if (!employerId || !token) {
        alert("Authentication error. Please log in again.");
        return;
      }
      const jobPayload = {
        employer_id: employerId, title, description, city, address,
        budget: budget === "" ? null : Number(budget), // Send null if empty, or number
        difficulty, deadline, artistCategory, insurance,
        location: { type: "Point", coordinates: [0, 0] },
      };
      await axios.post(`${API_BASE_URL}/api/job-postings`, jobPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Job posted successfully!");
      setTitle(""); setDescription(""); setCity(""); setAddress("");
      setBudget(""); setDifficulty(""); setDeadline(""); setArtistCategory("");
      setInsurance(false);
      navigate("/main");
    } catch (error: any) {
      console.error("Error posting job:", error);
      const errorMessage = error.response?.data?.message || "Failed to post job. Please try again.";
      alert(errorMessage);
    }
  };

   // Conditional rendering if not logged in as employer
   if (!employerId && typeof window !== 'undefined' && !localStorage.getItem("user")) {
     return (
       <>
         <Navbar />
         <div className="post-job-container" style={{textAlign: 'center'}}> {/* Reuse container style */}
           <p>You must be logged in as an Employer to post a job.</p>
         </div>
       </>
     );
   }

  return (
    <>
      {/* Inject styles */}
      <style>{postJobStyles}</style>
      <Navbar />
      {/* Use class names for styling */}
      <div className="post-job-container">
        <h2>Post a New Job Opportunity</h2>
        <form onSubmit={handleSubmit} className="post-job-form">

            {/* Title */}
            <div className="form-field-group">
              <label htmlFor="jobTitle">Job Title</label>
              <input
                id="jobTitle"
                className="form-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g., Mural Artist Needed for Cafe Wall"
              />
            </div>

            {/* Description */}
            <div className="form-field-group">
              <label htmlFor="jobDesc">Job Description</label>
              <textarea
                id="jobDesc"
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                placeholder="Describe the project, required skills, deliverables, etc."
              />
            </div>

             {/* Location Row */}
            <div className="form-row">
               <div className="form-field-group">
                 <label htmlFor="jobCity">City</label>
                 <input
                   id="jobCity"
                   className="form-input"
                   type="text"
                   value={city}
                   onChange={(e) => setCity(e.target.value)}
                   required
                   placeholder="e.g., Athens"
                 />
               </div>
               <div className="form-field-group">
                 <label htmlFor="jobAddress">Address / Area</label>
                 <input
                   id="jobAddress"
                   className="form-input"
                   type="text"
                   value={address}
                   onChange={(e) => setAddress(e.target.value)}
                   required
                   placeholder="e.g., Main Street 123 or Exarchia"
                 />
               </div>
            </div>

            {/* Budget */}
            <div className="form-field-group">
              <label htmlFor="jobBudget">Budget ($)</label>
              <input
                id="jobBudget"
                className="form-input"
                type="number"
                step="any"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value === "" ? "" : Number(e.target.value))}
                required
                placeholder="e.g., 500 (Enter 0 if negotiable/unspecified)"
              />
            </div>

             {/* Details Row */}
             <div className="form-row">
                <div className="form-field-group">
                  <label htmlFor="jobDifficulty">Difficulty Level</label>
                  <select
                    id="jobDifficulty"
                    className="form-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select...</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

               <div className="form-field-group">
                 <label htmlFor="jobDeadline">Application Deadline</label>
                 <input
                   id="jobDeadline"
                   className="form-input"
                   type="date"
                   value={deadline}
                   onChange={(e) => setDeadline(e.target.value)}
                   required
                 />
               </div>
            </div>

            {/* Category */}
            <div className="form-field-group">
              <label htmlFor="jobCategory">Artist Category Needed</label>
              <select
                id="jobCategory"
                className="form-select"
                value={artistCategory}
                onChange={(e) => setArtistCategory(e.target.value)}
                required
              >
                <option value="" disabled>Select category...</option>
                {artistCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {formatCategoryName(cat)}
                  </option>
                ))}
              </select>
            </div>

            {/* Insurance */}
            <div className="form-checkbox-group">
              <input
                id="jobInsurance"
                type="checkbox"
                checked={insurance}
                onChange={(e) => setInsurance(e.target.checked)}
              />
              <label htmlFor="jobInsurance">Insurance Provided by Employer?</label>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-button">
              Post Job Posting
            </button>

        </form>
      </div>
    </>
  );
};

export default PostJobPage;