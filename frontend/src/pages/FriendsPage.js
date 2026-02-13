import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Separator } from "../components/ui/separator";
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
    try {
      const res = await api.get("/friends");
      setFriendsData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFriends(); }, []);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setSearching(true);
    try {
      const res = await api.get(`/friends/search?q=${searchQuery}`);
      setSearchResults(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await api.post("/friends/request", { to_user_id: userId });
      toast.success("Solicitacao enviada!");
      fetchFriends();
      setSearchResults([]);
      setSearchQuery("");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro");
    }
  };

  const handleRespond = async (requestId, action) => {
    try {
      await api.post("/friends/respond", { request_id: requestId, action });
      toast.success(action === "accept" ? "Amizade aceita!" : "Solicitacao recusada");
      fetchFriends();
    } catch (e) {
      toast.error("Erro");
    }
  };

  const handleSetRival = async (userId) => {
    try {
      await api.post(`/friends/rival/${userId}`);
      toast.success("Rival definido!");
      refreshUser();
      fetchFriends();
    } catch (e) {
      toast.error("Erro");
    }
  };

  return (
    <div className="space-y-6" data-testid="friends-page">
      <Toaster position="top-right" />

      <div className="space-y-1">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">Social</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tight">Amigos</h1>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Buscar por nome..."
          className="bg-secondary/50 border-border h-10 font-mono flex-1"
          data-testid="search-users-input"
        />
        <Button onClick={handleSearch} disabled={searching}
          className="h-10 bg-foreground text-background font-heading font-bold uppercase tracking-wider"
          data-testid="search-users-button">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">Resultados</p>
          {searchResults.map((u) => (
            <Card key={u.user_id} className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={u.picture} />
                  <AvatarFallback className="bg-secondary text-xs font-bold">
                    {(u.display_name || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{u.display_name}</p>
                  <p className="text-xs font-mono text-muted-foreground">Nv. {u.level}</p>
                </div>
                <Button size="sm" onClick={() => handleSendRequest(u.user_id)}
                  className="h-8 bg-foreground text-background font-heading font-bold uppercase text-xs tracking-wider"
                  data-testid={`add-${u.user_id}`}>
                  <UserPlus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pending Received */}
      {friendsData.pending_received.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">Solicitacoes Recebidas</p>
          {friendsData.pending_received.map((f) => (
            <Card key={f.request_id} className="bg-card border-border border-l-2 border-l-foreground">
              <CardContent className="p-3 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={f.other_user?.picture} />
                  <AvatarFallback className="bg-secondary text-xs font-bold">
                    {(f.other_user?.display_name || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{f.other_user?.display_name}</p>
                  <p className="text-xs font-mono text-muted-foreground">Nv. {f.other_user?.level}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => handleRespond(f.request_id, "accept")}
                    className="h-8 bg-foreground text-background" data-testid={`accept-${f.request_id}`}>
                    <UserCheck className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRespond(f.request_id, "reject")}
                    className="h-8 border-border" data-testid={`reject-${f.request_id}`}>
                    <UserX className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pending Sent */}
      {friendsData.pending_sent.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">Enviadas</p>
          {friendsData.pending_sent.map((f) => (
            <Card key={f.request_id} className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={f.other_user?.picture} />
                  <AvatarFallback className="bg-secondary text-xs font-bold">?</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{f.other_user?.display_name}</p>
                </div>
                <Badge variant="secondary" className="text-xs font-mono">
                  <Clock className="h-3 w-3 mr-1" /> Pendente
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      {/* Friends List */}
      <div className="space-y-2">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">
          Amigos ({friendsData.accepted.length})
        </p>
        {friendsData.accepted.length > 0 ? (
          friendsData.accepted.map((f) => {
            const isRival = friendsData.rival_id === f.other_user?.user_id;
            return (
              <Card key={f.request_id} className={`bg-card border-border ${isRival ? "border-l-2 border-l-red-500" : ""}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={f.other_user?.picture} />
                    <AvatarFallback className="bg-secondary text-xs font-bold">
                      {(f.other_user?.display_name || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{f.other_user?.display_name}</p>
                      {isRival && <Badge className="bg-red-500/20 text-red-400 border-0 text-[10px] font-mono">Rival</Badge>}
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">
                      Nv. {f.other_user?.level} &middot; Streak {f.other_user?.streak}
                    </p>
                  </div>
                  {!isRival && (
                    <Button size="sm" variant="outline" onClick={() => handleSetRival(f.other_user?.user_id)}
                      className="h-8 border-border font-heading font-bold uppercase text-xs"
                      data-testid={`rival-${f.other_user?.user_id}`}>
                      <Swords className="h-3 w-3 mr-1" /> Rival
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-16 border border-border">
            <p className="text-sm text-muted-foreground">Nenhum amigo ainda</p>
            <p className="text-xs text-zinc-600 mt-1">Busque e adicione amigos acima</p>
          </div>
        )}
      </div>
    </div>
  );
}
