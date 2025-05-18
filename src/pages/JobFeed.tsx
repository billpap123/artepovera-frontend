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

// --- FIX: CORRECT INTERFACE DEFINITION ---
interface Job {
  id: number;
  title: string;
  description: string;
  employerName: string;
  created_at?: string;
  city?: string;
  address?: string;
  budget?: string | null; // <-- CORRECTED: Allow string or null
  difficulty?: string;
  deadline?: string;
  artistCategory?: string;
  insurance?: boolean;
}
// --- END INTERFACE FIX ---

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
    font-family: 'Nunito', Arial, sans-serif; /* Added Nunito */
    max-width: 1200px; /* Overall page constraint */
    margin: 30px auto; /* Centering page content */
    width: 100%;
  }

  .job-feed-container h2 {
    text-align: center;
    margin-bottom: 30px;
    color: #333; /* Consider using your CSS variables */
    font-weight: 700;
    font-size: 2rem;
    flex-shrink: 0;
  }

  /* --- Filter Styles --- */
  .job-filters {
    background: #f9f9f9; /* Consider var(--bg-container-light) */
    padding: 25px; /* More padding */
    border-radius: 8px;
    margin-bottom: 30px; /* More space */
    box-shadow: 0 3px 8px rgba(0,0,0,0.07); /* Softer shadow */
    border: 1px solid #e0e0e0; /* Softer border */
    flex-shrink: 0;
  }

  .job-filters h3 {
      margin-top: 0;
      margin-bottom: 20px; /* More space */
      color: #444; /* Consider var(--text-medium) */
      border-bottom: 1px solid #ddd; /* Softer separator */
      padding-bottom: 12px;
      font-size: 1.3rem;
  }

  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Adjusted minmax */
    gap: 18px; /* Adjusted gap */
    align-items: center;
  }

  .filter-input,
  .filter-select {
    padding: 10px 12px;
    border: 1px solid #ccc; /* Consider var(--border-color) */
    border-radius: 6px; /* Softer radius */
    width: 100%;
    box-sizing: border-box;
    font-size: 0.95rem;
    background-color: #fff; /* Ensure background for select */
  }
  .filter-input:focus,
  .filter-select:focus {
    border-color: #C96A50; /* var(--terracotta-red) or your accent */
    box-shadow: 0 0 0 2px rgba(201, 106, 80, 0.2);
    outline: none;
  }

  .budget-filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
  }
  .budget-filter-group input { flex: 1; min-width: 70px; }
  .budget-filter-group span { padding: 0 5px; color: #555; }

  .clear-filters-button {
    padding: 10px 15px;
    background-color: #E57373; /* Softer Red/Orange for clear */
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-weight: 600;
    font-size: 0.95rem;
  }
  .clear-filters-button:hover {
      background-color: #EF5350; /* Darker shade */
  }

  /* --- Job Listing Styles --- */
  .job-listing {
    display: grid;
    /* Forcing 2 columns explicitly. Media query handles 1 column. */
    grid-template-columns: repeat(2, 1fr);
    gap: 25px; /* Slightly more gap */
    max-height: 75vh; /* Keep if you want a scrollable fixed height area */
    overflow-y: auto;
    padding: 25px; /* More padding */
    flex-grow: 1;
    min-height: 450px; /* <<< KEY: Keep this to maintain height when empty */
    width: 100%;       /* <<< KEY: Keep this to maintain width */
    box-sizing: border-box;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: #fdfdfd; /* Light background for the listing area */
    position: relative; /* Needed if you ever want to absolutely position something inside */
  }

  /* --- Job Card Styles --- */
  .job-card {
    padding: 20px;
    border: 1px solid #e0e0e0; /* Softer border for cards */
    border-radius: 8px;
    background-color: #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    display: flex;
    flex-direction: column;
    min-height: 280px; /* Or adjust as needed */
    transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out;
  }
  .job-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-3px);
  }

  .job-card h3 {
    color: #774402; /* Consider var(--terracotta-red) or var(--text-medium) */
    margin: 0 0 10px 0;
    font-size: 1.3em;
  }
   .job-card p { margin: 0; font-size: 0.9rem; color: #555; line-height: 1.5; }
  .employer-name { font-size: 0.85em; color: #7f8c8d; margin-bottom: 15px; } /* Consider var(--text-light) */
  .job-description { color: #34495e; margin-bottom: 15px; flex-grow: 1; } /* Consider var(--text-dark) */
  .job-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 15px; font-size: 0.85em; color: #555; margin-bottom: 15px; }
   .job-details-grid p { margin-bottom: 5px; font-size: 1em; } /* Make text slightly larger relative to parent */
   .job-card .posted-date { font-size: 0.75em; color: #999; margin-top: 10px; text-align: right; }

  .apply-button {
    margin-top: auto; padding: 10px 15px; background-color: #C96A50; /* var(--terracotta-red) */
    color: white; border: none; border-radius: 4px; cursor: pointer; text-align: center;
    font-weight: bold; transition: background-color 0.2s ease; align-self: flex-start;
  }
  .apply-button:hover { background-color: #b0563f; /* var(--dark-red) or darker terracotta */ }

  /* --- Styling for Loading/Error/No Jobs Messages --- */
  .job-listing .loading-message,
  .job-listing .error-message,
  .job-listing .no-jobs-message {
    grid-column: 1 / -1; /* Crucial: Make the message span all columns */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 40px 20px;
    color: #6c757d; /* var(--text-light) */
    font-style: italic;
    font-size: 1.1em;
    /* The message will now be centered within the full width of the grid */
    /* and the .job-listing min-height will be respected */
    /* No specific height needed here, let parent control it */
  }
  .job-listing .error-message {
      color: #dc3545; /* var(--danger-red) or similar */
      font-style: normal;
      font-weight: bold;
  }

  /* --- Autocomplete Styles --- */
  .city-filter-container { position: relative; }
  .city-suggestions { position: absolute; background-color: white; border: 1px solid #ccc; border-top: none; border-radius: 0 0 4px 4px; list-style: none; margin: 0; padding: 0; max-height: 150px; overflow-y: auto; z-index: 100; /* Higher z-index */ width: 100%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); box-sizing: border-box; }
  .city-suggestions li { padding: 8px 12px; cursor: pointer; }
  .city-suggestions li:hover { background-color: #f0f0f0; }
  .filter-grid > div { position: relative; /* For suggestions dropdown positioning */ }


  /* --- Media Query for smaller screens --- */
  @media (max-width: 768px) {
    .job-listing {
      grid-template-columns: 1fr; /* Switch to 1 column */
      min-height: 300px; /* Adjust min-height for single column view if needed */
    }
    .filter-grid {
      grid-template-columns: 1fr; /* Stack filters */
    }
    .job-details-grid {
       grid-template-columns: 1fr; /* Stack job details */
    }
    .job-card {
        min-height: auto; /* Allow cards to be shorter in single column */
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

  // --- Filtering Logic (Handles string budget) ---
  const filteredJobs = useMemo(() => {
     return allJobs.filter(job => {
      // Parse budget string/null to number/undefined for comparisons
      // Added type assertion (as string) because interface now correctly allows string/null
      // parseFloat handles null input returning NaN, which is checked below
      const jobBudgetNumber = job.budget == null ? undefined : parseFloat(job.budget as string);

      if (filterCity && !job.city?.toLowerCase().includes(filterCity.toLowerCase())) return false;
      // Use parsed number for budget filtering, check for NaN
      if (filterMinBudget !== '' && (jobBudgetNumber === undefined || isNaN(jobBudgetNumber) || jobBudgetNumber < filterMinBudget)) return false;
      if (filterMaxBudget !== '' && (jobBudgetNumber === undefined || isNaN(jobBudgetNumber) || jobBudgetNumber > filterMaxBudget)) return false;
      if (filterDifficulty && job.difficulty !== filterDifficulty) return false;
      if (filterCategory && job.artistCategory !== filterCategory) return false;
      if (filterInsurance === 'yes' && job.insurance !== true) return false;
      if (filterInsurance === 'no' && job.insurance !== false) return false;
      return true;
    });
  }, [allJobs, filterCity, filterMinBudget, filterMaxBudget, filterDifficulty, filterCategory, filterInsurance]);
  // --- End Filtering Logic ---

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

  // Updated formatCurrency to handle potential NaN from parseFloat
  const formatCurrency = (amount: number | undefined): string => {
    // Check for undefined OR NaN before formatting
    if (amount === undefined || isNaN(amount)) return 'N/A';
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
            {/* City Filter */}
            <div className="city-filter-container" ref={cityInputRef}>
              <input className="filter-input" type="text" placeholder="City" value={filterCity} onChange={handleCityInputChange} onFocus={() => { if (filterCity.length > 0) { const suggestions = uniqueCities.filter(city => city.toLowerCase().startsWith(filterCity.toLowerCase())); if (suggestions.length > 0) { setCitySuggestions(suggestions); setShowCitySuggestions(true); } } }} autoComplete="off" />
              {showCitySuggestions && citySuggestions.length > 0 && ( <ul className="city-suggestions"> {citySuggestions.map((city, index) => ( <li key={index} onClick={() => handleSuggestionClick(city)}>{city}</li> ))} </ul> )}
            </div>
             {/* Difficulty Filter */}
             <select className="filter-select" value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}> <option value="">All difficulty levels</option> {difficultyLevels.map(level => (<option key={level} value={level}>{level}</option>))} </select>
             {/* Category Filter */}
             <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}> <option value="">All artist categories</option> {artistCategories.map((cat) => ( <option key={cat} value={cat}>{formatCategoryName(cat)}</option> ))} </select>
             {/* Budget Filter */}
             <div className="budget-filter-group"> <input className="filter-input" type="number" placeholder="Min budget" value={filterMinBudget} onChange={(e) => setFilterMinBudget(e.target.value === '' ? '' : Number(e.target.value))} /> <span>-</span> <input className="filter-input" type="number" placeholder="Max budget" value={filterMaxBudget} onChange={(e) => setFilterMaxBudget(e.target.value === '' ? '' : Number(e.target.value))} /> </div>
             {/* Insurance Filter */}
             <select className="filter-select" value={filterInsurance} onChange={(e) => setFilterInsurance(e.target.value as 'yes' | 'no' | '')}> <option value="">Insurance (All)</option> <option value="yes">Insurance provided</option> <option value="no">No insurance</option> </select>
             {/* Clear Button */}
             <button onClick={clearFilters} className="clear-filters-button"> Clear filters </button>
          </div>
        </div>

        {/* --- Job Listing Section --- */}
        <div className="job-listing">
           {isLoading ? ( <p className="loading-message">Loading jobs...</p> )
            : error ? ( <p className="error-message">{error}</p> )
            : filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <div key={job.id} className="job-card">
                    <h3>{job.title}</h3>
                    <p className="employer-name">Posted by: {job.employerName || 'Unknown Employer'}</p>
                    <p className="job-description">{job.description}</p>
                    <div className="job-details-grid">
                      {job.city && <p><strong>Location:</strong> {job.city}{job.address ? `, ${job.address}` : ''}</p>}

                      {/* --- Display Logic using parseFloat (with type assertion) --- */}
                      {/* Check if budget string exists AND is a parsable number */}
                      {/* Added type assertion (as string) to satisfy TS */}
                      {job.budget != null && !isNaN(parseFloat(job.budget as string)) && (
                           <p>
                             <strong>Budget:</strong> {formatCurrency(parseFloat(job.budget as string))}
                           </p>
                      )}
                      {/* --- End Display Logic --- */}

                      {job.difficulty && <p><strong>Difficulty:</strong> {job.difficulty}</p>}
                      {job.artistCategory && ( <p> <strong>Category:</strong>{' '} {formatCategoryName(job.artistCategory)} </p> )}
                      {job.deadline && <p><strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}</p>}
                      {typeof job.insurance === 'boolean' && <p><strong>Insurance:</strong> {job.insurance ? "Yes" : "No"}</p>}
                    </div>
                    {job.created_at && ( <p className="posted-date"> Posted on: {new Date(job.created_at).toLocaleString()} </p> )}
                    {isArtist && ( <button onClick={() => handleApply(job.id)} className="apply-button"> Apply now </button> )}
                  </div>
                ))
              ) : ( <p className="no-jobs-message">No jobs match your current filters. Try adjusting them or check back later!</p> )
          }
        </div>
      </div>
    </>
  );
};

export default JobFeed;