import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./config";
import "./workout.css";

export default function Workout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('workout');
  
  // Veri State'leri
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //  MODAL VE FORM STATE'LERİ 
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    duration: "",
    notes: ""
  });

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
    fetchWorkouts();
  }, [navigate]);

  // Antrenmanları Listele (GET)
  const fetchWorkouts = async () => {
    try {
      const response = await api.get('workouts/sessions/');
      const formattedData = response.data.map(session => ({
        id: session.id,
        title: session.title,
        description: session.notes || `Completed on ${session.formatted_date}`,
        duration: session.duration_minutes ? `${session.duration_minutes} min` : '0 min',
        exerciseCount: session.logs ? session.logs.length : 0,
        isCompleted: session.is_completed
      }));
      setWorkouts(formattedData);
      setLoading(false);
    } catch (err) {
      console.error("API Hatası:", err);
      setError("Failed to load workouts.");
      setLoading(false);
    }
  };

  // YENİ ANTRENMAN OLUŞTUR (POST)
  const handleCreateWorkout = async (e) => {
    e.preventDefault(); // Sayfanın yenilenmesini engelle

    try {
      const payload = {
        title: formData.title,
        duration_minutes: parseInt(formData.duration) || 0, // Sayıya çevir
        notes: formData.notes
      };

      // POST İsteği At
      await api.post('workouts/sessions/', payload);

      // Başarılı olursa:
      setShowModal(false); // Modalı kapat
      setFormData({ title: "", duration: "", notes: "" }); // Formu temizle
      fetchWorkouts(); // Antrenmanları yeniden yükle
      alert("Antrenman başarıyla oluşturuldu! 🎉");

    } catch (err) {
      console.error("Oluşturma Hatası:", err);
      alert("Hata oluştu, lütfen tekrar deneyin.");
    }
  };

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

  return (
    <div className="workout-container">
      {/* Sidebar  */}
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
                <p className="user-name">{user.first_name} {user.last_name}</p>
                <p className="user-email" style={{ fontSize: '12px' }}>{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">Çıkış Yap</button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          <div className="workout-header">
            <div className="workout-title-section">
              <h1 className="workout-title" style={{fontSize:'24px', fontWeight:'bold'}}>My Workouts</h1>
              <p className="workout-description">Manage your workout history</p>
            </div>
            <div className="workout-actions">
              {/* Butona basınca Modalı açıyoruz */}
              <button className="btn-new-workout" onClick={() => setShowModal(true)}>
                <span>➕ New Workout</span>
              </button>
            </div>
          </div>

          {loading && <p style={{textAlign:'center', padding:'20px'}}>Loading sessions...</p>}
          {error && <p style={{textAlign:'center', color:'red'}}>{error}</p>}

          {!loading && !error && (
            <div className="workouts-grid">
              {workouts.length === 0 ? (
                <div style={{gridColumn: '1/-1', textAlign:'center', padding:'40px', background:'white', borderRadius:'12px'}}>
                  <p>No workout sessions found. Create your first one!</p>
                </div>
              ) : (
                workouts.map((workout) => (
                  <div key={workout.id} className="workout-card">
                    <div className="workout-card-content">
                      <h3 className="workout-card-title">{workout.title}</h3>
                      <p className="workout-card-description">{workout.description}</p>
                      
                      <div className="workout-card-details">
                        <div className="detail-item">
                          <span className="detail-icon">⏱️</span>
                          <span>{workout.duration}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">📋</span>
                          <span>{workout.exerciseCount} exercises</span>
                        </div>
                      </div>
                    </div>

                    <div className="workout-card-actions">
                      <button className="btn-start">Start</button>
                      <button className="btn-view">View</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/*  MODAL (POPUP FORM) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          {/* İçeriğe tıklayınca kapanmasın diye stopPropagation kullanıyoruz */}
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Create New Workout</h2>
            
            <form onSubmit={handleCreateWorkout}>
              <div className="form-group">
                <label className="form-label">Workout Title</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. Leg Day"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input 
                  type="number" 
                  className="form-input"
                  placeholder="45"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Notes</label>
                <textarea 
                  className="form-textarea"
                  rows="3"
                  placeholder="Details about the workout..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Workout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}