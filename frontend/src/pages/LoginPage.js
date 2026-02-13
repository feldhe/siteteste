import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="login-page">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-12 text-center">
          {/* Logo */}
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-foreground">
              <Zap className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h1 className="font-heading text-5xl font-black uppercase tracking-tight">
              Shadow Scholar
            </h1>
            <p className="text-muted-foreground font-body text-base max-w-sm mx-auto">
              Gamifique seus estudos. Compita. Evolua.
            </p>
          </div>

          {/* Login button */}
          <div className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              data-testid="google-login-button"
              className="w-full h-14 bg-foreground text-background font-heading font-bold text-lg uppercase tracking-wider hover:bg-foreground/90 transition-all hover:-translate-y-0.5"
            >
              Entrar com Google
            </Button>
            <p className="text-xs text-zinc-600">
              Ao entrar, voce aceita os termos de uso
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border">
            <div>
              <p className="font-heading text-3xl font-black">100</p>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Niveis</p>
            </div>
            <div>
              <p className="font-heading text-3xl font-black">XP</p>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Sistema</p>
            </div>
            <div>
              <p className="font-heading text-3xl font-black">Clas</p>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Competicao</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center">
        <p className="text-[10px] text-zinc-600">
          Autoral por Henrique Feldhaus &ndash; Desenvolvedor Junior
        </p>
      </footer>
    </div>
  );
}
