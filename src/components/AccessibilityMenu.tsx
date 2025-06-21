// src/components/AccessibilityMenu.tsx

import React, { useState, useEffect } from 'react';
import { FaUniversalAccess, FaSearchPlus, FaSearchMinus, FaSyncAlt, FaEye, FaLink } from 'react-icons/fa';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import '../styles/AccessibilityMenu.css';

const AccessibilityMenu: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation(); // Initialize useTranslation

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
        aria-label={t('accessibilityMenu.ariaLabel.openMenu')} // Translated aria-label
      >
        <FaUniversalAccess />
      </button>

      {isMenuOpen && (
        <div className="accessibility-menu" role="dialog" aria-labelledby="accessibility-title">
          <h3 id="accessibility-title">{t('accessibilityMenu.title')}</h3> {/* Translated title */}

          <div className="access-option">
            <label>{t('accessibilityMenu.fontSize.label')}</label> {/* Translated label */}
            <div className="font-size-controls">
              <button onClick={decreaseFontSize} aria-label={t('accessibilityMenu.fontSize.decreaseAriaLabel')}>
                <FaSearchMinus />
              </button>
              <button onClick={resetFontSize} aria-label={t('accessibilityMenu.fontSize.resetAriaLabel')}>
                <FaSyncAlt />
              </button>
              <button onClick={increaseFontSize} aria-label={t('accessibilityMenu.fontSize.increaseAriaLabel')}>
                <FaSearchPlus />
              </button>
            </div>
          </div>

          <div className="access-option">
            <label>{t('accessibilityMenu.highContrast.label')}</label> {/* Translated label */}
            <button onClick={toggleHighContrast} className={`toggle-btn ${highContrast ? 'active' : ''}`}>
              <FaEye /> <span>{highContrast ? t('accessibilityMenu.highContrast.on') : t('accessibilityMenu.highContrast.off')}</span> {/* Translated On/Off */}
            </button>
          </div>

          <div className="access-option">
            <label>{t('accessibilityMenu.highlightLinks.label')}</label> {/* Translated label */}
            <button onClick={toggleHighlightLinks} className={`toggle-btn ${highlightLinks ? 'active' : ''}`}>
              <FaLink /> <span>{highlightLinks ? t('accessibilityMenu.highlightLinks.on') : t('accessibilityMenu.highlightLinks.off')}</span> {/* Translated On/Off */}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityMenu;