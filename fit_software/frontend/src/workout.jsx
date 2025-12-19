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

  // Template detail/edit modal states
  const [showTemplateDetailModal, setShowTemplateDetailModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({ title: '', description: '' });
  const [templateExercises, setTemplateExercises] = useState([]);
  const [templateExerciseSearch, setTemplateExerciseSearch] = useState('');
  const [showTemplateExerciseDropdown, setShowTemplateExerciseDropdown] = useState(false);

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

  // ========== TEMPLATE FUNCTIONS ==========
  
  // View template details
  const handleViewTemplate = async (template) => {
    try {
      const response = await api.get(`workouts/templates/${template.id}/`);
      setSelectedTemplate(response.data);
      setTemplateForm({
        title: response.data.title || '',
        description: response.data.description || ''
      });
      // Convert exercises to editable format
      const exercises = (response.data.exercises || []).map(ex => ({
        id: ex.exercise,
        name: ex.exercise_name,
        category: ex.category,
        sets: ex.sets || 3,
        reps: ex.target_reps || 0,
        order: ex.order
      }));
      setTemplateExercises(exercises);
      setEditingTemplate(false);
      setShowTemplateDetailModal(true);
    } catch (err) {
      console.error("Error fetching template:", err);
      alert("Could not load template details.");
    }
  };

  // Start editing template
  const startEditTemplate = () => {
    setEditingTemplate(true);
  };

  const cancelEditTemplate = () => {
    // Reset to original values
    if (selectedTemplate) {
      setTemplateForm({
        title: selectedTemplate.title || '',
        description: selectedTemplate.description || ''
      });
      const exercises = (selectedTemplate.exercises || []).map(ex => ({
        id: ex.exercise,
        name: ex.exercise_name,
        category: ex.category,
        sets: ex.sets || 3,
        reps: ex.target_reps || 0,
        order: ex.order
      }));
      setTemplateExercises(exercises);
    }
    setEditingTemplate(false);
  };

  // Save template changes
  const saveTemplate = async () => {
    if (!selectedTemplate) return;
    if (templateExercises.length === 0) {
      alert("Please add at least one exercise.");
      return;
    }
    try {
      const payload = {
        title: templateForm.title,
        description: templateForm.description,
        exercises_data: templateExercises.map((ex, index) => ({
          exercise: ex.id,
          order: index + 1,
          sets: ex.sets || 3,
          reps: String(ex.reps || 0)
        }))
      };
      await api.put(`workouts/templates/${selectedTemplate.id}/`, payload);
      // Refresh template data
      const response = await api.get(`workouts/templates/${selectedTemplate.id}/`);
      setSelectedTemplate(response.data);
      setEditingTemplate(false);
      fetchTemplates();
      alert("Template updated! ✅");
    } catch (err) {
      console.error("Error updating template:", err);
      alert("Could not update template.");
    }
  };

  // Delete template
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    if (!window.confirm("Delete this template? This cannot be undone.")) return;
    try {
      await api.delete(`workouts/templates/${selectedTemplate.id}/`);
      setShowTemplateDetailModal(false);
      setSelectedTemplate(null);
      fetchTemplates();
      alert("Template deleted.");
    } catch (err) {
      console.error("Error deleting template:", err);
      alert("Could not delete template.");
    }
  };

  // Add exercise to template (when editing)
  const addExerciseToTemplate = (exercise) => {
    if (!templateExercises.find(ex => ex.id === exercise.id)) {
      setTemplateExercises([...templateExercises, { 
        id: exercise.id, 
        name: exercise.name, 
        category: exercise.category,
        sets: 3, 
        reps: 10 
      }]);
    }
    setTemplateExerciseSearch('');
    setShowTemplateExerciseDropdown(false);
  };

  // Remove exercise from template
  const removeExerciseFromTemplate = (exerciseId) => {
    setTemplateExercises(templateExercises.filter(ex => ex.id !== exerciseId));
  };

  // Update exercise details in template
  const updateTemplateExercise = (exerciseId, field, value) => {
    setTemplateExercises(templateExercises.map(ex => 
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    ));
  };

  // Filtered exercises for template editing
  const filteredTemplateExercises = availableExercises.filter(ex => 
    ex.name.toLowerCase().includes(templateExerciseSearch.toLowerCase())
  );

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

          {/* Sessions View - Table Layout */}
          {!loading && !error && viewMode === 'sessions' && (
            <div className="sessions-table-container">
              {workouts.length === 0 ? (
                <div style={{textAlign:'center', padding:'40px', background:'white', borderRadius:'12px'}}>
                  <p>No workout sessions found. Create your first one!</p>
                </div>
              ) : (
                <table className="sessions-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Title</th>
                      <th>Date</th>
                      <th>Exercises</th>
                      <th>Sets</th>
                      <th>Reps</th>
                      <th>Duration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workouts.map((workout) => (
                      <tr key={workout.id} className={workout.is_completed ? 'completed-row' : 'in-progress-row'}>
                        <td>
                          <span className={`status-badge ${workout.is_completed ? 'completed' : 'in-progress'}`}>
                            {workout.is_completed ? '✓' : '🔄'}
                          </span>
                          {workout.mood_emoji && <span className="mood-emoji">{workout.mood_emoji}</span>}
                        </td>
                        <td className="session-title-cell">{workout.title}</td>
                        <td>{workout.formatted_date}</td>
                        <td>{workout.total_exercises || 0}</td>
                        <td>{workout.total_sets || 0}</td>
                        <td>{workout.total_reps || 0}</td>
                        <td>{workout.duration_minutes || 0} min</td>
                        <td>
                          <button className="btn-view-table" onClick={() => handleViewWorkout(workout)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
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
                      <button className="btn-view" onClick={() => handleViewTemplate(template)}>
                        View / Edit
                      </button>
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

      {/* TEMPLATE DETAIL/EDIT MODAL */}
      {showTemplateDetailModal && selectedTemplate && (
        <div className="modal-overlay" onClick={() => setShowTemplateDetailModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="detail-modal-header">
              <div>
                {!editingTemplate ? (
                  <>
                    <h2 className="modal-title">{selectedTemplate.title}</h2>
                    <p className="modal-subtitle">{selectedTemplate.description || 'No description'}</p>
                  </>
                ) : (
                  <>
                    <input 
                      type="text"
                      className="form-input"
                      value={templateForm.title}
                      onChange={(e) => setTemplateForm({...templateForm, title: e.target.value})}
                      placeholder="Template Title"
                    />
                  </>
                )}
              </div>
              <span className="template-badge">📋 Template</span>
            </div>

            {/* Template Stats */}
            <div className="detail-stats">
              <div className="detail-stat">
                <span className="detail-stat-value">{templateExercises.length}</span>
                <span className="detail-stat-label">Exercises</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-value">{templateExercises.reduce((sum, ex) => sum + (ex.sets || 0), 0)}</span>
                <span className="detail-stat-label">Total Sets</span>
              </div>
            </div>

            {/* Description when editing */}
            {editingTemplate && (
              <div className="form-group" style={{marginBottom: '1rem'}}>
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea"
                  rows="2"
                  placeholder="Template description..."
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                ></textarea>
              </div>
            )}

            {/* Exercises Section */}
            <div className="logs-section">
              <div className="logs-header">
                <h3>Exercises</h3>
              </div>

              {/* Add Exercise Search - Only when editing */}
              {editingTemplate && (
                <div className="exercise-search-container" style={{marginBottom: '1rem'}}>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Search exercises to add..."
                    value={templateExerciseSearch}
                    onChange={(e) => {
                      setTemplateExerciseSearch(e.target.value);
                      setShowTemplateExerciseDropdown(true);
                    }}
                    onFocus={() => setShowTemplateExerciseDropdown(true)}
                  />
                  
                  {showTemplateExerciseDropdown && templateExerciseSearch && (
                    <div className="exercise-dropdown">
                      {filteredTemplateExercises.length > 0 ? (
                        filteredTemplateExercises.slice(0, 10).map(ex => (
                          <div 
                            key={ex.id} 
                            className="exercise-dropdown-item"
                            onClick={() => addExerciseToTemplate(ex)}
                          >
                            <span>{ex.name}</span>
                            <span className="exercise-category">{ex.category}</span>
                          </div>
                        ))
                      ) : (
                        <div className="exercise-dropdown-item no-results">
                          <span>No exercises found</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Exercise List */}
              {templateExercises.length === 0 ? (
                <p style={{color: '#64748b', textAlign: 'center', padding: '1rem'}}>
                  No exercises in this template. {editingTemplate && 'Add some above!'}
                </p>
              ) : (
                <div className="exercise-list">
                  {templateExercises.map((ex, index) => (
                    <div key={ex.id} className="exercise-card">
                      <div className="exercise-card-header">
                        <div className="exercise-card-info">
                          <span className="exercise-order">{index + 1}</span>
                          <span className="exercise-name">{ex.name}</span>
                          <span 
                            className="exercise-category-badge" 
                            style={{backgroundColor: getCategoryColor(ex.category) + '20', color: getCategoryColor(ex.category)}}
                          >
                            {ex.category}
                          </span>
                        </div>
                        {editingTemplate && (
                          <button 
                            className="btn-delete-small"
                            onClick={() => removeExerciseFromTemplate(ex.id)}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      
                      <div className="exercise-card-details">
                        {editingTemplate ? (
                          <div className="exercise-inputs">
                            <label>Sets:</label>
                            <input
                              type="number"
                              className="input-small"
                              value={ex.sets}
                              onChange={(e) => updateTemplateExercise(ex.id, 'sets', parseInt(e.target.value) || 0)}
                              min="1"
                            />
                            <label>Reps:</label>
                            <input
                              type="number"
                              className="input-small"
                              value={ex.reps}
                              onChange={(e) => updateTemplateExercise(ex.id, 'reps', parseInt(e.target.value) || 0)}
                              min="0"
                            />
                          </div>
                        ) : (
                          <div className="exercise-summary">
                            <span>{ex.sets} sets × {ex.reps} reps</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="modal-actions">
              {!editingTemplate ? (
                <>
                  <button className="btn-delete" onClick={handleDeleteTemplate}>
                    Delete
                  </button>
                  <button className="btn-edit" onClick={startEditTemplate}>
                    Edit
                  </button>
                  <button className="btn-start" onClick={() => {
                    handleStartSession(selectedTemplate.id);
                    setShowTemplateDetailModal(false);
                  }}>
                    Start Session
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-cancel" onClick={cancelEditTemplate}>
                    Cancel
                  </button>
                  <button className="btn-save" onClick={saveTemplate}>
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}