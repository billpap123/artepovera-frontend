// src/pages/Portfolio.tsx
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Navbar from "../components/Navbar";
import { useUserContext } from '../context/UserContext';
import '../styles/Portfolio.css'; // Make sure to create/update this CSS file
// Consider importing icons for PDF/Video if you have them
// import { FaFilePdf, FaVideo } from 'react-icons/fa';

// --- UPDATED PortfolioItem Interface ---
export interface PortfolioItem {
  portfolio_id: number;
  artist_id: number;
  image_url: string; // Stores URL for images, PDFs, or videos
  description: string;
  item_type?: 'image' | 'pdf' | 'video' | 'other'; // Optional: if backend provides it
  created_at?: string;
}

export interface PortfolioProps {
  artistId?: number;
}

// --- Helper to determine file type from URL (simple version) ---
const getItemTypeFromUrl = (url: string): 'image' | 'pdf' | 'video' | 'other' => {
    if (!url) return 'other';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.match(/\.(jpeg|jpg|gif|png|webp)$/)) {
        return 'image';
    }
    if (lowerUrl.match(/\.pdf$/)) {
        return 'pdf';
    }
    if (lowerUrl.match(/\.(mp4|mov|webm|avi|flv)$/)) {
        return 'video';
    }
    return 'other';
};

