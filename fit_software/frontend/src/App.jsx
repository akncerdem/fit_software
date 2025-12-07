import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./login";
import SignUp from "./signup";
import Anasayfa from "./anasayfa";
import GoogleCallback from "./GoogleCallback";
import Workout from './workout';
import Goal from './goal';
import Challenges from './challenges'; // ← Dosya adı challanges ise böyle
import Profile from './profile';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access") || sessionStorage.getItem("access");
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/google-callback" element={<GoogleCallback />} />
      <Route
        path="/anasayfa"
        element={
          <ProtectedRoute>
            <Anasayfa />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workout"
        element={
          <ProtectedRoute>
            <Workout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/goal"
        element={
          <ProtectedRoute>
            <Goal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/challenges"
        element={
          <ProtectedRoute>
            <Challenges />  {/* ← Goal değil, Challenges olmalı */}
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />  {/* ← Goal değil, Profile olmalı */}
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}