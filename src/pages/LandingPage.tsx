// src/pages/LandingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

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
// --- End Embedded CSS ---


const LandingPage: React.FC = () => {
  return (
    <>
      {/* Inject styles */}
      <style>{landingPageStyles}</style>
      {/* <Navbar /> */}
      <div className="landing-page-container">

        {/* ─────────────────────────── HERO SECTION ─────────────────────────── */}
        <header className="hero-section">
          <video className="hero-video-background" autoPlay loop muted playsInline>
              <source src="/video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
          </video>
          <div className="hero-overlay"></div>
          <div className="hero-content">
            {/* NOTE: ARTEPOVERA is likely a proper noun/brand, keeping it uppercase */}
            <h1 className="hero-title">ARTEPOVERA</h1>
            {/* Applying rule to subtitle */}
            <p className="hero-subtitle">Where imagination meets opportunity.</p>
            {/* Paragraphs use sentence case */}
            <p className="hero-description">
              Showcase your talents, discover unique gigs, and connect with the creative world—<em>all in one place</em>.
            </p>
            <div className="hero-cta-buttons">
              {/* Applying rule to buttons */}
              <Link to="/login" className="hero-btn">Log in</Link>
              <Link to="/register" className="hero-btn alt">Sign up</Link>
            </div>
          </div>
        </header>

        {/* ─────────────────────────── CATEGORY SHOWCASE SECTION ─────────────────────────── */}
        <section className="landing-section category-showcase-section">
          {/* Applying rule to heading */}
          <h2>Explore opportunities</h2>
          {/* Paragraphs use sentence case */}
          <p className="section-intro">
            Find jobs tailored to your craft. Connect with employers looking for painters, musicians, performers, and more.
          </p>
          <div className="category-grid">
            {/* --- Painter Card --- */}
            <div className="category-card">
              <img src="/images/painter.jpg" alt="Painting and Visual Arts" />
              {/* Applying rule to card heading */}
              <h3>Visual creators</h3>
              {/* Paragraphs use sentence case */}
              <p>Find commissions, gallery showings, illustration gigs, and graphic design projects.</p>
              {/* Applying rule to link text */}
              <Link to="/main?category=painter&category=digital_artist&category=graphic_designer" className="category-link">Browse visual gigs</Link>
            </div>
            {/* --- Musician Card --- */}
            <div className="category-card">
              <img src="/images/musician.jpg" alt="Music and Composition" />
              {/* Applying rule to card heading */}
              <h3>Musicians & composers</h3>
              {/* Paragraphs use sentence case */}
              <p>Discover live performance opportunities, scoring jobs, session work, and band openings.</p>
              {/* Applying rule to link text */}
              <Link to="/main?category=musician" className="category-link">Find music opps</Link>
            </div>
            {/* --- Actor Card --- */}
            <div className="category-card">
              <img src="/images/actor.jpg" alt="Acting and Performance" />
              {/* Applying rule to card heading */}
              <h3>Actors & performers</h3>
              {/* Paragraphs use sentence case */}
              <p>Get cast in your next role. Find auditions for theatre, film, voice-over, and live events.</p>
              {/* Applying rule to link text */}
              <Link to="/main?category=actor&category=actress&category=dancer&category=comedian" className="category-link">See casting calls</Link>
            </div>
          </div>
        </section>

        {/* ─────────────────────────── FEATURES SECTION (Example) ─────────────────────────── */}
         {/* If uncommented, apply rule to h4 elements */}
         {/*
         <section className="landing-section features-section">
              <h2>How it works</h2> // <-- Apply rule
              <p className="section-intro">A platform designed for creative connections and career growth.</p>
              <div className="features-grid">
                  <div className="feature-item">
                       {/* <FaPalette className="feature-icon" /> */}
        {/* <div>
                           <h4>Build your portfolio</h4> // <-- Apply rule
                           <p>Showcase your best work with a beautiful, easy-to-manage portfolio.</p>
                       </div>
                   </div>
                   <div className="feature-item">
                       {/* <FaSearch className="feature-icon" /> */}
        {/* <div>
                           <h4>Find opportunities</h4> // <-- Apply rule
                           <p>Browse relevant job postings and gigs filtered by your artistic discipline.</p>
                       </div>
                   </div>
                  <div className="feature-item">
                      {/* <FaHandshake className="feature-icon" /> */}
       {/* <div>
                           <h4>Connect & collaborate</h4> // <-- Apply rule
                           <p>Directly message employers and fellow artists to build your network.</p>
                       </div>
                   </div>
              </div>
         </section>
         */}


        {/* ─────────────────────────── CALL TO ACTION ─────────────────────────── */}
        <section className="landing-section cta-section">
          {/* Applying rule to heading */}
          <h2>Ready to join the creative revolution?</h2>
          {/* Paragraphs use sentence case */}
          <p className="section-intro">
            Unlock your full potential—sign up and connect with a vibrant community of artists and employers today.
          </p>
           {/* Applying rule to button text */}
          <Link to="/register" className="cta-button">Sign up now</Link>
        </section>

         {/* Optional Footer */}
         {/* <footer className="landing-footer"> ... </footer> */}

      </div>
    </>
  );
};

export default LandingPage;