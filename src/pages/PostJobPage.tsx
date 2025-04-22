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
// (Capitalizes only the first letter of the first word after replacing underscores)
// THIS FUNCTION ALREADY IMPLEMENTS YOUR REQUESTED FORMATTING
const formatCategoryName = (category: string | undefined): string => {
  if (!category) return '';
  const spacedName = category.replace(/_/g, ' ');
  return spacedName.charAt(0).toUpperCase() + spacedName.slice(1);
};
// --- End Helper Function ---

// --- NEW Embedded CSS Styles for PostJobPage (Cuter/Modern) ---
const postJobStyles = `
  /* Import a font - Example: Nunito */
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap');

  .post-job-container {
    max-width: 750px; /* Adjusted width */
    margin: 40px auto; /* More vertical margin */
    padding: 35px 40px; /* More padding */
    border: none; /* Remove border */
    border-radius: 12px; /* More rounded */
    background-color: #ffffff; /* Keep white */
    /* Softer, layered shadow */
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
    font-family: 'Nunito', sans-serif; /* Apply the font */
    color: #495057; /* Default text color */
  }

  .post-job-container h2 {
    text-align: center;
    margin-bottom: 35px;
    color: #343a40; /* Darker heading */
    font-weight: 700; /* Bold */
    font-size: 1.8rem; /* Larger heading */
  }

  .post-job-form {
    display: flex;
    flex-direction: column;
    gap: 25px; /* Increased gap */
  }

  .form-field-group label {
    display: block;
    margin-bottom: 10px; /* More space */
    font-weight: 600;
    color: #495057; /* Slightly softer label color */
    font-size: 1rem; /* Slightly larger label */
  }

  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
    padding: 14px 18px; /* Adjusted padding */
    border: 1px solid #dee2e6; /* Lighter border */
    border-radius: 8px; /* Rounded inputs */
    box-sizing: border-box;
    font-size: 1rem;
    background-color: #f8f9fa; /* Very light input background */
    color: #495057;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
   /* Add placeholder styling */
  .form-input::placeholder,
  .form-textarea::placeholder {
      color: #adb5bd;
      opacity: 1; /* Firefox */
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    border-color: #66aaff; /* Softer blue focus */
    background-color: #fff; /* White background on focus */
    box-shadow: 0 0 0 3px rgba(102, 170, 255, 0.2); /* Softer blue ring */
    outline: none;
  }

   .form-textarea {
      min-height: 120px;
      resize: vertical;
      font-family: inherit; /* Ensure textarea uses the same font */
   }

  .form-row {
    display: flex;
    gap: 25px; /* Increased gap */
  }

  .form-row > div {
    flex: 1;
  }

  .form-checkbox-group {
    display: flex;
    align-items: center;
    padding-top: 10px;
    gap: 10px; /* Gap between checkbox and label */
  }

  /* Custom Checkbox Style (Optional but cuter) */
   .form-checkbox-group input[type="checkbox"] {
      appearance: none; /* Remove default */
      width: 1.4em;
      height: 1.4em;
      border: 1px solid #adb5bd;
      border-radius: 4px;
      display: inline-block;
      position: relative;
      cursor: pointer;
      margin: 0; /* Reset margin */
      flex-shrink: 0;
      transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
    }
    .form-checkbox-group input[type="checkbox"]:checked {
      background-color: #20c997; /* Teal check background */
      border-color: #20c997;
    }
     .form-checkbox-group input[type="checkbox"]:checked::before {
       content: '✔'; /* Checkmark */
       font-size: 1em;
       color: white;
       position: absolute;
       left: 50%;
       top: 50%;
       transform: translate(-50%, -50%);
     }
      .form-checkbox-group input[type="checkbox"]:focus {
          box-shadow: 0 0 0 3px rgba(32, 201, 151, 0.25); /* Teal focus ring */
          border-color: #1baa80;
      }

   .form-checkbox-group label {
      margin-bottom: 0;
      font-weight: 400; /* Lighter weight */
      color: #495057;
      cursor: pointer;
   }

  .submit-button {
    padding: 14px 30px;
    /* Using a softer, modern teal color */
    background-color: #20c997;
    color: white;
    border: none;
    border-radius: 8px; /* Match inputs */
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 20px;
    transition: background-color 0.2s ease, transform 0.1s ease;
    align-self: center;
    box-shadow: 0 2px 5px rgba(32, 201, 151, 0.2); /* Subtle shadow */
  }

  .submit-button:hover {
    background-color: #1baa80; /* Darker teal */
  }
  .submit-button:active {
     transform: scale(0.98);
     box-shadow: none; /* Remove shadow on press */
  }

  /* --- Media Query for Responsiveness --- */
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
  // State and other logic remains the same...
  const [employerId, setEmployerId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [budget, setBudget] = useState<number | "">("");
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
     if (budget !== "" && Number(budget) < 0) {
         alert("Budget cannot be negative.");
         return;
     }
     // Add check for required fields (though 'required' attr helps)
     if (!title || !description || !city || !address || budget === '' || !difficulty || !deadline || !artistCategory) {
         alert("Please fill out all required fields.");
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
        budget: budget === "" ? null : Number(budget), // Send null if budget is empty
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

   if (!employerId && typeof window !== 'undefined' && !localStorage.getItem("user")) {
     return (
       <>
         <Navbar />
         {/* Use the styles even for the message */}
         <div className="post-job-container" style={{textAlign: 'center'}}>
           <p style={{fontSize: '1.1rem', color: '#6c757d'}}>You must be logged in as an Employer to post a job.</p>
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

            <div className="form-field-group">
              <label htmlFor="jobDesc">Job Description</label>
              <textarea
                id="jobDesc"
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Describe the project, required skills, deliverables, etc."
              />
            </div>

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
                placeholder="e.g., 500 (Required)"
              />
            </div>

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
                   // Set min date to today?
                   min={new Date().toISOString().split("T")[0]}
                   value={deadline}
                   onChange={(e) => setDeadline(e.target.value)}
                   required
                 />
               </div>
            </div>

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

            <div className="form-checkbox-group">
              <input
                id="jobInsurance"
                type="checkbox"
                checked={insurance}
                onChange={(e) => setInsurance(e.target.checked)}
              />
              <label htmlFor="jobInsurance">Insurance Provided by Employer?</label>
            </div>

            <button type="submit" className="submit-button">
              Post Job Posting
            </button>

        </form>
      </div>
    </>
  );
};

export default PostJobPage;