import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Search, UserPlus, UserCheck, UserX, Swords, Clock } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function FriendsPage() {
  const { user, refreshUser } = useAuth();
  const [friendsData, setFriendsData] = useState({ accepted: [], pending_sent: [], pending_received: [], rival_id: "" });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchFriends = async () => {
    try { const res = await api.get("/friends"); setFriendsData(res.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFriends(); }, []);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setSearching(true);
    try { const res = await api.get(`/friends/search?q=${searchQuery}`); setSearchResults(res.data); }
    catch (e) { console.error(e); }
    finally { setSearching(false); }
  };

  const handleSendRequest = async (userId) => {
    try { await api.post("/friends/request", { to_user_id: userId }); toast.success("Enviada!"); fetchFriends(); setSearchResults([]); setSearchQuery(""); }
    catch (e) { toast.error(e.response?.data?.detail || "Erro"); }
  };

  const handleRespond = async (requestId, action) => {
    try { await api.post("/friends/respond", { request_id: requestId, action }); toast.success(action === "accept" ? "Aceito!" : "Recusado"); fetchFriends(); }
    catch (e) { toast.error("Erro"); }
  };

  const handleSetRival = async (userId) => {
    try { await api.post(`/friends/rival/${userId}`); toast.success("Rival definido!"); refreshUser(); fetchFriends(); }
    catch (e) { toast.error("Erro"); }
  };

  return (
    <div className="space-y-5" data-testid="friends-page">
      <Toaster position="top-center" toastOptions={{ style: { background: 'rgba(15,3,3,0.9)', border: '1px solid rgba(255,26,26,0.2)', color: '#f2f2f2' }}} />

      <div>
        <p className="text-xs font-mono text-zinc-600 tracking-widest">SOCIAL</p>
        <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-wider text-white mt-1">AMIGOS</h1>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Buscar por nome..." data-testid="search-users-input"
          className="bg-black/50 border-zinc-800 h-10 font-mono flex-1 rounded-xl focus:border-neon-red/50" />
        <button onClick={handleSearch} disabled={searching} data-testid="search-users-button"
          className="h-10 w-10 rounded-xl bg-neon-red/15 text-neon-red border border-neon-red/20 flex items-center justify-center hover:bg-neon-red/25 transition-all">
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono text-zinc-600 tracking-widest">RESULTADOS</p>
          {searchResults.map((u) => (
            <div key={u.user_id} className="glass-card p-3 flex items-center gap-3">
              <Avatar className="h-8 w-8"><AvatarImage src={u.picture} /><AvatarFallback className="bg-neon-red/10 text-neon-red text-xs font-bold">{(u.display_name || "?").charAt(0)}</AvatarFallback></Avatar>
              <div className="flex-1"><p className="text-sm font-medium">{u.display_name}</p><p className="text-[10px] font-mono text-zinc-600">Nv.{u.level}</p></div>
              <button onClick={() => handleSendRequest(u.user_id)} data-testid={`add-${u.user_id}`}
                className="h-8 px-3 rounded-lg bg-neon-red/15 text-neon-red text-xs font-heading font-bold tracking-wider border border-neon-red/20 flex items-center gap-1">
                <UserPlus className="h-3 w-3" /> ADD
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pending Received */}
      {friendsData.pending_received.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono text-zinc-600 tracking-widest">SOLICITACOES</p>
          {friendsData.pending_received.map((f) => (
            <div key={f.request_id} className="glass-strong p-3 flex items-center gap-3 neon-border">
              <Avatar className="h-8 w-8"><AvatarImage src={f.other_user?.picture} /><AvatarFallback className="bg-neon-red/10 text-neon-red text-xs font-bold">{(f.other_user?.display_name || "?").charAt(0)}</AvatarFallback></Avatar>
              <div className="flex-1"><p className="text-sm font-medium">{f.other_user?.display_name}</p></div>
              <div className="flex gap-1">
                <button onClick={() => handleRespond(f.request_id, "accept")} data-testid={`accept-${f.request_id}`}
                  className="p-2 rounded-lg bg-neon-red/15 text-neon-red hover:bg-neon-red/25 transition-colors"><UserCheck className="h-4 w-4" /></button>
                <button onClick={() => handleRespond(f.request_id, "reject")} data-testid={`reject-${f.request_id}`}
                  className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"><UserX className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Sent */}
      {friendsData.pending_sent.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono text-zinc-600 tracking-widest">ENVIADAS</p>
          {friendsData.pending_sent.map((f) => (
            <div key={f.request_id} className="glass-card p-3 flex items-center gap-3">
              <Avatar className="h-8 w-8"><AvatarImage src={f.other_user?.picture} /><AvatarFallback className="bg-zinc-800 text-xs">?</AvatarFallback></Avatar>
              <p className="text-sm font-medium flex-1">{f.other_user?.display_name}</p>
              <Badge className="bg-zinc-800 text-zinc-500 border-zinc-700 text-[10px] font-mono"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Friends */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-mono text-zinc-600 tracking-widest">AMIGOS ({friendsData.accepted.length})</p>
        {friendsData.accepted.length > 0 ? (
          friendsData.accepted.map((f) => {
            const isRival = friendsData.rival_id === f.other_user?.user_id;
            return (
              <div key={f.request_id} className={`glass-card p-3 flex items-center gap-3 ${isRival ? "neon-border" : ""}`}>
                <Avatar className="h-8 w-8"><AvatarImage src={f.other_user?.picture} /><AvatarFallback className="bg-neon-red/10 text-neon-red text-xs font-bold">{(f.other_user?.display_name || "?").charAt(0)}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{f.other_user?.display_name}</p>
                    {isRival && <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[9px] font-mono">RIVAL</Badge>}
                  </div>
                  <p className="text-[10px] font-mono text-zinc-600">Nv.{f.other_user?.level} &middot; Streak {f.other_user?.streak}</p>
                </div>
                {!isRival && (
                  <button onClick={() => handleSetRival(f.other_user?.user_id)} data-testid={`rival-${f.other_user?.user_id}`}
                    className="h-8 px-3 rounded-lg border border-zinc-800 text-zinc-500 text-xs font-heading font-bold tracking-wider hover:border-red-500/30 hover:text-red-400 transition-all flex items-center gap-1">
                    <Swords className="h-3 w-3" /> RIVAL
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 glass-card">
            <p className="text-sm text-zinc-600">Nenhum amigo</p>
            <p className="text-xs text-zinc-700 mt-1">Busque e adicione acima</p>
          </div>
        )}
      </div>
    </div>
  );
}
