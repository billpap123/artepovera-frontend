import React from "react";
import { Link } from "react-router-dom";
import "../styles/LandingPage.css";

// Sample data for artists (you already have this)
const sampleArtists = [
  { id: 1, name: "Lana Bright", specialty: "Contemporary Dancer", imageUrl: "/images/dancer.jpg" },
  { id: 2, name: "Marcos Silva", specialty: "3D Sculptor", imageUrl: "/images/sculptor.jpg" },
  { id: 3, name: "Aisha Wu", specialty: "Digital Illustrator", imageUrl: "/images/illustrator.jpg" },
];

// Sample data for job ads (you already have this)
const sampleJobs = [
  { id: 1, title: "Looking for live portrait painter", location: "Patras, GR" },
  { id: 2, title: "3D sculpture commission", location: "Paris, France" },
  { id: 3, title: "Illustrator for children’s book", location: "Remote" },
];

// New sample data for creative portfolios / artistic works
const samplePortfolios = [
  {
    id: 1,
    title: "Sunset Overdrive",
    description: "A vivid depiction of the urban sunset.",
    imageUrl: "backend/uploads/1739723536954.jpg",
  },
  {
    id: 2,
    title: "Nature's Whisper",
    description: "A serene landscape painting that calms the soul.",
    imageUrl: "backend/uploads/1739723536954.jpg",
  },
  {
    id: 3,
    title: "Digital Dreamscape",
    description: "Exploring the surreal world of digital art.",
    imageUrl: "backend/uploads/1741806916721.jpeg",
  },
];

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page-container">
      {/* ───────────────────────────
          HERO SECTION
      ─────────────────────────── */}
      <header className="hero-section">
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
          WHAT WE OFFER
      ─────────────────────────── */}
      <section className="what-we-offer-section">
        <h2>What we offer</h2>
        <div className="offer-grid">
          <div className="offer-card">
            <h3>For artists</h3>
            <p>
              Build a stunning portfolio, connect with potential employers, and grow your audience. Whether you’re a painter, dancer, or digital creator, our platform is built to highlight your unique talents.
            </p>
          </div>
          <div className="offer-card">
            <h3>For employers</h3>
            <p>
              Post job ads, browse portfolios, and hire the best creative minds in the industry. Simplify your talent search with advanced filtering and direct messaging.
            </p>
          </div>
          <div className="offer-card">
            <h3>For everyone</h3>
            <p>
              Our inclusive community welcomes artists of all styles and skill levels. Whether you’re just starting out or an established pro, we’ve got the tools you need to succeed.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────
          CREATIVE SHOWCASE SECTION
      ─────────────────────────── */}
      <section className="creative-showcase-section">
        <h2>What Artists Can Do</h2>
        <p>
          Explore creative works from our talented community—get inspired by their innovative visions.
        </p>
        <div className="showcase-grid">
          {samplePortfolios.map((item) => (
            <div key={item.id} className="showcase-card">
              <img src={item.imageUrl} alt={item.title} className="showcase-image" />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────
          LATEST JOB ADS
      ─────────────────────────── */}
      <section className="latest-jobs-section">
        <h2>Latest job ads</h2>
        <p>
          From freelance gigs to full-time opportunities, there’s something for every artist.
        </p>
        <div className="jobs-grid">
          {sampleJobs.map((job) => (
            <div key={job.id} className="job-card">
              <h3>{job.title}</h3>
              <p className="job-location">{job.location}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────
          CALL TO ACTION
      ─────────────────────────── */}
      <section className="cta-section">
        <h2>Ready to join the creative revolution?</h2>
        <p>
          Unlock your full potential—sign up and connect with a vibrant community of artists and employers.
        </p>
        <Link to="/register" className="cta-button">Sign Up Now</Link>
      </section>
    </div>
  );
};

export default LandingPage;
