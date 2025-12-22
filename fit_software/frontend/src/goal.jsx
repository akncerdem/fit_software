import { useNavigate, Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./config";
import { goalsApi } from "./goalApi";
import "./goal.css";

// --- KONFİGÜRASYON ---
const GOAL_TYPES = {
  //'🎯': { label: 'Target', units: ['workouts', 'min', 'hr'] },
  '📉': { label: 'Weight Loss', units: ['kg', 'lbs'] },
  '📈': { label: 'Weight Gain', units: ['kg', 'lbs'] },
  '🏃': { label: 'Running', units: ['km', 'm', 'min', 'hr'] },
  '🏊': { label: 'Swimming', units: ['laps', 'min', 'm', 'km'] },
  '🚲': { label: 'Cycling', units: ['km', 'miles', 'min', 'hr'] },
  '💪': { label: 'Workout', units: ['min', 'hr', 'sets', 'reps'] },
  '⚖️': { label: 'Body Fat', units: ['fav'] },
  '🔥': { label: 'Cardio', units: ['cal'] }
};

const UNIT_LABELS = {
  'kg': 'kg (Kilogram)', 'lbs': 'lbs (Pounds)', 'km': 'km (Kilometers)', 'm': 'meters',
  'miles': 'miles', 'min': 'minutes', 'hr': 'hours', 'laps': 'laps', 'sets': 'sets',
  'reps': 'reps', 'cal': 'calories', 'fav': '% (Body Fat)', 'workouts': 'workouts'
};

// --- AI normalize helpers ---
const normalizeUnit = (u) => {
  if (!u) return "";
  const s = String(u).trim().toLowerCase();

  const map = {
    // distance
    "kilometer": "km", "kilometers": "km", "kilometre": "km", "kilometres": "km", "km": "km",
    "meter": "m", "meters": "m", "metre": "m", "m": "m",
    "mile": "miles", "miles": "miles",

    // time
    "minute": "min", "minutes": "min", "min": "min",
    "hour": "hr", "hours": "hr", "hr": "hr",

    // weight
    "kilogram": "kg", "kilograms": "kg", "kg": "kg",
    "pound": "lbs", "pounds": "lbs", "lb": "lbs", "lbs": "lbs",

    // others
    "calorie": "cal", "calories": "cal", "cal": "cal",
    "%": "fav", "percent": "fav", "percentage": "fav",
    "lap": "laps", "laps": "laps",
    "set": "sets", "sets": "sets",
    "rep": "reps", "reps": "reps",
    "workout": "workouts", "workouts": "workouts",
  };

  return map[s] || s;
};

const resolveGoalIcon = (alt) => {
  // 1) direct icon match
  if (alt?.icon && GOAL_TYPES[alt.icon]) return alt.icon;

  // 2) match by label
  const t = String(alt?.type || "").trim().toLowerCase();
  if (!t) return null;

  const exact = Object.entries(GOAL_TYPES).find(
    ([, v]) => v.label.toLowerCase() === t
  );
  if (exact) return exact[0];

  // 3) synonyms
  const synonyms = {
    "lose weight": "📉",
    "weightloss": "📉",
    "gain weight": "📈",
    "running": "🏃",
    "run": "🏃",
    "swimming": "🏊",
    "cycle": "🚲",
    "cycling": "🚲",
    "workout": "💪",
    "strength": "💪",
    "body fat": "⚖️",
    "cardio": "🔥",
  };

  for (const [key, icon] of Object.entries(synonyms)) {
    if (t.includes(key) && GOAL_TYPES[icon]) return icon;
  }

  return null;
};


// --- BİLEŞENLER ---
const CircularProgress = ({ size, strokeWidth, percentage, color }) => {
  const safePercentage = isNaN(percentage) ? 0 : percentage; 
  const viewBox = `0 0 ${size} ${size}`;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const dash = (safePercentage * circumference) / 100;
  return (
    <svg width={size} height={size} viewBox={viewBox} className="circular-chart">
      <circle className="circle-bg" cx={size / 2} cy={size / 2} r={radius} strokeWidth={`${strokeWidth}px`} />
      <circle className="circle" cx={size / 2} cy={size / 2} r={radius} strokeWidth={`${strokeWidth}px`} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ stroke: color, strokeDasharray: `${dash} ${circumference}`, transition: "stroke-dasharray 0.5s ease" }} />
      <text x="50%" y="45%" dy=".3em" className="percentage-text">{safePercentage}%</text>
      <text x="50%" y="65%" dy=".3em" className="label-text">Success</text>
    </svg>
  );
};

