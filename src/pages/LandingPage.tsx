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
    background-color: #fdfbf7;
  }
  
  /* --- NEW: Fixed Header for Logo and Language Switcher --- */
  .landing-header {
    position: fixed; /* Keep it at the top */
    top: 0;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 5%; /* Use percentage for responsive padding */
    background-color: rgba(45, 35, 25, 0.5); /* Semi-transparent dark background */
    backdrop-filter: blur(8px); /* Frosted glass effect */
    -webkit-backdrop-filter: blur(8px);
    z-index: 1000; /* Ensure it's above all other content */
    transition: background-color 0.3s ease;
  }

  .landing-header:hover {
    background-color: rgba(45, 35, 25, 0.7);
  }

  .landing-logo img {
    height: 40px; /* Control logo size */
    width: auto;
  }


  .language-switcher {
    position: absolute;
    top: 25px;
    right: 25px;
    z-index: 10;
  }
  
  .language-switcher-select {
    /* --- Appearance for Light Backgrounds --- */
    background-color: #C96A50; /* Light beige */
    color: #4d4033; /* Dark brown text */
    border: 1px solid #dcd3c7; /* Light brown border */
    border-radius: 8px;
    padding: 8px 30px 8px 12px;
    
    /* --- Font and Cursor --- */
    font-family: 'Nunito', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    
    /* --- Removing Default OS Styling --- */
    outline: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  
    /* --- Custom Dropdown Arrow (Dark Version) --- */
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%234D4033%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E');
    background-repeat: no-repeat;
    background-position: right 10px top 50%;
    background-size: 10px auto;
    
    transition: background-color 0.2s ease;
  }
  
  .language-switcher-select:hover {
      background-color: #C96A50; /* Light beige */
    ; /* Slightly darker beige on hover */
  }
  
  /* Styling for the dropdown options */
  .language-switcher-select option {
    background-color: #4d4033;
    color: white;
  }
  /* --- End Header Styles --- */

  /* --- Hero Section --- */
  .hero-section {
    position: relative;
    height: 100vh; /* Make it full screen height */
    min-height: 600px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: white;
    background-color: #654321;
    overflow: hidden;
    /* No margin-top needed anymore as the header is fixed */
  }

.hero-video-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    object-fit: cover; /* This is the key property */
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
    animation: fadeIn 1.5s ease-in-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .hero-title {
    font-size: 3.5rem;
    font-weight: 800;
    margin-bottom: 0.5em;
    text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
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
    line-height: 1.6;
    opacity: 0.9;
  }
  .hero-description em {
    font-style: normal;
    color: #E2725B;
    font-weight: 700;
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
    background-color: #E2725B; /* Primary CTA color */
    color: white;
  }
   .hero-btn:hover {
       background-color: #C96A50;
       color: white;
       transform: translateY(-2px);
       box-shadow: 0 4px 15px rgba(0,0,0,0.2);
   }

   .hero-btn.alt {
      background-color: transparent;
      color: white;
   }
    .hero-btn.alt:hover {
        background-color: white;
        color: #4d4033;
        box-shadow: none;
    }

  /* --- Other Page Sections (No major changes needed) --- */
  .landing-section {
      padding: 80px 5%;
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
        line-height: 1.7;
    }

  .category-showcase-section { background-color: #f5f0e8; }
  .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 35px; max-width: 1200px; margin: 40px auto 0 auto; }
  .category-card { background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 20px rgba(101, 67, 33, 0.08); text-align: center; transition: transform 0.3s ease, box-shadow 0.3s ease; padding-bottom: 30px; }
  .category-card:hover { transform: translateY(-8px); box-shadow: 0 10px 25px rgba(101, 67, 33, 0.12); }
  .category-card img { width: 100%; height: 210px; object-fit: cover; display: block; }
  .category-card h3 { font-size: 1.6rem; font-weight: 700; color: #A0522D; margin: 25px 15px 10px 15px; }
  .category-card p { font-size: 1rem; color: #7d746b; padding: 0 25px; margin-bottom: 25px; min-height: 60px; line-height: 1.6; }
  .category-link { display: inline-block; padding: 9px 22px; border-radius: 20px; background-color: transparent; color: #A0522D; text-decoration: none; font-weight: 600; border: 2px solid #dcd3c7; transition: all 0.2s ease; }
  .category-link:hover { background-color: #A0522D; color: white; border-color: #A0522D; }

  .cta-section { background-color: #654321; color: #fdfbf7; }
  .cta-section h2 { color: #fff; margin-bottom: 20px; }
  .cta-section p { color: rgba(253, 251, 247, 0.85); margin-bottom: 35px; }
  .cta-button { padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 1.15rem; transition: all 0.3s ease; background-color: #E2725B; color: white; border: 2px solid #E2725B; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1); }
  .cta-button:hover { background-color: #C96A50; border-color: #C96A50; transform: scale(1.03); box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15); }
    
   /* --- Footer Styles --- */
  .landing-footer {
    background-color: #4d4033;
    color: #fdfbf7;
    padding: 40px 5%;
    text-align: center;
    font-size: 0.95rem;
    line-height: 1.6;
    padding: 80px 5%;
  }

  .landing-footer h3 {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 15px;
    color: #E2725B;
  }

  .landing-footer p {
    max-width: 700px;
    margin: 0 auto 25px auto;
    color: rgba(253, 251, 247, 0.9);
  }

  .landing-footer-contact {
    margin-bottom: 20px;
  }

  .landing-footer-contact a {
    color: #C96A50;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s ease;
  }

  .landing-footer-contact a:hover {
    color: #E2725B;
    text-decoration: underline;
  }

  .landing-footer-links {
    margin-top: 25px;
  }

  .landing-footer-links a {
    color: #fdfbf7;
    text-decoration: none;
    margin: 0 15px;
    transition: color 0.2s ease;
  }

  .landing-footer-links a:hover {
    color: #C96A50;
  }

  .landing-footer-bottom {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid rgba(253, 251, 247, 0.1);
    color: rgba(253, 251, 247, 0.7);
  }
   /* Responsive Adjustments */
   @media (max-width: 1268px) {
        .hero-title { font-size: 2.5rem; }
        .hero-subtitle { font-size: 1.2rem; }
        .landing-section h2 { font-size: 2rem; }
        .category-grid { grid-template-columns: 1fr; }
        .landing-header { padding: 15px 3%; }
        .hero-section{margin-top:80px}
   }
    @media (max-width: 480px) {
         .hero-title { font-size: 2rem; }
         .hero-subtitle { font-size: 1.1rem; }
         .hero-cta-buttons { flex-direction: column; }
         .hero-btn { width: 80%; margin: 5px auto; }
         .landing-section { padding: 60px 5%; }
                 .hero-section{margin-top:20px}

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
   {/* --- NEW: Footer Section --- */}
   <footer className="landing-footer">
          <h3>{t('landingPage.footer.title')}</h3>
          <p>{t('landingPage.footer.description')}</p>
          <div className="landing-footer-contact">
            <a href="mailto:info@artconnect.com">{t('footer.contactEmail')}</a>
          </div>
          
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
