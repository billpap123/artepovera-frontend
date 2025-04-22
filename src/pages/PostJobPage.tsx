// src/pages/PostJobPage.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// Artist categories based on your ENUM
const artistCategories = [
  "dancer",
  "painter",
  "digital_artist",
  "graphic_designer",
  "musician",
  "sculptor",
  "photographer",
  "actress",
  "actor",
  "comedian",
  "poet",
  "writer",
  "illustrator",
  "calligrapher",
  "filmmaker",
  "animator",
  "fashion_designer",
  "architect",
  "interior_designer",
  "jewelry_designer",
  "industrial_designer",
  "ceramicist",
  "woodworker",
];

// --- Formatting Helper Function ---
// (Capitalizes only the first letter of the first word after replacing underscores)
const formatCategoryName = (category: string | undefined): string => {
  if (!category) return ''; // Handle cases where category might be undefined

  // Replace underscores with spaces first
  const spacedName = category.replace(/_/g, ' ');

  // Capitalize only the very first character of the resulting string
  return spacedName.charAt(0).toUpperCase() + spacedName.slice(1);
};
// --- End Helper Function ---


const PostJobPage: React.FC = () => {
  // 1. Fetch user from localStorage
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [employerId, setEmployerId] = useState<number | null>(null);

  // 2. Local form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [budget, setBudget] = useState<number | "">(0); // Keep initial as 0 or '' as you prefer
  const [difficulty, setDifficulty] = useState("");
  const [deadline, setDeadline] = useState("");
  const [artistCategory, setArtistCategory] = useState("");
  const [insurance, setInsurance] = useState(false);

  const navigate = useNavigate();

  // 3. On component mount, check if user has employer_id
  useEffect(() => {
    if (storedUser && storedUser.user_type === "Employer" && storedUser.employer_id) {
      setEmployerId(storedUser.employer_id);
    } else {
      // Consider navigating away or showing a more persistent message if not an employer
      // alert("No valid employer_id found. Please ensure you're logged in as an Employer.");
      console.warn("User is not logged in as an employer or employer_id is missing.");
      // Optional: navigate('/login'); or navigate('/unauthorized');
    }
  }, [storedUser]); // Dependency on storedUser is correct

  // 4. Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!employerId) {
        alert("No valid employer ID found. Cannot create job.");
        return;
      }
       if (!token) {
         alert("Authentication token not found. Please log in again.");
         return; // Also check for token
      }

      // Construct payload
      const jobPayload = {
        employer_id: employerId,
        title,
        description,
        city,
        address,
        budget: budget === "" ? 0 : Number(budget), // Handle empty string case for budget
        difficulty,
        deadline,
        artistCategory, // Send the original snake_case value
        insurance,
        // Default the location field to [0, 0] - ensure backend expects this format
        location: { type: "Point", coordinates: [0, 0] },
      };

      await axios.post(`${API_BASE_URL}/api/job-postings`, jobPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Job posted successfully!");
      // Clear the form
      setTitle("");
      setDescription("");
      setCity("");
      setAddress("");
      setBudget(0); // Reset to 0 or ''
      setDifficulty("");
      setDeadline("");
      setArtistCategory("");
      setInsurance(false);

      navigate("/main"); // Navigate to the main page or job feed
    } catch (error: any) { // Added type annotation for error
      console.error("Error posting job:", error);
      // Provide more specific error feedback if possible
      const errorMessage = error.response?.data?.message || "Failed to post job. See console for details.";
      alert(errorMessage);
    }
  };

  // Simple check to prevent rendering form if not an employer
   if (!employerId && !localStorage.getItem("user")) { // Basic check if user object exists at all
     return (
       <>
         <Navbar />
         <div style={{ margin: "20px", textAlign: "center" }}>
           <p>You must be logged in as an Employer to post a job.</p>
           {/* Optional: Add a button to navigate to login */}
           {/* <button onClick={() => navigate('/login')}>Login</button> */}
         </div>
       </>
     );
   }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: '700px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>Post a Job</h2>
        <form onSubmit={handleSubmit}>
          {/* Using a more structured layout, e.g., flex column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

            <div>
              <label htmlFor="jobTitle" style={{ display: 'block', marginBottom: '5px' }}>Job Title:</label>
              <input
                id="jobTitle"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label htmlFor="jobDesc" style={{ display: 'block', marginBottom: '5px' }}>Job Description:</label>
              <textarea
                id="jobDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4} // Give it some default height
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>

             {/* Group City and Address */}
            <div style={{ display: 'flex', gap: '15px' }}>
               <div style={{ flex: 1 }}>
                 <label htmlFor="jobCity" style={{ display: 'block', marginBottom: '5px' }}>City:</label>
                 <input
                   id="jobCity"
                   type="text"
                   value={city}
                   onChange={(e) => setCity(e.target.value)}
                   required
                   style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                 />
               </div>
               <div style={{ flex: 1 }}>
                 <label htmlFor="jobAddress" style={{ display: 'block', marginBottom: '5px' }}>Address:</label>
                 <input
                   id="jobAddress"
                   type="text"
                   value={address}
                   onChange={(e) => setAddress(e.target.value)}
                   required
                   style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                 />
               </div>
            </div>


            <div>
              <label htmlFor="jobBudget" style={{ display: 'block', marginBottom: '5px' }}>Budget ($):</label>
              <input
                id="jobBudget"
                type="number"
                step="any" // Allows decimals
                min="0"    // Prevent negative budget
                value={budget}
                onChange={(e) =>
                  setBudget(e.target.value === "" ? "" : Number(e.target.value))
                }
                required
                placeholder="e.g., 500"
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>

             {/* Group Difficulty and Deadline */}
             <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="jobDifficulty" style={{ display: 'block', marginBottom: '5px' }}>Difficulty Level:</label>
                  <select
                    id="jobDifficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                  >
                    <option value="" disabled>Select Difficulty...</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

               <div style={{ flex: 1 }}>
                 <label htmlFor="jobDeadline" style={{ display: 'block', marginBottom: '5px' }}>Deadline:</label>
                 <input
                   id="jobDeadline"
                   type="date"
                   value={deadline}
                   onChange={(e) => setDeadline(e.target.value)}
                   required
                   style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                 />
               </div>
            </div>


            <div>
              <label htmlFor="jobCategory" style={{ display: 'block', marginBottom: '5px' }}>Artist Category:</label>
              <select
                id="jobCategory"
                value={artistCategory}
                onChange={(e) => setArtistCategory(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              >
                <option value="" disabled>Select Category...</option>
                {artistCategories.map((cat) => (
                  // Use original 'cat' for value, formatted name for display text
                  <option key={cat} value={cat}>
                    {formatCategoryName(cat)} {/* <--- APPLY FORMATTING HERE */}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                id="jobInsurance"
                type="checkbox"
                checked={insurance}
                onChange={(e) => setInsurance(e.target.checked)}
                style={{ marginRight: '10px', transform: 'scale(1.2)' }} // Slightly larger checkbox
              />
              <label htmlFor="jobInsurance">Insurance Provided?</label>
            </div>

            <button
             type="submit"
             style={{ padding: '12px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', marginTop: '10px' }}
            >
              Create Job Posting
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default PostJobPage;