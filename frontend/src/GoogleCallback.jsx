// src/GoogleCallback.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access = params.get("access");
    const refresh = params.get("refresh");
    const email = params.get("email");
    const first_name = params.get("first_name");
    const last_name = params.get("last_name");
  
  if (access) {
      // Her durumda localStorage'a yaz; gerekirse sessionStorage'a da yedekle
      localStorage.setItem("access", access);
      if (refresh) localStorage.setItem("refresh", refresh);
      if (email) localStorage.setItem("user", JSON.stringify({ email, first_name, last_name }));

      // Opsiyonel: kısa oturum için sessionStorage'a da koy
      const remember = localStorage.getItem("fitware_remember") === "1";
      if (!remember) {
        sessionStorage.setItem("access", access);
        if (refresh) sessionStorage.setItem("refresh", refresh);
      }

      console.log("Google ile giriş access token:", access);
    }
  
    // After saving token or if cookie-based, go home
    navigate("/anasayfa", { replace: true });
  }, [navigate]);

  return <p style={{ textAlign: "center", marginTop: "40px" }}>Google hesabınız doğrulanıyor...</p>;
}
