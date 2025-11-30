import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Anasayfa() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Token kontrolü
    const token = localStorage.getItem('access') || sessionStorage.getItem('access');
    if (!token) {
      navigate('/');
      return;
    }

    // Kullanıcı bilgilerini al (opsiyonel)
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    navigate('/');
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1>Hoş geldin! 🎉</h1>
      <p>Burası giriş sonrası anasayfa.</p>
      {user && (
        <div style={{ marginBottom: 20, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <h3>Kullanıcı Bilgileri:</h3>
          <p><strong>Ad:</strong> {user.first_name}</p>
          <p><strong>Soyad:</strong> {user.last_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => navigate('/test-endpoints')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Test Endpoints
        </button>
        <button 
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  )
}
