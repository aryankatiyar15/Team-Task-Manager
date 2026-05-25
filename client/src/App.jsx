import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProjectDetailPage from "./pages/ProjectDetailPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import TasksPage from "./pages/TasksPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function AuthRedirect({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="screen-loader">Loading workspace...</div>;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthRedirect>
            <LoginPage />
          </AuthRedirect>
        }
      />
      <Route
        path="/signup"
        element={
          <AuthRedirect>
            <SignupPage />
          </AuthRedirect>
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/tasks" element={<TasksPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
