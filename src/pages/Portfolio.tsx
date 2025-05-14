// src/pages/Portfolio.tsx
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Navbar from "../components/Navbar";
import { useUserContext } from '../context/UserContext'; // Assuming you might use this
import '../styles/Portfolio.css';
import '../styles/Global.css'; // Keep if you have global styles affecting this page
// You can import icons for file types if you have them
// import { FaFilePdf, FaVideo, FaImage } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001';

// --- UPDATED PortfolioItem Interface ---
export interface PortfolioItem {
  portfolio_id: number;
  artist_id: number; // Good to have artist ID
  image_url: string; // Will store URL for images OR PDFs OR Videos
  description: string;
  item_type?: 'image' | 'pdf' | 'video' | 'other'; // From backend, or inferred
  public_id?: string; // From backend, for Cloudinary management
  created_at?: string;
}

export interface PortfolioProps {
  artistId?: number;
  viewedArtistName?: string; // <<< ADD
}
// --- Helper to determine file type from URL (simple version) ---
const getItemTypeFromUrl = (url: string): 'image' | 'pdf' | 'video' | 'other' => {
    if (!url) return 'other';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.match(/\.(jpeg|jpg|gif|png|webp)$/)) { return 'image'; }
    if (lowerUrl.match(/\.pdf$/)) { return 'pdf'; }
    if (lowerUrl.match(/\.(mp4|mov|webm|avi|flv|mkv)$/)) { return 'video'; } // Added more video types
    return 'other';
};

