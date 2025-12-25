import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./login";
import SignUp from "./signup";
import Anasayfa from "./anasayfa";
import GoogleCallback from "./GoogleCallback";
import Workout from './workout';
import Goal from './goal';
import Challenges from './challenges';
import Profile from './profile';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access") || sessionStorage.getItem("access");
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Auth screens */}
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<Login />} />
      <Route path="/reset-password/:uid/:token" element={<Login />} />

      <Route path="/signup" element={<SignUp />} />
      <Route path="/google-callback" element={<GoogleCallback />} />

      {/* Protected screens */}
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
            <Challenges />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
