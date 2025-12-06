import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./challenges.css";

export default function Challenges() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('challenges');
  const [selectedTab, setSelectedTab] = useState('all'); // 'all' or 'my'

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

  // Örnek challenges verisi
  const challengesData = [
    {
      id: 1,
      title: 'Run 20 km this month',
      description: 'Complete a total of 20 kilometers of running before the end of the month',
      participants: 145,
      daysLeft: 12,
      badge: '🚴 Marathon Starter Badge',
      isJoined: false
    },
    {
      id: 2,
      title: 'Workout 10 times this month',
      description: 'Complete at least 10 workout sessions in the current month',
      participants: 234,
      daysLeft: 12,
      badge: '💪 Consistency King Badge',
      isJoined: true
    },
    {
      id: 3,
      title: '30-Day Plank Challenge',
      description: 'Hold a plank for increasing durations over 30 days',
      participants: 189,
      daysLeft: 18,
      badge: '🔥 Core Champion Badge',
      isJoined: true
    },
    {
      id: 4,
      title: 'Lift 10,000 kg total',
      description: 'Accumulate 10,000 kg of total weight lifted this month',
      participants: 98,
      daysLeft: 12,
      badge: '🐂 Iron Warrior Badge',
      isJoined: false
    }
  ];

  const filteredChallenges = selectedTab === 'my' 
    ? challengesData.filter(c => c.isJoined)
    : challengesData;

  return (
    <div className="challenges-container">
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
          {/* Tab Buttons */}
          <div className="challenges-tabs">
            <button 
              className={`tab-button ${selectedTab === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTab('all')}
            >
              All Challenges
            </button>
            <button 
              className={`tab-button ${selectedTab === 'my' ? 'active' : ''}`}
              onClick={() => setSelectedTab('my')}
            >
              My Challenges
            </button>
          </div>

          {/* Challenges Grid */}
          <div className="challenges-grid">
            {filteredChallenges.map((challenge) => (
              <div key={challenge.id} className="challenge-card">
                <div className="challenge-header">
                  <h3 className="challenge-title">{challenge.title}</h3>
                  {challenge.isJoined && (
                    <span className="joined-badge">Joined</span>
                  )}
                </div>

                <p className="challenge-description">{challenge.description}</p>

                <div className="challenge-info">
                  <div className="info-item">
                    <span className="info-icon">👥</span>
                    <span className="info-text">{challenge.participants} participants</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">🕒</span>
                    <span className="info-text">{challenge.daysLeft} days left</span>
                  </div>
                </div>

                <div className="challenge-badge">
                  <span className="badge-icon">🏆</span>
                  <span className="badge-text">{challenge.badge}</span>
                </div>

                <div className="challenge-actions">
                  {challenge.isJoined ? (
                    <>
                      <button className="btn-view-progress">View Progress</button>
                      <button className="btn-details">Details</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-join">Join Challenge</button>
                      <button className="btn-details">Details</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}