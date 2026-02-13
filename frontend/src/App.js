import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import AuthCallback from "./pages/AuthCallback";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import RankingsPage from "./pages/RankingsPage";
import ProfilePage from "./pages/ProfilePage";
import ShopPage from "./pages/ShopPage";
import ClanPage from "./pages/ClanPage";
import FriendsPage from "./pages/FriendsPage";

function ProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Layout>{children}</Layout>;
}

function OnboardingRoute() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.onboarding_complete) return <Navigate to="/dashboard" replace />;

  return <OnboardingPage />;
}

function AppRouter() {
  const location = useLocation();

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  // Check for session_id in hash SYNCHRONOUSLY before routing
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingRoute />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/activities" element={<ProtectedRoute><ActivitiesPage /></ProtectedRoute>} />
      <Route path="/rankings" element={<ProtectedRoute><RankingsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/shop" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
      <Route path="/clan" element={<ProtectedRoute><ClanPage /></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
