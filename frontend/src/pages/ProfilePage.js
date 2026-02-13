import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Edit, Flame, Trophy, Zap, ExternalLink, Award, Instagram, Youtube, Linkedin } from "lucide-react";
import { toast, Toaster } from "sonner";

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/..." },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
  { key: "custom", label: "Link Personalizado", placeholder: "https://..." },
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editCollegePlan, setEditCollegePlan] = useState("");
  const [editSocials, setEditSocials] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [p, b] = await Promise.all([api.get("/profile"), api.get("/badges")]);
        setProfile(p.data); setBadges(b.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const openEdit = () => {
    setEditBio(profile?.bio || ""); setEditCollegePlan(profile?.college_plan || "");
    setEditSocials(profile?.social_links || {}); setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/profile", { bio: editBio, college_plan: editCollegePlan, social_links: editSocials });
      setProfile(res.data); refreshUser(); setEditOpen(false); toast.success("Perfil atualizado!");
    } catch (e) { toast.error(e.response?.data?.detail || "Erro"); }
    finally { setSaving(false); }
  };

  if (loading || !profile) {
    return <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  const levelInfo = profile.level_info || {};
  const xpPercent = levelInfo.next_level_xp > 0 ? (levelInfo.current_xp / levelInfo.next_level_xp) * 100 : 0;
  const getRankColor = (r) => ({ "Bronze": "text-bronze", "Prata": "text-silver", "Ouro": "text-gold", "Rubi": "text-ruby", "Platina Lendario": "text-platinum" }[r] || "text-neon-red");

  return (
    <div className="space-y-5" data-testid="profile-page">
      <Toaster position="top-center" toastOptions={{ style: { background: 'rgba(15,3,3,0.9)', border: '1px solid rgba(255,26,26,0.2)', color: '#f2f2f2' }}} />

      {/* Gamer Card */}
      <div className="glass-card overflow-hidden" data-testid="profile-card">
        {/* Banner */}
        <div className="h-28 sm:h-40 w-full relative" data-testid="profile-banner"
          style={{ background: profile.banner ? `url(${profile.banner}) center/cover` : 'linear-gradient(135deg, #1a0000 0%, #3d0000 40%, #1a0000 100%)' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        </div>

        <div className="relative px-4 sm:px-6 pb-5 -mt-10">
          <div className="flex items-end gap-3 sm:gap-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-3 ring-neon-red/30 border-2 border-black" data-testid="profile-avatar">
              <AvatarImage src={profile.profile_photo || profile.picture} />
              <AvatarFallback className="bg-neon-red/15 text-neon-red text-xl font-heading font-bold">
                {(profile.display_name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pb-1">
              <h2 className="font-heading text-lg sm:text-xl font-bold tracking-wider text-white truncate">
                {profile.display_name}
              </h2>
              <p className="text-[10px] font-mono text-zinc-500">{profile.school} &middot; {profile.grade} &middot; {profile.city}</p>
            </div>
            <button onClick={openEdit} data-testid="edit-profile-button"
              className="p-2 rounded-lg glass-card border-zinc-800 hover:border-neon-red/30 transition-colors">
              <Edit className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          {profile.bio && <p className="text-sm text-zinc-300 mt-3">{profile.bio}</p>}
          {profile.college_plan && <p className="text-xs text-zinc-500 mt-1">Pretende cursar: {profile.college_plan}</p>}

          {profile.social_links && Object.keys(profile.social_links).filter(k => profile.social_links[k]).length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {Object.entries(profile.social_links).map(([key, url]) => {
                if (!url) return null;
                return (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono glass-card text-zinc-400 hover:text-neon-red hover:border-neon-red/20 transition-colors">
                    <ExternalLink className="h-2.5 w-2.5" /> {key}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Nivel" value={levelInfo.level} icon={<Trophy className="h-3.5 w-3.5 text-neon-red" />}
          sub={<span className={`text-[10px] font-heading font-bold ${getRankColor(levelInfo.rank)}`}>{levelInfo.rank}</span>} />
        <StatCard label="Level XP" value={profile.level_xp} icon={<Zap className="h-3.5 w-3.5 text-neon-red" />}
          sub={<div className="xp-bar-track h-1 mt-1"><div className="xp-bar-fill h-full" style={{ width: `${xpPercent}%` }} /></div>} />
        <StatCard label="Total XP" value={profile.total_xp} icon={<Zap className="h-3.5 w-3.5 text-neon-red" />} />
        <StatCard label="Streak" value={profile.streak} icon={<Flame className="h-3.5 w-3.5 text-orange-500" />}
          sub={<span className="text-[10px] text-zinc-600">dias</span>} />
      </div>

      {/* Badges */}
      <div className="glass-card p-4 sm:p-5" data-testid="badges-section">
        <p className="text-xs font-mono text-zinc-600 tracking-widest mb-3">CONQUISTAS</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {badges.map((b) => (
            <div key={b.badge_id} className={`p-3 rounded-xl text-center transition-all border ${
              b.earned ? "glass-strong border-neon-red/20" : "bg-zinc-900/20 border-zinc-900 opacity-40"
            }`}>
              <Award className={`h-5 w-5 mx-auto mb-1.5 ${b.earned ? "text-neon-red" : "text-zinc-700"}`} strokeWidth={1.5} />
              <p className="text-[11px] font-medium">{b.name}</p>
              <p className="text-[9px] text-zinc-600 mt-0.5">{b.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subjects */}
      <div className="glass-card p-4" data-testid="subjects-section">
        <p className="text-xs font-mono text-zinc-600 tracking-widest mb-3">MATERIAS</p>
        <div className="flex flex-wrap gap-2">
          {(profile.subjects || []).map((s) => (
            <Badge key={s} className="bg-neon-red/8 text-neon-red/80 border-neon-red/15 font-mono text-xs rounded-lg">{s}</Badge>
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="glass border-red-500/10 max-w-md mx-4 rounded-2xl max-h-[85vh] overflow-y-auto" aria-describedby="edit-desc" data-testid="edit-profile-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold tracking-wider text-neon-red">EDITAR PERFIL</DialogTitle>
            <p id="edit-desc" className="text-xs text-zinc-600">Atualize suas informacoes</p>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-zinc-600 tracking-widest mb-1 block">BIO</label>
              <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)}
                className="bg-black/50 border-zinc-800 font-mono text-sm rounded-xl" rows={3} maxLength={200} data-testid="edit-bio-input" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-600 tracking-widest mb-1 block">PRETENDE CURSAR</label>
              <Input value={editCollegePlan} onChange={(e) => setEditCollegePlan(e.target.value)}
                className="bg-black/50 border-zinc-800 h-10 font-mono rounded-xl" data-testid="edit-college-input" />
            </div>
            <div className="border-t border-zinc-800 pt-3">
              <p className="text-[10px] font-mono text-zinc-600 tracking-widest mb-2">REDES SOCIAIS</p>
              {SOCIAL_PLATFORMS.map((p) => (
                <div key={p.key} className="mb-2">
                  <label className="text-[10px] text-zinc-600 mb-0.5 block">{p.label}</label>
                  <Input value={editSocials[p.key] || ""} onChange={(e) => setEditSocials({ ...editSocials, [p.key]: e.target.value })}
                    placeholder={p.placeholder} className="bg-black/50 border-zinc-800 h-9 font-mono text-xs rounded-xl" data-testid={`social-${p.key}-input`} />
                </div>
              ))}
            </div>
            <button onClick={handleSave} disabled={saving} data-testid="save-profile-button"
              className="w-full h-11 rounded-xl bg-neon-red text-white font-heading font-bold text-sm tracking-wider neon-glow disabled:opacity-30 hover:bg-neon-red/90 transition-all">
              {saving ? "SALVANDO..." : "SALVAR"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon, sub }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-mono text-zinc-600 tracking-widest">{label}</span>
        {icon}
      </div>
      <p className="font-stat text-2xl sm:text-3xl font-bold text-white">{value}</p>
      {sub}
    </div>
  );
}
