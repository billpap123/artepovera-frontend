// src/pages/LandingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
// Removed sample data import
// Removed CSS import, styles are embedded below

// --- Embedded CSS Styles for LandingPage ---
const landingPageStyles = `
  /* Import Font */
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

  .landing-page-container {
    font-family: 'Nunito', sans-serif;
    color: #333;
    line-height: 1.6;
  }

  /* --- Hero Section --- */
  .hero-section {
    position: relative;
    height: 85vh; /* Adjust height as needed */
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: white;
    /* --- BACKGROUND IMAGE/VIDEO NEEDED --- */
    background: url('/hero-background.jpg') no-repeat center center/cover; /* Placeholder */
    /* Or use a video: */
    /* background: black; */ /* Fallback color */
  }

  /* Optional Video Background Styling */
  .hero-video-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover; /* Cover entire area */
    z-index: 1;
  }

  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5); /* Dark overlay for text contrast */
    z-index: 2;
  }

  .hero-content {
    position: relative;
    z-index: 3;
    max-width: 800px;
    padding: 20px;
  }

  .hero-title {
    font-size: 3.5rem; /* Adjust size */
    font-weight: 800;
    margin-bottom: 0.5em;
    letter-spacing: 1px;
    /* Optional: Text shadow for better readability */
    text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
  }

  .hero-subtitle {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1em;
    opacity: 0.9;
  }

  .hero-description {
    font-size: 1.1rem;
    margin-bottom: 2em;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    opacity: 0.85;
  }
  .hero-description em {
      font-style: normal;
      color: #90cdf4; /* Example accent color */
  }


  .hero-cta-buttons {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 30px;
  }

  .hero-btn {
    padding: 12px 30px;
    border-radius: 25px; /* Pill shape */
    text-decoration: none;
    font-weight: 700;
    font-size: 1rem;
    transition: all 0.3s ease;
    border: 2px solid white;
    background-color: white;
    color: #333; /* Dark text on light button */
  }
   .hero-btn:hover {
       background-color: transparent;
       color: white;
       transform: translateY(-2px);
   }

   .hero-btn.alt {
      background-color: transparent;
      color: white;
   }
    .hero-btn.alt:hover {
        background-color: white;
        color: #333;
    }


  /* --- Section Base Styles --- */
  .landing-section {
      padding: 60px 20px;
      text-align: center;
  }
   .landing-section h2 {
       font-size: 2.5rem;
       font-weight: 700;
       color: #343a40;
       margin-bottom: 20px;
   }
    .landing-section .section-intro {
        font-size: 1.1rem;
        color: #6c757d;
        max-width: 700px;
        margin: 0 auto 40px auto; /* Center intro text */
    }

  /* --- Category Showcase Section --- */
  .category-showcase-section {
    background-color: #f8f9fa; /* Light background */
  }

  .category-grid {
    display: grid;
    /* Responsive grid: 1 column mobile, 3 columns desktop */
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 30px;
    max-width: 1100px;
    margin: 40px auto 0 auto; /* Add top margin */
  }

  .category-card {
    background-color: #fff;
    border-radius: 10px;
    overflow: hidden; /* Contain image */
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.07);
    text-align: center;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    padding-bottom: 25px; /* Space below button */
  }

  .category-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  .category-card img {
    width: 100%;
    height: 200px; /* Fixed height for images */
    object-fit: cover; /* Cover the area, might crop */
    display: block;
  }

  .category-card h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #20c997; /* Teal color for category titles */
    margin: 20px 15px 10px 15px;
  }

  .category-card p {
    font-size: 1rem;
    color: #6c757d;
    padding: 0 20px; /* Side padding for text */
    margin-bottom: 20px;
    min-height: 60px; /* Give some space for text */
  }

  .category-link {
    display: inline-block;
    padding: 8px 20px;
    border-radius: 20px;
    background-color: #f8f9fa; /* Light background */
    color: #495057;
    text-decoration: none;
    font-weight: 600;
    border: 1px solid #dee2e6;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .category-link:hover {
    background-color: #20c997; /* Teal on hover */
    color: white;
    border-color: #20c997;
  }

   /* --- Simplified What We Offer / Features Section --- */
  .features-section {
      background-color: #fff;
  }
   .features-grid {
       display: grid;
       grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
       gap: 30px;
       max-width: 900px;
       margin: 40px auto 0 auto;
       text-align: left;
   }
   .feature-item {
       display: flex;
       align-items: flex-start; /* Align icon top */
       gap: 15px;
   }
   .feature-icon {
       font-size: 2rem; /* Adjust icon size */
       color: #20c997; /* Teal icon color */
       margin-top: 5px;
   }
   .feature-item h4 {
       margin: 0 0 5px 0;
       font-size: 1.2rem;
       font-weight: 700;
       color: #343a40;
   }
   .feature-item p {
       margin: 0;
       color: #6c757d;
       font-size: 0.95rem;
   }

  /* --- Call to Action Section --- */
  .cta-section {
    background-color: #343a40; /* Dark background */
    color: #fff;
  }
  .cta-section h2 {
      color: #fff;
      margin-bottom: 15px;
  }
  .cta-section p {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 30px;
  }
  .cta-button {
    padding: 14px 35px;
    border-radius: 30px;
    text-decoration: none;
    font-weight: 700;
    font-size: 1.1rem;
    transition: all 0.3s ease;
    background-color: #20c997; /* Teal button */
    color: white;
    border: 2px solid #20c997;
  }
  .cta-button:hover {
    background-color: #1baa80;
    border-color: #1baa80;
    transform: scale(1.05);
  }

   /* Responsive Adjustments */
   @media (max-width: 768px) {
        .hero-title { font-size: 2.8rem; }
        .hero-subtitle { font-size: 1.2rem; }
        .landing-section h2 { font-size: 2rem; }
        .category-grid { grid-template-columns: 1fr; } /* Stack categories */
        .features-grid { grid-template-columns: 1fr; } /* Stack features */
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
      {/* Navbar can be outside container if it's fixed/full-width */}
      {/* <Navbar /> */}
      <div className="landing-page-container">

        {/* ───────────────────────────
            HERO SECTION
        ─────────────────────────── */}
        <header className="hero-section">
          {/* --- Optional Video Background --- */}
          {/* <video className="hero-video-background" autoPlay loop muted playsInline>
              <source src="/background-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
          </video> */}
          {/* --- End Video Background --- */}

          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1 className="hero-title">ARTEPOVERA</h1>
            <p className="hero-subtitle">Where imagination meets opportunity.</p>
            <p className="hero-description">
              Showcase your talents, discover unique gigs, and connect with the creative world—<em>all in one place</em>.
            </p>
            <div className="hero-cta-buttons">
              <Link to="/login" className="hero-btn">Log In</Link>
              <Link to="/register" className="hero-btn alt">Sign Up</Link>
            </div>
          </div>
        </header>

        {/* ───────────────────────────
            CATEGORY SHOWCASE SECTION
        ─────────────────────────── */}
        <section className="landing-section category-showcase-section">
          <h2>Explore Opportunities</h2>
          <p className="section-intro">
            Find jobs tailored to your craft. Connect with employers looking for painters, musicians, performers, and more.
          </p>
          <div className="category-grid">
            {/* --- Painter Card --- */}
            <div className="category-card">
              {/* --- IMAGE NEEDED (e.g., 400x300 or similar aspect ratio) --- */}
              <img src="/images/landing-painter.jpg" alt="Painting and Visual Arts" />
              <h3>Visual Creators</h3>
              <p>Find commissions, gallery showings, illustration gigs, and graphic design projects.</p>
              {/* Link could go to job feed filtered for relevant categories */}
              <Link to="/main?category=painter&category=digital_artist&category=graphic_designer" className="category-link">Browse Visual Gigs</Link>
            </div>

            {/* --- Musician Card --- */}
            <div className="category-card">
               {/* --- IMAGE NEEDED --- */}
              <img src="/images/landing-musician.jpg" alt="Music and Composition" />
              <h3>Musicians & Composers</h3>
              <p>Discover live performance opportunities, scoring jobs, session work, and band openings.</p>
               {/* Link could go to job feed filtered for relevant categories */}
              <Link to="/main?category=musician" className="category-link">Find Music Opps</Link>
            </div>

            {/* --- Actor Card --- */}
            <div className="category-card">
               {/* --- IMAGE NEEDED --- */}
              <img src="/images/landing-actor.jpg" alt="Acting and Performance" />
              <h3>Actors & Performers</h3>
              <p>Get cast in your next role. Find auditions for theatre, film, voice-over, and live events.</p>
               {/* Link could go to job feed filtered for relevant categories */}
              <Link to="/main?category=actor&category=actress&category=dancer&category=comedian" className="category-link">See Casting Calls</Link>
            </div>
          </div>
        </section>

        {/* ───────────────────────────
            FEATURES SECTION (Example using icons - requires icon library)
            You can uncomment and use this OR the old "What we offer" text cards
        ─────────────────────────── */}
         {/*
         <section className="landing-section features-section">
              <h2>How It Works</h2>
              <p className="section-intro">A platform designed for creative connections and career growth.</p>
              <div className="features-grid">
                  <div className="feature-item">
                       {/* Example: Using placeholder text - Replace with actual Icon component */}
                       {/* <span className="feature-icon">🎨</span> */}
                       {/* Example with React Icons (install react-icons first: npm install react-icons)
                       import { FaPalette } from 'react-icons/fa';
                       <FaPalette className="feature-icon" />
                       */}
        {/*
                       <div>
                           <h4>Build Your Portfolio</h4>
                           <p>Showcase your best work with a beautiful, easy-to-manage portfolio.</p>
                       </div>
                   </div>
                   <div className="feature-item">
                       {/* <span className="feature-icon">🔍</span> */}
        {/*
                       <div>
                           <h4>Find Opportunities</h4>
                           <p>Browse relevant job postings and gigs filtered by your artistic discipline.</p>
                       </div>
                   </div>
                  <div className="feature-item">
                       {/* <span className="feature-icon">🤝</span> */}
        {/*
                       <div>
                           <h4>Connect & Collaborate</h4>
                           <p>Directly message employers and fellow artists to build your network.</p>
                       </div>
                   </div>
              </div>
         </section>
         */}


        {/* ───────────────────────────
            CALL TO ACTION
        ─────────────────────────── */}
        <section className="landing-section cta-section">
          <h2>Ready to Join the Creative Revolution?</h2>
          <p className="section-intro">
            Unlock your full potential—sign up and connect with a vibrant community of artists and employers today.
          </p>
          <Link to="/register" className="cta-button">Sign Up Now</Link>
        </section>

         {/* Optional Footer */}
         {/* <footer className="landing-footer"> ... </footer> */}

      </div>
    </>
  );
};

export default LandingPage;