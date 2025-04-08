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

const PostJobPage: React.FC = () => {
  // 1. Fetch user from localStorage
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [employerId, setEmployerId] = useState<number | null>(null);

  // 2. Local form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [budget, setBudget] = useState<number | "">(0);
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
      alert("No valid employer_id found. Please ensure you're logged in as an Employer.");
    }
  }, [storedUser]);

  // 4. Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!employerId) {
        alert("No valid employer ID found. Cannot create job.");
        return;
      }

      // Construct payload with the new fields including a default location
      const jobPayload = {
        employer_id: employerId,
        title,
        description,
        city,
        address,
        budget: Number(budget),
        difficulty,
        deadline,
        artistCategory,
        insurance,
        // Default the location field to [0, 0]
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
      setBudget(0);
      setDifficulty("");
      setDeadline("");
      setArtistCategory("");
      setInsurance(false);

      navigate("/main");
    } catch (error) {
      console.error("Error posting job:", error);
      alert("Failed to post job. See console for details.");
    }
  };

  return (
    <>
      <Navbar />
      <div style={{ margin: "20px" }}>
        <h2>Post a Job</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "10px" }}>
            <label>Job Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ marginLeft: "10px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Job Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{ marginLeft: "10px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>City:</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              style={{ marginLeft: "10px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Address:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              style={{ marginLeft: "10px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Budget:</label>
            <input
              type="number"
              step="any"
              value={budget}
              onChange={(e) =>
                setBudget(e.target.value === "" ? "" : Number(e.target.value))
              }
              required
              style={{ marginLeft: "10px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Difficulty Level:</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              required
              style={{ marginLeft: "10px" }}
            >
              <option value="">Select Difficulty</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Deadline:</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              style={{ marginLeft: "10px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Artist Category:</label>
            <select
              value={artistCategory}
              onChange={(e) => setArtistCategory(e.target.value)}
              required
              style={{ marginLeft: "10px" }}
            >
              <option value="">Select Category</option>
              {artistCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Insurance Provided:</label>
            <input
              type="checkbox"
              checked={insurance}
              onChange={(e) => setInsurance(e.target.checked)}
              style={{ marginLeft: "10px" }}
            />
          </div>
          <button type="submit">Create Job</button>
        </form>
      </div>
    </>
  );
};

export default PostJobPage;
