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

// --- Formatting Helper Function ---
// (Capitalizes only the first letter of the first word after replacing underscores)
const formatCategoryName = (category: string | undefined): string => {
  if (!category) return ''; // Handle cases where category might be undefined
  const spacedName = category.replace(/_/g, ' '); // Replace underscores first
  // Capitalize only the very first character
  return spacedName.charAt(0).toUpperCase() + spacedName.slice(1);
};
// --- End Helper Function ---

// --- Embedded CSS Styles ---
const componentStyles = `
  .job-feed-container {
    display: flex;
    flex-direction: column;
    padding: 20px;
    font-family: Arial, sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    /* Removed border/background from container to apply to specific sections if needed */
    /* height: calc(100vh - 80px); /* Example: viewport height minus navbar */
  }

  .job-feed-container h2 {
    text-align: center;
    margin-bottom: 30px;
    color: #333;
    flex-shrink: 0;
  }

  /* --- Filter Styles --- */
  .job-filters {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border: 1px solid #eee;
    flex-shrink: 0;
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
    background-color: #e59f09;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-weight: bold;
  }
  .clear-filters-button:hover {
      background-color: #c88a07;
  }

  /* --- Job Listing Styles --- */
  .job-listing {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* 2 columns */
    gap: 20px;
    max-height: 75vh; /* ADJUST THIS - Height before scroll */
    overflow-y: auto; /* Enable scroll */
    padding: 5px 15px 5px 5px; /* Padding (right side for scrollbar) */
    flex-grow: 1; /* Take available space */
    min-height: 200px; /* Minimum height */
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: #fdfdfd;
  }

  /* --- Job Card Styles --- */
  .job-card {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #fff;
    box-shadow: 0 2px 5px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    min-height: 280px; /* ADJUST AS NEEDED */
  }

  .job-card h3 {
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
    background-color: #b0563f;
  }

  .error-message, .loading-message, .no-jobs-message {
    color: #555;
    text-align: center;
    padding: 40px 20px;
    grid-column: 1 / -1;
    font-style: italic;
  }
  .error-message {
      color: red;
      font-style: normal;
      font-weight: bold;
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

  .filter-grid > div, .filter-grid > input, .filter-grid > select {
      position: relative;
  }

  /* --- Media Query for smaller screens --- */
  @media (max-width: 768px) {
    .job-listing {
      grid-template-columns: 1fr; /* Switch to 1 column */
    }
     .filter-grid {
       grid-template-columns: 1fr; /* Stack filters */
     }
     .job-details-grid {
        grid-template-columns: 1fr; /* Stack job details */
     }
  }
`;
// --- End Embedded CSS ---

// --- React Component ---
const JobFeed: React.FC = () => {
  // --- State and Refs ---
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterCity, setFilterCity] = useState('');
  const [filterMinBudget, setFilterMinBudget] = useState<number | ''>('');
  const [filterMaxBudget, setFilterMaxBudget] = useState<number | ''>('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterInsurance, setFilterInsurance] = useState<'yes' | 'no' | ''>('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityInputRef = useRef<HTMLDivElement>(null);

  // --- Memos and Effects ---
  const storedUser = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const isArtist = useMemo(() => storedUser?.user_type === "Artist", [storedUser]);

  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    allJobs.forEach(job => {
      if (job.city && typeof job.city === 'string') {
        cities.add(job.city);
      }
    });
    return Array.from(cities).sort();
  }, [allJobs]);

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

  const filteredJobs = useMemo(() => {
     return allJobs.filter(job => {
      if (filterCity && !job.city?.toLowerCase().includes(filterCity.toLowerCase())) return false;
      if (filterMinBudget !== '' && (job.budget === undefined || job.budget < filterMinBudget)) return false;
      if (filterMaxBudget !== '' && (job.budget === undefined || job.budget > filterMaxBudget)) return false;
      if (filterDifficulty && job.difficulty !== filterDifficulty) return false;
      if (filterCategory && job.artistCategory !== filterCategory) return false; // Filter using original value
      if (filterInsurance === 'yes' && job.insurance !== true) return false;
      if (filterInsurance === 'no' && job.insurance !== false) return false;
      return true;
    });
  }, [allJobs, filterCity, filterMinBudget, filterMaxBudget, filterDifficulty, filterCategory, filterInsurance]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target as Node)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- Handlers ---
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

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

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


  return (
    <>
      {/* Styles are embedded here */}
      <style>{componentStyles}</style>
      <Navbar />
      <div className="job-feed-container">

        {/* --- Filter Section --- */}
        <div className="job-filters">
          <h3>Filter jobs</h3>
          <div className="filter-grid">
            {/* City Filter with Autocomplete */}
            <div className="city-filter-container" ref={cityInputRef}>
              <input
                className="filter-input"
                type="text"
                placeholder="City"
                value={filterCity}
                onChange={handleCityInputChange}
                onFocus={() => {
                  if (filterCity.length > 0) {
                    const suggestions = uniqueCities.filter(city =>
                      city.toLowerCase().startsWith(filterCity.toLowerCase())
                    );
                     if (suggestions.length > 0) {
                       setCitySuggestions(suggestions);
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

            {/* Difficulty Filter */}
            <select
              className="filter-select"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <option value="">All difficulty levels</option>
              {difficultyLevels.map(level => (<option key={level} value={level}>{level}</option>))}
            </select>

             {/* Category Filter - APPLY FORMATTING HERE */}
            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All artist categories</option>
              {artistCategories.map((cat) => (
                 // Use original 'cat' for value, formatted name for display text
                <option key={cat} value={cat}>
                  {formatCategoryName(cat)} {/* <--- APPLY FORMATTING HERE */}
                </option>
              ))}
            </select>

            {/* Budget Filter */}
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

             {/* Insurance Filter */}
            <select
              className="filter-select"
              value={filterInsurance}
              onChange={(e) => setFilterInsurance(e.target.value as 'yes' | 'no' | '')}
            >
              <option value="">Insurance (All)</option>
              <option value="yes">Insurance provided</option>
              <option value="no">No insurance</option>
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
                  {typeof job.budget === 'number' && <p><strong>Budget:</strong> {formatCurrency(job.budget)}</p>}
                  {job.difficulty && <p><strong>Difficulty:</strong> {job.difficulty}</p>}

                  {/* Category Display - APPLY FORMATTING HERE */}
                  {job.artistCategory && (
                    <p>
                        <strong>Category:</strong>{' '}
                        {formatCategoryName(job.artistCategory)} {/* <--- APPLY FORMATTING HERE */}
                    </p>
                   )}

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
            // Added class for specific styling if needed
            <p className="no-jobs-message">No jobs match your current filters. Try adjusting them or check back later!</p>
          )}
        </div>
      </div>
    </>
  );
};


export default JobFeed;