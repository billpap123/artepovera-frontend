// src/pages/LandingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";


// --- Embedded CSS Styles for LandingPage (Earthy Tones) ---
const landingPageStyles = `
  /* Import Font */
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

  .landing-page-container {
    font-family: 'Nunito', sans-serif;
    color: #4d4033; /* Dark Brown for default text */
    line-height: 1.6;
    background-color: #fdfbf7; /* Off-white base background */
  }
    /*
  ADD THIS ENTIRE BLOCK TO YOUR landingPageStyles
*/

/* --- Language Switcher Styles --- */

.language-switcher {
  position: absolute;
  top: 25px;
  right: 25px;
  z-index: 10; /* Ensure it's on top of other content */
}

.language-switcher-select {
  /* --- Appearance and Colors --- */
  background-color: rgba(255, 255, 255, 0.15); /* Semi-transparent white */
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 8px 30px 8px 12px; /* Top, Right, Bottom, Left padding */
  
  /* --- Font and Cursor --- */
  font-family: 'Nunito', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  
  /* --- Removing Default OS Styling --- */
  outline: none;
  -webkit-appearance: none; /* Removes default Safari/Chrome styling */
  -moz-appearance: none;    /* Removes default Firefox styling */
  appearance: none;         /* Removes default styling */

  /* --- Custom Dropdown Arrow --- */
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E');
  background-repeat: no-repeat;
  background-position: right 10px top 50%;
  background-size: 10px auto;
  
  transition: background-color 0.2s ease;
}

.language-switcher-select:hover {
  background-color: rgba(255, 255, 255, 0.25); /* Slightly more opaque on hover */
}

/* Styling for the dropdown options themselves */
.language-switcher-select option {
  background-color: #4d4033; /* Dark brown background for the dropdown list */
  color: white;
}

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
    /* Background handled by <video> tag */
    background-color: #654321; /* Fallback: Dark Brown */
    overflow: hidden;
  }

  .hero-video-background {
    position: absolute;
    top: 50%;
    left: 50%;
    min-width: 100%;
    min-height: 100%;
    width: auto;
    height: auto;
    z-index: 1;
    transform: translate(-50%, -50%);
  }

  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(77, 64, 51, 0.6); /* Dark Brown Overlay */
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
    letter-spacing: 1px;
    text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.6);
     /* CSS text-transform can override inline text if needed */
     /* text-transform: uppercase; */ /* Example */
  }

  .hero-subtitle {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1em;
    opacity: 0.95;
     /* Capitalization handled inline */
  }

  .hero-description {
    font-size: 1.1rem;
    margin-bottom: 2em;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    opacity: 0.9;
     /* Standard sentence case */
  }
  .hero-description em {
      font-style: normal;
      color: #E2725B; /* Terracotta accent */
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
    color: #4d4033; /* Dark brown text */
     /* Capitalization handled inline */
  }
   .hero-btn:hover {
       background-color: rgba(255, 255, 255, 0.15); /* Transparent white */
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


  /* --- Section Base Styles --- */
  .landing-section {
      padding: 70px 20px;
      text-align: center;
  }
   .landing-section h2 {
       font-size: 2.5rem;
       font-weight: 700;
       color: #654321; /* Deep Brown Heading */
       margin-bottom: 25px;
        /* Capitalization handled inline */
   }
    .landing-section .section-intro {
        font-size: 1.15rem;
        color: #7d746b; /* Warm Grey */
        max-width: 750px;
        margin: 0 auto 50px auto;
         /* Standard sentence case */
    }

  /* --- Category Showcase Section --- */
  .category-showcase-section {
    background-color: #f5f0e8; /* Light Beige background */
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 35px;
    max-width: 1100px;
    margin: 40px auto 0 auto;
  }

  .category-card {
    background-color: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 5px 20px rgba(101, 67, 33, 0.1); /* Brownish shadow */
    text-align: center;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    padding-bottom: 30px;
  }

  .category-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 10px 25px rgba(101, 67, 33, 0.15);
  }

  .category-card img {
    width: 100%;
    height: 210px;
    object-fit: cover;
    display: block;
  }

  .category-card h3 {
    font-size: 1.6rem;
    font-weight: 700;
    color: #A0522D; /* Sienna */
    margin: 25px 15px 10px 15px;
     /* Capitalization handled inline */
  }

  .category-card p {
    font-size: 1rem;
    color: #7d746b;
    padding: 0 25px;
    margin-bottom: 25px;
    min-height: 60px;
     /* Standard sentence case */
  }

  .category-link {
    display: inline-block;
    padding: 9px 22px;
    border-radius: 20px;
    background-color: transparent;
    color: #A0522D; /* Sienna */
    text-decoration: none;
    font-weight: 600;
    border: 2px solid #dcd3c7; /* Light brown border */
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
     /* Capitalization handled inline */
  }

  .category-link:hover {
    background-color: #A0522D; /* Sienna */
    color: white;
    border-color: #A0522D;
  }

   /* --- Features Section --- */
  .features-section {
      background-color: #fdfbf7; /* Off-white */
  }
   .features-grid {
       display: grid;
       grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
       gap: 35px;
       max-width: 900px;
       margin: 40px auto 0 auto;
       text-align: left;
   }
   .feature-item {
       display: flex;
       align-items: flex-start;
       gap: 18px;
   }
   .feature-icon {
       font-size: 2.2rem;
       color: #CC7722; /* Ochre icon color */
       margin-top: 3px;
       flex-shrink: 0;
   }
   .feature-item h4 {
       margin: 0 0 8px 0;
       font-size: 1.25rem;
       font-weight: 700;
       color: #654321; /* Deep brown */
       /* Capitalization handled inline */
   }
   .feature-item p {
       margin: 0;
       color: #7d746b;
       font-size: 1rem;
        /* Standard sentence case */
   }

  /* --- Call to Action Section --- */
  .cta-section {
    background-color: #654321; /* Deep Brown background */
    color: #fdfbf7; /* Off-white text */
  }
  .cta-section h2 {
      color: #fff;
      margin-bottom: 20px;
       /* Capitalization handled inline */
  }
  .cta-section p {
      color: rgba(253, 251, 247, 0.85); /* Off-white transparent */
      margin-bottom: 35px;
       /* Standard sentence case */
  }
  .cta-button {
    padding: 15px 40px;
    border-radius: 30px;
    text-decoration: none;
    font-weight: 700;
    font-size: 1.15rem;
    transition: all 0.3s ease;
    background-color: #A0522D; /* Sienna */
    color: white;
    border: 2px solid #A0522D;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
     /* Capitalization handled inline */
  }
  .cta-button:hover {
    background-color: #804123; /* Darker Sienna */
    border-color: #804123;
    transform: scale(1.03);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  }

   /* Responsive Adjustments */
   @media (max-width: 768px) {
        .hero-title { font-size: 2.8rem; }
        .hero-subtitle { font-size: 1.2rem; }
        .landing-section h2 { font-size: 2rem; }
        .category-grid { grid-template-columns: 1fr; }
        .features-grid { grid-template-columns: 1fr; }
   }
    @media (max-width: 480px) {
         .hero-title { font-size: 2.2rem; }
         .hero-cta-buttons { flex-direction: column; }
         .hero-btn { width: 80%; margin: 5px auto; }
    }

`;
const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    // Use a class for positioning
    <div className="language-switcher">
      {/* Add a class to the select element for styling */}
      <select 
        className="language-switcher-select" 
        onChange={handleLanguageChange} 
        defaultValue={i18n.language}
      >
        <option value="en">EN</option>
        <option value="el">ΕL</option>
      </select>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  
  
  return (
    <>
      <style>{landingPageStyles}</style>
      <div className="landing-page-container">
      <LanguageSwitcher /> {/* 👈 Προστέθηκε εδώ */}

        <header className="hero-section">
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