// src/pages/Portfolio.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from "../components/Navbar";
import '../styles/Portfolio.css';

// Define the type for a single portfolio item
export interface PortfolioItem {
  portfolio_id: number;
  image_url: string;
  description: string;
}

// Define the props for the Portfolio component;
// artistId is optional. If not provided, we fetch the logged‐in artist’s portfolio.
export interface PortfolioProps {
  artistId?: number;
}

const Portfolio: React.FC<PortfolioProps> = ({ artistId }) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [editMode, setEditMode] = useState<{ id: number | null; description: string }>({
    id: null,
    description: '',
  });

  // Use your environment variable for the backend URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001';

  // Log the provided artistId for debugging
  console.log('🔸 Provided artistId prop is:', artistId);

  // Fetch portfolio data when the component mounts or when artistId changes
  useEffect(() => {
    fetchPortfolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  // Depending on whether an artistId is provided, we either fetch the portfolio for that artist
  // or, if not provided, fetch the logged-in artist's portfolio.
  const fetchPortfolio = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in.');
        setLoading(false);
        return;
      }

      let res;
      if (artistId && artistId > 0) {
        // Use the provided artistId
        res = await axios.get(`${API_BASE_URL}/api/portfolios/${artistId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Fetch for the currently logged-in artist
        res = await axios.get(`${API_BASE_URL}/api/portfolios/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setItems(res.data);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError('Failed to load portfolio items.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select an image first.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No token found. You must be logged in.');
        return;
      }
      const formData = new FormData();
      // We don’t send artist_id here because the backend uses the token (for /api/portfolios/me)
      // or if an artistId is provided, the backend should ignore it if not needed.
      formData.append("description", description);
      formData.append("image", selectedFile);

      const res = await axios.post(`${API_BASE_URL}/api/portfolios`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      // Append new item to state
      const newItem: PortfolioItem = res.data;
      setItems(prevItems => [...prevItems, newItem]);

      // Reset file & description
      setSelectedFile(null);
      setDescription('');
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image.');
    }
  };

  const handleEdit = async (portfolioId: number) => {
    if (!editMode.description.trim()) {
      alert('Description cannot be empty.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No token found. Please log in.');
        return;
      }
      await axios.put(
        `${API_BASE_URL}/api/portfolios/${portfolioId}`,
        { description: editMode.description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditMode({ id: null, description: '' });
      fetchPortfolio();
    } catch (err) {
      console.error('Error updating portfolio item:', err);
      alert('Failed to update portfolio item.');
    }
  };

  const handleDelete = async (portfolioId: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No token found. Please log in.');
        return;
      }
      await axios.delete(`${API_BASE_URL}/api/portfolios/${portfolioId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPortfolio();
    } catch (err) {
      console.error('Error deleting portfolio item:', err);
      alert('Failed to delete portfolio item.');
    }
  };

  if (loading) return <><Navbar /><p>Loading portfolio...</p></>;
  if (error) return <><Navbar /><p className="error-message">{error}</p></>;

  return (
    <>
      <Navbar />
      <div className="portfolio-page">
        <div className="portfolio-container">
          <h2>My portfolio</h2>

          {/* Upload Form */}
          <form onSubmit={handleUpload} className="portfolio-upload-form">
            <input
              type="file"
              name="image"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
              required
            />
            <input
              type="text"
              placeholder="Enter description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <button type="submit">Upload</button>
          </form>

          {/* Portfolio Display */}
          <div className="portfolio-grid">
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item.portfolio_id} className="portfolio-item">
                  <img
                    src={item.image_url}
                    alt="Portfolio Item"
                    className="portfolio-image"
                  />
                  {editMode.id === item.portfolio_id ? (
                    <input
                      type="text"
                      value={editMode.description}
                      onChange={(e) =>
                        setEditMode({ ...editMode, description: e.target.value })
                      }
                    />
                  ) : (
                    <p>{item.description}</p>
                  )}
                  <div className="portfolio-actions">
                    {editMode.id === item.portfolio_id ? (
                      <button onClick={() => handleEdit(item.portfolio_id)}>
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setEditMode({ id: item.portfolio_id, description: item.description })
                        }
                      >
                        Edit
                      </button>
                    )}
                    <button onClick={() => handleDelete(item.portfolio_id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No portfolio items available.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Portfolio;
