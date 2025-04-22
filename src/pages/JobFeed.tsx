// src/pages/JobFeed.tsx
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

// --- Constants and Interfaces ---
const artistCategories = [
  "dancer", "painter", "digital_artist", "graphic_designer", "musician",
  "sculptor", "photographer", "actress", "actor", "comedian", "poet",
  "writer", "illustrator", "calligrapher", "filmmaker", "animator",
  "fashion_designer", "architect", "interior_designer", "jewelry_designer",
  "industrial_designer", "ceramicist", "woodworker",
];
const difficultyLevels = ["Beginner", "Intermediate", "Expert"];
interface Job {
  id: number;
  title: string;
  description: string;
  employerName: string;
  created_at?: string;
  city?: string;
  address?: string;
  budget?: number;
  difficulty?: string;
  deadline?: string;
  artistCategory?: string;
  insurance?: boolean;
}
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

// --- Embedded CSS Styles ---
// KEEP THIS - This holds your actual styles being used
const componentStyles = `
  .job-feed-container {
  display: flex;             /* ADD */
  flex-direction: column;    /* ADD */
    padding: 20px;
    font-family: Arial, sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    border-radius: 8px;
    border: 1px solid #ddd;
    background-color: #fff;
  }

  .job-feed-container h2 {
    text-align: center;
    margin-bottom: 30px;
    color: #333;
  }

  .job-filters {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 30px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    flex-shrink: 0;          /* ADD */
    margin-bottom: 20px;   
  }

  .job-filters h3 {
      margin-top: 0;
      margin-bottom: 15px;
      color: #444;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
  }

  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 15px;
    align-items: center;
  }

  .filter-input,
  .filter-select {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 100%;
    box-sizing: border-box;
  }

  .filter-select {
     background: white;
  }

  .budget-filter-group {
      display: flex;
      align-items: center;
      gap: 5px;
  }

  .budget-filter-group input {
    flex: 1;
    min-width: 80px;
  }

  .budget-filter-group span {
      padding: 0 5px;
  }

  .clear-filters-button {
    padding: 10px 15px;
    /* Updated color from your last paste */
    background-color: #e59f09;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-weight: bold;
  }
  .clear-filters-button:hover {
      /* Corresponding hover state */
      background-color: #c88a07;
  }

  .job-listing {
  display: grid;
  /* --- CHANGE: Force 2 columns --- */
  grid-template-columns: repeat(2, 1fr); /* MODIFY THIS LINE */
  gap: 20px; /* Keep existing gap */

  /* --- ADD: Height limit and scrolling --- */
  max-height: 80vh;   /* ADD - ADJUST THIS VALUE (e.g., 75vh, 900px) */
  overflow-y: auto;   /* ADD - Enable vertical scroll */

  /* --- ADD: Padding for scrollbar --- */
  /* Adjust existing padding or add new padding */
  padding: 5px 15px 5px 5px; /* ADD/MODIFY - Top R Bottom L padding (R is for scrollbar) */

  /* --- ADD: Allow this area to grow --- */
  flex-grow: 1;         /* ADD */
  min-height: 200px;    /* ADD - Or another minimum */

  /* Optional: Add border/background for visual separation */
  border: 1px solid #e0e0e0; /* ADD/MODIFY */
  border-radius: 8px;        /* ADD/MODIFY */
  background-color: #fdfdfd; /* ADD/MODIFY */
}

  .job-card {
    min-height: 280px; /* ADD - ADJUST AS NEEDED */
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #fff;
    box-shadow: 0 2px 5px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
  }

  .job-card h3 {
    /* Updated color from your last paste */
    color: #774402;
    margin: 0 0 10px 0;
    font-size: 1.3em;
  }

   .job-card p {
      margin: 0;
      font-size: 0.9rem;
      color: #555;
      line-height: 1.5;
   }

  .employer-name {
    font-size: 0.9em;
    color: #7f8c8d;
    margin-bottom: 15px;
  }

  .job-description {
    color: #34495e;
    margin-bottom: 15px;
    flex-grow: 1;
  }

  .job-details-grid {
     display: grid;
     grid-template-columns: 1fr 1fr;
     gap: 5px 15px;
     font-size: 0.9em;
     color: #555;
     margin-bottom: 10px;
  }

   .job-details-grid p {
       margin-bottom: 5px;
       font-size: 0.9em;
   }

   .job-card .posted-date {
    font-size: 0.8em;
    color: #999;
    margin-top: 10px;
    text-align: right;
  }

  .apply-button {
    margin-top: auto;
    padding: 10px 15px;
     /* Updated color from your last paste */
    background-color: #C96A50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-align: center;
    font-weight: bold;
    transition: background-color 0.2s ease;
    align-self: flex-start;
  }
  .apply-button:hover {
     /* Corresponding hover state */
    background-color: #b0563f;
  }

  .error-message {
    color: red;
    text-align: center;
    padding: 20px;
    grid-column: 1 / -1;
  }

  .loading-message {
      text-align: center;
      padding: 30px;
      color: #555;
      grid-column: 1 / -1;
  }

  /* --- Autocomplete Styles --- */
  .city-filter-container {
    position: relative;
  }

  .city-suggestions {
    position: absolute;
    background-color: white;
    border: 1px solid #ccc;
    border-top: none;
    border-radius: 0 0 4px 4px;
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 150px;
    overflow-y: auto;
    z-index: 10;
    width: 100%;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    box-sizing: border-box;
  }

  .city-suggestions li {
    padding: 8px 12px;
    cursor: pointer;
  }

  .city-suggestions li:hover {
    background-color: #f0f0f0;
  }
  /* --- End Autocomplete Styles --- */

  .filter-grid > div, .filter-grid > input, .filter-grid > select {
      position: relative;
  }
      /* 6. Optional but recommended: Media Query for smaller screens */
/* Add this whole block at the end of componentStyles */
@media (max-width: 768px) { /* Adjust breakpoint (e.g., 768px) as needed */
  .job-listing {
    grid-template-columns: 1fr; /* Switch to 1 column */
    /* Keep or adjust max-height/overflow for mobile as desired */
  }
  /* Optional: stack filters on mobile for better layout */
   .filter-grid {
     grid-template-columns: 1fr;
   }
}
`;
// --- End Embedded CSS ---

