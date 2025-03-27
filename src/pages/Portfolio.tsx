// src/pages/Portfolio.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from "../components/Navbar";
import '../styles/Portfolio.css';

export interface PortfolioItem {
  portfolio_id: number;
  image_url: string;
  description: string;
}

export interface PortfolioProps {
  // The actual artist_id from the DB (must be a number)
  artistId: number;
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

  // Adjust to your actual Vite env var name
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001';
  console.log('🔸 The artistId prop is:', artistId);

  // Fetch the portfolio only after we have a valid artistId
  useEffect(() => {
    if (!artistId || artistId <= 0) {
      return;
    }
    fetchPortfolio();
  }, [artistId]);

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

      const res = await axios.get(`${API_BASE_URL}/api/portfolios/${artistId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      // We no longer need to send artist_id because the backend will derive it from the token.
      formData.append("description", description);
      formData.append("image", selectedFile); // File input name must match backend configuration

      const res = await axios.post(`${API_BASE_URL}/api/portfolios`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      // Directly update state with the new portfolio item returned by the backend
      const newItem: PortfolioItem = res.data;
      setItems(prevItems => [...prevItems, newItem]);

      // Reset file and description
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

  // If artistId is still 0 or invalid, show a loading or info message
  if (!artistId || artistId <= 0) {
    return (
      <>
        <Navbar />
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>
          Loading artist data...
        </p>
      </>
    );
  }

  if (loading) return <p>Loading portfolio...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <>
      <Navbar />
      <div className="portfolio-page">
        <div className="portfolio-container">
          <h2>My Portfolio</h2>

          {/* Upload Form */}
          <form onSubmit={handleUpload} className="portfolio-upload-form">
            <input
              type="file"
              name="image"  // Must match the backend multer configuration
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
