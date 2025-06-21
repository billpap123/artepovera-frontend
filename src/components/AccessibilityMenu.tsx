// src/components/AccessibilityMenu.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';         // ⚠️
import {
  FaUniversalAccess, FaSearchPlus, FaSearchMinus,
  FaSyncAlt, FaEye, FaLink
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import '../styles/AccessibilityMenu.css';

const AccessibilityMenu: React.FC = () => {
  const { t } = useTranslation();

  // UI state
  const [isMenuOpen,    setIsMenuOpen]    = useState(false);
  const [fontSize,      setFontSize]      = useState<number>(
    () => Number(localStorage.getItem('accessibility-fontSize') || 100)
  );
  const [highContrast,  setHighContrast]  = useState<boolean>(
    () => localStorage.getItem('accessibility-highContrast') === 'true'
  );
  const [highlightLinks,setHighlightLinks]= useState<boolean>(
    () => localStorage.getItem('accessibility-highlightLinks') === 'true'
  );

  /* ---------------- Side-effects ---------------- */
  useEffect(() => {
    /* font-size */
    document.documentElement.style.fontSize = `${fontSize}%`;
    localStorage.setItem('accessibility-fontSize', String(fontSize));

    /* highlight links */
    document.body.classList.toggle('links-highlighted', highlightLinks);
    localStorage.setItem('accessibility-highlightLinks', String(highlightLinks));

    /* save HC flag (το overlay μπαίνει αλλού) */
    localStorage.setItem('accessibility-highContrast', String(highContrast));
  }, [fontSize, highlightLinks, highContrast]);

  /* ---------------- Handlers ---------------- */
  const incFont = () => setFontSize(f => Math.min(f + 10, 150));
  const decFont = () => setFontSize(f => Math.max(f - 10, 70));
  const rstFont = () => setFontSize(100);

  const toggleHC     = () => setHighContrast(hc => !hc);
  const toggleLinks  = () => setHighlightLinks(l => !l);

  /* ---------------- Overlay Node ---------------- */
  const overlay = highContrast
    ? createPortal(<div className="hc-overlay" aria-hidden="true"/>, document.body)
    : null;

  return (
    <>
      {overlay /* ⚠️ ρίχνουμε το overlay στην κορυφή του body */}
      <div className="accessibility-container">
        <button
          className="accessibility-fab"
          onClick={() => setIsMenuOpen(o => !o)}
          aria-label={t('accessibilityMenu.ariaLabel.openMenu')}
        >
          <FaUniversalAccess/>
        </button>

        {isMenuOpen && (
          <div className="accessibility-menu" role="dialog" aria-labelledby="accessibility-title">
            <h3 id="accessibility-title">{t('accessibilityMenu.title')}</h3>

            <div className="access-option">
              <label>{t('accessibilityMenu.fontSize.label')}</label>
              <div className="font-size-controls">
                <button onClick={decFont} aria-label={t('accessibilityMenu.fontSize.decreaseAriaLabel')}>
                  <FaSearchMinus/>
                </button>
                <button onClick={rstFont} aria-label={t('accessibilityMenu.fontSize.resetAriaLabel')}>
                  <FaSyncAlt/>
                </button>
                <button onClick={incFont} aria-label={t('accessibilityMenu.fontSize.increaseAriaLabel')}>
                  <FaSearchPlus/>
                </button>
              </div>
            </div>

            <div className="access-option">
              <label>{t('accessibilityMenu.highContrast.label')}</label>
              <button onClick={toggleHC} className={`toggle-btn ${highContrast ? 'active' : ''}`}>
                <FaEye/><span>{highContrast ? t('accessibilityMenu.highContrast.on')
                                            : t('accessibilityMenu.highContrast.off')}</span>
              </button>
            </div>

            <div className="access-option">
              <label>{t('accessibilityMenu.highlightLinks.label')}</label>
              <button onClick={toggleLinks} className={`toggle-btn ${highlightLinks ? 'active' : ''}`}>
                <FaLink/><span>{highlightLinks ? t('accessibilityMenu.highlightLinks.on')
                                               : t('accessibilityMenu.highlightLinks.off')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AccessibilityMenu;
