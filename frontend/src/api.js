// src/api.js
// Bu dosya yalnızca Login sayfasında ihtiyaç duyulan basit istekleri içerir.
export const API_BASE = import.meta.env.VITE_API_BASE || "http://35.198.170.119";

// Sağlık kontrolü (örn. /api/health/ uç noktası)
export async function getHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health/`, { credentials: "include" });
    if (!res.ok) throw new Error("Health fetch failed");
    return await res.json();
  } catch (err) {
    return { status: "error" };
  }
}

// E-posta/şifre ile giriş
export async function loginWithEmail(email, password) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Giriş başarısız");
    }
    
    // Token'ları ve kullanıcı bilgilerini localStorage'a kaydet
    if (data.tokens) {
      localStorage.setItem("access", data.tokens.access);
      localStorage.setItem("refresh", data.tokens.refresh);
    }
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    
    return data;
  } catch (err) {
    throw new Error(err.message || "Giriş sırasında hata oluştu");
  }
}

// (Opsiyonel) Google OAuth tetikleyici — backend'ine göre değiştir.
// Genelde bir yönlendirme linki verir ya da popup açarsın.
export function startGoogleLogin() {
  window.location.href = `${API_BASE}/api/auth/google/login/`;
}

// Kullanıcı kaydı
export async function signup(firstName, lastName, email, password, repeatPassword) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/signup/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ 
        first_name: firstName, 
        last_name: lastName, 
        email, 
        password, 
        repeat_password: repeatPassword 
      }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Kayıt başarısız");
    }
    
    // Token'ları ve kullanıcı bilgilerini localStorage'a kaydet
    if (data.tokens) {
      localStorage.setItem("access", data.tokens.access);
      localStorage.setItem("refresh", data.tokens.refresh);
    }
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    
    return data;
  } catch (err) {
    throw new Error(err.message || "Kayıt sırasında hata oluştu");
  }
}
