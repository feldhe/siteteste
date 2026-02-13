import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";

export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace("#", ""));
      const sessionId = params.get("session_id");

      if (!sessionId) {
        navigate("/login");
        return;
      }

      try {
        const response = await api.post("/auth/session", { session_id: sessionId });
        const userData = response.data;
        login(userData);

        if (!userData.onboarding_complete) {
          navigate("/onboarding", { state: { user: userData } });
        } else {
          navigate("/dashboard", { state: { user: userData } });
        }
      } catch (error) {
        console.error("Auth error:", error);
        navigate("/login");
      }
    };

    processAuth();
  }, [navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="auth-callback">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Autenticando...</p>
      </div>
    </div>
  );
}
