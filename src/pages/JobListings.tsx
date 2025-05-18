// src/components/JobPostings.tsx (or similar path)
import React, { useEffect, useState, useMemo } from 'react'; // Removed useCallback and useRef if not used
import axios from 'axios';
import '../styles/Global.css'; // Or specific styles for this component

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:50001";

interface JobPosting {
  id: number; // Assuming backend sends 'id' after mapping
  title: string;
  description: string;
  category?: string; // This might be 'artistCategory' from backend
  city?: string;
  address?: string;
  budget?: number | string | null; // Allow for number or string from backend
  difficulty?: string;
  employerName?: string;
  created_at?: string;
  deadline?: string;    // Added deadline
  insurance?: boolean; // Added insurance
  artistCategory?: string; // Keep if backend sends this
}

interface JobPostingsProps {
  employerId?: number; // To fetch jobs for a specific employer
  // Or, if this component always fetches ALL jobs, employerId might not be needed
  // and jobs could be passed as a prop from a parent like JobFeed.
  // For this example, I'll assume it fetches its own jobs based on employerId or all jobs.
}

// Helper to format currency - can be moved to utils
const formatCurrency = (amount: number | string | undefined | null): string => {
    if (amount == null) return 'N/A';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numAmount);
};

// Helper to format category name - can be moved to utils
const formatCategoryName = (category: string | undefined): string => {
  if (!category) return '';
  const spacedName = category.replace(/_/g, ' ');
  return spacedName.charAt(0).toUpperCase() + spacedName.slice(1);
};


const JobPostings: React.FC<JobPostingsProps> = ({ employerId }) => {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Added loading state for initial fetch

  // --- ADDED STATE FOR APPLICATION TRACKING ---
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [applyingToJobId, setApplyingToJobId] = useState<number | null>(null);
  // --- END ADDED STATE ---

  const storedUser = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const isArtist = useMemo(() => storedUser?.user_type === 'Artist', [storedUser]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      // No headers needed if /api/job-postings is public and no employerId is specified,
      // but usually job listings are public. Auth might be needed for employer-specific.
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        let url = `${API_URL}/api/job-postings`; // Default to all job postings
        if (employerId) {
          // If fetching for a specific employer, ensure this endpoint is correct
          // and if it requires authentication.
          url = `${API_URL}/api/job-postings/employer?employer_id=${employerId}`;
        }

        const jobsResponse = await axios.get(url, { headers });
        setJobPostings(jobsResponse.data || []); // Assuming backend sends array directly or in {jobs: []}

        // If user is an artist, fetch their applications
        if (isArtist && token && storedUser.user_id) {
          try {
            const appsResponse = await axios.get(`${API_URL}/api/artists/my-applications`, { headers });
            if (appsResponse.data && Array.isArray(appsResponse.data.appliedJobIds)) {
              setAppliedJobIds(new Set(appsResponse.data.appliedJobIds));
              console.log("[JobPostings] Fetched applied job IDs:", appsResponse.data.appliedJobIds);
            }
          } catch (appsErr) {
            console.error("Error fetching artist's job applications for JobPostings component:", appsErr);
          }
        }
      } catch (err: any) {
        console.error('Error fetching job postings:', err);
        setError(err.response?.data?.message || 'Failed to load job postings.');
        setJobPostings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [employerId, isArtist, storedUser.user_id, API_URL]); // Added dependencies

  // --- UPDATED handleApply Function ---
  const handleApply = async (jobId: number) => {
    const token = localStorage.getItem('token');
    if (!token || !isArtist) {
      alert("You must be logged in as an Artist to apply for jobs.");
      return;
    }
    if (appliedJobIds.has(jobId)) {
        alert("You have already applied to this job.");
        return;
    }

    setApplyingToJobId(jobId);
    setError(null);

    try {
      // --- Ensure this URL matches your backend route for applying ---
      const response = await axios.post(
        `${API_URL}/api/job-postings/${jobId}/apply`, // Changed from /api/jobs/ to /api/job-postings/
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(response.data.message || "Application successful!");
      if ((response.status === 201 || response.status === 200) && response.data.application) {
        setAppliedJobIds(prev => new Set(prev).add(jobId));
      }
    } catch (error: any) {
      console.error(`Error applying to job ${jobId}:`, error);
      const errorMessage = error.response?.data?.message || "Failed to apply. Please try again.";
      alert(errorMessage);
      if (error.response?.status === 409) { // Already applied (confirmed by backend)
        setAppliedJobIds(prev => new Set(prev).add(jobId));
      }
    } finally {
      setApplyingToJobId(null);
    }
  };
  // --- END UPDATED handleApply ---

  if (isLoading) {
      return <div className="job-postings-loading" style={{padding: '20px', textAlign: 'center'}}>Loading job postings...</div>;
  }

  return (
    <div className="job-postings-list-container" style={{ padding: '20px' }}> {/* Renamed class for clarity */}
      <h4>{employerId ? "Job Postings by this Employer" : "Available Job Postings"}</h4>
      {error && <p className="error-message" style={{color: 'red'}}>{error}</p>}
      {jobPostings.length > 0 ? (
        jobPostings.map((job) => (
          <div
            key={job.id}
            className="job-posting-item-card" // Using a more descriptive class
            style={{ /* Your existing card styles or move to CSS file */ }}
          >
            <h5 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>{job.title}</h5>
            {job.employerName && ( <p className="employer-name-small" style={{fontSize: '0.85rem', color: '#666', marginBottom: '10px'}}> Posted by: {job.employerName} </p> )}
            <p style={{ margin: '5px 0', fontSize: '0.95rem' }}>{job.description}</p>

            <div className="job-details-inline" style={{fontSize: '0.9rem', color: '#444', marginTop: '10px'}}>
                {job.city && ( <span><strong>Location:</strong> {job.city}{job.address ? `, ${job.address}` : ''} | </span> )}
                {job.budget != null && !isNaN(parseFloat(job.budget as string)) && ( <span><strong>Budget:</strong> {formatCurrency(job.budget)} | </span> )}
                {job.difficulty && ( <span><strong>Difficulty:</strong> {job.difficulty} | </span> )}
                {job.artistCategory && ( <span><strong>Category:</strong> {formatCategoryName(job.artistCategory)} | </span> )}
                {job.deadline && ( <span><strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()} | </span> )}
                {typeof job.insurance === 'boolean' && ( <span><strong>Insurance:</strong> {job.insurance ? "Provided" : "Not Provided"}</span> )}
            </div>

            {job.created_at && ( <p style={{ fontSize: '0.8em', color: '#777', textAlign: 'right', marginTop: '10px' }}> Posted: {new Date(job.created_at).toLocaleDateString()} </p> )}

            {/* --- UPDATED APPLY BUTTON --- */}
            {isArtist && (
              <button
                onClick={() => handleApply(job.id)}
                className="apply-button" // Add this class to your CSS
                disabled={appliedJobIds.has(job.id) || applyingToJobId === job.id}
                style={{ /* Your existing button styles or move to CSS */ }}
              >
                {applyingToJobId === job.id
                  ? "Applying..."
                  : appliedJobIds.has(job.id)
                  ? 'Applied'
                  : 'Apply Now'}
              </button>
            )}
            {/* --- END UPDATED APPLY BUTTON --- */}
          </div>
        ))
      ) : (
        <p>No job postings found.</p>
      )}
    </div>
  );
};

export default JobPostings;