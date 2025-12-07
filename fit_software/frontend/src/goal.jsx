import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { goalsApi } from "./goalApi";
import "./goal.css";

export default function Goal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('goal');
  
  // Backend state'leri
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- MODAL STATE'LERİ ---
  
  // 1. Yeni Goal Ekleme Modalı
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    icon: '🎯',
    current_value: 0,
    target_value: '',
    unit: 'kg'
  });

  // 2. Update (Progress) Modalı
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null); 
  const [updateValue, setUpdateValue] = useState('');

  // 3. Delete (Silme) Modalı
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 4. View (Detay) Modalı - YENİ
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewGoal, setViewGoal] = useState(null);

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

    fetchGoals();
  }, [navigate]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await goalsApi.getActive();
      setGoals(data);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- YARDIMCI FONKSİYONLAR ---
  
  // Tarihi okunabilir formata çevirir (Örn: 10 Aralık 2025)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // --- HANDLERS ---

  // Detay Modalını Aç - YENİ
  const openViewModal = (goal) => {
    setViewGoal(goal);
    setIsViewModalOpen(true);
  };

  const openUpdateModal = (goal) => {
    setSelectedGoal(goal);
    setUpdateValue(goal.current_value);
    setIsUpdateModalOpen(true);
  };

  const openDeleteModal = (goal) => {
    setSelectedGoal(goal);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmUpdate = async (e) => {
    e.preventDefault();
    if (!selectedGoal) return;

    const parsedValue = parseFloat(updateValue);
    if (isNaN(parsedValue) || parsedValue < 0) {
      alert('Please enter a valid number');
      return;
    }

    try {
      const result = await goalsApi.updateProgress(selectedGoal.id, parsedValue);
      if (result.success) {
        fetchGoals();
        setIsUpdateModalOpen(false);
        setSelectedGoal(null);
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      alert('Failed to update progress.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedGoal) return;

    try {
      await goalsApi.delete(selectedGoal.id);
      fetchGoals();
      setIsDeleteModalOpen(false);
      setSelectedGoal(null);
    } catch (err) {
      console.error('Error deleting goal:', err);
      alert('Failed to delete goal.');
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.target_value) {
      alert('Please fill in title and target value');
      return;
    }

    try {
      await goalsApi.create(newGoal);
      setIsModalOpen(false);
      setNewGoal({
        title: '',
        description: '',
        icon: '🎯',
        current_value: 0,
        target_value: '',
        unit: 'kg'
      });
      fetchGoals();
    } catch (err) {
      console.error('Error creating goal:', err);
      alert('Failed to create goal.');
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
    <div className="goal-container">
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
          <div className="goals-header">
            <div className="goals-title-section">
              <h1 className="goals-title">My Goals</h1>
              <p className="goals-description">Track your fitness objectives</p>
            </div>
            <button className="btn-add-goal" onClick={() => setIsModalOpen(true)}>
              <span className="plus-icon">+</span>
              <span>Add New Goal</span>
            </button>
          </div>

          <div className="goals-grid">
            {loading ? (
              <div className="empty-state">
                <div className="empty-icon">⏳</div>
                <p className="empty-text">Loading goals...</p>
              </div>
            ) : error ? (
              <div className="empty-state">
                <div className="empty-icon">⚠️</div>
                <p className="empty-text error">{error}</p>
                <button onClick={fetchGoals} className="btn-retry">
                  Retry
                </button>
              </div>
            ) : goals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <p className="empty-text">No active goals yet</p>
                <p className="empty-subtext">
                  Create your first goal to start tracking your fitness journey!
                </p>
              </div>
            ) : (
              goals.map((goal) => (
                <div key={goal.id} className="goal-card">
                  {/* Tıklanabilir Header */}
                  <div 
                    className="goal-card-header" 
                    onClick={() => openViewModal(goal)}
                    style={{ cursor: 'pointer' }}
                    title="Click for details"
                  >
                    <div className="goal-info">
                      <span className="goal-icon">{goal.icon}</span>
                      <h3 className="goal-title">{goal.title}</h3>
                    </div>
                    <div className="goal-stats">
                      <span className="goal-current">{goal.current_value}</span>
                      <span className="goal-separator">/</span>
                      <span className="goal-target">{goal.target_value} {goal.unit}</span>
                    </div>
                  </div>

                  <div className="goal-progress-section">
                    <div className="progress-label">
                      <span>Progress</span>
                      <span className="progress-percentage">{goal.progress}%</span>
                    </div>
                    <div className="goal-progress-bar">
                      <div 
                        className="goal-progress-fill"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="goal-card-footer">
                    <div className="current-value">
                      Current: {goal.current_value}
                    </div>
                    <div className="goal-actions">
                      <button 
                        className="btn-update"
                        onClick={() => openUpdateModal(goal)}
                      >
                        Update
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => openDeleteModal(goal)}
                        title="Delete goal"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 1. Add Goal Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Goal</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="goal-form">
              <div className="form-group">
                <label className="form-label">Goal Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Lose 5 kg"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe your goal..."
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Icon</label>
                  <select
                    className="form-select"
                    value={newGoal.icon}
                    onChange={(e) => setNewGoal({...newGoal, icon: e.target.value})}
                  >
                    <option value="🎯">🎯 Target</option>
                    <option value="📉">📉 Weight Loss</option>
                    <option value="📈">📈 Weight Gain</option>
                    <option value="💪">💪 Strength</option>
                    <option value="🏃">🏃 Running</option>
                    <option value="🏋️">🏋️ Lifting</option>
                    <option value="🔥">🔥 Cardio</option>
                    <option value="⏱️">⏱️ Time</option>
                    <option value="📅">📅 Calendar</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select
                    className="form-select"
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="workouts">Workouts</option>
                    <option value="km">km (Kilometer)</option>
                    <option value="reps">Reps</option>
                    <option value="minutes">Minutes</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Current Value</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    step="0.1"
                    value={newGoal.current_value}
                    onChange={(e) => setNewGoal({...newGoal, current_value: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Value *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g., 65"
                    step="0.1"
                    value={newGoal.target_value}
                    onChange={(e) => setNewGoal({...newGoal, target_value: parseFloat(e.target.value) || ''})}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Update Progress Modal */}
      {isUpdateModalOpen && selectedGoal && (
        <div className="modal-overlay" onClick={() => setIsUpdateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Update Progress</h2>
              <button className="modal-close" onClick={() => setIsUpdateModalOpen(false)}>
                ✕
              </button>
            </div>
            
            <form onSubmit={handleConfirmUpdate} className="goal-form">
              <div className="form-group">
                <p style={{ margin: 0, color: '#6b7280' }}>
                  Updating: <strong>{selectedGoal.title}</strong>
                </p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Current: {selectedGoal.current_value} {selectedGoal.unit}</label>
                </div>
                <div className="form-group">
                   <label className="form-label">Target: {selectedGoal.target_value} {selectedGoal.unit}</label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">New Value</label>
                <input
                  type="number"
                  className="form-input"
                  step="0.1"
                  autoFocus
                  value={updateValue}
                  onChange={(e) => setUpdateValue(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsUpdateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedGoal && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Goal</h2>
              <button className="modal-close" onClick={() => setIsDeleteModalOpen(false)}>
                ✕
              </button>
            </div>
            
            <div className="goal-form">
               <p style={{ fontSize: '16px', color: '#374151', margin: 0 }}>
                 Are you sure you want to delete <strong>"{selectedGoal.title}"</strong>?
               </p>
               <p style={{ fontSize: '14px', color: '#ef4444', marginTop: '8px' }}>
                 This action cannot be undone.
               </p>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button 
                className="btn-delete" 
                style={{ marginLeft: '0' }}
                onClick={handleConfirmDelete}
              >
                Delete Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW DETAILS MODAL (YENİ EKLENDİ) */}
      {isViewModalOpen && viewGoal && (
        <div className="modal-overlay" onClick={() => setIsViewModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>{viewGoal.icon}</span>
                <h2 className="modal-title">{viewGoal.title}</h2>
              </div>
              <button className="modal-close" onClick={() => setIsViewModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="goal-form">
              {/* Açıklama */}
              {viewGoal.description && (
                <div className="form-group" style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                  <label className="form-label" style={{ marginBottom: '4px' }}>Description</label>
                  <p style={{ margin: 0, color: '#374151', lineHeight: '1.5' }}>
                    {viewGoal.description}
                  </p>
                </div>
              )}

              {/* İstatistik Tablosu */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                <div className="form-group">
                  <label className="form-label">Start Value</label>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280' }}>
                    {viewGoal.start_value} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>{viewGoal.unit}</span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Current Value</label>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#2563eb' }}>
                    {viewGoal.current_value} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>{viewGoal.unit}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Value</label>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                    {viewGoal.target_value} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>{viewGoal.unit}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Remaining</label>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#ef4444' }}>
                    {viewGoal.remaining} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>{viewGoal.unit}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar (Görsel) */}
              <div className="goal-progress-section" style={{ marginTop: '16px' }}>
                <div className="progress-label">
                  <span>Overall Progress</span>
                  <span className="progress-percentage">{viewGoal.progress}%</span>
                </div>
                <div className="goal-progress-bar">
                  <div 
                    className="goal-progress-fill"
                    style={{ width: `${viewGoal.progress}%` }}
                  />
                </div>
              </div>

              {/* Tarih Bilgileri */}
              <div style={{ 
                borderTop: '1px solid #e5e7eb', 
                paddingTop: '16px', 
                marginTop: '8px',
                fontSize: '13px',
                color: '#9ca3af',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Created: {formatDate(viewGoal.created_at)}</span>
                <span>Last Updated: {formatDate(viewGoal.updated_at)}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsViewModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}