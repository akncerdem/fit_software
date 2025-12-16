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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [viewMode, setViewMode] = useState('sessions'); // 'sessions' or 'templates'
  
  const [formData, setFormData] = useState({
    title: "",
    duration: "",
    notes: ""
  });
  const [editFormData, setEditFormData] = useState({
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

  // Add set state
  const [showAddSetForm, setShowAddSetForm] = useState(false);
  const [newSet, setNewSet] = useState({ exercise_id: "", weight_kg: 0, reps: 0, rpe: 0 });

  // Editing state for a single set and for the whole session
  const [editingSetId, setEditingSetId] = useState(null);
  const [editingSetData, setEditingSetData] = useState({ weight_kg: 0, reps: 0, rpe: 0 });
  const [editingSession, setEditingSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title: "", duration_minutes: 0, notes: "" });

  // Editing state for a single exercise container
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [editingExerciseData, setEditingExerciseData] = useState({ notes: '', order: 1 });

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
      // Initialize session form for potential edits
      setSessionForm({
        title: response.data.title || "",
        duration_minutes: response.data.duration_minutes || 0,
        notes: response.data.notes || ""
      });
      setEditingSession(false);
      setEditingSetId(null);
      setEditingExerciseId(null);
    } catch (err) {
      console.error("Error fetching workout details:", err);
      alert("Could not load workout details.");
    }
  };

  // SESSION DETAYLARINI GÖSTER (VIEW)
  const handleViewDetails = (session) => {
    console.log("View Details clicked for session:", session);
    setSelectedSession(session);
    setShowDetailsModal(true);
    console.log("Details modal should be open now");
  };

  // SESSION DÜZENLE (PUT/PATCH)
  const handleEditSession = (session) => {
    console.log("Edit clicked for session:", session);
    setSelectedSession(session);
    setEditFormData({
      title: session.title || "",
      duration: session.duration_minutes || "",
      notes: session.notes || ""
    });
    setShowEditModal(true);
  };

  const handleUpdateWorkout = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        title: editFormData.title,
        duration_minutes: parseInt(editFormData.duration) || 0,
        notes: editFormData.notes
      };

      console.log("Updating session:", selectedSession.id, payload);
      const response = await api.patch(`workouts/sessions/${selectedSession.id}/`, payload);
      console.log("Update response:", response);

      setShowEditModal(false);
      setSelectedSession(null);
      setEditFormData({ title: "", duration: "", notes: "" });
      fetchWorkouts();
      alert("Antrenman başarıyla güncellendi! ✅");

    } catch (err) {
      console.error("Güncelleme Hatası:", err);
      console.error("Error details:", err.response?.data);
      alert(`Hata oluştu: ${err.response?.data?.detail || err.message || "Lütfen tekrar deneyin."}`);
    }
  };

  // SESSION SİL (DELETE)
  const handleDeleteClick = (session) => {
    setSelectedSession(session);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      console.log("Deleting session:", selectedSession.id);
      const response = await api.delete(`workouts/sessions/${selectedSession.id}/`);
      console.log("Delete response:", response);
      setShowDeleteConfirm(false);
      setSelectedSession(null);
      fetchWorkouts();
      alert("Antrenman başarıyla silindi! 🗑️");

    } catch (err) {
      console.error("Silme Hatası:", err);
      console.error("Error details:", err.response?.data);
      alert(`Hata oluştu: ${err.response?.data?.detail || err.message || "Lütfen tekrar deneyin."}`);
    }
  };

  // SESSION TAMAMLA (TOGGLE is_completed)
  const handleCompleteSession = async (session) => {
    try {
      console.log("Completing session:", session.id, "Current status:", session.is_completed);
      const response = await api.patch(`workouts/sessions/${session.id}/`, {
        is_completed: !session.is_completed
      });
      console.log("Complete response:", response);
      fetchWorkouts();
      alert(session.is_completed ? "Antrenman aktif hale getirildi! 🔄" : "Antrenman tamamlandı! ✅");

    } catch (err) {
      console.error("Tamamlama Hatası:", err);
      console.error("Error details:", err.response?.data);
      alert(`Hata oluştu: ${err.response?.data?.detail || err.message || "Lütfen tekrar deneyin."}`);
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

  // Add set to session
  const handleAddSet = async () => {
    if (!selectedWorkout || !newSet.exercise_id) return;
    try {
      await api.post(`workouts/sessions/${selectedWorkout.id}/add_set/`, newSet);
      // Refresh session data
      const response = await api.get(`workouts/sessions/${selectedWorkout.id}/`);
      setSelectedWorkout(response.data);
      setNewSet({ exercise_id: "", weight_kg: 0, reps: 0, rpe: 0 });
      setShowAddSetForm(false);
    } catch (err) {
      console.error("Error adding set:", err);
      alert("Could not add set.");
    }
  };

  // Update set
  const handleUpdateSet = async (setId, updates) => {
    if (!selectedWorkout) return;
    try {
      await api.patch(`workouts/sessions/${selectedWorkout.id}/update_set/`, {
        set_id: setId,
        ...updates
      });
      // Refresh session data
      const response = await api.get(`workouts/sessions/${selectedWorkout.id}/`);
      setSelectedWorkout(response.data);
    } catch (err) {
      console.error("Error updating set:", err);
    }
  };

  // Delete set
  const handleDeleteSet = async (setId) => {
    if (!selectedWorkout) return;
    if (!window.confirm("Delete this set?")) return;
    try {
      await api.delete(`workouts/sessions/${selectedWorkout.id}/delete_set/?set_id=${setId}`);
      // Refresh session data
      const response = await api.get(`workouts/sessions/${selectedWorkout.id}/`);
      setSelectedWorkout(response.data);
    } catch (err) {
      console.error("Error deleting set:", err);
    }
  };

  // YENİ ANTRENMAN OLUŞTUR (POST)
  const handleCreateWorkout = async (e) => {
    e.preventDefault();

    // 1. Validation: Don't send empty data
    if (selectedExercises.length === 0) {
        alert("Please select at least one exercise.");
        return;
    }
    if (!formData.title) {
        alert("Please enter a workout name.");
        return;
    }

    try {
      console.log("Sending Payload...", formData, selectedExercises); // Debug 1

      const templatePayload = {
        title: formData.title,
        description: formData.notes,
        // Ensure sets/reps are numbers/strings as expected
        exercises_data: selectedExercises.map((ex, index) => ({
          exercise: ex.id,
          order: index + 1,
          sets: ex.sets || 3,      // Default to 3 if not set
          reps: ex.reps || "8-12"  // Default to "8-12" if not set
        }))
      };

      // 2. Create the Template
      // Note: Added '/api/' just in case. Remove if your axios config handles it.
      const templateResponse = await api.post('/workouts/templates/', templatePayload);
      console.log("Template Created:", templateResponse.data); // Debug 2
      
      const templateId = templateResponse.data.id;

      // 3. Start the Session immediately
      await api.post(`/workouts/templates/${templateId}/start_session/`);
      console.log("Session Started Successfully"); // Debug 3

      // 4. Cleanup
      setShowModal(false);
      setFormData({ title: "", notes: "" });
      setSelectedExercises([]);
      
      // 5. Refresh Lists
      // Make sure these functions exist and work!
      if (typeof fetchWorkouts === 'function') fetchWorkouts(); 
      if (typeof fetchTemplates === 'function') fetchTemplates();
      
      alert("Antrenman başarıyla oluşturuldu! 🎉");

    } catch (err) {
      // IMPROVED ERROR LOGGING
      console.error("FULL ERROR OBJECT:", err);
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Server Data:", err.response.data);
        console.error("Server Status:", err.response.status);
        alert(`Error: ${JSON.stringify(err.response.data)}`); // Show the real error on screen
      } else if (err.request) {
        // The request was made but no response was received
        console.error("No Response:", err.request);
        alert("Server not responding. Is Django running?");
      } else {
        // Something happened in setting up the request
        console.error("Error Message:", err.message);
      }
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

  // Start editing a session
  const startEditSession = () => {
    if (!selectedWorkout) return;
    setEditingSession(true);
  };

  const cancelEditSession = () => setEditingSession(false);

  const saveSession = async () => {
    if (!selectedWorkout) return;
    try {
      await api.patch(`workouts/sessions/${selectedWorkout.id}/update_session/`, sessionForm);
      const response = await api.get(`workouts/sessions/${selectedWorkout.id}/`);
      setSelectedWorkout(response.data);
      setEditingSession(false);
      fetchWorkouts();
      fetchStats();
    } catch (err) {
      console.error("Error updating session:", err);
      alert("Could not update session.");
    }
  };

  // Start editing an exercise container
  const startEditExercise = (ex) => {
    setEditingExerciseId(ex.id);
    setEditingExerciseData({ notes: ex.notes || '', order: ex.order || 1 });
  };

  const cancelEditExercise = () => setEditingExerciseId(null);

  const saveEditExercise = async (exerciseId) => {
    if (!selectedWorkout) return;
    try {
      await api.patch(`workouts/sessions/${selectedWorkout.id}/update_exercise/`, {
        exercise_id: exerciseId,
        notes: editingExerciseData.notes,
        order: editingExerciseData.order
      });
      const response = await api.get(`workouts/sessions/${selectedWorkout.id}/`);
      setSelectedWorkout(response.data);
      setEditingExerciseId(null);
    } catch (err) {
      console.error("Error updating exercise:", err);
      alert("Could not update exercise.");
    }
  };

  // Delete exercise from session
  const handleDeleteExercise = async (exerciseId) => {
    if (!selectedWorkout) return;
    if (!window.confirm("Delete this exercise and all its sets?")) return;
    try {
      await api.delete(`workouts/sessions/${selectedWorkout.id}/delete_exercise/?exercise_id=${exerciseId}`);
      // Refresh session data
      const response = await api.get(`workouts/sessions/${selectedWorkout.id}/`);
      setSelectedWorkout(response.data);
      fetchWorkouts();
      fetchStats();
    } catch (err) {
      console.error("Error deleting exercise:", err);
      alert("Could not delete exercise.");
    }
  };

  // Complete workout
  const handleCompleteWorkout = async () => {
    if (!selectedWorkout) return;
    try {
      // First update duration, mood, notes
      await api.patch(`workouts/sessions/${selectedWorkout.id}/update_session/`, {
        duration_minutes: completeForm.duration_minutes,
        mood_emoji: completeForm.mood_emoji,
        notes: completeForm.notes
      });
      // Then mark as complete
      await api.post(`workouts/sessions/${selectedWorkout.id}/complete/`);
      // Refresh data
      const response = await api.get(`workouts/sessions/${selectedWorkout.id}/`);
      setSelectedWorkout(response.data);
      setShowCompleteModal(false);
      fetchWorkouts();
      fetchStats();
      alert("Workout completed! 🎉");
    } catch (err) {
      console.error("Error completing workout:", err);
      alert("Could not complete workout.");
    }
  };

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

          {/* Sessions View - Table Format */}
          {!loading && !error && viewMode === 'sessions' && (
            <div className="workouts-table-container">
              {workouts.length === 0 ? (
                <div style={{textAlign:'center', padding:'40px', background:'white', borderRadius:'12px'}}>
                  <p>No workout sessions found. Create your first one!</p>
                </div>
              ) : (
                <table className="workouts-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Title</th>
                      <th>Duration</th>
                      <th>Exercises</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workouts.map((session) => {
                      const uniqueExercises = session.logs 
                        ? [...new Set(session.logs.map(log => log.exercise_name))].length 
                        : 0;
                      const totalSets = session.logs ? session.logs.length : 0;
                      
                      return (
                        <tr key={session.id} className={session.is_completed ? 'completed' : 'active'}>
                          <td className="table-date">{session.formatted_date || 'N/A'}</td>
                          <td className="table-title">{session.title}</td>
                          <td className="table-duration">
                            {session.duration_minutes ? `${session.duration_minutes} min` : '0 min'}
                          </td>
                          <td className="table-exercises">
                            {uniqueExercises > 0 ? (
                              <span>{uniqueExercises} exercise{uniqueExercises > 1 ? 's' : ''} ({totalSets} sets)</span>
                            ) : (
                              <span style={{color: '#94a3b8'}}>No exercises</span>
                            )}
                          </td>
                          <td className="table-status">
                            <span className={`status-badge ${session.is_completed ? 'status-completed' : 'status-active'}`}>
                              {session.is_completed ? '✓ Completed' : '○ Active'}
                            </span>
                          </td>
                          <td className="table-actions">
                            <button 
                              className="btn-table-view" 
                              onClick={() => handleViewDetails(session)}
                              title="View Details"
                              style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.7rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '50px',
                                height: '32px',
                                marginRight: '0.4rem'
                              }}
                            >
                              View
                            </button>
                            <button 
                              className="btn-table-edit" 
                              onClick={() => handleEditSession(session)}
                              title="Edit"
                              style={{
                                backgroundColor: '#fbbf24',
                                color: 'white',
                                border: 'none',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                minWidth: '35px',
                                height: '32px',
                                marginRight: '0.4rem'
                              }}
                            >
                              ✏️
                            </button>
                            <button 
                              className="btn-table-complete" 
                              onClick={() => handleCompleteSession(session)}
                              title={session.is_completed ? "Mark as Active" : "Mark as Completed"}
                              style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                minWidth: '35px',
                                height: '32px',
                                marginRight: '0.4rem'
                              }}
                            >
                              {session.is_completed ? "↩️" : "✓"}
                            </button>
                            <button 
                              className="btn-table-delete" 
                              onClick={() => handleDeleteClick(session)}
                              title="Delete"
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                minWidth: '35px',
                                height: '32px'
                              }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
                  <button className="btn-add-log" onClick={() => setShowAddSetForm(true)}>
                    + Add Set
                  </button>
                )}
              </div>

              {/* Add Set Form */}
              {showAddSetForm && (
                <div className="add-set-form">
                  <select 
                    className="form-input"
                    value={newSet.exercise_id}
                    onChange={(e) => setNewSet({...newSet, exercise_id: parseInt(e.target.value)})}
                  >
                    <option value="">Select Exercise</option>
                    {selectedWorkout?.exercises?.map(ex => (
                      <option key={ex.id} value={ex.exercise}>{ex.exercise_name}</option>
                    ))}
                    {availableExercises.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    className="form-input input-small"
                    placeholder="Weight"
                    value={newSet.weight_kg}
                    onChange={(e) => setNewSet({...newSet, weight_kg: parseFloat(e.target.value) || 0})}
                  />
                  <input
                    type="number"
                    className="form-input input-small"
                    placeholder="Reps"
                    value={newSet.reps}
                    onChange={(e) => setNewSet({...newSet, reps: parseInt(e.target.value) || 0})}
                  />
                  <input
                    type="number"
                    className="form-input input-small"
                    placeholder="RPE"
                    value={newSet.rpe}
                    onChange={(e) => setNewSet({...newSet, rpe: parseInt(e.target.value) || 0})}
                  />
                  <button className="btn-save-small" onClick={handleAddSet}>Add</button>
                  <button className="btn-cancel-small" onClick={() => setShowAddSetForm(false)}>Cancel</button>
                </div>
              )}

              {/* Exercises + Sets List */}
              <div className="exercises-list">
                {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 ? (
                  selectedWorkout.exercises.map((ex) => (
                    <div key={ex.id} className="exercise-block">
                      <div className="exercise-header">
                        <span className="exercise-name">{ex.exercise_name}</span>
                        <span className="exercise-category" style={{backgroundColor: getCategoryColor(ex.category) + '20', color: getCategoryColor(ex.category)}}>{ex.category}</span>
                        {!selectedWorkout.is_completed && (
                          <button className='btn-add-small' onClick={() => {
                            // Open add form and preselect this exercise
                            setNewSet({...newSet, exercise_id: ex.exercise});
                            setShowAddSetForm(true);
                          }}>+ Add Set</button>
                        )}
                        {!selectedWorkout.is_completed && (
                          <button className='btn-edit-small' onClick={() => startEditExercise(ex)}>Edit</button>
                        )}
                        {!selectedWorkout.is_completed && (
                          <button className='btn-delete-small' onClick={() => handleDeleteExercise(ex.id)}>🗑️</button>
                        )}
                      </div>

                      <div className="sets-list">
                        {ex.sets && ex.sets.length > 0 ? (
                          ex.sets.map((s) => (
                            <div key={s.id} className="set-item">
                              <div className="set-info">
                                <span>Set {s.set_number}</span>
                                {s.weight_kg > 0 && <span>{s.weight_kg} kg</span>}
                                <span>{s.reps} reps</span>
                                {s.rpe != null && <span>RPE {s.rpe}</span>}
                              </div>

                              {!selectedWorkout.is_completed && (
                                <div className="set-actions">
                                  {editingSetId === s.id ? (
                                    <div className="edit-set-form">
                                      <input
                                        type="number"
                                        className="form-input input-small"
                                        placeholder="Weight"
                                        value={editingSetData.weight_kg}
                                        onChange={(e) => setEditingSetData({...editingSetData, weight_kg: parseFloat(e.target.value) || 0})}
                                      />
                                      <input
                                        type="number"
                                        className="form-input input-small"
                                        placeholder="Reps"
                                        value={editingSetData.reps}
                                        onChange={(e) => setEditingSetData({...editingSetData, reps: parseInt(e.target.value) || 0})}
                                      />
                                      <input
                                        type="number"
                                        className="form-input input-small"
                                        placeholder="RPE"
                                        value={editingSetData.rpe}
                                        onChange={(e) => setEditingSetData({...editingSetData, rpe: parseInt(e.target.value) || 0})}
                                      />
                                      <button className="btn-save-small" onClick={() => handleUpdateSet(s.id, editingSetData)}>Save</button>
                                      <button className="btn-cancel-small" onClick={() => setEditingSetId(null)}>Cancel</button>
                                    </div>
                                  ) : (
                                    <>
                                      <button className="btn-icon" onClick={() => {
                                        setEditingSetId(s.id);
                                        setEditingSetData({ weight_kg: s.weight_kg, reps: s.reps, rpe: s.rpe });
                                      }}>&#x270F;&#xFE0F;</button>
                                      <button className="btn-icon" onClick={() => handleDeleteSet(s.id)}>🗑️</button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="no-sets">No sets logged yet for this exercise.</p>
                        )}
                      </div>
                      {editingExerciseId === ex.id && (
                        <div className="edit-exercise-form">
                          <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea
                              className="form-textarea"
                              rows="2"
                              value={editingExerciseData.notes}
                              onChange={(e) => setEditingExerciseData({...editingExerciseData, notes: e.target.value})}
                            ></textarea>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Order</label>
                            <input
                              type="number"
                              className="form-input"
                              value={editingExerciseData.order}
                              onChange={(e) => setEditingExerciseData({...editingExerciseData, order: parseInt(e.target.value) || 1})}
                            />
                          </div>
                          <div className="edit-exercise-actions">
                            <button className="btn-save-small" onClick={() => saveEditExercise(ex.id)}>Save</button>
                            <button className="btn-cancel-small" onClick={cancelEditExercise}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="no-sets">No exercises found for this session.</p>
                )}
              </div>
            </div>

            {/* Notes Section */}
            {editingSession ? (
              <div className="notes-section">
                <h4>Edit Session</h4>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={sessionForm.title} onChange={(e) => setSessionForm({...sessionForm, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input type="number" className="form-input" value={sessionForm.duration_minutes} onChange={(e) => setSessionForm({...sessionForm, duration_minutes: parseInt(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" rows="3" value={sessionForm.notes} onChange={(e) => setSessionForm({...sessionForm, notes: e.target.value})}></textarea>
                </div>
              </div>
            ) : (
              selectedWorkout.notes && (
                <div className="notes-section">
                  <h4>Notes</h4>
                  <p>{selectedWorkout.notes}</p>
                </div>
              )
            )}

            {/* Actions */}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
              {!selectedWorkout.is_completed && (
                <>
                  {!editingSession ? (
                    <>
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
                      <button className="btn-edit" onClick={startEditSession}>Edit</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-save" onClick={saveSession}>Save</button>
                      <button className="btn-cancel" onClick={cancelEditSession}>Cancel</button>
                    </>
                  )}
                </>
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

      {/* EDIT MODAL */}
      {showEditModal && selectedSession && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); setSelectedSession(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Edit Workout</h2>
            
            <form onSubmit={handleUpdateWorkout}>
              <div className="form-group">
                <label className="form-label">Workout Title</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. Leg Day"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input 
                  type="number" 
                  className="form-input"
                  placeholder="45"
                  value={editFormData.duration}
                  onChange={(e) => setEditFormData({...editFormData, duration: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Notes</label>
                <textarea 
                  className="form-textarea"
                  rows="3"
                  placeholder="Details about the workout..."
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setShowEditModal(false); setSelectedSession(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Update Workout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && selectedSession && (
        <div className="modal-overlay" onClick={() => { setShowDeleteConfirm(false); setSelectedSession(null); }}>
          <div className="modal-content modal-delete" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Delete Workout</h2>
            <p style={{marginBottom: '1.5rem', color: '#64748b'}}>
              Are you sure you want to delete <strong>"{selectedSession.title}"</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => { setShowDeleteConfirm(false); setSelectedSession(null); }}>
                Cancel
              </button>
              <button type="button" className="btn-delete" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {showDetailsModal && selectedSession && (
        <div className="modal-overlay" onClick={() => { setShowDetailsModal(false); setSelectedSession(null); }}>
          <div className="modal-content modal-details" onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h2 className="modal-title" style={{margin: 0}}>Workout Details</h2>
              <button 
                onClick={() => { setShowDetailsModal(false); setSelectedSession(null); }}
                style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b'}}
              >
                ×
              </button>
            </div>

            <div className="details-section">
              <div className="details-row">
                <span className="details-label">Title:</span>
                <span className="details-value">{selectedSession.title}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Date:</span>
                <span className="details-value">{selectedSession.formatted_date || 'N/A'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Duration:</span>
                <span className="details-value">{selectedSession.duration_minutes ? `${selectedSession.duration_minutes} minutes` : '0 minutes'}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Status:</span>
                <span className={`status-badge ${selectedSession.is_completed ? 'status-completed' : 'status-active'}`}>
                  {selectedSession.is_completed ? '✓ Completed' : '○ Active'}
                </span>
              </div>
              {selectedSession.notes && (
                <div className="details-row">
                  <span className="details-label">Notes:</span>
                  <span className="details-value" style={{whiteSpace: 'pre-wrap'}}>{selectedSession.notes}</span>
                </div>
              )}
            </div>

            {selectedSession.logs && selectedSession.logs.length > 0 ? (
              <div className="details-section" style={{marginTop: '2rem'}}>
                <h3 style={{marginBottom: '1rem', color: '#1e293b', fontSize: '1.125rem'}}>Exercise Logs</h3>
                <div className="logs-container">
                  {(() => {
                    // Group logs by exercise
                    const groupedLogs = {};
                    selectedSession.logs.forEach(log => {
                      if (!groupedLogs[log.exercise_name]) {
                        groupedLogs[log.exercise_name] = [];
                      }
                      groupedLogs[log.exercise_name].push(log);
                    });

                    return Object.entries(groupedLogs).map(([exerciseName, logs]) => (
                      <div key={exerciseName} className="exercise-group">
                        <h4 className="exercise-name">{exerciseName}</h4>
                        <table className="logs-table">
                          <thead>
                            <tr>
                              <th>Set</th>
                              <th>Weight (kg)</th>
                              <th>Reps</th>
                            </tr>
                          </thead>
                          <tbody>
                            {logs.map((log, idx) => (
                              <tr key={log.id || idx}>
                                <td>{log.set_number}</td>
                                <td>{log.weight_kg || '-'}</td>
                                <td>{log.reps || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ) : (
              <div className="details-section" style={{marginTop: '2rem', textAlign: 'center', padding: '2rem', color: '#94a3b8'}}>
                <p>No exercise logs found for this session.</p>
              </div>
            )}

            <div className="modal-actions" style={{marginTop: '2rem', justifyContent: 'flex-end'}}>
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => { setShowDetailsModal(false); setSelectedSession(null); }}
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn-table-edit" 
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEditSession(selectedSession);
                }}
                style={{marginLeft: '0.5rem', backgroundColor: '#fbbf24', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer'}}
              >
                ✏️ Edit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}