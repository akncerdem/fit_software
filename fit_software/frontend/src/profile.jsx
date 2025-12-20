import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./config";
import "./profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    bio: '',
    fitness_level: ''
  });
  const [badgeFormData, setBadgeFormData] = useState({
    badge_type: ''
  });
  const [error, setError] = useState(null);
  const [badgeError, setBadgeError] = useState(null);

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

    fetchProfile();
    fetchBadges();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/');
      setProfile(response.data);
      // Update form data if profile exists
      if (response.data) {
        setFormData({
          height: response.data.height || '',
          weight: response.data.weight || '',
          bio: response.data.bio || '',
          fitness_level: response.data.fitness_level || ''
        });
      }
    } catch (error) {
      // Profile doesn't exist yet, that's okay
      if (error.response?.status !== 404) {
        console.error('Error fetching profile:', error);
      }
    }
  };

  const fetchBadges = async () => {
    try {
      const response = await api.get('/badges/');
      setBadges(response.data || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      setBadges([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    navigate('/');
  }

  const handleEditProfile = () => {
    // Load existing profile data if available
    if (profile) {
      setFormData({
        height: profile.height || '',
        weight: profile.weight || '',
        bio: profile.bio || '',
        fitness_level: profile.fitness_level || ''
      });
    } else {
      // Reset form for new profile
      setFormData({
        height: '',
        weight: '',
        bio: '',
        fitness_level: ''
      });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
  };


  const handleCloseBadgeModal = () => {
    setIsBadgeModalOpen(false);
    setBadgeError(null);
  };

  const handleBadgeInputChange = (e) => {
    const { name, value } = e.target;
    setBadgeFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteBadge = async (badgeId) => {
    if (!window.confirm('Are you sure you want to delete this badge?')) {
      return;
    }

    try {
      await api.delete(`/badges/${badgeId}/`);
      // Refresh badges list
      await fetchBadges();
    } catch (error) {
      console.error('Error deleting badge:', error);
      alert('Failed to delete badge. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        bio: formData.bio || '',
        fitness_level: formData.fitness_level || ''
      };

      let response;
      if (profile && profile.id) {
        // Update existing profile
        response = await api.put(`/profile/${profile.id}/`, payload);
      } else {
        // Create new profile
        response = await api.post('/profile/', payload);
      }

      setProfile(response.data);
      setIsModalOpen(false);
      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.response?.data?.detail || error.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFitnessLevelLabel = (level) => {
    const labels = {
      'no_exercise': "I don't exercise",
      'sometimes': 'Sometimes exercise',
      'regular': 'Regular (3+ times per week)'
    };
    return labels[level] || level;
  };

  const getBadgeIcon = (badgeType) => {
    const iconMap = {
      'Week Warrior': '🏆',
      'Early Bird': '🔓',
      'Consistency King': '💪',
      'Push-up Pro': '💯',
      'Fire Starter': '🔥',
      'Strength Builder': '🏋️',
      'Cardio Champion': '🏃',
      'Rising Star': '⭐'
    };
    return iconMap[badgeType] || '🏅';
  };

  const formatBadgeDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

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
                <span className="profile-level">
                  {profile?.fitness_level ? getFitnessLevelLabel(profile.fitness_level) : profileData.level}
                </span>
                {profile?.bio && (
                  <p className="profile-bio">{profile.bio}</p>
                )}
                {profile?.height && (
                  <p className="profile-stats">Height: {profile.height} cm</p>
                )}
                {profile?.weight && (
                  <p className="profile-stats">Weight: {profile.weight} kg</p>
                )}

                <div className="profile-buttons">
                  <button className="btn-edit-profile" onClick={handleEditProfile}>
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
                    <div className="stat-value">{badges.length}</div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="section-title" style={{ margin: 0 }}>Earned Badges</h3>
                </div>
                {badges.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem', 
                    color: '#666',
                    fontSize: '0.95rem'
                  }}>
                    You haven't earned any badges yet — start your first goal to begin your journey!
                  </div>
                ) : (
                  <div className="badges-grid">
                    {badges.map((badge, index) => (
                      <div key={badge.id} className="badge-item">
                        <button 
                          className="badge-delete-btn"
                          onClick={() => handleDeleteBadge(badge.id)}
                          title="Delete Badge"
                        >
                          ×
                        </button>
                        <div className="badge-icon-large">{getBadgeIcon(badge.badge_type)}</div>
                        <div className="badge-name">{badge.badge_type}</div>
                        <div className="badge-date">{formatBadgeDate(badge.awarded_at)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {profile ? 'Edit Profile' : 'Create Profile'}
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              {error && (
                <div className="form-error">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="height">Height (cm)</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  placeholder="Enter height in cm"
                  step="0.1"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="weight">Weight (kg)</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="Enter weight in kg"
                  step="0.1"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fitness_level">Fitness Level</label>
                <select
                  id="fitness_level"
                  name="fitness_level"
                  value={formData.fitness_level}
                  onChange={handleInputChange}
                >
                  <option value="">Select fitness level</option>
                  <option value="no_exercise">I don't exercise</option>
                  <option value="sometimes">Sometimes exercise</option>
                  <option value="regular">Regular (3+ times per week)</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Badge Modal */}
      {isBadgeModalOpen && (
        <div className="modal-overlay" onClick={handleCloseBadgeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Badge</h2>
              <button className="modal-close" onClick={handleCloseBadgeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleBadgeSubmit} className="profile-form">
              {badgeError && (
                <div className="form-error">
                  {badgeError}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="badge_type">Badge Type</label>
                <select
                  id="badge_type"
                  name="badge_type"
                  value={badgeFormData.badge_type}
                  onChange={handleBadgeInputChange}
                  required
                >
                  <option value="">Select a badge type</option>
                  <option value="Week Warrior">Week Warrior</option>
                  <option value="Early Bird">Early Bird</option>
                  <option value="Consistency King">Consistency King</option>
                  <option value="Push-up Pro">Push-up Pro</option>
                  <option value="Fire Starter">Fire Starter</option>
                  <option value="Strength Builder">Strength Builder</option>
                  <option value="Cardio Champion">Cardio Champion</option>
                  <option value="Rising Star">Rising Star</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseBadgeModal}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add Badge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}