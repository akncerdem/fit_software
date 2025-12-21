import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./config";
import "./challenges.css";
import { API_BASE } from "./api";

export default function Challenges() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("challenges");
  const [selectedTab, setSelectedTab] = useState("all"); // 'all' | 'my'
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // details / progress modal
  const [modalType, setModalType] = useState(null); // 'details' | 'progress' | null
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  // create challenge modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newBadge, setNewBadge] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newTargetValue, setNewTargetValue] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    const token =
      localStorage.getItem("access") || sessionStorage.getItem("access");
    if (!token) {
      navigate("/");
      return;
    }

    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // sayfa ilk açıldığında tüm challengelar
    loadChallenges("all");
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

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    navigate("/");
  };

  const menuItems = [
    { id: "dashboard", icon: "🏠", label: "Dashboard", path: "/anasayfa" },
    { id: "workout", icon: "💪", label: "Workout", path: "/workout" },
    { id: "goal", icon: "🎯", label: "Goal", path: "/goal" },
    { id: "challenges", icon: "🏆", label: "Challenges", path: "/challenges" },
    { id: "profile", icon: "👤", label: "Profile", path: "/profile" },
  ];

  async function loadChallenges(type) {
    setLoading(true);
    setError("");
    setSelectedTab(type);

    try {
      const token =
        localStorage.getItem("access") || sessionStorage.getItem("access");

      const url =
        type === "my"
          ? `${API_BASE}/api/challenges/my/`
          : `${API_BASE}/api/challenges/`;

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Challenges alınamadı");
      }

      const data = await res.json();
      setChallenges(data);
    } catch (err) {
      setError(err.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(challengeId) {
    try {
      const token =
        localStorage.getItem("access") || sessionStorage.getItem("access");
      if (!token) {
        navigate("/");
        return;
      }

      const res = await fetch(
        `${API_BASE}/api/challenges/${challengeId}/join/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      const updatedChallenge = await res.json();

      if (!res.ok) {
        throw new Error(
          updatedChallenge.detail || "Challenge'a katılırken hata oluştu"
        );
      }

      setChallenges((prev) =>
        prev.map((c) => (c.id === updatedChallenge.id ? updatedChallenge : c))
      );

      setSelectedChallenge((prev) =>
        prev && prev.id === updatedChallenge.id ? updatedChallenge : prev
      );
    } catch (err) {
      alert(err.message || "Join işlemi başarısız");
    }
  }

  async function handleLeave(challengeId) {
    try {
      const token =
        localStorage.getItem("access") || sessionStorage.getItem("access");
      if (!token) {
        navigate("/");
        return;
      }

      const res = await fetch(
        `${API_BASE}/api/challenges/${challengeId}/leave/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      const updatedChallenge = await res.json();

      if (!res.ok) {
        throw new Error(
          updatedChallenge.detail || "Challenge'dan çıkarken hata oluştu"
        );
      }

      setChallenges((prev) =>
        prev.map((c) => (c.id === updatedChallenge.id ? updatedChallenge : c))
      );

      setSelectedChallenge((prev) =>
        prev && prev.id === updatedChallenge.id ? updatedChallenge : prev
      );
    } catch (err) {
      alert(err.message || "Leave işlemi başarısız");
    }
  }

  // yeni challenge oluşturma
  async function handleCreateChallenge(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      const token =
        localStorage.getItem("access") || sessionStorage.getItem("access");
      if (!token) {
        navigate("/");
        return;
      }

      const body = {
        title: newTitle,
        description: newDescription,
        badge: newBadge,
        due_date: newDueDate || null,
        target_value: newTargetValue ? parseFloat(newTargetValue) : null,
        unit: newUnit || null,
      };

      const res = await fetch(`${API_BASE}/api/challenges/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Challenge oluşturulamadı");
      }

      // Başarılı -> My Challenges'a geç ve yenile
      await loadChallenges("my");
      setShowCreateModal(false);
      setNewTitle("");
      setNewDescription("");
      setNewBadge("");
      setNewDueDate("");
      setNewTargetValue("");
      setNewUnit("");
    } catch (err) {
      setCreateError(err.message || "Bir hata oluştu");
    } finally {
      setCreating(false);
    }
  }

  // modal açma / kapama
  function openDetails(challenge) {
    setSelectedChallenge(challenge);
    setModalType("details");
  }

  function openProgress(challenge) {
    setSelectedChallenge(challenge);
    setModalType("progress");
  }

  function closeModal() {
    setModalType(null);
    setSelectedChallenge(null);
  }

  function openCreateModal() {
    setShowCreateModal(true);
    setCreateError("");
  }

  function closeCreateModal() {
    if (creating) return;
    setShowCreateModal(false);
    setCreateError("");
  }

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
              className={`nav-item ${
                activeTab === item.id ? "active" : ""
              }`}
              onClick={() => setActiveTab(item.id)}
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
          {/* Tabs + Create button */}
          <div className="challenges-header">
            <div className="challenges-tabs">
              <button
                className={`tab-button ${
                  selectedTab === "all" ? "active" : ""
                }`}
                onClick={() => loadChallenges("all")}
              >
                All Challenges
              </button>
              <button
                className={`tab-button ${
                  selectedTab === "my" ? "active" : ""
                }`}
                onClick={() => loadChallenges("my")}
              >
                My Challenges
              </button>
            </div>

            {selectedTab === "my" && (
              <button
                className="btn-primary create-challenge-btn"
                onClick={openCreateModal}
              >
                + Create Challenge
              </button>
            )}
          </div>

          {loading && <p>Loading challenges...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {/* Challenges Grid */}
          <div className="challenges-grid">
            {challenges.map((challenge) => {
              const isExpired = challenge.days_left === 0;

              return (
                <div key={challenge.id} className="challenge-card">
                  <div className="challenge-header">
                    <h3 className="challenge-title">{challenge.title}</h3>

                    {challenge.is_joined && (
                      <span className="joined-badge">Joined</span>
                    )}

                    {!challenge.is_joined && isExpired && (
                      <span className="expired-badge">Expired</span>
                    )}
                  </div>

                  <p className="challenge-description">
                    {challenge.description}
                  </p>

                  <div className="challenge-info">
                    <div className="info-item">
                      <span className="info-icon">👥</span>
                      <span className="info-text">
                        {challenge.participants} participants
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">🕒</span>
                      <span className="info-text">
                        {challenge.days_left != null
                          ? `${challenge.days_left} days left`
                          : "No deadline"}
                      </span>
                    </div>
                  </div>

                  <div className="challenge-badge">
                    <span className="badge-icon">🏆</span>
                    <span className="badge-text">
                      {challenge.badge || "No badge"}
                    </span>
                  </div>

                  <div className="challenge-actions">
                    {challenge.is_joined ? (
                      <>
                        <button
                          className="btn-view-progress"
                          onClick={() => openProgress(challenge)}
                        >
                          View Progress
                        </button>
                        <button
                          className="btn-join"
                          onClick={() => handleLeave(challenge.id)}
                        >
                          Leave
                        </button>
                        <button
                          className="btn-details"
                          onClick={() => openDetails(challenge)}
                        >
                          Details
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`btn-join ${
                            isExpired ? "btn-join-disabled" : ""
                          }`}
                          disabled={isExpired}
                          onClick={() =>
                            !isExpired && handleJoin(challenge.id)
                          }
                        >
                          {isExpired ? "Expired" : "Join Challenge"}
                        </button>
                        <button
                          className="btn-details"
                          onClick={() => openDetails(challenge)}
                        >
                          Details
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {!loading && challenges.length === 0 && (
              <p>Hiç challenge bulunamadı.</p>
            )}
          </div>
        </div>
      </div>

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <div className="challenge-modal-overlay" onClick={closeCreateModal}>
          <div
            className="challenge-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={closeCreateModal}>
              ×
            </button>

            <h2 className="modal-title">Create New Challenge</h2>

            <form className="challenge-form" onSubmit={handleCreateChallenge}>
              <label className="form-label">
                Title
                <input
                  type="text"
                  className="form-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </label>

              <label className="form-label">
                Description
                <textarea
                  className="form-textarea"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                />
              </label>

              <label className="form-label">
                Badge name
                <input
                  type="text"
                  className="form-input"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  placeholder="örn. Marathon Starter Badge"
                />
              </label>

              <label className="form-label">
                Due date
                <input
                  type="date"
                  className="form-input"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </label>

              <label className="form-label">
                Target value
                <input
                  type="number"
                  className="form-input"
                  value={newTargetValue}
                  onChange={(e) => setNewTargetValue(e.target.value)}
                  placeholder="örn. 20"
                  min="0"
                  step="0.1"
                />
              </label>

              <label className="form-label">
                Unit
                <input
                  type="text"
                  className="form-input"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="km, workout, kg..."
                />
              </label>

              {createError && (
                <p className="form-error">{createError}</p>
              )}

              <div className="form-buttons">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeCreateModal}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Challenge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details / Progress Modal */}
      {modalType && selectedChallenge && (
        <div className="challenge-modal-overlay" onClick={closeModal}>
          <div
            className="challenge-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>

            {modalType === "details" && (
              <>
                <h2 className="modal-title">{selectedChallenge.title}</h2>
                <p className="modal-subtitle">
                  {selectedChallenge.description}
                </p>

                <div className="modal-row">
                  <span>Badge:</span>
                  <strong>{selectedChallenge.badge || "No badge"}</strong>
                </div>
                <div className="modal-row">
                  <span>Participants:</span>
                  <strong>{selectedChallenge.participants}</strong>
                </div>
                <div className="modal-row">
                  <span>Days left:</span>
                  <strong>
                    {selectedChallenge.days_left != null
                      ? `${selectedChallenge.days_left} days`
                      : "No deadline"}
                  </strong>
                </div>
                <div className="modal-row">
                  <span>Status:</span>
                  <strong>
                    {selectedChallenge.is_joined ? "Joined" : "Not joined"}
                  </strong>
                </div>
              </>
            )}

            {modalType === "progress" && (
              <>
                <h2 className="modal-title">
                  {selectedChallenge.title} – Progress
                </h2>

                {selectedChallenge.is_joined ? (
                  <>
                    <p className="modal-description">
                      Bu challenge&apos;a katıldın. Şu an için detaylı
                      ilerleme verisi backendten sınırlı geliyor, ama katılım
                      ve kalan günleri burada görebilirsin.
                    </p>

                    <div className="progress-summary">
                      <div>
                        <span>Joined:</span> <strong>Yes</strong>
                      </div>
                      <div>
                        <span>Participants:</span>{" "}
                        <strong>{selectedChallenge.participants}</strong>
                      </div>
                      <div>
                        <span>Days left:</span>{" "}
                        <strong>
                          {selectedChallenge.days_left != null
                            ? `${selectedChallenge.days_left} days`
                            : "No deadline"}
                        </strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="modal-description">
                    Bu challenge&apos;a henüz katılmadın. İlerlemeyi
                    görebilmek için önce &quot;Join Challenge&quot; butonuna
                    tıklaman gerekiyor.
                  </p>
                )}
              </>
            )}

            <div className="modal-footer">
              {!selectedChallenge.is_joined &&
                selectedChallenge.days_left !== 0 && (
                  <button
                    className="btn-join modal-join-btn"
                    onClick={() => handleJoin(selectedChallenge.id)}
                  >
                    Join this Challenge
                  </button>
                )}

              {!selectedChallenge.is_joined &&
                selectedChallenge.days_left === 0 && (
                  <p className="modal-expired-text">
                    Bu challenge&apos;ın süresi dolmuş. Artık katılamazsın.
                  </p>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
