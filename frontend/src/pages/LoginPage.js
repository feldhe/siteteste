import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-6 h-6 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black relative overflow-hidden" data-testid="login-page">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,26,26,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,26,26,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      {/* Red glow orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #ff1a1a 0%, transparent 70%)' }} />

      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-sm space-y-10 text-center">
          {/* Logo */}
          <div className="space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl neon-glow-strong bg-neon-red/10">
              <Zap className="h-8 w-8 text-neon-red" strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-heading text-3xl sm:text-4xl font-black tracking-wider text-white neon-text" data-testid="login-title">
                SHADOW<br />SCHOLAR
              </h1>
              <p className="text-zinc-500 font-body text-sm mt-3 max-w-xs mx-auto">
                Gamifique seus estudos. Compita. Evolua.
              </p>
            </div>
          </div>

          {/* Login */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              data-testid="google-login-button"
              className="w-full h-14 rounded-xl bg-neon-red text-white font-heading font-bold text-sm tracking-widest uppercase neon-glow hover:bg-neon-red/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              ENTRAR COM GOOGLE
            </button>
            <p className="text-[11px] text-zinc-700">
              Ao entrar, voce aceita os termos de uso
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-zinc-900">
            {[
              { val: "100", label: "NIVEIS" },
              { val: "XP", label: "SISTEMA" },
              { val: "CLAS", label: "COMPETE" },
            ].map((s) => (
              <div key={s.label} className="glass-card p-3">
                <p className="font-stat text-2xl font-bold text-neon-red">{s.val}</p>
                <p className="text-[9px] font-mono text-zinc-600 tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="py-4 text-center relative z-10">
        <p className="text-[10px] text-zinc-700">
          Autoral por Henrique Feldhaus &ndash; Desenvolvedor Junior
        </p>
      </footer>
    </div>
  );
}
