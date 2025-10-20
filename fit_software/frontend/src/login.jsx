import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "./config";
import { Link, useNavigate } from "react-router-dom";
import styles from "./login.module.css";
import { loginWithEmail } from "./api";

export default function Login() {
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/health/`)
      .then((res) => setHealth(res.data))
      .catch(() => setHealth({ status: "error" }));
  }, []);

  async function login(e) {
    e.preventDefault();
    setMsg("");
    setIsLoading(true);
    
    try {
      const data = await loginWithEmail(username, password);
      setMsg("Giriş başarılı! Anasayfaya yönlendiriliyorsunuz...");
      
      // 2 saniye sonra anasayfaya yönlendir
      setTimeout(() => {
        navigate("/anasayfa");
      }, 2000);
      
    } catch (error) {
      setMsg(error.message || "Giriş başarısız.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleLoginSuccess = (googleToken) => {
    // Eğer Google login kullanıyorsan, backend’inden access üretip kaydet:
    // localStorage.setItem('access', accessFromBackend)
    // localStorage.setItem('refresh', refreshFromBackend)
    navigate('/anasayfa', { replace: true })
  }

  return (
    <div className={styles.container}>
      <section className={`${styles.card} ${styles["auth-card"]}`}>
        <h2 className={styles["card-title"]}>Welcome back!</h2>

        <form className={styles.form} onSubmit={login}>
          <div>
            <div className={styles.label}>Email</div>
            <input
              className={`${styles.input} ${styles["input-underline"]}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <div className={styles.label}>Password</div>
            <input
              className={`${styles.input} ${styles["input-underline"]}`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className={styles["form-row"]}>
            <label className={styles.checkbox}>
              <input type="checkbox" /> Remember me
            </label>
            <a className={styles.link} href="#">Forgot password?</a>
          </div>

          <button
            className={`${styles.btn} ${styles["btn-primary"]} ${styles["btn-lg"]}`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Giriş yapılıyor..." : "Log in"}
          </button>

          <button className={`${styles.btn} ${styles["btn-google"]}`} type="button">
            <span className={styles.gdot} /> Log in with Google
          </button>

          <div className={styles["auth-footer-note"]}>
            Don’t you have an account?{" "}
            <Link className={styles["link-cta"]} to="/signup">Sign up</Link>
          </div>
        </form>

        {msg && <div className={styles.msg}>{msg}</div>}
      </section>
    </div>
  );
}
