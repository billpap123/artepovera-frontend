// src/pages/JobFeed.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Global.css';

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

const JobFeed: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn("No token found; user might not be logged in.");
          return;
        }
        const response = await axios.get(`${API_URL}/api/job-postings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setJobs(response.data);
      } catch (err) {
        console.error('❌ Error fetching jobs:', err);
        setError('Failed to fetch jobs. Please try again later.');
      }
    };

    fetchJobs();
  }, []);

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="job-feed" style={{ padding: '20px' }}>
      {jobs.length > 0 ? (
        jobs.map((job) => (
          <div
            key={job.id}
            className="job"
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <h3 style={{ margin: '0 0 5px' }}>{job.title}</h3>
            <p style={{ margin: '5px 0' }}>{job.description}</p>
            <p style={{ margin: '5px 0' }}>
              <strong>Posted by:</strong> {job.employerName}
            </p>
            {/* Show location if available */}
            {job.city && job.address && (
              <p style={{ margin: '5px 0' }}>
                <strong>Location:</strong> {job.city}, {job.address}
              </p>
            )}
            {/* Show budget */}
            {job.budget !== undefined && (
              <p style={{ margin: '5px 0' }}>
                <strong>Budget:</strong> ${job.budget}
              </p>
            )}
            {/* Show difficulty */}
            {job.difficulty && (
              <p style={{ margin: '5px 0' }}>
                <strong>Difficulty:</strong> {job.difficulty}
              </p>
            )}
            {/* Show deadline */}
            {job.deadline && (
              <p style={{ margin: '5px 0' }}>
                <strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}
              </p>
            )}
            {/* Show artist category */}
            {job.artistCategory && (
              <p style={{ margin: '5px 0' }}>
                <strong>Artist Category:</strong> {job.artistCategory.replace(/_/g, " ")}
              </p>
            )}
            {/* Show insurance status */}
            {typeof job.insurance === "boolean" && (
              <p style={{ margin: '5px 0' }}>
                <strong>Insurance Provided:</strong> {job.insurance ? "Yes" : "No"}
              </p>
            )}
            {job.created_at && (
              <p style={{ fontSize: '0.9em', color: '#666' }}>
                Posted on: {new Date(job.created_at).toLocaleString()}
              </p>
            )}
          </div>
        ))
      ) : (
        <p>No jobs available at the moment.</p>
      )}
    </div>
  );
};

export default JobFeed;
