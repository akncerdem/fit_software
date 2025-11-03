import { useEffect, useState } from "react";
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  return (
    <div className={styles.loginWrapper}>
      {/* Left panel - hero */}
      <aside className={styles.leftPanel}>
        <div className={styles.bgGlowA}></div>
        <div className={styles.bgGlowB}></div>
        

        <section className={styles.heroSection}>
          <div className={styles.floatingLogo}>
            {/* SVG logo */}
            <svg viewBox="0 0 100 100">
              <path d="M50 10 L85 25 L85 50 Q85 75 50 90 Q15 75 15 50 L15 25 Z" fill="white" className={styles.shieldPath} />
              <circle cx="50" cy="35" r="6" fill="#06b6d4" className={styles.personHead} />
              <path d="M35 48 Q35 42 42 42 L58 42 Q65 42 65 48 L65 70 L57 70 L57 50 L43 50 L43 70 L35 70 Z" fill="#06b6d4" className={styles.personBody} />
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
            <h2 className={styles.cardTitle}>Welcome!</h2>
            <p className={styles.cardSubtitle}>Login to Your Account</p>

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
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>Remember Me</span>
                </label>
                <button type="button" className={styles.forgotLink}>
                  Forgot Password?
                </button>
              </div>

              <button type="submit" disabled={isLoading} className={`${styles.btn} ${styles.btnPrimary}`}>
                {isLoading ? "Logging in..." : "Log In"}
              </button>

              <div className={styles.divider}><span>or</span></div>

              <button
                type="button"
                className={`${styles.btn} ${styles.btnGoogle}`}
                onClick={startGoogleLogin}
              >
                <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>

              {error && <div className={styles.errorMessage}>{error}</div>}
              {message && <div className={styles.successMessage}>{message}</div>}
            </form>

            <div className={styles.signupPrompt}>
              Do not have an account yet? <Link className={styles.signupLink} to="/signup">Sign Up</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



const FRONTEND_URL = import.meta.env.VITE_APP_URL || "http://localhost:5173";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

const handleGoogleLogin = () => {
  // Let the backend do the OAuth dance.
  // Add "next" if your backend supports it; otherwise skip the query param.
  window.location.href = `${API_BASE}/auth/google/login/?next=${encodeURIComponent(FRONTEND_URL + "/oauth/callback")}`;
};