const Portfolio: React.FC<PortfolioProps> = ({ artistId: viewingArtistId, viewedArtistName }) => {  const { userId: loggedInUserId, artistId: loggedInUserArtistId } = useUserContext();

  const targetArtistId = viewingArtistId || loggedInUserArtistId;
  // isOwner determines if the logged-in user can edit this portfolio
  const isOwner = !!loggedInUserArtistId && (targetArtistId === loggedInUserArtistId);


  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for adding new items
  const [showAddForm, setShowAddForm] = useState(false); // To toggle form visibility
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false); // For Add and Edit/Delete operations

  // State for editing descriptions
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState('');


  const fetchPortfolio = useCallback(async () => {
    if (!targetArtistId) {
      console.warn("No target artist ID for portfolio fetch.");
      // If viewing own profile but artistId from context is not yet set,
      // this might initially be true. The UserContext update should trigger a re-render.
      setError(isOwner ? "Your artist profile ID isn't available yet." : "Artist ID not specified.");
      setLoading(false);
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token'); // May or may not be needed depending on if portfolio is public
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      // Use targetArtistId to fetch specific portfolio
      const res = await axios.get(`${API_BASE_URL}/api/portfolios/${targetArtistId}`, { headers });
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
  }, [targetArtistId, API_BASE_URL, isOwner]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Updated allowed types
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf', 'video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/x-msvideo'];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        alert('Invalid file type. Please select an Image, PDF, or common Video format.');
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
    setUploading(true); setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { throw new Error('Authentication token not found.'); }
      const formData = new FormData();
      formData.append("description", description.trim());
      formData.append("image", selectedFile);

      // This endpoint should create a portfolio item for the LOGGED-IN artist
      const res = await axios.post(`${API_BASE_URL}/api/portfolios`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      const newItem: PortfolioItem = {
          ...res.data,
          item_type: res.data.item_type || getItemTypeFromUrl(res.data.image_url)
      };
      setItems(prevItems => [newItem, ...prevItems]); // Add new item to the top
      setSelectedFile(null);
      setDescription('');
      setShowAddForm(false); // Hide form after successful upload
    } catch (err: any) {
      console.error('Error uploading item:', err);
      const message = err.response?.data?.message || 'Failed to upload item.';
      setError(message); alert(message);
    } finally {
      setUploading(false);
    }
  };

  const startEditing = (item: PortfolioItem) => { setEditItemId(item.portfolio_id); setEditDescription(item.description); };
  const cancelEditing = () => { setEditItemId(null); setEditDescription(''); };

  const handleSaveEdit = async (portfolioId: number) => {
    if (!editDescription.trim()) { alert('Description cannot be empty.'); return; }
    const originalItem = items.find(item => item.portfolio_id === portfolioId);
    if (editDescription.trim() === originalItem?.description.trim()) { cancelEditing(); return; } // No change

    setUploading(true); // Use 'uploading' state to disable buttons during save
    try {
      const token = localStorage.getItem('token');
      if (!token) { throw new Error('Authentication token not found.'); }
      // For now, only updating description. File update would be more complex here.
      await axios.put(
        `${API_BASE_URL}/api/portfolios/${portfolioId}`,
        { description: editDescription.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setItems(prevItems => prevItems.map(item =>
        item.portfolio_id === portfolioId ? { ...item, description: editDescription.trim() } : item
      ));
      cancelEditing();
    } catch (err: any) {
      console.error('Error updating portfolio item:', err);
      const message = err.response?.data?.message || 'Failed to update portfolio item.';
      setError(message); alert(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (portfolioId: number) => {
    if (!window.confirm('Are you sure you want to delete this item? This cannot be undone.')) return;
    setUploading(true); setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { throw new Error('Authentication token not found.'); }
      await axios.delete(`${API_BASE_URL}/api/portfolios/${portfolioId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(prevItems => prevItems.filter(item => item.portfolio_id !== portfolioId));
    } catch (err: any) {
      console.error('Error deleting portfolio item:', err);
      const message = err.response?.data?.message || 'Failed to delete portfolio item.';
      setError(message); alert(message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <><Navbar /><div className="portfolio-page loading-portfolio"><p className="loading-message">Loading portfolio...</p></div></>;
  // Modified error display to be more informative
  if (error && items.length === 0) { // Show primary error if loading fails completely
    return (
        <>
            <Navbar />
            <div className="portfolio-page error-portfolio">
                <p className="error-message">{error}</p>
                {isOwner && <button onClick={fetchPortfolio} className="action-btn">Try Again</button>}
            </div>
        </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="portfolio-page">
        <div className="portfolio-header">
            {/* Title changes based on whose portfolio it is */}
            <h2>{isOwner ? "Manage My Portfolio" : (viewedArtistName ? `${viewedArtistName}'s Portfolio` : "Artist Portfolio")}</h2>
            {/* Show Add Item button only for the owner and if form is not already shown */}
            {isOwner && !showAddForm && (
                <button onClick={() => {setShowAddForm(true); setError(null);}} className="add-item-button">
                    + Add New Work
                </button>
            )}
        </div>

        {/* Display general error messages here if they are not specific to upload */}
        {error && !uploading && <p className="error-message" style={{textAlign: 'center', marginBottom: '20px'}}>{error}</p>}

        {/* Add New Item Form (Conditionally Rendered) */}
        {isOwner && showAddForm && (
          <form onSubmit={handleUpload} className="portfolio-upload-form card-style">
            <h3>Upload New Work</h3>
            <div className="form-group">
              <label htmlFor="portfolioFile">Select File (Image, PDF, Video)*</label>
              <input
                id="portfolioFile" type="file" name="image" // name="image" as backend expects this for portfolio items
                accept="image/png, image/jpeg, image/gif, application/pdf, video/mp4, video/quicktime, video/webm, video/x-matroska, video/x-msvideo" // Updated accept
                onChange={handleFileChange}
                // Removed 'required' as it's checked in handleUpload
              />
            </div>
            <div className="form-group">
              <label htmlFor="portfolioDesc">Description*</label>
              <textarea
                id="portfolioDesc" placeholder="Describe your work, CV content, or video..."
                value={description} onChange={(e) => setDescription(e.target.value)}
                rows={4}
                // Removed 'required'
              />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={uploading || !selectedFile || !description.trim()} className="submit-btn">
                {uploading ? "Uploading..." : "Upload to Portfolio"}
              </button>
              <button type="button" onClick={() => { setShowAddForm(false); setSelectedFile(null); setDescription(''); setError(null); }} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Portfolio Display Grid */}
        <div className="portfolio-grid">
          {/* Show this message only if not loading, no items, and add form is not open */}
          {!loading && items.length === 0 && !showAddForm && (
            <p className="no-items-message">{isOwner ? "Your portfolio is empty. Click 'Add New Work' to get started!" : "This artist hasn't added any portfolio items yet."}</p>
          )}

          {items.map((item) => {
            // Use item.item_type if backend provides it, otherwise infer
            const itemType = item.item_type || getItemTypeFromUrl(item.image_url);
            const isEditingThis = editItemId === item.portfolio_id;

            return (
              <div key={item.portfolio_id} className={`portfolio-item card-style item-type-${itemType} ${isEditingThis ? 'editing' : ''}`}>
                {/* Conditional rendering for different file types */}
                {itemType === 'image' && (
                  <a href={item.image_url} target="_blank" rel="noopener noreferrer" title="View full image">
                    <img src={item.image_url} alt={item.description || 'Portfolio Image'} className="portfolio-media portfolio-image" loading="lazy"/>
                  </a>
                )}
                {itemType === 'pdf' && (
                  <div className="portfolio-media portfolio-pdf-item">
                    {/* Placeholder for PDF Icon - consider using react-icons: <FaFilePdf /> */}
                    <span className="file-icon pdf-icon" role="img" aria-label="PDF Document">📄</span>
                    <p className="file-name">{(item.description || 'Document').substring(0, 25)}{item.description && item.description.length > 25 ? '...' : ''}</p>
                    <a href={item.image_url} target="_blank" rel="noopener noreferrer" className="view-file-link button-style">View PDF</a>
                  </div>
                )}
                {itemType === 'video' && (
                  <div className="portfolio-media portfolio-video-item">
                    {/* Using HTML5 video player */}
                    <video controls width="100%" preload="metadata" className="portfolio-video-player">
                      <source src={item.image_url} type={selectedFile?.type || "video/mp4"} /> {/* Try to infer type or use common video type */}
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                 {itemType === 'other' && ( // Fallback for unknown types
                    <div className="portfolio-media portfolio-other-item">
                         <span className="file-icon" role="img" aria-label="File">📎</span>
                         <p className="file-name">{(item.description || 'File').substring(0,25)}{item.description.length > 25 ? '...' : ''}</p>
                         <a href={item.image_url} target="_blank" rel="noopener noreferrer" className="view-file-link button-style">Open File</a>
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
                  {/* Show action buttons only if the logged-in user is the owner */}
                  {isOwner && (
                    <div className="portfolio-actions">
                      {isEditingThis ? (
                        <>
                          <button onClick={() => handleSaveEdit(item.portfolio_id)} className="action-btn save" disabled={uploading}>Save</button>
                          <button onClick={cancelEditing} className="action-btn cancel" disabled={uploading}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => startEditing(item)} className="action-btn edit" disabled={uploading || showAddForm}>Edit Desc</button>
                      )}
                      <button onClick={() => handleDelete(item.portfolio_id)} className="action-btn delete" disabled={uploading || showAddForm}>Delete</button>
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