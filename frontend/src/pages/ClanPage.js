import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Shield, Plus, Crown, LogOut, Zap } from "lucide-react";
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
      const res = await api.get("/clans");
      setClans(res.data);
      if (user?.clan_id) { const c = await api.get(`/clans/${user.clan_id}`); setMyClan(c.data); }
      else setMyClan(null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user?.clan_id]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post("/clans", { name: clanName, description: clanDesc });
      toast.success("Cla criado!"); setCreateOpen(false); setClanName(""); setClanDesc("");
      refreshUser(); fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || "Erro"); }
    finally { setCreating(false); }
  };

  const handleJoin = async (clanId) => {
    try { await api.post(`/clans/${clanId}/join`); toast.success("Entrou!"); refreshUser(); fetchData(); }
    catch (e) { toast.error(e.response?.data?.detail || "Erro"); }
  };

  const handleLeave = async () => {
    try { await api.post(`/clans/${myClan.clan_id}/leave`); toast.success("Saiu"); refreshUser(); setMyClan(null); fetchData(); }
    catch (e) { toast.error(e.response?.data?.detail || "Erro"); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-neon-red border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5" data-testid="clan-page">
      <Toaster position="top-center" toastOptions={{ style: { background: 'rgba(15,3,3,0.9)', border: '1px solid rgba(255,26,26,0.2)', color: '#f2f2f2' }}} />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono text-zinc-600 tracking-widest">EQUIPE</p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-wider text-white mt-1">CLA</h1>
        </div>
        {!user?.clan_id && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <button className="h-10 px-5 rounded-xl bg-neon-red text-white font-heading font-bold text-xs tracking-wider neon-glow hover:bg-neon-red/90 transition-all flex items-center gap-2" data-testid="create-clan-button">
                <Plus className="h-4 w-4" /> CRIAR
              </button>
            </DialogTrigger>
            <DialogContent className="glass border-red-500/10 max-w-md mx-4 rounded-2xl" aria-describedby="create-clan-desc" data-testid="create-clan-dialog">
              <DialogHeader>
                <DialogTitle className="font-heading text-lg font-bold tracking-wider text-neon-red">CRIAR CLA</DialogTitle>
                <p id="create-clan-desc" className="text-xs text-zinc-600 flex items-center gap-1"><Zap className="h-3 w-3 text-neon-red" /> Custo: 500 XP</p>
              </DialogHeader>
              <div className="space-y-3">
                <Input value={clanName} onChange={(e) => setClanName(e.target.value)} placeholder="Nome do cla..."
                  className="bg-black/50 border-zinc-800 h-10 font-mono rounded-xl" data-testid="clan-name-input" />
                <Textarea value={clanDesc} onChange={(e) => setClanDesc(e.target.value)} placeholder="Descricao..."
                  className="bg-black/50 border-zinc-800 font-mono text-sm rounded-xl" rows={3} data-testid="clan-desc-input" />
                <button onClick={handleCreate} disabled={!clanName || creating} data-testid="submit-clan-button"
                  className="w-full h-11 rounded-xl bg-neon-red text-white font-heading font-bold text-sm tracking-wider neon-glow disabled:opacity-30">
                  {creating ? "CRIANDO..." : "CRIAR (-500 XP)"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* My Clan */}
      {myClan && (
        <div className="glass-strong p-5 neon-glow" data-testid="my-clan-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-neon-red/15 flex items-center justify-center">
                <Shield className="h-5 w-5 text-neon-red" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold tracking-wider text-white">{myClan.name}</h2>
                <p className="text-xs text-zinc-500">{myClan.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-stat text-2xl font-bold text-neon-red neon-text">{myClan.total_xp}</p>
              <p className="text-[9px] font-mono text-zinc-600">XP TOTAL</p>
            </div>
          </div>

          <div className="border-t border-zinc-800/50 pt-3">
            <p className="text-[10px] font-mono text-zinc-600 tracking-widest mb-2">MEMBROS ({(myClan.member_details || []).length})</p>
            <div className="space-y-1.5">
              {(myClan.member_details || []).map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-black/30">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={m.picture} />
                    <AvatarFallback className="bg-neon-red/10 text-neon-red text-[10px] font-bold">{(m.display_name || "?").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium flex-1">{m.display_name}</p>
                  <span className="text-[10px] font-mono text-zinc-600">Nv.{m.level}</span>
                  {m.user_id === myClan.leader_id && <Crown className="h-3.5 w-3.5 text-gold" />}
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleLeave} data-testid="leave-clan-button"
            className="mt-4 h-9 px-4 rounded-lg border border-red-500/20 text-red-400 text-xs font-heading font-bold tracking-wider hover:bg-red-500/10 transition-colors flex items-center gap-1.5">
            <LogOut className="h-3 w-3" /> SAIR
          </button>
        </div>
      )}

      {/* All Clans */}
      <div>
        <p className="text-[10px] font-mono text-zinc-600 tracking-widest mb-3">TODOS OS CLAS</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {clans.map((c) => (
            <div key={c.clan_id} className="glass-card p-4 flex items-center gap-3" data-testid={`clan-${c.clan_id}`}>
              <div className="w-9 h-9 rounded-lg bg-zinc-800/50 flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-[10px] font-mono text-zinc-600">{(c.members || []).length} membros &middot; {c.total_xp} XP</p>
              </div>
              {!user?.clan_id && (
                <button onClick={() => handleJoin(c.clan_id)} data-testid={`join-${c.clan_id}`}
                  className="h-8 px-3 rounded-lg bg-neon-red/15 text-neon-red text-xs font-heading font-bold tracking-wider border border-neon-red/20 hover:bg-neon-red/25 transition-all">
                  ENTRAR
                </button>
              )}
            </div>
          ))}
          {clans.length === 0 && (
            <div className="col-span-full text-center py-16 glass-card"><p className="text-sm text-zinc-600">Nenhum cla criado</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