const Portfolio: React.FC<PortfolioProps> = ({ artistId: viewingArtistId }) => {
  const { userId: loggedInUserId, artistId: loggedInUserArtistId } = useUserContext();

  const targetArtistId = viewingArtistId || loggedInUserArtistId;
  const isOwner = targetArtistId === loggedInUserArtistId && !!loggedInUserArtistId;

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001';

  const fetchPortfolio = useCallback(async () => {
    if (!targetArtistId) {
      console.warn("No target artist ID for portfolio.");
      setError(isOwner ? "Could not find your artist profile ID." : "Artist ID not specified.");
      setLoading(false);
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_BASE_URL}/api/portfolios/${targetArtistId}`, { headers });
      
      // Assign item_type based on URL if backend doesn't provide it
      const portfolioWithTypes = (res.data || []).map((item: PortfolioItem) => ({
        ...item,
        item_type: item.item_type || getItemTypeFromUrl(item.image_url)
      }));
      setItems(portfolioWithTypes);

    } catch (err: any) {
      console.error('Error fetching portfolio:', err);
      setError(err.response?.data?.message || 'Failed to load portfolio items.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [targetArtistId, API_BASE_URL, isOwner]); // Added isOwner for error message context

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf', 'video/mp4', 'video/quicktime', 'video/webm'];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        alert('Invalid file type. Please select an Image (PNG, JPG, GIF), PDF, or Video (MP4, MOV, WebM).');
        e.target.value = '';
        setSelectedFile(null);
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !description.trim()) {
      alert('Please select a file and enter a description.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { throw new Error('Authentication token not found.'); }
      const formData = new FormData();
      formData.append("description", description.trim());
      formData.append("image", selectedFile); // Backend expects 'image' field

      const res = await axios.post(`${API_BASE_URL}/api/portfolios`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      
      const newItem: PortfolioItem = {
          ...res.data,
          item_type: res.data.item_type || getItemTypeFromUrl(res.data.image_url)
      };
      setItems(prevItems => [newItem, ...prevItems]); // Add to top for immediate visibility
      setSelectedFile(null);
      setDescription('');
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Error uploading item:', err);
      const message = err.response?.data?.message || 'Failed to upload item.';
      setError(message);
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const startEditing = (item: PortfolioItem) => { setEditItemId(item.portfolio_id); setEditDescription(item.description); };
  const cancelEditing = () => { setEditItemId(null); setEditDescription(''); };

  const handleSaveEdit = async (portfolioId: number) => {
    if (!editDescription.trim()) { alert('Description cannot be empty.'); return; }
    const originalItem = items.find(item => item.portfolio_id === portfolioId);
    if (editDescription === originalItem?.description) { cancelEditing(); return; }
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { throw new Error('Authentication token not found.'); }
      await axios.put(`${API_BASE_URL}/api/portfolios/${portfolioId}`, { description: editDescription.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setItems(prevItems => prevItems.map(item => item.portfolio_id === portfolioId ? { ...item, description: editDescription.trim() } : item));
      cancelEditing();
    } catch (err: any) { console.error('Error updating portfolio item:', err); const message = err.response?.data?.message || 'Failed to update.'; alert(message); }
    finally { setUploading(false); }
  };

  const handleDelete = async (portfolioId: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    setUploading(true); setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { throw new Error('Authentication token not found.'); }
      await axios.delete(`${API_BASE_URL}/api/portfolios/${portfolioId}`, { headers: { Authorization: `Bearer ${token}` } });
      setItems(prevItems => prevItems.filter(item => item.portfolio_id !== portfolioId));
    } catch (err: any) { console.error('Error deleting portfolio item:', err); const message = err.response?.data?.message || 'Failed to delete.'; alert(message); }
    finally { setUploading(false); }
  };

  if (loading) return <><Navbar /><div className="portfolio-page loading-portfolio"><p className="loading-message">Loading portfolio...</p></div></>;
  if (error && !isOwner && items.length === 0) return <><Navbar /><div className="portfolio-page error-portfolio"><p className="error-message">{error}</p></div></>; // Show error if public view fails and no items

  return (
    <>
      <Navbar />
      <div className="portfolio-page">
        <div className="portfolio-header">
            <h2>{isOwner ? "Manage My Portfolio" : "Artist Portfolio"}</h2>
            {isOwner && !showAddForm && (
                <button onClick={() => setShowAddForm(true)} className="add-item-button">
                    + Add New Work
                </button>
            )}
        </div>

        {error && <p className="error-message" style={{textAlign: 'center', marginBottom: '20px'}}>{error}</p>}

        {isOwner && showAddForm && (
          <form onSubmit={handleUpload} className="portfolio-upload-form card-style">
            <h3>Upload New Work</h3>
            <div className="form-group">
              <label htmlFor="portfolioFile">Select File (Image, PDF, Video)*</label>
              <input
                id="portfolioFile" type="file" name="image"
                accept="image/png, image/jpeg, image/gif, application/pdf, video/mp4, video/quicktime, video/webm" // Updated accept
                onChange={handleFileChange} required
              />
            </div>
            <div className="form-group">
              <label htmlFor="portfolioDesc">Description*</label>
              <textarea
                id="portfolioDesc" placeholder="Describe your work, CV content, or video..."
                value={description} onChange={(e) => setDescription(e.target.value)}
                required rows={4}
              />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={uploading || !selectedFile || !description.trim()} className="submit-btn">
                {uploading ? "Uploading..." : "Upload to Portfolio"}
              </button>
              <button type="button" onClick={() => { setShowAddForm(false); setSelectedFile(null); setDescription('');}} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="portfolio-grid">
          {!loading && items.length === 0 && !showAddForm && (
            <p className="no-items-message">{isOwner ? "Your portfolio is empty. Click 'Add New Work' to get started!" : "This artist hasn't added any portfolio items yet."}</p>
          )}
          {items.map((item) => {
            const itemType = item.item_type || getItemTypeFromUrl(item.image_url); // Use pre-assigned type or infer
            const isEditingThis = editItemId === item.portfolio_id;

            return (
              <div key={item.portfolio_id} className={`portfolio-item card-style item-type-${itemType} ${isEditingThis ? 'editing' : ''}`}>
                {itemType === 'image' && (
                  <a href={item.image_url} target="_blank" rel="noopener noreferrer" title="View full image"> {/* Make image clickable */}
                    <img src={item.image_url} alt={item.description || 'Portfolio Image'} className="portfolio-media portfolio-image" loading="lazy"/>
                  </a>
                )}
                {itemType === 'pdf' && (
                  <div className="portfolio-media portfolio-pdf-item">
                    <span className="file-icon pdf-icon" role="img" aria-label="PDF Document">📄</span> {/* Replace with actual icon component if available */}
                    <p className="file-name">{(item.description || 'Document').substring(0, 30)}{item.description.length > 30 ? '...' : ''}</p>
                    <a href={item.image_url} target="_blank" rel="noopener noreferrer" className="view-file-link">View PDF</a>
                  </div>
                )}
                {itemType === 'video' && (
                  <div className="portfolio-media portfolio-video-item">
                    <video controls width="100%" preload="metadata">
                      <source src={item.image_url} type={selectedFile?.type || "video/mp4"} /> {/* Try to infer type, or default */}
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                 {itemType === 'other' && (
                    <div className="portfolio-media portfolio-other-item">
                         <span className="file-icon" role="img" aria-label="File">📎</span>
                         <p className="file-name">{(item.description || 'File').substring(0,30)}{item.description.length > 30 ? '...' : ''}</p>
                         <a href={item.image_url} target="_blank" rel="noopener noreferrer" className="view-file-link">Open File</a>
                    </div>
                 )}

                <div className="portfolio-item-content">
                  {isEditingThis ? (
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="edit-description-input"
                      rows={3} autoFocus
                    />
                  ) : (
                    <p className="portfolio-description">{item.description || "No description."}</p>
                  )}
                  {isOwner && (
                    <div className="portfolio-actions">
                      {isEditingThis ? (
                        <>
                          <button onClick={() => handleSaveEdit(item.portfolio_id)} className="action-btn save" disabled={uploading}>Save</button>
                          <button onClick={cancelEditing} className="action-btn cancel" disabled={uploading}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => startEditing(item)} className="action-btn edit" disabled={uploading}>Edit Desc</button>
                      )}
                      <button onClick={() => handleDelete(item.portfolio_id)} className="action-btn delete" disabled={uploading}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Portfolio;