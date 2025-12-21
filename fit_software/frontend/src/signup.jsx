import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./signup.module.css";
import { signup } from "./api";

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    repeatPassword: ""
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await signup(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password,
        formData.repeatPassword
      );
      
      setMessage("Account created successfully! Redirecting to login...");
      
      // 2 saniye sonra login sayfasına yönlendir
      setTimeout(() => {
        navigate("/");
      }, 2000);
      
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["app-wrap"]}>
      <div className={styles["auth-card"]}>
        <h1 className={styles.title}>Create your account</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles["grid-2"]}>
            <label className={styles.label}>
              First name
              <input 
                className={styles.input} 
                type="text" 
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required 
              />
            </label>
            <label className={styles.label}>
              Last name
              <input 
                className={styles.input} 
                type="text" 
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required 
              />
            </label>
          </div>

          <label className={styles.label}>
            Email
            <input 
              className={styles.input} 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </label>

          <label className={styles.label}>
            Password
            <input 
              className={styles.input} 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              required 
            />
          </label>

          <label className={styles.label}>
            Repeat password
            <input 
              className={styles.input} 
              type="password" 
              name="repeatPassword"
              value={formData.repeatPassword}
              onChange={handleChange}
              required 
            />
          </label>

          <button 
            className={`${styles.btn} ${styles["w-full"]}`} 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {message && (
          <div className={styles.message}>
            {message}
          </div>
        )}

        <p className={`${styles.muted} ${styles.center} ${styles["mt-16"]}`}>
          Already have an account?{" "}
          <Link className={styles.link} to="/">Log in</Link>
        </p>
      </div>

      <aside className={styles["right-pane"]}>
        {/* Sağ taraf: temayla uyumlu görsel/metin alanı */}
      </aside>
    </div>
  );
}