const getBadgeInfo = (progress) => {
  const p = isNaN(progress) ? 0 : progress;
  if (p >= 100) return { label: '🏆 Master', class: 'badge-gold' };
  if (p >= 75) return { label: '🔥 Elite', class: 'badge-silver' };
  if (p >= 50) return { label: '🥈 Halfway', class: 'badge-bronze' };
  if (p >= 25) return { label: '🥉 Starter', class: 'badge-starter' };
  return null;
};

export default function Goal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('goal');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data State
  const [goals, setGoals] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [aiOpen, setAiOpen] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);




const handleGetAiSuggestion = async () => {
  
  try {
    setAiLoading(true);
    setAiError(null);
    const res = await goalsApi.suggest(newGoal.title, newGoal.description);
    setAiSuggestion(res);
    setAiOpen(true);
  } catch (e) {
    console.error(e);
    setAiError("Failed to get suggestion.");
  } finally {
    setAiLoading(false);
  }
};

const handleApplySuggestion = () => {
  if (!aiSuggestion?.alternative) return;

  const alt = aiSuggestion.alternative;

  // 1) Type resolve (must match your dropdown types)
  const icon = resolveGoalIcon(alt);

  if (!icon) {
    // Type is not supported -> show Unknown goal message and don't modify form
    setAiSuggestion({
      recognized: false,
      message: "Unknown goal. Please provide a clear description of your fitness goal.",
      alternative: null,
    });
    setAiOpen(true);
    return;
  }

  // 2) Unit resolve
  const allowedUnits = GOAL_TYPES[icon]?.units || [];
  const normalizedAltUnit = normalizeUnit(alt.unit);
  const unit =
    allowedUnits.includes(normalizedAltUnit)
      ? normalizedAltUnit
      : (allowedUnits[0] || newGoal.unit);

  // 3) Apply into form (Type + Unit + Target)
  setNewGoal((prev) => ({
    ...prev,
    icon,
    unit,
    target_value: alt.target_value ?? prev.target_value,
    description: prev.description
      ? prev.description
      : (alt.timeline_days ? `Timeline: ${alt.timeline_days} days` : prev.description),
  }));
};


  // Modallar
    // Modal dışına tıklayınca kapatma: sadece tıklama dışarıda başlar ve dışarıda biterse kapansın
  const overlayDownOnBackdropRef = useRef(false);
  const handleOverlayPointerDown = (e) => {
    overlayDownOnBackdropRef.current = e.target === e.currentTarget;
  };
  const handleOverlayClick = (closeFn) => (e) => {
    const startedOutside = overlayDownOnBackdropRef.current;
    overlayDownOnBackdropRef.current = false;
    const endedOutside = e.target === e.currentTarget;
    if (startedOutside && endedOutside) closeFn();
  };

const [isModalOpen, setIsModalOpen] = useState(false);
  
