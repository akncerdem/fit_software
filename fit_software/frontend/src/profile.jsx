import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

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
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    navigate('/');
  }

  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', path: '/anasayfa' },
    { id: 'workout', icon: '💪', label: 'Workout', path: '/workout' },
    { id: 'goal', icon: '🎯', label: 'Goal', path: '/goal' },
    { id: 'challenges', icon: '🏆', label: 'Challenges', path: '/challenges' },
    { id: 'profile', icon: '👤', label: 'Profile', path: '/profile' }
  ];

  // Örnek profil verileri
  const profileData = {
    name: 'Alex Martinez',
    email: 'alex.martinez@university.edu',
    level: 'Intermediate',
    stats: {
      totalWorkouts: 47,
      badgesEarned: 8,
      activeGoals: 4
    },
    badges: [
      { id: 1, name: 'Week Warrior', icon: '🏆', date: 'Nov 18, 2025' },
      { id: 2, name: 'Early Bird', icon: '🔓', date: 'Nov 12, 2025' },
      { id: 3, name: 'Consistency King', icon: '💪', date: 'Nov 5, 2025' },
      { id: 4, name: 'Push-up Pro', icon: '💯', date: 'Oct 28, 2025' },
      { id: 5, name: 'Fire Starter', icon: '🔥', date: 'Oct 20, 2025' },
      { id: 6, name: 'Strength Builder', icon: '🏋️', date: 'Oct 15, 2025' },
      { id: 7, name: 'Cardio Champion', icon: '🏃', date: 'Oct 8, 2025' },
      { id: 8, name: 'Rising Star', icon: '⭐', date: 'Oct 1, 2025' }
    ]
  };

  // Kullanıcının baş harflerini al
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="profile-container">
      {/* Sidebar */}
      <div className="sidebar">
        <Link to="/anasayfa" className="logo-link">
          <h1 className="logo">FitWare</h1>
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
              <div className="user-avatar">👤</div>
              <div>
                <p className="user-name">
                  {user.first_name} {user.last_name}
                </p>
                <p className="user-email">{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Çıkış Yap
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          <div className="profile-layout">
            {/* Left Column - Profile Info */}
            <div className="profile-left">
              <div className="profile-card">
                <div className="profile-avatar-large">
                  {user ? getInitials(user.first_name, user.last_name) : 'AM'}
                </div>
                <h2 className="profile-name">
                  {user ? `${user.first_name} ${user.last_name}` : profileData.name}
                </h2>
                <p className="profile-email">
                  {user?.email || profileData.email}
                </p>
                <span className="profile-level">{profileData.level}</span>

                <div className="profile-buttons">
                  <button className="btn-edit-profile">
                    <span>✏️</span>
                    <span>Edit Profile</span>
                  </button>
                  <button className="btn-logout-red" onClick={handleLogout}>
                    <span>🚪</span>
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Stats and Badges */}
            <div className="profile-right">
              {/* Stats Card */}
              <div className="stats-card">
                <h3 className="section-title">Your Stats</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-icon">💪</div>
                    <div className="stat-value">{profileData.stats.totalWorkouts}</div>
                    <div className="stat-label">Total Workouts</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">🏅</div>
                    <div className="stat-value">{profileData.stats.badgesEarned}</div>
                    <div className="stat-label">Badges Earned</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-value">{profileData.stats.activeGoals}</div>
                    <div className="stat-label">Active Goals</div>
                  </div>
                </div>
              </div>

              {/* Badges Card */}
              <div className="badges-card">
                <h3 className="section-title">Earned Badges</h3>
                <div className="badges-grid">
                  {profileData.badges.map((badge) => (
                    <div key={badge.id} className="badge-item">
                      <div className="badge-icon-large">{badge.icon}</div>
                      <div className="badge-name">{badge.name}</div>
                      <div className="badge-date">{badge.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}