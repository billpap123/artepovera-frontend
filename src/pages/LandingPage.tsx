import React from "react";
import { Link } from "react-router-dom";
import "../styles/LandingPage.css";

// Sample data for artists
const sampleArtists = [
  {
    id: 1,
    name: "Lana Bright",
    specialty: "Contemporary Dancer",
    imageUrl: "/images/dancer.jpg", // Replace with actual image path
  },
  {
    id: 2,
    name: "Marcos Silva",
    specialty: "3D Sculptor",
    imageUrl: "/images/sculptor.jpg",
  },
  {
    id: 3,
    name: "Aisha Wu",
    specialty: "Digital Illustrator",
    imageUrl: "/images/illustrator.jpg",
  },
];

// Sample data for job ads
const sampleJobs = [
  {
    id: 1,
    title: "Looking for Live Portrait Painter",
    location: "New York, USA",
    imageUrl: "/images/portrait-job.jpg",
  },
  {
    id: 2,
    title: "3D Sculpture Commission",
    location: "Paris, France",
    imageUrl: "/images/sculpture-job.jpg",
  },
  {
    id: 3,
    title: "Illustrator for Children’s Book",
    location: "Remote",
    imageUrl: "/images/illustrator-job.jpg",
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
          <p className="hero-subtitle">
            Where imagination meets opportunity.
          </p>
          <p className="hero-description">
            Showcase your talents, discover unique gigs, and connect with
            the creative world—<em>all in one place</em>.
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
        <h2>What We Offer</h2>
        <div className="offer-grid">
          <div className="offer-card">
            <h3>For Artists</h3>
            <p>
              Build a stunning portfolio, connect with potential employers, 
              and grow your audience. Whether you’re a painter, dancer, or 
              digital creator, our platform is built to highlight your 
              unique talents.
            </p>
          </div>
          <div className="offer-card">
            <h3>For Employers</h3>
            <p>
              Post job ads, browse portfolios, and hire the best creative 
              minds in the industry. Simplify your talent search with 
              advanced filtering and direct messaging.
            </p>
          </div>
          <div className="offer-card">
            <h3>For Everyone</h3>
            <p>
              Our inclusive community welcomes artists of all styles and 
              skill levels. Whether you’re just starting out or an 
              established pro, we’ve got the tools you need to succeed.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────
          FEATURED ARTISTS
      ─────────────────────────── */}
      <section className="featured-artists-section">
        <h2>Meet Our Featured Artists</h2>
        <p>
          Get inspired by creators who have made their mark on ARTEPOVERA.
        </p>
        <div className="artists-grid">
          {sampleArtists.map((artist) => (
            <div key={artist.id} className="artist-card">
              <img
                src={artist.imageUrl}
                alt={`${artist.name} - ${artist.specialty}`}
                className="artist-image"
              />
              <h3>{artist.name}</h3>
              <p>{artist.specialty}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────
          LATEST JOB ADS
      ─────────────────────────── */}
      <section className="latest-jobs-section">
        <h2>Latest Job Ads</h2>
        <p>
          From freelance gigs to full-time opportunities, there’s something
          for every artist.
        </p>
        <div className="jobs-grid">
          {sampleJobs.map((job) => (
            <div key={job.id} className="job-card">
              <img
                src={job.imageUrl}
                alt={job.title}
                className="job-image"
              />
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
        <h2>Ready to Join the Creative Revolution?</h2>
        <p>
          Unlock your full potential—sign up and connect with a vibrant 
          community of artists and employers.
        </p>
        <Link to="/register" className="cta-button">Sign Up Now</Link>
      </section>
    </div>
  );
};

export default LandingPage;
