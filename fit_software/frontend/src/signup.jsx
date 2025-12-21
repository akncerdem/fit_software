import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./login.module.css";
import { signup } from "./api";

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    repeatPassword: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      await signup(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password,
        formData.repeatPassword
      );

      setMessage("Account created! Redirecting to login...");
      setTimeout(() => navigate("/"), 1200);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginWrapper}>
      {/* Left panel (same vibe as login) */}
      <aside className={styles.leftPanel}>
        <div className={styles.bgGlowA}></div>
        <div className={styles.bgGlowB}></div>

        <section className={styles.heroSection}>
          <div className={styles.floatingLogo}>
            <svg viewBox="0 0 100 100">
              <path
                d="M50 10 L85 25 L85 50 Q85 75 50 90 Q15 75 15 50 L15 25 Z"
                fill="white"
                className={styles.shieldPath}
              />
              <circle cx="50" cy="35" r="6" fill="#06b6d4" className={styles.personHead} />
              <path
                d="M35 48 Q35 42 42 42 L58 42 Q65 42 65 48 L65 70 L35 70 Z"
                fill="#06b6d4"
                className={styles.personBody}
              />
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

      {/* Right panel - signup card */}
      <main className={styles.rightPanel}>
        <div className={styles.formContainer}>
          <div className={styles.loginCard}>
            <h2 className={styles.cardTitle}>Create account</h2>
            <p className={styles.cardSubtitle}>Start your fitness journey</p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.grid2}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>First name</label>
                  <input
                    className={styles.input}
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Last name</label>
                  <input
                    className={styles.input}
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>E-mail</label>
                <input
                  className={styles.input}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Password</label>
                <input
                  className={styles.input}
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Repeat password</label>
                <input
                  className={styles.input}
                  type="password"
                  name="repeatPassword"
                  value={formData.repeatPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create account"}
              </button>

              {message && <div className={styles.message}>{message}</div>}

              <p className={styles.signupText}>
                Already have an account? <Link to="/">Log in</Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
