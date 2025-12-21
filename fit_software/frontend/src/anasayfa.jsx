import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./config";
import "./index.css";

export default function Anasayfa() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const token = localStorage.getItem('access') || sessionStorage.getItem('access');
    if (!token) {
      navigate('/');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Fetch profile data
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/');
      if (response.data) {
        const profileData = Array.isArray(response.data) ? response.data[0] : response.data;
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    navigate('/');
  }

  // Örnek veri - gerçek uygulamada API'den gelecek
  const dashboardData = {
    workoutsThisWeek: { current: 2, target: 3 },
    weightProgress: { change: -1.2, current: 68.8 },
    latestBadge: { name: "Week Warrior", earnedDays: 2 },
    goals: [
      { name: "Lose 5 kg", progress: 1.2, target: 5 },
      { name: "3 workouts per week", progress: 2, target: 3 },
      { name: "Run 20 km this month", progress: 9, target: 20 }
    ]
  };

  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', path: '/anasayfa' },
    { id: 'workout', icon: '💪', label: 'Workout', path: '/workout' },
    { id: 'goal', icon: '🎯', label: 'Goal', path: '/goal' },
    { id: 'challenges', icon: '🏆', label: 'Challenges', path: '/challenges' },
    { id: 'profile', icon: '👤', label: 'Profile', path: '/profile' }
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <Link to="/anasayfa" className="logo-link">
          <h1 className="logo">
            FitWare
          </h1>
        </Link>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
    <Link
      key={item.id}
      to={item.path}
      className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
    >
      <span className="nav-icon">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
          ))}
        </nav>

        {user && (
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">
                {profile?.profile_picture ? (
                  <img 
                    src={profile.profile_picture}
                    alt="Profile" 
                    className="sidebar-profile-picture"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  '👤'
                )}
              </div>
              <div>
                <p className="user-name">
                  {user.first_name} {user.last_name}
                </p>
                <p className="user-email">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="logout-btn"
            >
              Çıkış Yap
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          {/* Header */}
          <div className="page-header">
            <h2 className="welcome-title">
              Welcome back, {user?.first_name || 'Alex'}! 👋
            </h2>
            <p className="welcome-subtitle">Here's your fitness overview</p>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            {/* Workouts This Week */}
            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <h3 className="stat-title">
                    Workouts This Week
                  </h3>
                  <p className="stat-value">
                    {dashboardData.workoutsThisWeek.current}/{dashboardData.workoutsThisWeek.target}
                  </p>
                  <p className="stat-subtitle">Keep going!</p>
                </div>
                <div className="stat-icon stat-icon-blue">
                  💪
                </div>
              </div>
            </div>

            {/* Weight Progress */}
            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <h3 className="stat-title">
                    Weight Progress
                  </h3>
                  <p className="stat-value stat-value-green">
                    {dashboardData.weightProgress.change} kg
                  </p>
                  <p className="stat-subtitle">
                    Current: {dashboardData.weightProgress.current} kg
                  </p>
                </div>
                <div className="stat-icon stat-icon-green">
                  📉
                </div>
              </div>
            </div>

            {/* Latest Badge */}
            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <h3 className="stat-title">
                    Latest Badge
                  </h3>
                  <p className="stat-value-badge">
                    🏆 {dashboardData.latestBadge.name}
                  </p>
                  <p className="stat-subtitle">
                    Earned {dashboardData.latestBadge.earnedDays} days ago
                  </p>
                </div>
                <div className="stat-icon stat-icon-yellow">
                  🏅
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-card">
            <h3 className="section-title">
              Quick Actions
            </h3>
            <div className="quick-actions-buttons">
              <button className="btn-primary">
                💪 Log Workout
              </button>
              <button className="btn-secondary">
                🎯 Update Weight
              </button>
              <button className="btn-secondary">
                View Challenges
              </button>
            </div>
          </div>

          {/* Goals Progress */}
          <div className="goals-card">
            <h3 className="section-title">
              Your Goals Progress
            </h3>
            <div className="goals-list">
              {dashboardData.goals.map((goal, index) => {
                const percentage = (goal.progress / goal.target) * 100;
                return (
                  <div key={index} className="goal-item">
                    <div className="goal-header">
                      <span className="goal-name">{goal.name}</span>
                      <span className="goal-progress">
                        {goal.progress} {goal.name.includes('kg') ? 'kg lost' : goal.name.includes('workouts') ? 'completed' : 'km completed'}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}