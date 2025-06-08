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

// --- Embedded CSS Styles ---
const postJobStyles = `
  /* Import a font - Example: Nunito */
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap');

  .post-job-container {
    max-width: 750px;
    padding-top:200px !important;
    margin: 40px auto;
    padding: 35px 40px;
    border: none;
    border-radius: 12px;
    background-color: #ffffff;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
    font-family: 'Nunito', sans-serif;
    color: #495057;
  }

  .post-job-container h2 {
    text-align: center;
    margin-bottom: 35px;
    color: #343a40;
    font-weight: 700;
    font-size: 1.8rem;
  }

  .post-job-form {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .form-field-group label {
    display: block;
    margin-bottom: 10px;
    font-weight: 600;
    color: #495057;
    font-size: 1rem;
  }

  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    padding: 14px 18px;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    box-sizing: border-box;
    font-size: 1rem;
    background-color: #f8f9fa;
    color: #495057;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .form-input::placeholder,
  .form-textarea::placeholder {
      color: #adb5bd;
      opacity: 1; /* Firefox */
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    border-color: #66aaff;
    background-color: #fff;
    box-shadow: 0 0 0 3px rgba(102, 170, 255, 0.2);
    outline: none;
  }

   .form-textarea {
      min-height: 120px;
      resize: vertical;
      font-family: inherit;
   }

  .form-row {
    display: flex;
    gap: 25px;
  }

  .form-row > div {
    flex: 1;
  }

  .form-checkbox-group {
    display: flex;
    align-items: center;
    padding-top: 10px;
    gap: 10px;
  }

   .form-checkbox-group input[type="checkbox"] {
      appearance: none;
      width: 1.4em;
      height: 1.4em;
      border: 1px solid #adb5bd;
      border-radius: 4px;
      display: inline-block;
      position: relative;
      cursor: pointer;
      margin: 0;
      flex-shrink: 0;
      transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
    }
    .form-checkbox-group input[type="checkbox"]:checked {
      background-color: #20c997;
      border-color: #20c997;
    }
     .form-checkbox-group input[type="checkbox"]:checked::before {
       content: '✔';
       font-size: 1em;
       color: white;
       position: absolute;
       left: 50%;
       top: 50%;
       transform: translate(-50%, -50%);
     }
      .form-checkbox-group input[type="checkbox"]:focus {
          box-shadow: 0 0 0 3px rgba(32, 201, 151, 0.25);
          border-color: #1baa80;
      }

   .form-checkbox-group label {
      margin-bottom: 0;
      font-weight: 400;
      color: #495057;
      cursor: pointer;
   }

  .submit-button {
    padding: 14px 30px;
    background-color: #20c997;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 20px;
    transition: background-color 0.2s ease, transform 0.1s ease;
    align-self: center;
    box-shadow: 0 2px 5px rgba(32, 201, 151, 0.2);
  }

  .submit-button:hover {
    background-color: #1baa80;
  }
  .submit-button:active {
     transform: scale(0.98);
     box-shadow: none;
  }

  @media (max-width: 650px) {
    .form-row {
      flex-direction: column;
      gap: 25px;
    }
    .post-job-container {
        padding: 25px;
        margin: 20px 15px;
    }
     .submit-button {
        width: 100%;
     }
     .post-job-container h2 {
         font-size: 1.6rem;
     }
  }
`;
// --- End Embedded CSS ---


