import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./login";   // src/login.jsx
import Anasayfa from './anasayfa'    // Senin oluşturduğun sayfa
import SignUp from "./signup"; // src/signup.jsx


function ProtectedRoute({ children }) {
  const token = localStorage.getItem('access') // access token burada duracak varsayıyoruz
  return token ? children : <Navigate to="/" replace />
}


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/anasayfa" element={<ProtectedRoute> <Anasayfa /></ProtectedRoute>}/>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
