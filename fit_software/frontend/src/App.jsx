import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./login";
import SignUp from "./signup";
import Anasayfa from "./anasayfa";
import GoogleCallback from "./GoogleCallback";

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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
