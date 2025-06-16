// src/pages/LandingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import LanguageSwitcher from '../components/LanguageSwitcher'; // Import the reusable component

// --- Embedded CSS Styles for LandingPage ---
const landingPageStyles = `
  /* Import Font */
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

  .landing-page-container {
    font-family: 'Nunito', sans-serif;
    color: #4d4033;
    line-height: 1.6;
    background-color: #fdfbf7;
  }
  
  /* --- The local CSS for the language switcher has been removed. --- */
  /* It now correctly uses the styles from your Global.css file. */

  /* --- Hero Section --- */
  .hero-section {
    position: relative;
    height: 85vh;
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: white;
    background-color: #654321;
    overflow: hidden;
  }

  .hero-video-background {
    position: absolute;
    top: 50%; left: 50%;
    min-width: 100%; min-height: 100%;
    width: auto; height: auto;
    z-index: 1;
    transform: translate(-50%, -50%);
  }

  .hero-overlay {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background-color: rgba(77, 64, 51, 0.6);
    z-index: 2;
  }

  .hero-content {
    position: relative;
    z-index: 3;
    max-width: 800px;
    padding: 20px;
  }

  .hero-title {
    font-size: 3.5rem;
    font-weight: 800;
    margin-bottom: 0.5em;
    text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.6);
  }

  .hero-subtitle {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1em;
    opacity: 0.95;
  }

  .hero-description {
    font-size: 1.1rem;
    margin-bottom: 2em;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    opacity: 0.9;
  }
  .hero-description em {
      font-style: normal;
      color: #E2725B;
      font-weight: 600;
  }

  .hero-cta-buttons {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 30px;
  }

  .hero-btn {
    padding: 12px 30px;
    border-radius: 25px;
    text-decoration: none;
    font-weight: 700;
    font-size: 1rem;
    transition: all 0.3s ease;
    border: 2px solid white;
    background-color: white;
    color: #4d4033;
  }
   .hero-btn:hover {
       background-color: rgba(255, 255, 255, 0.15);
       color: white;
       transform: translateY(-2px);
   }

   .hero-btn.alt {
      background-color: transparent;
      color: white;
   }
    .hero-btn.alt:hover {
        background-color: white;
        color: #4d4033;
    }

  /* --- Other Page Sections --- */
  .landing-section {
      padding: 70px 20px;
      text-align: center;
  }
   .landing-section h2 {
       font-size: 2.5rem;
       font-weight: 700;
       color: #654321;
       margin-bottom: 25px;
   }
    .landing-section .section-intro {
        font-size: 1.15rem;
        color: #7d746b;
        max-width: 750px;
        margin: 0 auto 50px auto;
    }

  .category-showcase-section { background-color: #f5f0e8; }
  .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 35px; max-width: 1100px; margin: 40px auto 0 auto; }
  .category-card { background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 20px rgba(101, 67, 33, 0.1); text-align: center; transition: transform 0.3s ease, box-shadow 0.3s ease; padding-bottom: 30px; }
  .category-card:hover { transform: translateY(-6px); box-shadow: 0 10px 25px rgba(101, 67, 33, 0.15); }
  .category-card img { width: 100%; height: 210px; object-fit: cover; display: block; }
  .category-card h3 { font-size: 1.6rem; font-weight: 700; color: #A0522D; margin: 25px 15px 10px 15px; }
  .category-card p { font-size: 1rem; color: #7d746b; padding: 0 25px; margin-bottom: 25px; min-height: 60px; }
  .category-link { display: inline-block; padding: 9px 22px; border-radius: 20px; background-color: transparent; color: #A0522D; text-decoration: none; font-weight: 600; border: 2px solid #dcd3c7; transition: all 0.2s ease; }
  .category-link:hover { background-color: #A0522D; color: white; border-color: #A0522D; }

  .cta-section { background-color: #654321; color: #fdfbf7; }
  .cta-section h2 { color: #fff; margin-bottom: 20px; }
  .cta-section p { color: rgba(253, 251, 247, 0.85); margin-bottom: 35px; }
  .cta-button { padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 1.15rem; transition: all 0.3s ease; background-color: #A0522D; color: white; border: 2px solid #A0522D; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1); }
  .cta-button:hover { background-color: #804123; border-color: #804123; transform: scale(1.03); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15); }

   /* Responsive Adjustments */
   @media (max-width: 768px) {
        .hero-title { font-size: 2.8rem; }
        .hero-subtitle { font-size: 1.2rem; }
        .landing-section h2 { font-size: 2rem; }
        .category-grid { grid-template-columns: 1fr; }
   }
    @media (max-width: 480px) {
         .hero-title { font-size: 2.2rem; }
         .hero-cta-buttons { flex-direction: column; }
         .hero-btn { width: 80%; margin: 5px auto; }
    }
`;

const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <style>{landingPageStyles}</style>
      
      {/* THIS IS THE FIX: The LanguageSwitcher is now outside the main container */}
      <LanguageSwitcher />

      <div className="landing-page-container">
        <header className="hero-section">
          {/* It has been removed from here */}
          
          <video className="hero-video-background" autoPlay loop muted playsInline>
              <source src="/images/video.mp4" type="video/mp4" />
              {t('landingPage.hero.videoError')}
          </video>
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1 className="hero-title">{t('landingPage.hero.title')}</h1>
            <p className="hero-subtitle">{t('landingPage.hero.subtitle')}</p>
            <p className="hero-description" dangerouslySetInnerHTML={{ __html: t('landingPage.hero.description') }} />
            <div className="hero-cta-buttons">
              <Link to="/login" className="hero-btn">{t('landingPage.hero.loginButton')}</Link>
              <Link to="/register" className="hero-btn alt">{t('landingPage.hero.signupButton')}</Link>
            </div>
          </div>
        </header>

        <section className="landing-section category-showcase-section">
          <h2>{t('landingPage.categories.title')}</h2>
          <p className="section-intro">{t('landingPage.categories.intro')}</p>
          <div className="category-grid">
            <div className="category-card">
              <img src="/images/painter.jpg" alt="Painting and Visual Arts" />
              <h3>{t('landingPage.categories.visuals.title')}</h3>
              <p>{t('landingPage.categories.visuals.description')}</p>
              <Link to="/main?category=painter&category=digital_artist&category=graphic_designer" className="category-link">{t('landingPage.categories.visuals.link')}</Link>
            </div>
            <div className="category-card">
              <img src="/images/musician.jpg" alt="Music and Composition" />
              <h3>{t('landingPage.categories.music.title')}</h3>
              <p>{t('landingPage.categories.music.description')}</p>
              <Link to="/main?category=musician" className="category-link">{t('landingPage.categories.music.link')}</Link>
            </div>
            <div className="category-card">
              <img src="/images/actor.jpg" alt="Acting and Performance" />
              <h3>{t('landingPage.categories.acting.title')}</h3>
              <p>{t('landingPage.categories.acting.description')}</p>
              <Link to="/main?category=actor&category=actress&category=dancer&category=comedian" className="category-link">{t('landingPage.categories.acting.link')}</Link>
            </div>
          </div>
        </section>

        <section className="landing-section cta-section">
          <h2>{t('landingPage.cta.title')}</h2>
          <p className="section-intro">{t('landingPage.cta.intro')}</p>
          <Link to="/register" className="cta-button">{t('landingPage.cta.button')}</Link>
        </section>

      </div>
    </>
  );
};

export default LandingPage;