const [newGoal, setNewGoal] = useState({ title: '', description: '', icon: '🎯', current_value: 0, target_value: '', unit: 'workouts' });
  const titleOk = !!newGoal.title?.trim();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null); 
  const [updateValue, setUpdateValue] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewGoal, setViewGoal] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access') || sessionStorage.getItem('access');
    if (!token) { navigate('/'); return; }
    const userData = localStorage.getItem('user');
    if (userData) { setUser(JSON.parse(userData)); }
    
    fetchData();
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/');
      if (response.data) {
        const profileData = Array.isArray(response.data) ? response.data[0] : response.data;
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const goalsData = await goalsApi.getAll();
      setGoals(goalsData || []); 

      try {
        const logsData = await goalsApi.getLogs();
        setActivityLogs(logsData || []);
      } catch (e) {
        console.warn("Log hatası:", e);
        setActivityLogs([]);
      }

    } catch (err) {
      console.error('Error fetching data:', err); setError('Failed to load data.');
    } finally { setLoading(false); }
  };

  // --- YENİ: HAFTALIK ETİKETİ HESAPLA (Örn: 1 Ara - 7 Ara) ---
  const getWeekRangeLabel = () => {
    const today = new Date();
    const day = today.getDay(); // 0 (Pazar) - 6 (Ctesi)
    
    // Pazartesiyi bul
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
    
    // Offset'e göre bu haftanın Pazartesi ve Pazar'ını hesapla
    const startOfWeek = new Date(today);
    startOfWeek.setDate(diffToMonday + (weekOffset * 7));
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Formatla (Türkçe)
    const options = { day: 'numeric', month: 'short' };
    const startStr = startOfWeek.toLocaleDateString('tr-TR', options);
    const endStr = endOfWeek.toLocaleDateString('tr-TR', options);
    
    return `${startStr} - ${endStr}`;
  };

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };


  // --- LOG TARİHİNİ GÜVENLİ ŞEKİLDE YYYY-AA-GG FORMATINA ÇEVİR ---
  const normalizeLogDateKey = (log) => {
    const raw =
      log?.date ??
      log?.day ??
      log?.created_at ??
      log?.updated_at ??
      log?.timestamp ??
      log?.time ??
      log?.datetime;

    if (!raw) return null;

    if (typeof raw === "string") {
      // "YYYY-MM-DD" veya "YYYY-MM-DDTHH:mm:ssZ"
      const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) return `${m[1]}-${m[2]}-${m[3]}`;

      // "DD.MM.YYYY"
      const m2 = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
      if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;

      // Diğer formatlar için (örn. ISO datetime): local tarihe çevir
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return formatDateKey(d);
      return null;
    }

    const d = new Date(raw);
    if (!isNaN(d.getTime())) return formatDateKey(d);
    return null;
  };

  // Activity log günlerini hızlı eşleştirmek için Set'e çevir
  const activityDateSet = useMemo(() => {
    const set = new Set();
    if (Array.isArray(activityLogs)) {
      activityLogs.forEach((log) => {
        const key = normalizeLogDateKey(log);
        if (key) set.add(key);
      });
    }
    return set;
  }, [activityLogs]);

  // --- HAFTALIK GRAFİK VERİSİ ---
  const getWeeklyData = () => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1); 
    currentWeekStart.setDate(diff + (weekOffset * 7));

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const loopDate = new Date(currentWeekStart);
      loopDate.setDate(currentWeekStart.getDate() + i);
      const dateString = formatDateKey(loopDate);
      const dayName = loopDate.toLocaleDateString('en-US', { weekday: 'short' });
      
      const hasLog = activityDateSet.has(dateString);
      const isToday = dateString === formatDateKey(new Date());
      const isFuture = new Date(dateString) > new Date();

      let status = 'future';
      let icon = '•';

      if (isFuture) {
        status = 'future'; icon = '•';
      } else if (hasLog) {
        status = 'success'; icon = '✅';
      } else {
        status = isToday ? 'pending' : 'missed';
        icon = isToday ? '⭕' : '⚪';
      }
      weekDays.push({ name: dayName, date: dateString, status, icon, isToday });
    }
    return weekDays;
  };

  const weeklyData = getWeeklyData();

  const changeWeek = (direction) => {
    if (direction === 1 && weekOffset >= 0) return;
    if (direction === -1 && weekOffset <= -4) return;
    setWeekOffset(prev => prev + direction);
  };

  // --- HANDLERS ---
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  const openViewModal = (g) => { setViewGoal(g); setIsViewModalOpen(true); };
  const openUpdateModal = (g) => { setSelectedGoal(g); setUpdateValue(g.current_value); setIsUpdateModalOpen(true); };
  const openDeleteModal = (g) => { setSelectedGoal(g); setIsDeleteModalOpen(true); };

  const handleConfirmUpdate = async (e) => {
    e.preventDefault(); if (!selectedGoal) return;
    const parsedValue = parseFloat(updateValue);
    if (isNaN(parsedValue) || parsedValue < 0) { alert('Please enter a valid number'); return; }
    try {
      const result = await goalsApi.updateProgress(selectedGoal.id, parsedValue);
      if (result.success) { 
        fetchData();
        // Check for new badges after goal update
        try {
          await api.post('/goals/check-badges/');
        } catch (err) {
          console.warn('Error checking badges:', err);
        }
        setIsUpdateModalOpen(false); setSelectedGoal(null); 
      }
    } catch (err) { console.error(err); alert('Failed to update.'); }
  };

  const handleConfirmDelete = async () => {
    if (!selectedGoal) return;
    try { await goalsApi.delete(selectedGoal.id); fetchData(); setIsDeleteModalOpen(false); setSelectedGoal(null);
    } catch (err) { console.error(err); alert('Failed to delete.'); }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (isCreating) return; // Prevent double submission
    if (!newGoal.title || !newGoal.target_value) { alert('Fill required fields'); return; }
    setIsCreating(true);
    try {
      await goalsApi.create(newGoal);
      setIsModalOpen(false);
      setNewGoal({ title: '', description: '', icon: '🎯', current_value: 0, target_value: '', unit: 'workouts' });
      fetchData();
    } catch (err) { console.error(err); alert('Failed to create.'); }
    finally { setIsCreating(false); }
  };

  const handleLogout = () => { localStorage.removeItem('access'); localStorage.removeItem('refresh'); localStorage.removeItem('user'); navigate('/'); }

  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', path: '/anasayfa' },
    { id: 'workout', icon: '💪', label: 'Workout', path: '/workout' },
    { id: 'goal', icon: '🎯', label: 'Goal', path: '/goal' },
    { id: 'challenges', icon: '🏆', label: 'Challenges', path: '/challenges' },
    { id: 'profile', icon: '👤', label: 'Profile', path: '/profile' }
  ];

  // Stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.is_completed === true).length;
  const activeGoalsCount = goals.filter(g => g.is_active && !g.is_completed).length;
  const totalProgressSum = goals.reduce((acc, curr) => acc + (curr.progress || 0), 0);
  const averageProgress = totalGoals > 0 ? Math.round(totalProgressSum / totalGoals) : 0;
  const nextMilestoneGoal = goals.filter(g => (g.progress || 0) < 100).sort((a, b) => (b.progress || 0) - (a.progress || 0))[0];

  return (
    <div className="goal-container">
      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle menu"
      >
        <span className={`hamburger ${isSidebarOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <Link to="/anasayfa" className="logo-link"><h1 className="logo">FitWare</h1></Link>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link 
              key={item.id} 
              to={item.path} 
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
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
              <div><p className="user-name">{user.first_name} {user.last_name}</p><p className="user-email">{user.email}</p></div>
            </div>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        )}
      </div>

      <div className="main-content">
        <div className="content-wrapper">
          <div className="dashboard-overview">
            <div className="dashboard-title"><span>📊</span> Dashboard Overview</div>
            
            <div className="dashboard-grid">
              <div>
                <div className="stats-row" style={{ marginBottom: '24px' }}>
                  <div className="stat-card"><span className="stat-icon">🎯</span><span className="stat-value">{activeGoalsCount}</span><span className="stat-label">Active</span></div>
                  <div className="stat-card"><span className="stat-icon">✅</span><span className="stat-value">{completedGoals}</span><span className="stat-label">Done</span></div>
                  <div className="stat-card"><span className="stat-icon">🔥</span><span className="stat-value">{totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}%</span><span className="stat-label">Success</span></div>
                </div>
                <div className="overall-progress-container">
                   {totalGoals === 0 ? <div className="milestone-text"><span>👋 Welcome! Add your first goal.</span></div> 
                   : nextMilestoneGoal ? <div className="milestone-text"><span>🚀 Next Milestone:</span><strong>{nextMilestoneGoal.title}</strong><span>is {nextMilestoneGoal.remaining !== undefined ? nextMilestoneGoal.remaining : 0} {nextMilestoneGoal.unit} away!</span></div>
                   : <div className="milestone-text"><span>🎉 All goals completed!</span></div>}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress size={180} strokeWidth={15} percentage={averageProgress} color="#2563eb" />
              </div>
            </div>

            <div className="weekly-activity-section">
              <div className="weekly-header">
                <div className="weekly-title">
                  📅 Activity Log 
                  {/* BURASI GÜNCELLENDİ: Tarih Aralığı Gösteriliyor */}
                  <span className="badge badge-starter" style={{marginLeft:'8px', fontSize:'11px', textTransform: 'none'}}>
                    {getWeekRangeLabel()}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={() => changeWeek(-1)} disabled={weekOffset <= -4} style={{ cursor: weekOffset <= -4 ? 'not-allowed' : 'pointer', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white' }}>◀</button>
                  <span style={{ fontSize: '13px', color: '#6b7280', width: '90px', textAlign: 'center' }}>{weekOffset === 0 ? 'Current Week' : `${Math.abs(weekOffset)} week(s) ago`}</span>
                  <button onClick={() => changeWeek(1)} disabled={weekOffset >= 0} style={{ cursor: weekOffset >= 0 ? 'not-allowed' : 'pointer', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white' }}>▶</button>
                </div>
              </div>

              <div className="week-grid">
                {weeklyData.map((day, index) => (
                  <div key={index} className={`day-column day-${day.status} ${day.isToday ? 'today' : ''}`}>
                    <span className="day-name">{day.name}</span>
                    <span className={`day-status-icon status-${day.status}`}>{day.icon}</span>
                    <span style={{fontSize:'10px', color:'#9ca3af'}}>{day.date.split('-')[2]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="goals-header">
            <div className="goals-title-section"><h1 className="goals-title">My Goals</h1><p className="goals-description">Track your fitness objectives</p></div>
            <button className="btn-add-goal" onClick={() => {
            setIsModalOpen(true);
            setAiSuggestion(null);
            setAiError(null);
            setAiOpen(true);
            }}><span className="plus-icon">+</span><span>Add New Goal</span></button>
          </div>

          <div className="goals-grid">
            {loading ? <div className="empty-state"><div className="empty-icon">⏳</div><p>Loading...</p></div>
            : error ? <div className="empty-state"><p className="error">{error}</p></div>
            : goals.length === 0 ? <div className="empty-state"><div className="empty-icon">🎯</div><p>No active goals yet</p></div>
            : goals.map((goal) => {
                const badge = getBadgeInfo(goal.progress);
                return (
                  <div key={goal.id} className="goal-card">
                    <div className="goal-card-header" onClick={() => openViewModal(goal)} style={{ cursor: 'pointer' }}>
                      <div className="goal-info">
                        <span className="goal-icon">{goal.icon}</span>
                        <div><h3 className="goal-title">{goal.title}</h3>{badge && <span className={`badge ${badge.class}`} style={{ marginTop: '4px' }}>{badge.label}</span>}</div>
                      </div>
                      <div className="goal-stats"><span className="goal-current">{goal.current_value}</span><span className="goal-separator">/</span><span className="goal-target">{goal.target_value} {goal.unit}</span></div>
                    </div>
                    <div className="goal-progress-section"><div className="progress-label"><span>Progress</span><span>{goal.progress || 0}%</span></div><div className="goal-progress-bar"><div className="goal-progress-fill" style={{ width: `${goal.progress || 0}%` }}></div></div></div>
                    <div className="goal-card-footer"><div className="current-value">Current: {goal.current_value}</div><div className="goal-actions"><button className="btn-update" onClick={() => openUpdateModal(goal)}>Update</button><button className="btn-delete" onClick={() => openDeleteModal(goal)} title="Delete">Delete</button></div></div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* MODALLAR (AYNI) */}
      {isModalOpen && (
        <div className="modal-overlay" onPointerDown={handleOverlayPointerDown} onClick={handleOverlayClick(() => setIsModalOpen(false))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Create New Goal</h2><button className="modal-close" onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}>✕</button></div>
            <form onSubmit={handleCreateGoal} className="goal-form">
              <div className="form-group"><label className="form-label">Title</label><input type="text" className="form-input" value={newGoal.title} onChange={(e) => setNewGoal({...newGoal, title: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Desc</label><textarea className="form-textarea" value={newGoal.description} onChange={(e) => setNewGoal({...newGoal, description: e.target.value})} rows="2" /></div>
             <div className="ai-box">
  <button
    type="button"
    className="ai-btn"
    onClick={handleGetAiSuggestion}
    disabled={!titleOk || aiLoading}
  >
    {aiLoading ? "Loading..." : "Get AI Suggestions"}
  </button>

{(aiError || aiSuggestion) && (
  <div className="ai-card">
    <div className="ai-card-header">
      <div className="ai-title">
        ⚠️ {aiError ? "AI Error" : (aiSuggestion?.recognized ? "Suggestion" : "Unknown Goal")}
      </div>

      <button
        type="button"
        className="ai-toggle"
        onClick={() => setAiOpen((p) => !p)}
      >
        {aiOpen ? "Show Less ▲" : "Show More ▼"}
      </button>
    </div>

    {aiOpen && (
      <>
        {aiError ? (
          <p className="ai-msg">{aiError}</p>
        ) : (
          <>
            <p className="ai-msg">{aiSuggestion?.message}</p>

            {/* Alternative sadece recognized=true iken gözüksün */}
            {aiSuggestion?.recognized && aiSuggestion?.alternative && (
              <div className="ai-alt">
                <div><b>Recommended Alternative:</b></div>
                <div>
                  <b>Target:</b> {aiSuggestion.alternative.target_value}{" "}
                  {aiSuggestion.alternative.unit}
                </div>
                <div><b>Timeline:</b> {aiSuggestion.alternative.timeline_days} days</div>
                <div><b>Type:</b> {aiSuggestion.alternative.type}</div>
              </div>
            )}

            {/* Apply butonu da sadece recognized=true + alternative varsa çıksın */}
            {aiSuggestion?.recognized && aiSuggestion?.alternative && (
              <button
                type="button"
                className="ai-apply"
                onClick={handleApplySuggestion}
              >
                ✅ Apply Suggestions to Form
              </button>
            )}
          </>
        )}
      </>
    )}
  </div>
)}
</div>


              <div className="form-row">
                 <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={newGoal.icon} onChange={(e) => {const icon=e.target.value; setNewGoal({...newGoal, icon, unit: GOAL_TYPES[icon]?.units[0] || 'workouts'})}}>{Object.entries(GOAL_TYPES).map(([k,v])=><option key={k} value={k}>{k} {v.label}</option>)}</select></div>
                 <div className="form-group"><label className="form-label">Unit</label><select className="form-select" value={newGoal.unit} onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}>{(GOAL_TYPES[newGoal.icon]?.units||[]).map(u=><option key={u} value={u}>{UNIT_LABELS[u]||u}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Current</label><input type="number" step="1" className="form-input" value={newGoal.current_value} onChange={(e) => setNewGoal({...newGoal, current_value: parseFloat(e.target.value)||0})} /></div>
                <div className="form-group"><label className="form-label">Target</label><input type="number" step="1" className="form-input" value={newGoal.target_value} onChange={(e) => setNewGoal({...newGoal, target_value: parseFloat(e.target.value)||''})} required /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn-cancel" onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}>Cancel</button><button type="submit" className="btn-submit" disabled={isCreating}>{isCreating ? 'Creating...' : 'Create'}</button></div>
            </form>
          </div>
        </div>
      )}

      {isUpdateModalOpen && selectedGoal && (
        <div className="modal-overlay" onPointerDown={handleOverlayPointerDown} onClick={handleOverlayClick(() => setIsUpdateModalOpen(false))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Update Progress</h2><button className="modal-close" onClick={(e) => { e.stopPropagation(); setIsUpdateModalOpen(false); }}>✕</button></div>
            <form onSubmit={handleConfirmUpdate} className="goal-form">
               <div className="form-group"><p>Updating: <strong>{selectedGoal.title}</strong></p></div>
               <div className="form-group"><label className="form-label">New Value ({selectedGoal.unit})</label><input type="number" step="1" autoFocus className="form-input" value={updateValue} onChange={(e) => setUpdateValue(e.target.value)} required /></div>
               <div className="modal-footer"><button type="button" className="btn-cancel" onClick={(e) => { e.stopPropagation(); setIsUpdateModalOpen(false); }}>Cancel</button><button type="submit" className="btn-submit">Save</button></div>
            </form>
          </div>
        </div>
      )}
      
      {isDeleteModalOpen && selectedGoal && (
        <div className="modal-overlay" onPointerDown={handleOverlayPointerDown} onClick={handleOverlayClick(() => setIsDeleteModalOpen(false))}>
           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
             <div className="modal-header"><h2 className="modal-title">Delete Goal</h2><button className="modal-close" onClick={(e) => { e.stopPropagation(); setIsDeleteModalOpen(false); }}>✕</button></div>
             <p>Are you sure you want to delete <strong>"{selectedGoal.title}"</strong>?</p>
             <div className="modal-footer"><button className="btn-cancel" onClick={(e) => { e.stopPropagation(); setIsDeleteModalOpen(false); }}>Cancel</button><button className="btn-delete" onClick={handleConfirmDelete}>Delete</button></div>
           </div>
        </div>
      )}

      {isViewModalOpen && viewGoal && (
        <div className="modal-overlay" onPointerDown={handleOverlayPointerDown} onClick={handleOverlayClick(() => setIsViewModalOpen(false))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><div style={{display:'flex', gap:'10px'}}><span>{viewGoal.icon}</span><h2 className="modal-title">{viewGoal.title}</h2></div><button className="modal-close" onClick={(e) => { e.stopPropagation(); setIsViewModalOpen(false); }}>✕</button></div>
            <div className="goal-form">
              {viewGoal.description && <div className="form-group" style={{background:'#f9fafb', padding:'10px', borderRadius:'8px'}}><p>{viewGoal.description}</p></div>}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginTop:'10px'}}>
                <div><label className="form-label">Start</label><div style={{fontWeight:'bold', color:'#6b7280'}}>{viewGoal.start_value} {viewGoal.unit}</div></div>
                <div><label className="form-label">Current</label><div style={{fontWeight:'bold', color:'#2563eb'}}>{viewGoal.current_value} {viewGoal.unit}</div></div>
                <div><label className="form-label">Target</label><div style={{fontWeight:'bold'}}>{viewGoal.target_value} {viewGoal.unit}</div></div>
                <div><label className="form-label">Left</label><div style={{fontWeight:'bold', color:'#ef4444'}}>{viewGoal.remaining!==undefined?viewGoal.remaining:0} {viewGoal.unit}</div></div>
              </div>
              <div style={{marginTop:'20px'}}>
                <div className="progress-label"><span>Progress</span><span>{viewGoal.progress}%</span></div>
                <div className="goal-progress-bar"><div className="goal-progress-fill" style={{width:`${viewGoal.progress}%`}}></div></div>
              </div>
              <div style={{marginTop:'15px', fontSize:'12px', color:'#9ca3af', display:'flex', justifyContent:'space-between'}}>
                 <span>Created: {formatDate(viewGoal.created_at)}</span>
                 <span>Updated: {formatDate(viewGoal.updated_at)}</span>
              </div>
            </div>
            <div className="modal-footer"><button className="btn-cancel" onClick={(e) => { e.stopPropagation(); setIsViewModalOpen(false); }}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
  
}
