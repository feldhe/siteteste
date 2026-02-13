import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LayoutDashboard, BookOpen, Trophy, Shield, User, Store, Users, LogOut, Flame, Zap, Menu, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

const MOBILE_NAV = [
  { path: "/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/activities", label: "Estudar", icon: BookOpen },
  { path: "/rankings", label: "Ranking", icon: Trophy },
  { path: "/clan", label: "Cl\u00e3", icon: Shield },
  { path: "/profile", label: "Perfil", icon: User },
];

const SIDEBAR_NAV = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/activities", label: "Atividades", icon: BookOpen },
  { path: "/rankings", label: "Ranking", icon: Trophy },
  { path: "/clan", label: "Cl\u00e3", icon: Shield },
  { path: "/friends", label: "Amigos", icon: Users },
  { path: "/shop", label: "Loja", icon: Store },
  { path: "/profile", label: "Perfil", icon: User },
];

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleNav = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-black" data-testid="app-layout">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 z-40 flex-col glass border-r border-red-500/10" data-testid="sidebar">
        <div className="flex flex-col h-full p-5">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-neon-red/20 flex items-center justify-center neon-glow">
              <Zap className="h-4 w-4 text-neon-red" strokeWidth={2} />
            </div>
            <span className="font-heading text-sm font-bold tracking-widest text-neon-red neon-text">
              SHADOW SCHOLAR
            </span>
          </div>

          {/* User Card */}
          {user && (
            <div className="glass-card p-3 mb-6 flex items-center gap-3">
              <Avatar className="h-9 w-9 ring-2 ring-neon-red/30">
                <AvatarImage src={user.picture || user.profile_photo} />
                <AvatarFallback className="bg-neon-red/10 text-neon-red text-xs font-bold">
                  {(user.display_name || user.name || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.display_name || user.name}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="font-mono">Nv.{user.level || 0}</span>
                  {user.streak > 0 && (
                    <span className="flex items-center gap-0.5 text-orange-400">
                      <Flame className="h-3 w-3" />{user.streak}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Nav Items */}
          <nav className="flex-1 space-y-1">
            {SIDEBAR_NAV.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                data-testid={`nav-${item.path.slice(1)}`}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? "bg-neon-red/15 text-neon-red neon-border"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-600 hover:text-red-400 transition-colors mt-4"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            Sair
          </button>

          <p className="text-[9px] text-zinc-700 mt-3 text-center leading-tight">
            Autoral por Henrique Feldhaus<br />Desenvolvedor Junior
          </p>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 glass-nav md:hidden">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-neon-red" strokeWidth={2} />
          <span className="font-heading text-xs font-bold tracking-widest text-neon-red">SHADOW SCHOLAR</span>
        </div>
        <div className="flex items-center gap-3">
          {user?.streak > 0 && (
            <span className="flex items-center gap-1 text-xs font-mono text-orange-400">
              <Flame className="h-3 w-3" />{user.streak}
            </span>
          )}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="mobile-menu-toggle"
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu Overlay ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/80" />
          <div className="absolute top-14 right-3 w-56 glass-card p-2" onClick={(e) => e.stopPropagation()}>
            {[...SIDEBAR_NAV.filter(i => !MOBILE_NAV.find(m => m.path === i.path))].map((item) => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
                {item.label}
              </button>
            ))}
            <div className="border-t border-zinc-800 mt-1 pt-1">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-600 hover:text-red-400 transition-colors">
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 pb-safe-nav md:pb-0 overflow-auto min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 md:py-8">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav md:hidden" data-testid="mobile-bottom-nav"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex justify-around items-center h-16">
          {MOBILE_NAV.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                data-testid={`mobile-nav-${item.path.slice(1)}`}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all duration-200 ${
                  active ? "text-neon-red" : "text-zinc-600"
                }`}
              >
                <div className={`relative ${active ? "neon-glow rounded-full" : ""}`}>
                  <item.icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
                </div>
                <span className={`text-[10px] font-medium ${active ? "font-semibold" : ""}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
