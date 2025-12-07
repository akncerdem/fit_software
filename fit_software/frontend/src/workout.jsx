import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./workout.css";

export default function Workout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('workout');

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

  // Örnek workout verisi
  const workoutData = {
    title: "Full Body A",
    description: "Complete upper and lower body workout focusing on compound movements",
    exercises: [
      {
        id: 1,
        name: "Barbell Squat",
        sets: 4,
        reps: "8-10",
        rest: "2 min"
      },
      {
        id: 2,
        name: "Bench Press",
        sets: 4,
        reps: "8-10",
        rest: "2 min"
      },
      {
        id: 3,
        name: "Barbell Row",
        sets: 4,
        reps: "8-12",
        rest: "90 sec"
      },
      {
        id: 4,
        name: "Overhead Press",
        sets: 3,
        reps: "8-10",
        rest: "90 sec"
      },
      {
        id: 5,
        name: "Romanian Deadlift",
        sets: 3,
        reps: "10-12",
        rest: "90 sec"
      }
    ]
  };

  return (
    <div className="workout-container">
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
          {/* Back Button */}
          <button className="back-button" onClick={() => navigate('/anasayfa')}>
            <span className="back-arrow">←</span>
            <span>Back to Workouts</span>
          </button>

          {/* Workout Header */}
          <div className="workout-header">
            <div className="workout-title-section">
              <h1 className="workout-title">{workoutData.title}</h1>
              <p className="workout-description">{workoutData.description}</p>
            </div>
            <div className="workout-actions">
              <button className="btn-edit">
                <span>✏️</span>
                <span>Edit</span>
              </button>
              <button className="btn-duplicate">
                <span>📋</span>
                <span>Duplicate</span>
              </button>
            </div>
          </div>

          {/* Exercises Section */}
          <div className="exercises-section">
            <h2 className="exercises-title">Exercises</h2>
            
            <div className="exercises-list">
              {workoutData.exercises.map((exercise) => (
                <div key={exercise.id} className="exercise-item">
                  <div className="exercise-number">{exercise.id}</div>
                  <div className="exercise-info">
                    <h3 className="exercise-name">{exercise.name}</h3>
                  </div>
                  <div className="exercise-details">
                    <div className="exercise-detail">
                      <span className="detail-value">{exercise.sets} sets</span>
                    </div>
                    <div className="exercise-detail">
                      <span className="detail-value">{exercise.reps} reps</span>
                    </div>
                    <div className="exercise-detail">
                      <span className="detail-value">{exercise.rest} rest</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}