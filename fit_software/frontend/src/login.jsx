import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./login.module.css";
import { loginWithEmail, startGoogleLogin } from "./api";

const GOOGLE_ERROR_MESSAGES = {
  state_mismatch: "Google sign-in verification failed. Please try again.",
  token_exchange_failed: "We could not reach Google. Please try again shortly.",
  userinfo_fetch_failed: "We could not read your Google profile. Please try again.",
  missing_email: "We could not read the e-mail address from Google. Try another account.",
  missing_code: "Google response was incomplete. Please try again.",
  missing_access_token: "Google access token could not be retrieved. Please try again.",
};

function resolveGoogleErrorMessage(code) {
  return GOOGLE_ERROR_MESSAGES[code] || "Google sign-in could not be completed. Please try again.";
}

export default function FitwareLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- API base (DEV) ---
  const API_BASE = useMemo(() => "http://127.0.0.1:8000", []);

  // view: login | forgot | reset
  const [view, setView] = useState("login");

  // login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // forgot fields
  const [forgotEmail, setForgotEmail] = useState("");

  // reset fields
  const [resetUid, setResetUid] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  // shared UI state
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Google error handling (existing)
  useEffect(() => {
    if (!location.search) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const googleError = params.get("google_error");

    if (googleError) {
      setError(resolveGoogleErrorMessage(googleError));
      setMessage("");
      navigate("/", { replace: true });
    }
  }, [location.search, navigate]);

  // Decide which view to show based on URL
  useEffect(() => {
    const path = location.pathname;

    // clear message on route change
    setMessage("");
    setError("");
    setIsLoading(false);

    if (path.startsWith("/forgot-password")) {
      setView("forgot");
      setForgotEmail((prev) => prev || email);
      return;
    }

    if (path.startsWith("/reset-password/")) {
      const parts = path.split("/").filter(Boolean);
      // ["reset-password", ":uid", ":token"]
      const uid = parts[1] || "";
      const token = parts[2] || "";

      setView("reset");
      setResetUid(uid);
      setResetToken(token);
      return;
    }

    setView("login");
  }, [location.pathname, email]);

  // helper: post JSON
  const postJson = async (url, payload) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      // ignore
    }

    if (!res.ok) {
      throw new Error(data?.error || data?.detail || "Request failed.");
    }

    return data;
  };

  // --- Login submit ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      await loginWithEmail(email, password);
      setMessage("Login successful! Redirecting...");
      setTimeout(() => navigate("/anasayfa"), 800);
    } catch (err) {
      setError(err.message || "An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Forgot password submit ---
  const handleForgotSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const data = await postJson(`${API_BASE}/api/v1/auth/password/reset/`, {
        email: (forgotEmail || "").trim(),
      });

      setMessage(data?.message || "If the email exists, a reset link was sent.");
    } catch (err) {
      setError(err.message || "Could not send reset link.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Reset password submit ---
  const handleResetSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    if (!resetUid || !resetToken) {
      setIsLoading(false);
      setError("Invalid reset link (missing uid/token).");
      return;
    }

    if (!newPassword || !repeatPassword) {
      setIsLoading(false);
      setError("Please fill both password fields.");
      return;
    }

    if (newPassword !== repeatPassword) {
      setIsLoading(false);
      setError("Passwords do not match.");
      return;
    }

    try {
      const data = await postJson(`${API_BASE}/api/v1/auth/password/reset/confirm/`, {
        uid: resetUid,
        token: resetToken,
        new_password: newPassword,
        repeat_password: repeatPassword,
      });

      setMessage(data?.message || "Password updated successfully.");

      // After success, go back to login screen
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      setError(err.message || "Reset link is invalid or expired.");
    } finally {
      setIsLoading(false);
    }
  };

  const cardTitle =
    view === "login" ? "Welcome!" : view === "forgot" ? "Reset Password" : "Set New Password";

  const cardSubtitle =
    view === "login"
      ? "Login to Your Account"
      : view === "forgot"
      ? "Enter your email to receive a reset link"
      : "Enter your new password";

  return (
    <div className={styles.loginWrapper}>
      {/* Left panel - hero */}
      <aside className={styles.leftPanel}>
        <div className={styles.bgGlowA}></div>
        <div className={styles.bgGlowB}></div>

        <section className={styles.heroSection}>
          <div className={styles.floatingLogo}>
            <svg viewBox="0 0 100 100">
              <path d="M50 10 L85 25 L85 50 Q85 75 50 90 Q15 75 15 50 L15 25 Z" fill="white" className={styles.shieldPath} />
              <circle cx="50" cy="35" r="6" fill="#06b6d4" className={styles.personHead} />
              <path d="M35 48 Q35 42 42 42 L58 42 Q65 42 65 48 L65 70 L35 70 Z" fill="#06b6d4" className={styles.personBody} />
              <path d="M35 48 L25 38 L28 35 L38 45 Z" fill="#06b6d4" className={styles.armLeft} />
              <path d="M65 48 L75 38 L72 35 L62 45 Z" fill="#06b6d4" className={styles.armRight} />
            </svg>

            <div className={styles.rotatingRing}></div>
            <div className={styles.rotatingRing2}></div>
          </div>

          <h1 className={styles.brandTitle}>Fitware</h1>
          <p className={styles.tagline}>The digital way to stay strong</p>
        </section>
      </aside>

      {/* Right panel - form */}
      <main className={styles.rightPanel}>
        <div className={styles.formContainer}>
          <div className={styles.loginCard}>
            <h2 className={styles.cardTitle}>{cardTitle}</h2>
            <p className={styles.cardSubtitle}>{cardSubtitle}</p>

            {/* LOGIN */}
            {view === "login" && (
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={styles.input}
                    placeholder="Email"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={styles.input}
                    placeholder="Password"
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <button
                    type="button"
                    className={styles.forgotLink}
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" disabled={isLoading} className={`${styles.btn} ${styles.btnPrimary}`}>
                  {isLoading ? "Logging in..." : "Log In"}
                </button>

                <div className={styles.divider}>
                  <span>or</span>
                </div>

                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGoogle}`}
                  onClick={startGoogleLogin}
                >
                  <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                  </svg>
                  Sign in with Google
                </button>

                <p className={styles.signupText}>
                  Do not have an account yet? <Link to="/signup">Sign Up</Link>
                </p>
              </form>
            )}

            {/* FORGOT PASSWORD */}
            {view === "forgot" && (
              <form onSubmit={handleForgotSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>E-mail</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className={styles.input}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <button type="submit" disabled={isLoading} className={`${styles.btn} ${styles.btnPrimary}`}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>

                <div className={styles.formRow} style={{ justifyContent: "center" }}>
                  <button type="button" className={styles.forgotLink} onClick={() => navigate("/")}>
                    Back to Login
                  </button>
                </div>
              </form>
            )}

            {/* RESET PASSWORD */}
            {view === "reset" && (
              <form onSubmit={handleResetSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.input}
                    placeholder="New password"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Confirm Password</label>
                  <input
                    type="password"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className={styles.input}
                    placeholder="Repeat password"
                    required
                  />
                </div>

                <button type="submit" disabled={isLoading} className={`${styles.btn} ${styles.btnPrimary}`}>
                  {isLoading ? "Updating..." : "Update Password"}
                </button>

                <div className={styles.formRow} style={{ justifyContent: "center" }}>
                  <button type="button" className={styles.forgotLink} onClick={() => navigate("/")}>
                    Back to Login
                  </button>
                </div>
              </form>
            )}

            {/* messages */}
            {message && <div className={styles.successMessage}>{message}</div>}
            {error && <div className={styles.errorMessage}>{error}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
