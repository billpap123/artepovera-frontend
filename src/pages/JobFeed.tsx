// src/pages/JobFeed.tsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import '../styles/Global.css'; // Make sure this contains card and filter styles
import Navbar from '../components/Navbar'; // Assuming you want the Navbar here too

// Use the same categories as PostJobPage
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
  employerName: string; // Assuming the backend provides this (might need adjustment)
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

const JobFeed: React.FC = () => {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state

  // Filter States
  const [filterCity, setFilterCity] = useState('');
  const [filterMinBudget, setFilterMinBudget] = useState<number | ''>('');
  const [filterMaxBudget, setFilterMaxBudget] = useState<number | ''>('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterInsurance, setFilterInsurance] = useState<'yes' | 'no' | ''>(''); // '' means All

  // User Type Check
  const storedUser = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const isArtist = useMemo(() => storedUser?.user_type === "Artist", [storedUser]);

  // Fetch all jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        // No need to check for token here, backend should handle authorization
        // Let non-logged-in users see jobs, but apply button logic handles auth
        const response = await axios.get(`${API_URL}/api/job-postings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}, // Send token if available
        });
        setAllJobs(response.data || []); // Ensure it's an array
      } catch (err: any) {
        console.error("❌ Error fetching jobs:", err);
        setError(err.response?.data?.message || "Failed to fetch jobs. Please try again later.");
        setAllJobs([]); // Clear jobs on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []); // Fetch only once on mount

  // Apply Filters (using useMemo for optimization)
  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      // City Filter (Case-insensitive partial match)
      if (filterCity && !job.city?.toLowerCase().includes(filterCity.toLowerCase())) {
        return false;
      }
      // Min Budget Filter
      if (filterMinBudget !== '' && (job.budget === undefined || job.budget < filterMinBudget)) {
        return false;
      }
      // Max Budget Filter
      if (filterMaxBudget !== '' && (job.budget === undefined || job.budget > filterMaxBudget)) {
        return false;
      }
      // Difficulty Filter
      if (filterDifficulty && job.difficulty !== filterDifficulty) {
        return false;
      }
      // Artist Category Filter
      if (filterCategory && job.artistCategory !== filterCategory) {
        return false;
      }
      // Insurance Filter
      if (filterInsurance === 'yes' && job.insurance !== true) {
        return false;
      }
      if (filterInsurance === 'no' && job.insurance !== false) {
        return false;
      }
      // If all checks pass, include the job
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
      // Assuming your apply endpoint is /api/job-postings/:jobId/apply (adjust if different)
      // Ensure the user has an artist_id available, might need to fetch it or store it upon login
      // const artistId = storedUser?.artist_id; // Example - adjust based on your user object structure
      // if (!artistId) {
      //   alert("Could not find Artist ID. Cannot apply.");
      //   return;
      // }

      const response = await axios.post(`${API_URL}/api/job-postings/${jobId}/apply`, {}, { // Send empty body or required data
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(response.data.message || "Application successful!");
      // Optionally: Update UI to show application status for this job
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
  };

  // Format currency utility
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount); // Adjust currency as needed
  };

  return (
    <>
      <Navbar />
      <div className="job-feed-container" style={styles.container}>
        <h2 style={styles.heading}>Find Your Next Opportunity</h2>

        {/* --- Filter Section --- */}
        <div className="job-filters" style={styles.filtersContainer}>
          <h3 style={styles.filterHeading}>Filter Jobs</h3>
          <div style={styles.filterGrid}>
            <input
              type="text"
              placeholder="City"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              style={styles.filterInput}
            />
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">All Difficulty Levels</option>
              {difficultyLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">All Artist Categories</option>
              {artistCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <div style={styles.budgetFilterGroup}>
              <input
                type="number"
                placeholder="Min Budget"
                value={filterMinBudget}
                onChange={(e) => setFilterMinBudget(e.target.value === '' ? '' : Number(e.target.value))}
                style={{ ...styles.filterInput, ...styles.budgetInput }}
              />
              <span style={styles.budgetSeparator}>-</span>
              <input
                type="number"
                placeholder="Max Budget"
                value={filterMaxBudget}
                onChange={(e) => setFilterMaxBudget(e.target.value === '' ? '' : Number(e.target.value))}
                style={{ ...styles.filterInput, ...styles.budgetInput }}
              />
            </div>
            <select
              value={filterInsurance}
              onChange={(e) => setFilterInsurance(e.target.value as 'yes' | 'no' | '')}
              style={styles.filterSelect}
            >
              <option value="">Insurance (All)</option>
              <option value="yes">Insurance Provided</option>
              <option value="no">No Insurance</option>
            </select>
            <button onClick={clearFilters} style={styles.clearButton}>
              Clear Filters
            </button>
          </div>
        </div>

        {/* --- Job Listing Section --- */}
        <div className="job-listing" style={styles.jobListing}>
          {isLoading ? (
            <p>Loading jobs...</p>
          ) : error ? (
            <p className="error-message" style={styles.errorMessage}>{error}</p>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div key={job.id} className="job-card" style={styles.jobCard}>
                <h3 style={styles.jobTitle}>{job.title}</h3>
                <p style={styles.employerName}>Posted by: {job.employerName || 'Unknown Employer'}</p>
                <p style={styles.jobDescription}>{job.description}</p>
                <div style={styles.jobDetailsGrid}>
                  {job.city && <p><strong>Location:</strong> {job.city}{job.address ? `, ${job.address}` : ''}</p>}
                  {job.budget !== undefined && <p><strong>Budget:</strong> {formatCurrency(job.budget)}</p>}
                  {job.difficulty && <p><strong>Difficulty:</strong> {job.difficulty}</p>}
                  {job.artistCategory && <p><strong>Category:</strong> {job.artistCategory.replace(/_/g, " ")}</p>}
                  {job.deadline && <p><strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}</p>}
                  {typeof job.insurance === "boolean" && <p><strong>Insurance:</strong> {job.insurance ? "Yes" : "No"}</p>}
                </div>
                 {job.created_at && (
                    <p style={styles.postedDate}>
                    Posted on: {new Date(job.created_at).toLocaleString()}
                    </p>
                )}
                {isArtist && (
                  <button
                    onClick={() => handleApply(job.id)}
                    style={styles.applyButton}
                    className="apply-button" // Add class for specific hover/active styles
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

// Basic Inline Styles (Consider moving to CSS file for better organization)
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif', // Example font
    maxWidth: '1200px',
    margin: '0 auto',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#333',
  },
  filtersContainer: {
    background: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  filterHeading: {
      marginTop: 0,
      marginBottom: '15px',
      color: '#444',
      borderBottom: '1px solid #eee',
      paddingBottom: '10px',
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', // Responsive grid
    gap: '15px',
    alignItems: 'center',
  },
  filterInput: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100%', // Make inputs fill grid cell
    boxSizing: 'border-box', // Include padding and border in element's total width/height
  },
  filterSelect: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100%',
    boxSizing: 'border-box',
    background: 'white', // Ensure select background is white
  },
  budgetFilterGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
  },
  budgetInput: {
    flex: 1, // Allow budget inputs to share space
    minWidth: '80px', // Prevent inputs from becoming too small
  },
  budgetSeparator: {
      padding: '0 5px',
  },
  clearButton: {
    padding: '10px 15px',
    backgroundColor: '#e74c3c', // Red color for clear
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    fontWeight: 'bold',
    // Ensure it aligns well in the grid if needed
    // gridColumn: 'span 1', // Adjust span if necessary
  },
  jobListing: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Responsive cards
    gap: '20px',
  },
  jobCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column', // Stack content vertically
  },
  jobTitle: {
    margin: '0 0 10px 0',
    color: '#2c3e50', // Darker blue color
    fontSize: '1.3em',
  },
  employerName: {
    fontSize: '0.9em',
    color: '#7f8c8d', // Grey color
    marginBottom: '15px',
  },
  jobDescription: {
    color: '#34495e', // Slightly lighter blue-grey
    marginBottom: '15px',
    flexGrow: 1, // Allow description to take up available space
    lineHeight: 1.5,
  },
  jobDetailsGrid: {
     display: 'grid',
     gridTemplateColumns: '1fr 1fr', // Two columns for details
     gap: '5px 15px', // Row and column gap
     fontSize: '0.9em',
     color: '#555',
     marginBottom: '10px',
  },
   postedDate: {
    fontSize: '0.8em',
    color: '#999',
    marginTop: '10px',
    textAlign: 'right',
  },
  applyButton: {
    marginTop: 'auto', // Pushes button to the bottom of the card
    padding: '10px 15px',
    backgroundColor: '#3498db', // Blue color
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    textAlign: 'center',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
    alignSelf: 'flex-start', // Align button to the start (left)
  },
  errorMessage: {
    color: 'red',
    textAlign: 'center',
    padding: '20px',
  }
};


export default JobFeed;