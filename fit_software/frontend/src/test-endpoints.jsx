import { useState } from "react";
import { createGoal, updateGoal, createProfile, updateProfile } from "./api";

export default function TestEndpoints() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Goal form state
  const [goalForm, setGoalForm] = useState({
    title: "",
    target_value: "",
    target_type: "",
    due_date: "",
    is_completed: false,
  });
  const [goalId, setGoalId] = useState("");

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    photo_url: "",
    bio: "",
    fitness_level: "",
    height: "",
    weight: "",
  });

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = {
        ...goalForm,
        due_date: goalForm.due_date || null,
        is_completed: goalForm.is_completed === "true" || goalForm.is_completed === true,
      };
      const response = await createGoal(data);
      setResult(response);
      setGoalId(response.goal?.id || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalUpdate = async (e) => {
    e.preventDefault();
    if (!goalId) {
      setError("Please create a goal first or enter a goal ID");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = {
        ...goalForm,
        due_date: goalForm.due_date || null,
        is_completed: goalForm.is_completed === "true" || goalForm.is_completed === true,
      };
      // Remove empty fields
      Object.keys(data).forEach((key) => {
        if (data[key] === "" || data[key] === null) delete data[key];
      });
      const response = await updateGoal(goalId, data);
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = {
        ...profileForm,
        height: profileForm.height ? parseFloat(profileForm.height) : null,
        weight: profileForm.weight ? parseFloat(profileForm.weight) : null,
      };
      const response = await createProfile(data);
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = {
        ...profileForm,
        height: profileForm.height ? parseFloat(profileForm.height) : null,
        weight: profileForm.weight ? parseFloat(profileForm.weight) : null,
      };
      // Remove empty fields
      Object.keys(data).forEach((key) => {
        if (data[key] === "" || data[key] === null) delete data[key];
      });
      const response = await updateProfile(data);
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>API Endpoints Test Page</h1>
      
      {error && (
        <div style={{ padding: "10px", background: "#fee", color: "#c00", marginBottom: "20px", borderRadius: "4px" }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div style={{ padding: "10px", background: "#efe", color: "#060", marginBottom: "20px", borderRadius: "4px" }}>
          <strong>Success!</strong>
          <pre style={{ marginTop: "10px", overflow: "auto" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Goal Section */}
        <div style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px" }}>
          <h2>Goal Endpoints</h2>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Goal ID (for update):</label>
            <input
              type="text"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              placeholder="Enter goal ID"
              style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
            />
          </div>

          <form onSubmit={handleGoalSubmit}>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Title *</label>
              <input
                type="text"
                value={goalForm.title}
                onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                required
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Target Value</label>
              <input
                type="text"
                value={goalForm.target_value}
                onChange={(e) => setGoalForm({ ...goalForm, target_value: e.target.value })}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Target Type</label>
              <input
                type="text"
                value={goalForm.target_type}
                onChange={(e) => setGoalForm({ ...goalForm, target_type: e.target.value })}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Due Date</label>
              <input
                type="date"
                value={goalForm.due_date}
                onChange={(e) => setGoalForm({ ...goalForm, due_date: e.target.value })}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Is Completed</label>
              <select
                value={goalForm.is_completed}
                onChange={(e) => setGoalForm({ ...goalForm, is_completed: e.target.value === "true" })}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              >
                <option value={false}>False</option>
                <option value={true}>True</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                marginBottom: "10px",
              }}
            >
              {loading ? "Loading..." : "Create Goal"}
            </button>
          </form>

          <button
            onClick={handleGoalUpdate}
            disabled={loading || !goalId}
            style={{
              width: "100%",
              padding: "10px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading || !goalId ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Loading..." : "Update Goal"}
          </button>
        </div>

        {/* Profile Section */}
        <div style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px" }}>
          <h2>Profile Endpoints</h2>

          <form onSubmit={handleProfileSubmit}>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Photo URL</label>
              <input
                type="url"
                value={profileForm.photo_url}
                onChange={(e) => setProfileForm({ ...profileForm, photo_url: e.target.value })}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Bio</label>
              <textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                rows="3"
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Fitness Level</label>
              <input
                type="text"
                value={profileForm.fitness_level}
                onChange={(e) => setProfileForm({ ...profileForm, fitness_level: e.target.value })}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Height</label>
              <input
                type="number"
                step="0.1"
                value={profileForm.height}
                onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Weight</label>
              <input
                type="number"
                step="0.1"
                value={profileForm.weight}
                onChange={(e) => setProfileForm({ ...profileForm, weight: e.target.value })}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                marginBottom: "10px",
              }}
            >
              {loading ? "Loading..." : "Create Profile"}
            </button>
          </form>

          <button
            onClick={handleProfileUpdate}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Loading..." : "Update Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

