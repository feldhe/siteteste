import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LayoutDashboard, BookOpen, Trophy, Shield, User, Store, Users, Menu, X, LogOut, Flame } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/activities", label: "Atividades", icon: BookOpen },
  { path: "/rankings", label: "Ranking", icon: Trophy },
  { path: "/clan", label: "Cl\u00e3", icon: Shield },
  { path: "/friends", label: "Amigos", icon: Users },
  { path: "/shop", label: "Loja", icon: Store },
  { path: "/profile", label: "Perfil", icon: User },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleNav = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background" data-testid="app-layout">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-background border-b border-border md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} data-testid="mobile-menu-toggle">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="font-heading text-lg font-bold uppercase tracking-wider">Shadow Scholar</span>
        <div className="flex items-center gap-2">
          {user?.streak > 0 && (
            <span className="flex items-center gap-1 text-sm font-mono text-orange-400">
              <Flame className="h-4 w-4" /> {user.streak}
            </span>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full p-6">
          <div className="hidden md:flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-foreground flex items-center justify-center">
              <span className="text-background font-heading font-black text-sm">SS</span>
            </div>
            <span className="font-heading text-xl font-bold uppercase tracking-wider">Shadow Scholar</span>
          </div>

          {/* User mini card */}
          {user && (
            <div className="flex items-center gap-3 mb-6 p-3 border border-border">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.picture || user.profile_photo} />
                <AvatarFallback className="bg-secondary text-xs font-bold">
                  {(user.display_name || user.name || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user.display_name || user.name}</p>
                <p className="text-xs font-mono text-muted-foreground">Nv. {user.level || 0}</p>
              </div>
            </div>
          )}

          <Separator className="mb-4" />

          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  data-testid={`nav-${item.path.slice(1)}`}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium tracking-wide uppercase transition-colors ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="h-4 w-4" strokeWidth={1.5} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <Separator className="my-4" />

          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium tracking-wide uppercase text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            Sair
          </button>

          <p className="text-[10px] text-zinc-600 mt-4 text-center">
            Autoral por Henrique Feldhaus &ndash; Desenvolvedor Junior
          </p>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