const JobFeed: React.FC = () => {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter States
  const [filterCity, setFilterCity] = useState('');
  const [filterMinBudget, setFilterMinBudget] = useState<number | ''>('');
  const [filterMaxBudget, setFilterMaxBudget] = useState<number | ''>('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterInsurance, setFilterInsurance] = useState<'yes' | 'no' | ''>('');

  // Autocomplete State
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityInputRef = useRef<HTMLDivElement>(null); // Changed Ref to Div container

  // User Type Check
  const storedUser = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const isArtist = useMemo(() => storedUser?.user_type === "Artist", [storedUser]);

  // Calculate Unique Cities
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    allJobs.forEach(job => {
      if (job.city && typeof job.city === 'string') {
        cities.add(job.city);
      }
    });
    return Array.from(cities).sort();
  }, [allJobs]);

  // Fetch all jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/api/job-postings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setAllJobs(response.data || []);
      } catch (err: any) {
        console.error("❌ Error fetching jobs:", err);
        setError(err.response?.data?.message || "Failed to fetch jobs. Please try again later.");
        setAllJobs([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Apply Filters
  const filteredJobs = useMemo(() => {
     return allJobs.filter(job => {
      if (filterCity && !job.city?.toLowerCase().includes(filterCity.toLowerCase())) return false;
      if (filterMinBudget !== '' && (job.budget === undefined || job.budget < filterMinBudget)) return false;
      if (filterMaxBudget !== '' && (job.budget === undefined || job.budget > filterMaxBudget)) return false;
      if (filterDifficulty && job.difficulty !== filterDifficulty) return false;
      if (filterCategory && job.artistCategory !== filterCategory) return false;
      if (filterInsurance === 'yes' && job.insurance !== true) return false;
      if (filterInsurance === 'no' && job.insurance !== false) return false;
      return true;
    });
  }, [allJobs, filterCity, filterMinBudget, filterMaxBudget, filterDifficulty, filterCategory, filterInsurance]);

  // Handle Apply Button Click
   const handleApply = async (jobId: number) => {
    const token = localStorage.getItem("token");
    if (!token || !isArtist) {
      alert("You must be logged in as an Artist to apply for jobs.");
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/api/job-postings/${jobId}/apply`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(response.data.message || "Application successful!");
    } catch (error: any) {
      console.error(`Error applying to job ${jobId}:`, error);
      alert(error.response?.data?.message || "Failed to apply. See console for details.");
    }
  };


  // Function to reset filters
  const clearFilters = () => {
    setFilterCity('');
    setFilterMinBudget('');
    setFilterMaxBudget('');
    setFilterDifficulty('');
    setFilterCategory('');
    setFilterInsurance('');
    setCitySuggestions([]);
    setShowCitySuggestions(false);
  };

  // Format currency utility
  const formatCurrency = (amount: number | undefined): string => { // Added explicit return type
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Autocomplete Handlers
  const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterCity(value);
    if (value.length > 0) {
      const suggestions = uniqueCities.filter(city =>
        city.toLowerCase().startsWith(value.toLowerCase())
      );
      setCitySuggestions(suggestions);
      setShowCitySuggestions(suggestions.length > 0);
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    }
  };

  const handleSuggestionClick = (city: string) => {
    setFilterCity(city);
    setCitySuggestions([]);
    setShowCitySuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click target is inside the container referenced by cityInputRef
      if (cityInputRef.current && !cityInputRef.current.contains(event.target as Node)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  return (
    <>
      {/* Styles are embedded here */}
      <style>{componentStyles}</style>
      <Navbar />
      <div className="job-feed-container">
        <h2>Find Your Next Opportunity</h2>

        {/* --- Filter Section --- */}
        <div className="job-filters">
          <h3>Filter Jobs</h3>
          <div className="filter-grid">
            {/* City Filter with Autocomplete */}
            {/* Ensure ref is on the container div */}
            <div className="city-filter-container" ref={cityInputRef}>
              <input
                className="filter-input"
                type="text"
                placeholder="City"
                value={filterCity}
                onChange={handleCityInputChange}
                onFocus={() => { // Show suggestions on focus if there's input
                  if (filterCity.length > 0) {
                    const suggestions = uniqueCities.filter(city =>
                      city.toLowerCase().startsWith(filterCity.toLowerCase())
                    );
                     if (suggestions.length > 0) {
                       setCitySuggestions(suggestions); // Update suggestions just in case
                       setShowCitySuggestions(true);
                     }
                  }
                }}
                autoComplete="off"
              />
              {showCitySuggestions && citySuggestions.length > 0 && (
                <ul className="city-suggestions">
                  {citySuggestions.map((city, index) => (
                    <li key={index} onClick={() => handleSuggestionClick(city)}>
                      {city}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Other Filters */}
            <select
              className="filter-select"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <option value="">All Difficulty Levels</option>
              {difficultyLevels.map(level => (<option key={level} value={level}>{level}</option>))}
            </select>
            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Artist Categories</option>
              {artistCategories.map((cat) => (<option key={cat} value={cat}>{cat.replace(/_/g, " ")}</option>))}
            </select>
            <div className="budget-filter-group">
              <input
                className="filter-input"
                type="number"
                placeholder="Min Budget"
                value={filterMinBudget}
                onChange={(e) => setFilterMinBudget(e.target.value === '' ? '' : Number(e.target.value))}
              />
              <span>-</span>
              <input
                className="filter-input"
                type="number"
                placeholder="Max Budget"
                value={filterMaxBudget}
                onChange={(e) => setFilterMaxBudget(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <select
              className="filter-select"
              value={filterInsurance}
              onChange={(e) => setFilterInsurance(e.target.value as 'yes' | 'no' | '')}
            >
              <option value="">Insurance (All)</option>
              <option value="yes">Insurance Provided</option>
              <option value="no">No Insurance</option>
            </select>
            <button onClick={clearFilters} className="clear-filters-button">
              Clear Filters
            </button>
          </div>
        </div>

        {/* --- Job Listing Section --- */}
        <div className="job-listing">
           {isLoading ? (
            <p className="loading-message">Loading jobs...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div key={job.id} className="job-card">
                <h3>{job.title}</h3>
                <p className="employer-name">Posted by: {job.employerName || 'Unknown Employer'}</p>
                <p className="job-description">{job.description}</p>
                <div className="job-details-grid">
                  {job.city && <p><strong>Location:</strong> {job.city}{job.address ? `, ${job.address}` : ''}</p>}
                  {/* Use explicit check for budget rendering */}
                  {typeof job.budget === 'number' && <p><strong>Budget:</strong> {formatCurrency(job.budget)}</p>}
                  {job.difficulty && <p><strong>Difficulty:</strong> {job.difficulty}</p>}
                  {job.artistCategory && <p><strong>Category:</strong> {job.artistCategory.replace(/_/g, " ")}</p>}
                  {job.deadline && <p><strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}</p>}
                  {typeof job.insurance === 'boolean' && <p><strong>Insurance:</strong> {job.insurance ? "Yes" : "No"}</p>}
                </div>
                 {job.created_at && (
                    <p className="posted-date">
                    Posted on: {new Date(job.created_at).toLocaleString()}
                    </p>
                )}
                {isArtist && (
                  <button
                    onClick={() => handleApply(job.id)}
                    className="apply-button"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            ))
          ) : (
            <p>No jobs match your current filters. Try adjusting them or check back later!</p>
          )}
        </div>
      </div>
    </>
  );
};

// REMOVED the unused 'styles' object from here
// const styles: { [key: string]: React.CSSProperties } = { ... };

export default JobFeed;