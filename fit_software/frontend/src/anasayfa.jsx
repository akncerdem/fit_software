import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { goalsApi } from "./goalApi";
import { api } from "./config";
import "./index.css";

export default function Anasayfa() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [goals, setGoals] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Fetch goals
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await api.get('/goals/');
        setGoals(response.data || []);
      } catch (error) {
        console.error('Error fetching goals:', error);
        setGoals([]);
      }
    };
    fetchGoals();
  }, []);

  // Fetch badges and check for new ones
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        // First, check and award any earned badges
        await api.post('/goals/check-badges/');
        // Then fetch all badges
        const response = await api.get('/badges/');
        setBadges(response.data || []);
      } catch (error) {
        console.error('Error fetching badges:', error);
        setBadges([]);
      }
    };
    fetchBadges();
  }, []);

  // Fetch activity logs
  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        const response = await api.get('/goals/activity_logs/');
        setActivityLogs(response.data || []);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        setActivityLogs([]);
      }
    };
    
    const logVisitAndFetch = async () => {
      try {
        await api.post('/goals/log_visit/');
        // Fetch logs after logging visit
        await fetchActivityLogs();
      } catch (error) {
        console.error('Error logging visit:', error);
        // Still fetch logs even if logging fails
        await fetchActivityLogs();
      }
    };
    
    logVisitAndFetch();
  }, []);

  // Fetch profile picture
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile/');
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    navigate('/');
  };

  // --- Goals This Week ---
  const getCurrentWeekRange = () => {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return [startOfWeek, endOfWeek];
  };

  const isDateInCurrentWeek = (dateStr) => {
    const [start, end] = getCurrentWeekRange();
    const d = new Date(dateStr);
    // Set time to midnight for accurate date comparison
    d.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  };

  // Count goals completed and total for this week
  const goalsThisWeek = (() => {
    // Goals that have been updated (worked on) this week
    const weekGoals = goals.filter(goal => {
      const updatedDate = new Date(goal.updated_at);
      return isDateInCurrentWeek(updatedDate);
    });
    // Count completed goals (is_completed = true) this week
    const completedThisWeek = weekGoals.filter(g => g.is_completed === true).length;
    // Total = all goals worked on this week
    const total = weekGoals.length;
    return {
      done: completedThisWeek,
      total: total || 0
    };
  })();

  // --- Login Streak ---
  const getLoginStreak = () => {
    // Use activityLogs, count consecutive days up to today
    if (!activityLogs || activityLogs.length === 0) {
      return 0;
    }
    
    // Create a set of date strings for easier lookup
    const daySet = new Set(activityLogs.map(log => log.date));
    
    // Count consecutive days from today
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(today);
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      if (daySet.has(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  // --- Latest Badge ---
  const latestBadge = badges && badges.length > 0
    ? [...badges].sort((a, b) => new Date(b.awarded_at) - new Date(a.awarded_at))[0]
    : null;

  // --- Calendar Heatmap ---
  const getCalendarHeatmapData = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Group completed goals by date for current month
    const completedByDate = {};
    goals.forEach(goal => {
      if (goal.progress >= 100 && goal.is_completed) {
        const updatedDate = new Date(goal.updated_at);
        if (updatedDate.getFullYear() === year && updatedDate.getMonth() === month) {
          const dateKey = updatedDate.getDate();
          completedByDate[dateKey] = (completedByDate[dateKey] || 0) + 1;
        }
      }
    });
    
    // Also count activity logs for current month
    activityLogs.forEach(log => {
      const logDate = new Date(log.date);
      if (logDate.getFullYear() === year && logDate.getMonth() === month) {
        const dateKey = logDate.getDate();
        completedByDate[dateKey] = (completedByDate[dateKey] || 0) + 1;
      }
    });
    
    // Generate array of days
    const calendarDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const count = completedByDate[day] || 0;
      calendarDays.push({ day, count });
    }
    
    return { daysInMonth, firstDay, calendarDays };
  };

  const getHeatmapIntensity = (count) => {
    if (count === 0) return 'heatmap-empty';
    if (count === 1) return 'heatmap-low';
    if (count === 2) return 'heatmap-medium';
    return 'heatmap-high';
  };

  const calendarData = getCalendarHeatmapData();

  // --- Goals Progress (latest 3 active + completed) ---
  const activeGoals = goals.filter(g => g.is_active && !g.is_completed).slice(0, 2);
  const completedGoals = goals.filter(g => g.is_completed).slice(0, 1);

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
            {/* Goals This Week */}
            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <h3 className="stat-title">Goals This Week</h3>
                  <p className="stat-value">
                    {goalsThisWeek.done}/{goalsThisWeek.total} Completed
                  </p>
                  <p className="stat-subtitle">Stay on track!</p>
                </div>
                <div className="stat-icon stat-icon-blue">🎯</div>
              </div>
            </div>

            {/* Login Streak */}
            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <h3 className="stat-title">Login Streak</h3>
                  <p className="stat-value stat-value-green">
                    {getLoginStreak()} Day Streak
                  </p>
                  <p className="stat-subtitle">Keep logging in!</p>
                </div>
                <div className="stat-icon stat-icon-green">🔥</div>
              </div>
            </div>

            {/* Latest Badge */}
            <div className="stat-card">
              <div className="stat-card-content">
                <div>
                  <h3 className="stat-title">Latest Badge</h3>
                  {latestBadge ? (
                    <>
                      <p className="stat-value-badge">
                        🏆 {latestBadge.badge_type}
                      </p>
                      <p className="stat-subtitle">
                        Earned {latestBadge.awarded_at ? new Date(latestBadge.awarded_at).toLocaleDateString() : ''}
                      </p>
                    </>
                  ) : (
                    <p className="stat-value-badge">No badges yet</p>
                  )}
                </div>
                <div className="stat-icon stat-icon-yellow">🏅</div>
              </div>
            </div>
          </div>

          {/* Activity Heatmap Calendar and Goals Progress - Side by Side */}
          <div className="dashboard-row">
            {/* Left Column - Goals Progress and Quote */}
            <div className="dashboard-left-column">
              {/* Goals Progress */}
              <div className="goals-card" data-goals-count={activeGoals.length + completedGoals.length}>
                <h3 className="section-title">Your Goals Progress</h3>
                <div className="goals-list">
                  {activeGoals.length === 0 && completedGoals.length === 0 ? (
                    <div 
                      className="empty-state-message"
                      onClick={() => navigate('/goal')}
                    >
                      You have no goals yet, let's add some!
                    </div>
                  ) : (
                    <>
                      {activeGoals.map((goal, index) => {
                        // Use the same progress calculation as the backend
                        let percentage = 0;
                        if (goal.start_value === goal.target_value) {
                          percentage = goal.current_value === goal.target_value ? 100 : 0;
                        } else if (goal.start_value > goal.target_value) {
                          // Decrease scenario (weight loss, etc.)
                          if (goal.current_value <= goal.target_value) {
                            percentage = 100;
                          } else if (goal.current_value >= goal.start_value) {
                            percentage = 0;
                          } else {
                            const totalDiff = goal.start_value - goal.target_value;
                            const currentDiff = goal.start_value - goal.current_value;
                            percentage = (currentDiff / totalDiff) * 100;
                          }
                        } else {
                          // Increase scenario (running, weight gain, etc.)
                          if (goal.current_value >= goal.target_value) {
                            percentage = 100;
                          } else if (goal.current_value <= goal.start_value) {
                            percentage = 0;
                          } else {
                            const totalDiff = goal.target_value - goal.start_value;
                            const currentDiff = goal.current_value - goal.start_value;
                            percentage = (currentDiff / totalDiff) * 100;
                          }
                        }
                        
                        return (
                          <div key={goal.id || index} className="goal-item">
                            <div className="goal-header">
                              <span className="goal-name">{goal.title}</span>
                              <span className="goal-progress">
                                {goal.current_value} / {goal.target_value} {goal.unit}
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
                      {completedGoals.length > 0 && (
                        <>
                          <div className="goals-divider">Done</div>
                          {completedGoals.map((goal, index) => (
                            <div key={`completed-${goal.id || index}`} className="goal-item completed-goal">
                              <div className="goal-header">
                                <span className="goal-name">✓ {goal.title}</span>
                                <span className="goal-progress">
                                  {goal.current_value} / {goal.target_value} {goal.unit}
                                </span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className="progress-bar-fill completed-fill"
                                  style={{ width: '100%' }}
                                />
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Inspirational Quote */}
              <div className="quote-card">
                <h3 className="section-title">Daily Inspiration</h3>
                <div className="quote-content">
                  <p className="quote-text">"The only way to do great work is to love what you do."</p>
                  <p className="quote-author">— Steve Jobs</p>
                </div>
              </div>
            </div>

            {/* Calendar Heatmap - Right */}
            <div className="calendar-card">
              <h3 className="section-title">Activity Heatmap</h3>
              <div className="calendar-container">
                <div className="calendar-month">
                  {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <div className="calendar-grid">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="calendar-day-header">{day}</div>
                  ))}
                  {Array(calendarData.firstDay.getDay()).fill(null).map((_, i) => (
                    <div key={`empty-${i}`} className="calendar-day empty"></div>
                  ))}
                  {calendarData.calendarDays.map(({ day, count }) => (
                    <div
                      key={day}
                      className={`calendar-day ${getHeatmapIntensity(count)}`}
                      title={`${new Date(new Date().getFullYear(), new Date().getMonth(), day).toLocaleDateString()}: ${count} activities`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="calendar-legend">
                  <div className="legend-item">
                    <div className="legend-box heatmap-empty"></div>
                    <span>No</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-box heatmap-low"></div>
                    <span>Low</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-box heatmap-medium"></div>
                    <span>Mid</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-box heatmap-high"></div>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}