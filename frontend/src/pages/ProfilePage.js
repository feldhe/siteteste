import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Separator } from "../components/ui/separator";
import { Edit, Flame, Trophy, Zap, Link as LinkIcon, Instagram, Youtube, Linkedin, ExternalLink, Award } from "lucide-react";
import { toast, Toaster } from "sonner";

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/..." },
  { key: "x", label: "X (Twitter)", icon: ExternalLink, placeholder: "https://x.com/..." },
  { key: "tiktok", label: "TikTok", icon: ExternalLink, placeholder: "https://tiktok.com/@..." },
  { key: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/..." },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/in/..." },
  { key: "custom", label: "Link Personalizado", icon: LinkIcon, placeholder: "https://..." },
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
        const [pRes, bRes] = await Promise.all([
          api.get("/profile"),
          api.get("/badges"),
        ]);
        setProfile(pRes.data);
        setBadges(bRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const openEdit = () => {
    setEditBio(profile?.bio || "");
    setEditCollegePlan(profile?.college_plan || "");
    setEditSocials(profile?.social_links || {});
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/profile", {
        bio: editBio,
        college_plan: editCollegePlan,
        social_links: editSocials,
      });
      setProfile(res.data);
      refreshUser();
      setEditOpen(false);
      toast.success("Perfil atualizado!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent animate-spin" />
      </div>
    );
  }

  const levelInfo = profile.level_info || {};
  const xpPercent = levelInfo.next_level_xp > 0 ? (levelInfo.current_xp / levelInfo.next_level_xp) * 100 : 0;
  const getRankColor = (rank) => {
    const c = { "Bronze": "text-bronze", "Prata": "text-silver", "Ouro": "text-gold", "Rubi": "text-ruby", "Platina Lendario": "text-platinum" };
    return c[rank] || "text-foreground";
  };

  return (
    <div className="space-y-6" data-testid="profile-page">
      <Toaster position="top-right" />

      {/* Gamer Card */}
      <Card className="bg-card border-border overflow-hidden relative" data-testid="profile-card">
        {/* Banner */}
        <div
          className="h-36 sm:h-48 w-full bg-secondary"
          style={{
            backgroundImage: profile.banner
              ? `url(${profile.banner})`
              : `url(https://images.unsplash.com/photo-1762258344624-52d8c3b74c66?w=800&q=60)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          data-testid="profile-banner"
        />

        <CardContent className="relative pt-0 pb-6 px-6">
          {/* Avatar */}
          <div className="flex items-end gap-4 -mt-12">
            <Avatar className="h-20 w-20 border-4 border-card" data-testid="profile-avatar">
              <AvatarImage src={profile.profile_photo || profile.picture} />
              <AvatarFallback className="bg-secondary text-2xl font-heading font-black">
                {(profile.display_name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-2xl font-black uppercase tracking-tight truncate">
                  {profile.display_name}
                </h2>
                {profile.active_badge && (
                  <Badge variant="secondary" className="text-xs font-mono">{profile.active_badge}</Badge>
                )}
              </div>
              <p className="text-xs font-mono text-muted-foreground">
                {profile.school} &middot; {profile.grade} &middot; {profile.city}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={openEdit} data-testid="edit-profile-button"
              className="border-border font-heading font-bold uppercase text-xs tracking-wider">
              <Edit className="h-3 w-3 mr-1.5" /> Editar
            </Button>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-zinc-300 mt-4 max-w-lg">{profile.bio}</p>
          )}
          {profile.college_plan && (
            <p className="text-xs text-muted-foreground mt-1">Pretende cursar: {profile.college_plan}</p>
          )}

          {/* Social Links */}
          {profile.social_links && Object.keys(profile.social_links).length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {Object.entries(profile.social_links).map(([key, url]) => {
                if (!url) return null;
                return (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors">
                    <ExternalLink className="h-3 w-3" /> {key}
                  </a>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Nivel" value={levelInfo.level} icon={<Trophy className="h-4 w-4" />} sub={
          <span className={`text-xs font-heading font-bold uppercase ${getRankColor(levelInfo.rank)}`}>{levelInfo.rank}</span>
        } />
        <StatCard label="Level XP" value={profile.level_xp} icon={<Zap className="h-4 w-4" />} sub={
          <Progress value={xpPercent} className="h-1 bg-secondary mt-1" />
        } />
        <StatCard label="Total XP" value={profile.total_xp} icon={<Zap className="h-4 w-4" />} />
        <StatCard label="Streak" value={profile.streak} icon={<Flame className="h-4 w-4 text-orange-400" />} sub={
          <span className="text-xs text-muted-foreground">dias</span>
        } />
      </div>

      {/* Badges */}
      <Card className="bg-card border-border" data-testid="badges-section">
        <CardContent className="p-6">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-4">Conquistas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {badges.map((b) => (
              <div key={b.badge_id} className={`p-3 border text-center transition-colors ${
                b.earned ? "border-foreground/30 bg-secondary/50" : "border-border opacity-40"
              }`}>
                <Award className={`h-6 w-6 mx-auto mb-2 ${b.earned ? "text-foreground" : "text-zinc-600"}`} strokeWidth={1.5} />
                <p className="text-xs font-medium">{b.name}</p>
                <p className="text-[10px] text-muted-foreground">{b.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subjects */}
      <Card className="bg-card border-border" data-testid="subjects-section">
        <CardContent className="p-6">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-4">Materias</h3>
          <div className="flex flex-wrap gap-2">
            {(profile.subjects || []).map((s) => (
              <Badge key={s} variant="secondary" className="font-mono text-xs">{s}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-y-auto" aria-describedby="edit-profile-desc" data-testid="edit-profile-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-bold uppercase tracking-wider">Editar Perfil</DialogTitle>
            <p id="edit-profile-desc" className="text-xs text-muted-foreground">Atualize suas informacoes</p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-1 block">Bio</label>
              <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)}
                className="bg-secondary/50 border-border font-mono text-sm" rows={3} maxLength={200}
                data-testid="edit-bio-input" />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-1 block">Pretende Cursar</label>
              <Input value={editCollegePlan} onChange={(e) => setEditCollegePlan(e.target.value)}
                className="bg-secondary/50 border-border h-10 font-mono" data-testid="edit-college-input" />
            </div>
            <Separator />
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">Redes Sociais</p>
            {SOCIAL_PLATFORMS.map((p) => (
              <div key={p.key}>
                <label className="text-xs text-muted-foreground mb-1 block">{p.label}</label>
                <Input
                  value={editSocials[p.key] || ""}
                  onChange={(e) => setEditSocials({ ...editSocials, [p.key]: e.target.value })}
                  placeholder={p.placeholder}
                  className="bg-secondary/50 border-border h-9 font-mono text-xs"
                  data-testid={`social-${p.key}-input`}
                />
              </div>
            ))}
            <Button onClick={handleSave} disabled={saving}
              className="w-full h-12 bg-foreground text-background font-heading font-bold uppercase tracking-wider"
              data-testid="save-profile-button">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon, sub }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">{label}</span>
          {icon}
        </div>
        <p className="font-heading text-3xl font-black">{value}</p>
        {sub}
      </CardContent>
    </Card>
  );
}