const PostJobPage: React.FC = () => {
  const [employerId, setEmployerId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  // --- FIX 1: Correct budget state definition ---
  const [budget, setBudget] = useState<number | null>(null); // Use number | null
  const [difficulty, setDifficulty] = useState("");
  const [deadline, setDeadline] = useState("");
  const [artistCategory, setArtistCategory] = useState("");
  const [insurance, setInsurance] = useState(false);
  const navigate = useNavigate();
  // It's generally safer to parse from localStorage inside useEffect
  // const storedUser = JSON.parse(localStorage.getItem("user") || "{}"); // Moved inside useEffect

  useEffect(() => {
    // Parse user info here
    const userString = localStorage.getItem("user");
    const storedUser = userString ? JSON.parse(userString) : null;

    if (storedUser && storedUser.user_type === "Employer" && storedUser.employer_id) {
      setEmployerId(storedUser.employer_id);
    } else {
      console.warn("User is not logged in as an employer or employer_id is missing.");
      // Optional: Redirect if not authorized
      // navigate('/login');
    }
  }, [navigate]); // Add navigate to dependency array if used inside

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     if (budget === null) { // Check if required budget is null
         alert("Budget is required.");
         return;
     }
     if (budget < 0) {
         alert("Budget cannot be negative.");
         return;
     }
     // Simplified required check (relying mostly on 'required' HTML attribute)
     if (!difficulty || !deadline || !artistCategory) {
         alert("Please fill out Difficulty, Deadline, and Category.");
         return;
     }
    try {
      const token = localStorage.getItem("token");
      if (!employerId || !token) {
        alert("Authentication error. Please log in again.");
        return;
      }
      // --- FIX 2: Correct job payload definition ---
      const jobPayload = {
        employer_id: employerId,
        title,
        description,
        city,
        address,
        budget: budget, // Use the state variable directly (it's number | null)
        difficulty,
        deadline,
        artistCategory,
        insurance,
        location: { type: "Point", coordinates: [0, 0] },
      };
      await axios.post(`${API_BASE_URL}/api/job-postings`, jobPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Job posted successfully!");
      // Reset form
      setTitle(""); setDescription(""); setCity(""); setAddress("");
      // --- FIX 3: Correct budget state reset ---
      setBudget(null); // Reset budget to null
      setDifficulty(""); setDeadline(""); setArtistCategory("");
      setInsurance(false);
      navigate("/main");
    } catch (error: any) {
      console.error("Error posting job:", error);
      const errorMessage = error.response?.data?.message || "Failed to post job. Please try again.";
      alert(errorMessage);
    }
  };

   // This check needs employerId state, which is set in useEffect
   // It might flash the form briefly before useEffect runs.
   // Consider a loading state or checking employerId directly.
   if (employerId === null) { // Check if employerId hasn't been set yet
        // You could show a loading indicator here instead
         return (
           <>
             <Navbar />
             <div className="post-job-container" style={{textAlign: 'center'}}>
               <p style={{fontSize: '1.1rem', color: '#6c757d'}}>Loading user data...</p>
             </div>
           </>
         );
   }


  return (
    <>
      <style>{postJobStyles}</style>
      <Navbar />
      <div className="post-job-container">
        <h2>Post a new job opportunity</h2>
        <form onSubmit={handleSubmit} className="post-job-form">

            {/* Title */}
            <div className="form-field-group">
              <label htmlFor="jobTitle">Job title</label>
              <input id="jobTitle" className="form-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Mural Artist Needed for Cafe Wall"/>
            </div>

            {/* Description */}
            <div className="form-field-group">
              <label htmlFor="jobDesc">Job description</label>
              <textarea id="jobDesc" className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Describe the project, required skills, deliverables, etc."/>
            </div>

             {/* Location Row */}
            <div className="form-row">
               <div className="form-field-group">
                 <label htmlFor="jobCity">City</label>
                 <input id="jobCity" className="form-input" type="text" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="e.g., Athens"/>
               </div>
               <div className="form-field-group">
                 <label htmlFor="jobAddress">Address / Area</label>
                 <input id="jobAddress" className="form-input" type="text" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="e.g., Main Street 123 or Exarchia"/>
               </div>
            </div>

            {/* Budget */}
            <div className="form-field-group">
              <label htmlFor="jobBudget">Budget ($)</label>
              {/* --- FIX 4: Ensure input handlers match state type (number | null) --- */}
              <input
                id="jobBudget"
                className="form-input"
                type="number"
                step="any"
                min="0"
                value={budget === null ? '' : budget} // Display '' if state is null
                onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || value === null) { // Check for null just in case
                        setBudget(null);
                    } else {
                        const num = parseFloat(value);
                        // Allow setting null even if parsing fails (e.g., user types 'abc')
                        setBudget(isNaN(num) ? null : num);
                    }
                }}
                required
                placeholder="e.g., 500 (Required)"
              />
            </div>

             {/* Details Row */}
             <div className="form-row">
                <div className="form-field-group">
                  <label htmlFor="jobDifficulty">Difficulty level</label>
                  <select id="jobDifficulty" className="form-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} required>
                    <option value="" disabled>Select...</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
               <div className="form-field-group">
                 <label htmlFor="jobDeadline">Application Deadline</label>
                 <input id="jobDeadline" className="form-input" type="date" min={new Date().toISOString().split("T")[0]} value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
               </div>
            </div>

            {/* Category */}
            <div className="form-field-group">
              <label htmlFor="jobCategory">Artist category needed</label>
              <select id="jobCategory" className="form-select" value={artistCategory} onChange={(e) => setArtistCategory(e.target.value)} required>
                <option value="" disabled>Select category...</option>
                {artistCategories.map((cat) => (<option key={cat} value={cat}>{formatCategoryName(cat)}</option>))}
              </select>
            </div>

            {/* Insurance */}
            <div className="form-checkbox-group">
              <input id="jobInsurance" type="checkbox" checked={insurance} onChange={(e) => setInsurance(e.target.checked)}/>
              <label htmlFor="jobInsurance">Insurance provided by employer?</label>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-button">Create job posting</button>

        </form>
      </div>
    </>
  );
};

export default PostJobPage;