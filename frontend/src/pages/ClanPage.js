import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Shield, Plus, Users, Trophy, Crown, LogOut, Zap } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function ClanPage() {
  const { user, refreshUser } = useAuth();
  const [clans, setClans] = useState([]);
  const [myClan, setMyClan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [clanName, setClanName] = useState("");
  const [clanDesc, setClanDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const clansRes = await api.get("/clans");
      setClans(clansRes.data);
      if (user?.clan_id) {
        const clanRes = await api.get(`/clans/${user.clan_id}`);
        setMyClan(clanRes.data);
      } else {
        setMyClan(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.clan_id]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post("/clans", { name: clanName, description: clanDesc });
      toast.success("Cla criado!");
      setCreateOpen(false);
      setClanName(""); setClanDesc("");
      refreshUser();
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao criar cla");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (clanId) => {
    try {
      await api.post(`/clans/${clanId}/join`);
      toast.success("Entrou no cla!");
      refreshUser();
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro");
    }
  };

  const handleLeave = async () => {
    try {
      await api.post(`/clans/${myClan.clan_id}/leave`);
      toast.success("Saiu do cla");
      refreshUser();
      setMyClan(null);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="clan-page">
      <Toaster position="top-right" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">Equipe</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tight">Cla</h1>
        </div>
        {!user?.clan_id && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-foreground text-background font-heading font-bold uppercase tracking-wider h-12 px-6" data-testid="create-clan-button">
                <Plus className="h-4 w-4 mr-2" /> Criar Cla
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md" aria-describedby="create-clan-desc" data-testid="create-clan-dialog">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl font-bold uppercase tracking-wider">Criar Cla</DialogTitle>
                <p id="create-clan-desc" className="text-xs text-muted-foreground">Crie seu cla e lidere uma equipe</p>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Custo: 500 Total XP
                </p>
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-1 block">Nome do Cla</label>
                  <Input value={clanName} onChange={(e) => setClanName(e.target.value)}
                    className="bg-secondary/50 border-border h-10 font-mono" data-testid="clan-name-input" />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-1 block">Descricao</label>
                  <Textarea value={clanDesc} onChange={(e) => setClanDesc(e.target.value)}
                    className="bg-secondary/50 border-border font-mono text-sm" rows={3} data-testid="clan-desc-input" />
                </div>
                <Button onClick={handleCreate} disabled={!clanName || creating}
                  className="w-full h-12 bg-foreground text-background font-heading font-bold uppercase tracking-wider"
                  data-testid="submit-clan-button">
                  {creating ? "Criando..." : "Criar (-500 XP)"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* My Clan */}
      {myClan && (
        <Card className="bg-card border-border" data-testid="my-clan-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center">
                  <Shield className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-black uppercase tracking-tight">{myClan.name}</h2>
                  <p className="text-xs text-muted-foreground">{myClan.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-heading text-2xl font-black">{myClan.total_xp}</p>
                <p className="text-xs font-mono text-muted-foreground">XP Total</p>
              </div>
            </div>

            <Separator className="my-4" />

            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-3">
              Membros ({(myClan.member_details || []).length})
            </h3>
            <div className="space-y-2">
              {(myClan.member_details || []).map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 p-2 border border-border">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={m.picture} />
                    <AvatarFallback className="bg-secondary text-xs font-bold">
                      {(m.display_name || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.display_name}</p>
                    <p className="text-xs font-mono text-muted-foreground">Nv. {m.level}</p>
                  </div>
                  {m.user_id === myClan.leader_id && (
                    <Crown className="h-4 w-4 text-gold" />
                  )}
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={handleLeave} className="mt-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground font-heading font-bold uppercase text-xs tracking-wider" data-testid="leave-clan-button">
              <LogOut className="h-3 w-3 mr-1.5" /> Sair do Cla
            </Button>
          </CardContent>
        </Card>
      )}

      {/* All Clans */}
      <div>
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-3">
          Todos os Clas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {clans.map((c, i) => (
            <Card key={c.clan_id} className="bg-card border-border hover:border-foreground/30 transition-colors" data-testid={`clan-${c.clan_id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-secondary flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(c.members || []).length} membros &middot; {c.total_xp} XP
                  </p>
                </div>
                {!user?.clan_id && (
                  <Button size="sm" onClick={() => handleJoin(c.clan_id)}
                    className="h-8 bg-foreground text-background font-heading font-bold uppercase text-xs tracking-wider"
                    data-testid={`join-${c.clan_id}`}>
                    Entrar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {clans.length === 0 && (
            <div className="col-span-full text-center py-16 border border-border">
              <p className="text-sm text-muted-foreground">Nenhum cla criado ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
