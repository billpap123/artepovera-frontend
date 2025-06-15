// src/components/AccessibilityMenu.tsx

import React, { useState, useEffect } from 'react';
import { FaUniversalAccess, FaSearchPlus, FaSearchMinus, FaSyncAlt, FaEye, FaLink } from 'react-icons/fa';
import '../styles/AccessibilityMenu.css'; // We will create this file next

const AccessibilityMenu: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Initialize state from localStorage or use defaults
  const [fontSize, setFontSize] = useState<number>(() => Number(localStorage.getItem('accessibility-fontSize') || 100));
  const [highContrast, setHighContrast] = useState<boolean>(() => localStorage.getItem('accessibility-highContrast') === 'true');
  const [highlightLinks, setHighlightLinks] = useState<boolean>(() => localStorage.getItem('accessibility-highlightLinks') === 'true');

  // Effect to apply styles and save to localStorage whenever a setting changes
  useEffect(() => {
    // Font Size
    document.documentElement.style.fontSize = `${fontSize}%`;
    localStorage.setItem('accessibility-fontSize', String(fontSize));

    // High Contrast
    document.body.classList.toggle('high-contrast', highContrast);
    localStorage.setItem('accessibility-highContrast', String(highContrast));
    
    // Highlight Links
    document.body.classList.toggle('links-highlighted', highlightLinks);
    localStorage.setItem('accessibility-highlightLinks', String(highlightLinks));

  }, [fontSize, highContrast, highlightLinks]);

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 10, 150));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 10, 70));
  const resetFontSize = () => setFontSize(100);

  const toggleHighContrast = () => setHighContrast(prev => !prev);
  const toggleHighlightLinks = () => setHighlightLinks(prev => !prev);

  return (
    <div className="accessibility-container">
      <button 
        className="accessibility-fab" 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Open Accessibility Menu"
      >
        <FaUniversalAccess />
      </button>

      {isMenuOpen && (
        <div className="accessibility-menu" role="dialog" aria-labelledby="accessibility-title">
          <h3 id="accessibility-title">Accessibility Tools</h3>
          
          <div className="access-option">
            <label>Font Size</label>
            <div className="font-size-controls">
              <button onClick={decreaseFontSize} aria-label="Decrease Font Size"><FaSearchMinus /></button>
              <button onClick={resetFontSize} aria-label="Reset Font Size"><FaSyncAlt /></button>
              <button onClick={increaseFontSize} aria-label="Increase Font Size"><FaSearchPlus /></button>
            </div>
          </div>

          <div className="access-option">
            <label>High Contrast</label>
            <button onClick={toggleHighContrast} className={`toggle-btn ${highContrast ? 'active' : ''}`}>
              <FaEye /> <span>{highContrast ? 'On' : 'Off'}</span>
            </button>
          </div>

          <div className="access-option">
            <label>Highlight Links</label>
            <button onClick={toggleHighlightLinks} className={`toggle-btn ${highlightLinks ? 'active' : ''}`}>
              <FaLink /> <span>{highlightLinks ? 'On' : 'Off'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityMenu;