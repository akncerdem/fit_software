import { Link } from 'react-router-dom';
import './landing.css';

export default function Landing() {
  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <nav className="landing-navbar">
        <div className="navbar-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 100 100" fill="white" width="26" height="26">
              <path d="M50 10 L85 25 L85 50 Q85 75 50 90 Q15 75 15 50 L15 25 Z" fillOpacity="0.9" />
              <circle cx="50" cy="35" r="6" fill="#06b6d4" />
              <path d="M35 48 Q35 42 42 42 L58 42 Q65 42 65 48 L65 70 L35 70 Z" fill="#06b6d4" />
              <path d="M35 50 L25 40 M65 50 L75 40" stroke="#06b6d4" strokeWidth="4" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <span className="logo-text">Fitware</span>
        </div>
        <div className="navbar-actions">
          <Link to="/login" className="login-btn">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Simple Background Decoration */}
        <div className="hero-bg-decoration">
          <div className="bg-circle bg-circle-1"></div>
          <div className="bg-circle bg-circle-2"></div>
          <div className="bg-circle bg-circle-3"></div>
        </div>

        <div className="hero-content">
          {/* Hero Icon */}
          <div className="hero-icon">
            <svg viewBox="0 0 100 100" fill="white">
              <path d="M50 10 L85 25 L85 50 Q85 75 50 90 Q15 75 15 50 L15 25 Z" fillOpacity="0.9" />
              <circle cx="50" cy="35" r="6" fill="#06b6d4" />
              <path d="M35 48 Q35 42 42 42 L58 42 Q65 42 65 48 L65 70 L35 70 Z" fill="#06b6d4" />
              <path d="M35 50 L25 40 M65 50 L75 40" stroke="#06b6d4" strokeWidth="4" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          <h1 className="hero-title">Fitware</h1>
          <p className="hero-subtitle">Your Fitness Journey Starts Here</p>
          <p className="hero-tagline">
            Track your workouts, set goals, and achieve your fitness potential
            with our comprehensive health management platform.
          </p>

          <Link to="/signup" className="hero-cta">
            Get Started
          </Link>

          {/* Feature Pills */}
          <div className="feature-pills">
            <div className="feature-pill">
              <span>🏋️</span> Workout Tracking
            </div>
            <div className="feature-pill">
              <span>📊</span> Progress Analytics
            </div>
            <div className="feature-pill">
              <span>🎯</span> Goal Setting
            </div>
            <div className="feature-pill">
              <span>🏆</span> Challenges
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
