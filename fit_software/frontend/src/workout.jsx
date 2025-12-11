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
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //  MODAL VE FORM STATE'LERİ 
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [viewMode, setViewMode] = useState('sessions'); // 'sessions' or 'templates'
  
  const [formData, setFormData] = useState({
    title: "",
    duration: "",
    notes: ""
  });

  // Complete workout form
  const [completeForm, setCompleteForm] = useState({
    duration_minutes: 0,
    mood_emoji: "💪",
    notes: ""
  });

  // EXERCISE STATE'LERİ
  const [availableExercises, setAvailableExercises] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false);
  const [showNewExerciseForm, setShowNewExerciseForm] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: "", category: "strength", metric_type: "weight" });

  // Add log state
  const [showAddLogForm, setShowAddLogForm] = useState(false);
  const [newLog, setNewLog] = useState({ exercise: "", set_number: 1, weight_kg: 0, reps: 0 });

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
    fetchTemplates();
    fetchExercises();
    fetchStats();
  }, [navigate]);

  // Egzersizleri Getir (GET)
  const fetchExercises = async () => {
    try {
      const response = await api.get('exercises/');
      setAvailableExercises(response.data);
    } catch (err) {
      console.error("Exercise API Hatası:", err);
    }
  };

  // Fetch workout stats
  const fetchStats = async () => {
    try {
      const response = await api.get('workouts/sessions/stats/');
      setStats(response.data);
    } catch (err) {
      console.error("Stats API Error:", err);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const response = await api.get('workouts/templates/');
      setTemplates(response.data);
    } catch (err) {
      console.error("Templates API Error:", err);
    }
  };

  // Antrenmanları Listele (GET)
  const fetchWorkouts = async () => {
    try {
      const response = await api.get('workouts/sessions/');
      setWorkouts(response.data);
      setLoading(false);
    } catch (err) {
      console.error("API Hatası:", err);
      setError("Failed to load workouts.");
      setLoading(false);
    }
  };

  // View workout details
  const handleViewWorkout = async (workout) => {
    try {
      const response = await api.get(`workouts/sessions/${workout.id}/`);
      setSelectedWorkout(response.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Error fetching workout details:", err);
      alert("Could not load workout details.");
    }
  };

  // Start session from template
  const handleStartSession = async (templateId) => {
    try {
      const response = await api.post(`workouts/templates/${templateId}/start_session/`);
      setSelectedWorkout(response.data);
      setShowDetailModal(true);
      fetchWorkouts();
      alert("Session started! 💪");
    } catch (err) {
      console.error("Error starting session:", err);
      alert("Could not start session.");
    }
  };

  // Add log to session
  const handleAddLog = async () => {
    if (!selectedWorkout || !newLog.exercise) return;
    try {
      await api.post(`workouts/sessions/${selectedWorkout.id}/add_log/`, newLog);
      // Refresh session data
      const response = await api.get(`workouts/sessions/${selectedWorkout.id}/`);
      setSelectedWorkout(response.data);
      setNewLog({ exercise: "", set_number: 1, weight_kg: 0, reps: 0 });
      setShowAddLogForm(false);
    } catch (err) {
      console.error("Error adding log:", err);
      alert("Could not add log.");
    }
  };

  // Update log
  const handleUpdateLog = async (logId, updates) => {
    if (!selectedWorkout) return;
    try {
      await api.patch(`workouts/sessions/${selectedWorkout.id}/update_log/`, {
        log_id: logId,
        ...updates
      });
      // Refresh session data
      const response = await api.get(`workouts/sessions/${selectedWorkout.id}/`);
      setSelectedWorkout(response.data);
    } catch (err) {
      console.error("Error updating log:", err);
    }
  };

  // Delete log
  const handleDeleteLog = async (logId) => {
    if (!selectedWorkout) return;
    if (!window.confirm("Delete this set?")) return;
    try {
      await api.delete(`workouts/sessions/${selectedWorkout.id}/delete_log/?log_id=${logId}`);
      // Refresh session data
      const response = await api.get(`workouts/sessions/${selectedWorkout.id}/`);
      setSelectedWorkout(response.data);
    } catch (err) {
      console.error("Error deleting log:", err);
    }
  };

  // Complete workout
  const handleCompleteWorkout = async () => {
    if (!selectedWorkout) return;
    try {
      await api.post(`workouts/sessions/${selectedWorkout.id}/complete/`, completeForm);
      setShowCompleteModal(false);
      setShowDetailModal(false);
      fetchWorkouts();
      fetchStats();
      alert("Workout completed! 🎉");
    } catch (err) {
      console.error("Error completing workout:", err);
      alert("Could not complete workout.");
    }
  };

  // YENİ ANTRENMAN OLUŞTUR (POST)
  const handleCreateWorkout = async (e) => {
    e.preventDefault(); // Sayfanın yenilenmesini engelle

    try {
      // First create a workout template with exercises
      const templatePayload = {
        title: formData.title,
        description: formData.notes,
        exercises_data: selectedExercises.map((ex, index) => ({
          exercise: ex.id,
          order: index + 1,
          sets: ex.sets || 3,
          reps: ex.reps || "8-12"
        }))
      };

      // Create template first
      const templateResponse = await api.post('workouts/templates/', templatePayload);
      
      // Then start a session from this template
      await api.post(`workouts/templates/${templateResponse.data.id}/start_session/`);

      // Başarılı olursa:
      setShowModal(false); // Modalı kapat
      setFormData({ title: "", duration: "", notes: "" }); // Formu temizle
      setSelectedExercises([]); // Seçili egzersizleri temizle
      fetchWorkouts(); // Antrenmanları yeniden yükle
      fetchTemplates(); // Refresh templates
      alert("Antrenman başarıyla oluşturuldu! 🎉");

    } catch (err) {
      console.error("Oluşturma Hatası:", err);
      alert("Hata oluştu, lütfen tekrar deneyin.");
    }
  };

  // Egzersiz Ekleme
  const addExerciseToWorkout = (exercise) => {
    if (!selectedExercises.find(ex => ex.id === exercise.id)) {
      setSelectedExercises([...selectedExercises, { ...exercise, sets: 3, reps: "8-12" }]);
    }
    setExerciseSearch("");
    setShowExerciseDropdown(false);
  };

  // Egzersiz Çıkarma
  const removeExerciseFromWorkout = (exerciseId) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.id !== exerciseId));
  };

  // Egzersiz Set/Rep Güncelleme
  const updateExerciseDetails = (exerciseId, field, value) => {
    setSelectedExercises(selectedExercises.map(ex => 
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    ));
  };

  // Yeni Custom Egzersiz Oluştur
  const handleCreateExercise = async () => {
    if (!newExercise.name.trim()) {
      alert("Egzersiz adı gerekli!");
      return;
    }
    try {
      const response = await api.post('exercises/', newExercise);
      setAvailableExercises([...availableExercises, response.data]);
      addExerciseToWorkout(response.data);
      setNewExercise({ name: "", category: "strength", metric_type: "weight" });
      setShowNewExerciseForm(false);
      alert("Yeni egzersiz oluşturuldu! 💪");
    } catch (err) {
      console.error("Egzersiz oluşturma hatası:", err);
      alert("Egzersiz oluşturulamadı.");
    }
  };

  // Helper function to get metric label
  const getMetricLabel = (metricType) => {
    const labels = {
      'weight': 'kg',
      'distance': 'km',
      'time': 'min',
      'reps': 'reps'
    };
    return labels[metricType] || '';
  };

  // Helper to format category badge color
  const getCategoryColor = (category) => {
    const colors = {
      'strength': '#2563eb',
      'cardio': '#10b981',
      'flexibility': '#8b5cf6'
    };
    return colors[category] || '#64748b';
  };

  // Filtrelenmiş Egzersizler
  const filteredExercises = availableExercises.filter(ex => 
    ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

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
          {/* Stats Section */}
          {stats && (
            <div className="stats-section">
              <div className="stat-card">
                <span className="stat-icon">🏋️</span>
                <div className="stat-info">
                  <span className="stat-value">{stats.total_workouts}</span>
                  <span className="stat-label">Total Workouts</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">⏱️</span>
                <div className="stat-info">
                  <span className="stat-value">{stats.total_duration_minutes}</span>
                  <span className="stat-label">Total Minutes</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">📊</span>
                <div className="stat-info">
                  <span className="stat-value">{stats.total_sets}</span>
                  <span className="stat-label">Total Sets</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">💪</span>
                <div className="stat-info">
                  <span className="stat-value">{Math.round(stats.total_volume_kg).toLocaleString()}</span>
                  <span className="stat-label">Volume (kg)</span>
                </div>
              </div>
            </div>
          )}

          <div className="workout-header">
            <div className="workout-title-section">
              <h1 className="workout-title" style={{fontSize:'24px', fontWeight:'bold'}}>My Workouts</h1>
              <p className="workout-description">Manage your workout history</p>
            </div>
            <div className="workout-actions">
              {/* View mode toggle */}
              <div className="view-toggle">
                <button 
                  className={`toggle-btn ${viewMode === 'sessions' ? 'active' : ''}`}
                  onClick={() => setViewMode('sessions')}
                >
                  Sessions
                </button>
                <button 
                  className={`toggle-btn ${viewMode === 'templates' ? 'active' : ''}`}
                  onClick={() => setViewMode('templates')}
                >
                  Templates
                </button>
              </div>
              <button className="btn-new-workout" onClick={() => setShowModal(true)}>
                <span>➕ New Workout</span>
              </button>
            </div>
          </div>

          {loading && <p style={{textAlign:'center', padding:'20px'}}>Loading sessions...</p>}
          {error && <p style={{textAlign:'center', color:'red'}}>{error}</p>}

          {/* Sessions View */}
          {!loading && !error && viewMode === 'sessions' && (
            <div className="workouts-grid">
              {workouts.length === 0 ? (
                <div style={{gridColumn: '1/-1', textAlign:'center', padding:'40px', background:'white', borderRadius:'12px'}}>
                  <p>No workout sessions found. Create your first one!</p>
                </div>
              ) : (
                workouts.map((workout) => (
                  <div key={workout.id} className="workout-card">
                    <div className="workout-card-header">
                      <span className={`status-badge ${workout.is_completed ? 'completed' : 'in-progress'}`}>
                        {workout.is_completed ? '✓ Completed' : '🔄 In Progress'}
                      </span>
                      {workout.mood_emoji && <span className="mood-emoji">{workout.mood_emoji}</span>}
                    </div>
                    <div className="workout-card-content">
                      <h3 className="workout-card-title">{workout.title}</h3>
                      <p className="workout-card-date">{workout.formatted_date}</p>
                      
                      <div className="workout-card-stats">
                        <div className="mini-stat">
                          <span className="mini-stat-value">{workout.total_exercises || 0}</span>
                          <span className="mini-stat-label">Exercises</span>
                        </div>
                        <div className="mini-stat">
                          <span className="mini-stat-value">{workout.total_sets || 0}</span>
                          <span className="mini-stat-label">Sets</span>
                        </div>
                        <div className="mini-stat">
                          <span className="mini-stat-value">{workout.total_reps || 0}</span>
                          <span className="mini-stat-label">Reps</span>
                        </div>
                        <div className="mini-stat">
                          <span className="mini-stat-value">{workout.duration_minutes || 0}</span>
                          <span className="mini-stat-label">Min</span>
                        </div>
                      </div>
                      
                      {workout.total_volume > 0 && (
                        <div className="volume-bar">
                          <span>Total Volume: {Math.round(workout.total_volume).toLocaleString()} kg</span>
                        </div>
                      )}
                    </div>

                    <div className="workout-card-actions">
                      <button className="btn-view" onClick={() => handleViewWorkout(workout)}>
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Templates View */}
          {!loading && !error && viewMode === 'templates' && (
            <div className="workouts-grid">
              {templates.length === 0 ? (
                <div style={{gridColumn: '1/-1', textAlign:'center', padding:'40px', background:'white', borderRadius:'12px'}}>
                  <p>No workout templates found. Create your first one!</p>
                </div>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className="workout-card template-card">
                    <div className="workout-card-content">
                      <h3 className="workout-card-title">{template.title}</h3>
                      <p className="workout-card-description">{template.description || 'No description'}</p>
                      
                      <div className="workout-card-stats">
                        <div className="mini-stat">
                          <span className="mini-stat-value">{template.exercise_count || 0}</span>
                          <span className="mini-stat-label">Exercises</span>
                        </div>
                        <div className="mini-stat">
                          <span className="mini-stat-value">{template.total_sets || 0}</span>
                          <span className="mini-stat-label">Sets</span>
                        </div>
                      </div>

                      {template.exercises && template.exercises.length > 0 && (
                        <div className="template-exercises-preview">
                          {template.exercises.slice(0, 3).map(ex => (
                            <span key={ex.id} className="exercise-preview-badge" style={{backgroundColor: getCategoryColor(ex.category) + '20', color: getCategoryColor(ex.category)}}>
                              {ex.exercise_name}
                            </span>
                          ))}
                          {template.exercises.length > 3 && (
                            <span className="exercise-preview-more">+{template.exercises.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="workout-card-actions">
                      <button className="btn-start" onClick={() => handleStartSession(template.id)}>
                        Start Session
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showDetailModal && selectedWorkout && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="detail-modal-header">
              <div>
                <h2 className="modal-title">{selectedWorkout.title}</h2>
                <p className="modal-subtitle">{selectedWorkout.formatted_date}</p>
              </div>
              <span className={`status-badge ${selectedWorkout.is_completed ? 'completed' : 'in-progress'}`}>
                {selectedWorkout.is_completed ? '✓ Completed' : '🔄 In Progress'}
              </span>
            </div>

            {/* Session Stats */}
            <div className="detail-stats">
              <div className="detail-stat">
                <span className="detail-stat-value">{selectedWorkout.total_exercises}</span>
                <span className="detail-stat-label">Exercises</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-value">{selectedWorkout.total_sets}</span>
                <span className="detail-stat-label">Sets</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-value">{selectedWorkout.total_reps}</span>
                <span className="detail-stat-label">Reps</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-value">{Math.round(selectedWorkout.total_volume)}</span>
                <span className="detail-stat-label">Volume (kg)</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-value">{selectedWorkout.duration_minutes || 0}</span>
                <span className="detail-stat-label">Minutes</span>
              </div>
            </div>

            {/* Logs Section */}
            <div className="logs-section">
              <div className="logs-header">
                <h3>Exercise Logs</h3>
                {!selectedWorkout.is_completed && (
                  <button className="btn-add-log" onClick={() => setShowAddLogForm(true)}>
                    + Add Set
                  </button>
                )}
              </div>

              {/* Add Log Form */}
              {showAddLogForm && (
                <div className="add-log-form">
                  <select 
                    className="form-input"
                    value={newLog.exercise}
                    onChange={(e) => setNewLog({...newLog, exercise: parseInt(e.target.value)})}
                  >
                    <option value="">Select Exercise</option>
                    {availableExercises.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="form-input input-small"
                    placeholder="Set #"
                    value={newLog.set_number}
                    onChange={(e) => setNewLog({...newLog, set_number: parseInt(e.target.value) || 1})}
                  />
                  <input
                    type="number"
                    className="form-input input-small"
                    placeholder="Weight"
                    value={newLog.weight_kg}
                    onChange={(e) => setNewLog({...newLog, weight_kg: parseFloat(e.target.value) || 0})}
                  />
                  <input
                    type="number"
                    className="form-input input-small"
                    placeholder="Reps"
                    value={newLog.reps}
                    onChange={(e) => setNewLog({...newLog, reps: parseInt(e.target.value) || 0})}
                  />
                  <button className="btn-save-small" onClick={handleAddLog}>Add</button>
                  <button className="btn-cancel-small" onClick={() => setShowAddLogForm(false)}>Cancel</button>
                </div>
              )}

              {/* Logs List */}
              <div className="logs-list">
                {selectedWorkout.logs && selectedWorkout.logs.length > 0 ? (
                  selectedWorkout.logs.map((log) => (
                    <div key={log.id} className="log-item">
                      <div className="log-info">
                        <span className="log-exercise-name">{log.exercise_name}</span>
                        <span className="log-category-badge" style={{backgroundColor: getCategoryColor(log.category) + '20', color: getCategoryColor(log.category)}}>
                          {log.category}
                        </span>
                      </div>
                      <div className="log-details">
                        <span className="log-set">Set {log.set_number}</span>
                        {log.weight_kg > 0 && <span className="log-weight">{log.weight_kg} kg</span>}
                        <span className="log-reps">{log.reps} reps</span>
                      </div>
                      {!selectedWorkout.is_completed && (
                        <div className="log-actions">
                          <button 
                            className="btn-icon"
                            onClick={() => handleDeleteLog(log.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="no-logs">No sets logged yet. Add your first set!</p>
                )}
              </div>
            </div>

            {/* Notes Section */}
            {selectedWorkout.notes && (
              <div className="notes-section">
                <h4>Notes</h4>
                <p>{selectedWorkout.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
              {!selectedWorkout.is_completed && (
                <button 
                  className="btn-save" 
                  onClick={() => {
                    setCompleteForm({
                      duration_minutes: selectedWorkout.duration_minutes || 0,
                      mood_emoji: "💪",
                      notes: selectedWorkout.notes || ""
                    });
                    setShowCompleteModal(true);
                  }}
                >
                  Complete Workout
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE WORKOUT MODAL */}
      {showCompleteModal && (
        <div className="modal-overlay" onClick={() => setShowCompleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Complete Workout 🎉</h2>
            
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <input 
                type="number" 
                className="form-input"
                value={completeForm.duration_minutes}
                onChange={(e) => setCompleteForm({...completeForm, duration_minutes: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">How did you feel?</label>
              <div className="mood-selector">
                {['😫', '😐', '🙂', '😊', '💪', '🔥'].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    className={`mood-btn ${completeForm.mood_emoji === emoji ? 'selected' : ''}`}
                    onClick={() => setCompleteForm({...completeForm, mood_emoji: emoji})}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea 
                className="form-textarea"
                rows="3"
                placeholder="How was your workout?"
                value={completeForm.notes}
                onChange={(e) => setCompleteForm({...completeForm, notes: e.target.value})}
              ></textarea>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowCompleteModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleCompleteWorkout}>
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

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

              {/* EXERCISES SECTION */}
              <div className="form-group">
                <label className="form-label">Exercises</label>
                
                {/* Exercise Search */}
                <div className="exercise-search-container">
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Search exercises..."
                    value={exerciseSearch}
                    onChange={(e) => {
                      setExerciseSearch(e.target.value);
                      setShowExerciseDropdown(true);
                    }}
                    onFocus={() => setShowExerciseDropdown(true)}
                  />
                  
                  {/* Dropdown */}
                  {showExerciseDropdown && (
                    <div className="exercise-dropdown">
                      {filteredExercises.length > 0 ? (
                        filteredExercises.slice(0, 50).map(ex => (
                          <div 
                            key={ex.id} 
                            className="exercise-dropdown-item"
                            onClick={() => addExerciseToWorkout(ex)}
                          >
                            <span>{ex.name}</span>
                            <span className="exercise-category">{ex.category}</span>
                          </div>
                        ))
                      ) : (
                        <div className="exercise-dropdown-item no-results">
                          <span>No exercises found</span>
                          {exerciseSearch.trim() !== "" && (
                            <button 
                              type="button"
                              className="btn-create-exercise"
                              onClick={() => {
                                setNewExercise({ ...newExercise, name: exerciseSearch });
                                setShowNewExerciseForm(true);
                                setShowExerciseDropdown(false);
                              }}
                            >
                              + Create "{exerciseSearch}"
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Exercises List */}
                {selectedExercises.length > 0 && (
                  <div className="selected-exercises">
                    {selectedExercises.map((ex, index) => (
                      <div key={ex.id} className="selected-exercise-item">
                        <div className="exercise-info">
                          <span className="exercise-order">{index + 1}</span>
                          <span className="exercise-name">{ex.name}</span>
                          <span className="exercise-category-badge">{ex.category}</span>
                        </div>
                        <div className="exercise-inputs">
                          <input
                            type="number"
                            className="input-small"
                            placeholder="Sets"
                            value={ex.sets}
                            onChange={(e) => updateExerciseDetails(ex.id, 'sets', parseInt(e.target.value) || 0)}
                            min="1"
                          />
                          <span>x</span>
                          <input
                            type="text"
                            className="input-small"
                            placeholder="Reps"
                            value={ex.reps}
                            onChange={(e) => updateExerciseDetails(ex.id, 'reps', e.target.value)}
                          />
                          <button 
                            type="button" 
                            className="btn-remove-exercise"
                            onClick={() => removeExerciseFromWorkout(ex.id)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* New Exercise Form (Mini) */}
              {showNewExerciseForm && (
                <div className="new-exercise-form">
                  <h4>Create New Exercise</h4>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Exercise name"
                    value={newExercise.name}
                    onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                  />
                  <select
                    className="form-input"
                    value={newExercise.category}
                    onChange={(e) => setNewExercise({...newExercise, category: e.target.value})}
                  >
                    <option value="strength">Strength</option>
                    <option value="cardio">Cardio</option>
                    <option value="flexibility">Flexibility</option>
                  </select>
                  <div className="new-exercise-actions">
                    <button type="button" className="btn-cancel-small" onClick={() => setShowNewExerciseForm(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn-save-small" onClick={handleCreateExercise}>
                      Add Exercise
                    </button>
                  </div>
                </div>
              )}

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
                <button type="submit" className="btn-save" disabled={selectedExercises.length === 0}>
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