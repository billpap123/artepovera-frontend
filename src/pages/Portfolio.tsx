// src/pages/Portfolio.tsx
import { useTranslation } from "react-i18next";


import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Navbar from "../components/Navbar";
import { useUserContext } from '../context/UserContext';
import '../styles/Portfolio.css';
import '../styles/Global.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:50001';

export interface PortfolioItem {
  portfolio_id: number;
  artist_id: number;
  image_url: string;
  description: string;
  item_type?: 'image' | 'pdf' | 'video' | 'other';
  public_id?: string;
  created_at?: string;
}

export interface PortfolioProps {
  artistId?: number; // For viewing someone else's portfolio
  viewedArtistName?: string; // Name of the artist being viewed
}

const getItemTypeFromUrl = (url: string): 'image' | 'pdf' | 'video' | 'other' => {
    if (!url) return 'other';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.match(/\.(jpeg|jpg|gif|png|webp)$/)) { return 'image'; }
    if (lowerUrl.match(/\.pdf$/)) { return 'pdf'; }
    if (lowerUrl.match(/\.(mp4|mov|webm|avi|flv|mkv)$/)) { return 'video'; }
    return 'other';
};

const Portfolio: React.FC<PortfolioProps> = ({ artistId: viewingArtistId, viewedArtistName }) => {
  const { artistId: loggedInUserArtistId } = useUserContext();
  const { t } = useTranslation();
  console.log("--- isOwner Calculation ---");
  console.log("Prop (from router) -> viewingArtistId:", viewingArtistId, "| type:", typeof viewingArtistId);
  console.log("Context -> loggedInUserArtistId:", loggedInUserArtistId, "| type:", typeof loggedInUserArtistId);


  const targetArtistId = viewingArtistId || loggedInUserArtistId;
  const isOwner = !!loggedInUserArtistId && (targetArtistId === loggedInUserArtistId);

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState('');

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
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
  }, [targetArtistId]);

  useEffect(() => {
    if (targetArtistId) {
      fetchPortfolio();
    } else {
      setLoading(false);
      setItems([]);
    }
  }, [targetArtistId, fetchPortfolio]);
  
  const handleOpenModal = (imageUrl: string) => setModalImage(imageUrl);
  const handleCloseModal = () => setModalImage(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf', 'video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/x-msvideo'];
      if (allowedTypes.includes(file.type)) { setSelectedFile(file); } else {
        alert('Invalid file type.');
        e.target.value = '';
        setSelectedFile(null);
      }
    } else { setSelectedFile(null); }
  };
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !description.trim()) { alert('Please select a file and enter a description.'); return; }
    setUploading(true); setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { throw new Error('Authentication token not found.'); }
      const formData = new FormData();
      formData.append("description", description.trim());
      formData.append("image", selectedFile);
      const res = await axios.post(`${API_BASE_URL}/api/portfolios`, formData, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
      const newItemData = res.data;
      const newItem: PortfolioItem = { ...newItemData, item_type: newItemData.item_type || getItemTypeFromUrl(newItemData.image_url) };
      setItems(prevItems => [newItem, ...prevItems]);
      setSelectedFile(null); setDescription(''); setShowAddForm(false);
      alert("Portfolio item uploaded successfully!");
    } catch (err: any) {
      console.error('Error uploading item:', err);
      const message = err.response?.data?.message || 'Failed to upload item.';
      setError(message); alert(message);
    } finally { setUploading(false); }
  };
  const startEditing = (item: PortfolioItem) => { setEditItemId(item.portfolio_id); setEditDescription(item.description); };
  const cancelEditing = () => { setEditItemId(null); setEditDescription(''); };
  const handleSaveEdit = async (portfolioId: number) => {
    if (!editDescription.trim()) { alert('Description cannot be empty.'); return; }
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { throw new Error('Authentication token not found.'); }
      await axios.put(`${API_BASE_URL}/api/portfolios/${portfolioId}`, { description: editDescription.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setItems(prevItems => prevItems.map(item => item.portfolio_id === portfolioId ? { ...item, description: editDescription.trim() } : item));
      cancelEditing();
      alert("Description updated successfully!");
    } catch (err: any) {
      console.error('Error updating portfolio item:', err);
      const message = err.response?.data?.message || 'Failed to update portfolio item.';
      setError(message); alert(message);
    } finally { setUploading(false); }
  };
  const handleDelete = async (portfolioId: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    setUploading(true); setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { throw new Error('Authentication token not found.'); }
      await axios.delete(`${API_BASE_URL}/api/portfolios/${portfolioId}`, { headers: { Authorization: `Bearer ${token}` } });
      setItems(prevItems => prevItems.filter(item => item.portfolio_id !== portfolioId));
      alert("Portfolio item deleted.");
    } catch (err: any) {
      console.error('Error deleting portfolio item:', err);
      const message = err.response?.data?.message || 'Failed to delete portfolio item.';
      setError(message); alert(message);
    } finally { setUploading(false); }
  };

  if (!viewingArtistId && !loggedInUserArtistId) {
    return (
        <>
            <Navbar />
            <div className="portfolio-page loading-portfolio">
                <p className="loading-message">Loading user profile...</p>
            </div>
        </>
    );
  }

  if (loading) return <><Navbar /><div className="portfolio-page loading-portfolio"><p className="loading-message">Loading portfolio...</p></div></>;
  
  if (error) return <><Navbar /><div className="portfolio-page error-portfolio"><p className="error-message">{error}</p>{isOwner && <button onClick={fetchPortfolio} className="action-btn">Try Again</button>}</div></>;

  return (
    <>
      <Navbar />
      <div className="portfolio-page">
        <div className="portfolio-header">
            <h2>{isOwner ? t('portfolioPage.header.myPortfolio') : t('portfolioPage.header.artistsPortfolio', { name: viewedArtistName || t('portfolioPage.header.genericArtist') })}</h2>
            {isOwner && !showAddForm && (
                <button onClick={() => {setShowAddForm(true); setError(null);}} className="add-item-button">
                    {t('portfolioPage.header.addNew')}
                </button>
            )}
        </div>

        {isOwner && showAddForm && (
          <form onSubmit={handleUpload} className="portfolio-upload-form card-style">
            <h3>{t('portfolioPage.form.title')}</h3>
            <div className="form-group">
              <label htmlFor="portfolioFile">{t('portfolioPage.form.fileLabel')}</label>
              <input id="portfolioFile" type="file" name="image" accept="image/png, image/jpeg, image/gif, application/pdf, video/mp4, video/quicktime, video/webm, video/x-matroska, video/x-msvideo" onChange={handleFileChange} />
            </div>
            <div className="form-group">
              <label htmlFor="portfolioDesc">{t('portfolioPage.form.descriptionLabel')}</label>
              <textarea id="portfolioDesc" placeholder={t('portfolioPage.form.descriptionPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={uploading || !selectedFile || !description.trim()} className="submit-btn">{uploading ? t('portfolioPage.form.uploadingButton') : t('portfolioPage.form.uploadButton')}</button>
              <button type="button" onClick={() => { setShowAddForm(false); setSelectedFile(null); setDescription(''); setError(null); }} className="cancel-btn">{t('portfolioPage.form.cancelButton')}</button>
            </div>
          </form>
        )}

        <div className="portfolio-grid">
          {!loading && items.length === 0 && !showAddForm && (
            <p className="no-items-message">{isOwner ? t('portfolioPage.status.emptyOwner') : t('portfolioPage.status.emptyViewer')}</p>
          )}
          {items.map((item) => {
            const itemType = item.item_type || getItemTypeFromUrl(item.image_url);
            const isEditingThis = editItemId === item.portfolio_id;

            return (
              <div key={item.portfolio_id} className={`portfolio-item card-style item-type-${itemType} ${isEditingThis ? 'editing' : ''}`}>
                 {itemType === 'image' && (<button onClick={() => handleOpenModal(item.image_url)} className="portfolio-image-button"><img src={item.image_url} alt={item.description || t('portfolioPage.item.imageAlt')} className="portfolio-media portfolio-image" loading="lazy"/></button>)}
                 {itemType === 'pdf' && (<div className="portfolio-media portfolio-pdf-item"><span className="file-icon pdf-icon" role="img" aria-label={t('portfolioPage.item.pdfAriaLabel')}>📄</span><p className="file-name">{(item.description || t('portfolioPage.item.pdfDefaultName')).substring(0, 25)}{item.description && item.description.length > 25 ? '...' : ''}</p><a href={item.image_url} target="_blank" rel="noopener noreferrer" className="view-file-link button-style">{t('portfolioPage.item.viewPdf')}</a></div>)}
                 {itemType === 'video' && (<div className="portfolio-media portfolio-video-item"><video controls width="100%" preload="metadata" className="portfolio-video-player"><source src={item.image_url} type={selectedFile && item.image_url === URL.createObjectURL(selectedFile) ? selectedFile.type : 'video/mp4'} />{t('portfolioPage.item.videoError')}</video></div>)}
                 {itemType === 'other' && (<div className="portfolio-media portfolio-other-item"><span className="file-icon" role="img" aria-label={t('portfolioPage.item.otherAriaLabel')}>📎</span><p className="file-name">{(item.description || t('portfolioPage.item.otherDefaultName')).substring(0,25)}{item.description.length > 25 ? '...' : ''}</p><a href={item.image_url} target="_blank" rel="noopener noreferrer" className="view-file-link button-style">{t('portfolioPage.item.openFile')}</a></div>)}
                <div className="portfolio-item-content">
                  {isEditingThis ? (<textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="edit-description-input" rows={3} autoFocus/>) : (<p className="portfolio-description">{item.description || t('portfolioPage.status.noDescription')}</p>)}
                  {isOwner && (
                    <div className="portfolio-actions">
                      {isEditingThis ? (<> <button onClick={() => handleSaveEdit(item.portfolio_id)} className="action-btn save" disabled={uploading}>{t('portfolioPage.item.saveButton')}</button> <button onClick={cancelEditing} className="action-btn cancel" disabled={uploading}>{t('portfolioPage.form.cancelButton')}</button> </>) : (<button onClick={() => startEditing(item)} className="action-btn edit" disabled={uploading || showAddForm}>{t('portfolioPage.item.editButton')}</button>)}
                      <button onClick={() => handleDelete(item.portfolio_id)} className="action-btn delete" disabled={uploading || showAddForm}>{t('portfolioPage.item.deleteButton')}</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        {modalImage && ( <div className="portfolio-modal-overlay" onClick={handleCloseModal}><div className="portfolio-modal-content" onClick={(e) => e.stopPropagation()}><img src={modalImage} alt={t('portfolioPage.modal.enlargedViewAlt')} /><button onClick={handleCloseModal} className="close-modal-button">{t('portfolioPage.modal.closeButton')}</button></div></div>)}
        </div>
      </div>
    </>
  );
};

export default Portfolio;