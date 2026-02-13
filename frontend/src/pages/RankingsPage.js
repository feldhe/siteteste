import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Trophy, Flame, Shield, Users } from "lucide-react";

export default function RankingsPage() {
  const [globalRanking, setGlobalRanking] = useState([]);
  const [streakRanking, setStreakRanking] = useState([]);
  const [friendsRanking, setFriendsRanking] = useState([]);
  const [clansRanking, setClansRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("global");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [g, s, f, c] = await Promise.all([
          api.get("/rankings/global"),
          api.get("/rankings/streak"),
          api.get("/rankings/friends"),
          api.get("/rankings/clans"),
        ]);
        setGlobalRanking(g.data);
        setStreakRanking(s.data);
        setFriendsRanking(f.data);
        setClansRanking(c.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const getPosStyle = (pos) => {
    if (pos === 1) return "bg-gold text-black";
    if (pos === 2) return "bg-silver text-black";
    if (pos === 3) return "bg-bronze text-black";
    return "bg-secondary";
  };

  const renderUserRow = (item, i, valueKey, valueLabel) => (
    <div
      key={item.user_id || item.clan_id || i}
      className="flex items-center gap-4 p-3 border border-border hover:border-foreground/30 transition-colors animate-slide-up"
      style={{ animationDelay: `${i * 0.04}s` }}
      data-testid={`rank-row-${i}`}
    >
      <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 font-heading font-black text-sm ${getPosStyle(item.position || i + 1)}`}>
        {item.position || i + 1}
      </div>
      <Avatar className="h-8 w-8">
        <AvatarImage src={item.picture || item.photo} />
        <AvatarFallback className="bg-secondary text-xs font-bold">
          {(item.display_name || item.name || "?").charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.display_name || item.name}</p>
        {item.level !== undefined && (
          <p className="text-xs font-mono text-muted-foreground">Nv. {item.level}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-heading text-lg font-black">{item[valueKey] || 0}</p>
        <p className="text-[10px] font-mono text-muted-foreground uppercase">{valueLabel}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="rankings-page">
      <div className="space-y-1">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">Competicao</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tight">Ranking</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-secondary border border-border h-12 p-1 w-full grid grid-cols-4" data-testid="ranking-tabs">
          <TabsTrigger value="global" className="font-heading font-bold uppercase text-xs tracking-wider data-[state=active]:bg-foreground data-[state=active]:text-background">
            <Trophy className="h-3 w-3 mr-1.5" /> Global
          </TabsTrigger>
          <TabsTrigger value="friends" className="font-heading font-bold uppercase text-xs tracking-wider data-[state=active]:bg-foreground data-[state=active]:text-background">
            <Users className="h-3 w-3 mr-1.5" /> Amigos
          </TabsTrigger>
          <TabsTrigger value="clans" className="font-heading font-bold uppercase text-xs tracking-wider data-[state=active]:bg-foreground data-[state=active]:text-background">
            <Shield className="h-3 w-3 mr-1.5" /> Clas
          </TabsTrigger>
          <TabsTrigger value="streak" className="font-heading font-bold uppercase text-xs tracking-wider data-[state=active]:bg-foreground data-[state=active]:text-background">
            <Flame className="h-3 w-3 mr-1.5" /> Streak
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center h-32 mt-6">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            <TabsContent value="global" className="mt-4 space-y-2">
              <p className="text-xs font-mono text-muted-foreground mb-3">XP ganho hoje (reset 00:00 UTC-3)</p>
              {globalRanking.length > 0 ? (
                globalRanking.map((item, i) => renderUserRow(item, i, "xp", "XP"))
              ) : (
                <EmptyState text="Nenhum XP registrado hoje" />
              )}
            </TabsContent>

            <TabsContent value="friends" className="mt-4 space-y-2">
              {friendsRanking.length > 0 ? (
                friendsRanking.map((item, i) => renderUserRow(item, i, "xp", "XP"))
              ) : (
                <EmptyState text="Adicione amigos para ver o ranking" />
              )}
            </TabsContent>

            <TabsContent value="clans" className="mt-4 space-y-2">
              {clansRanking.length > 0 ? (
                clansRanking.map((item, i) => renderUserRow(item, i, "total_xp", "XP Total"))
              ) : (
                <EmptyState text="Nenhum cla criado ainda" />
              )}
            </TabsContent>

            <TabsContent value="streak" className="mt-4 space-y-2">
              {streakRanking.length > 0 ? (
                streakRanking.map((item, i) => renderUserRow(item, i, "streak", "Dias"))
              ) : (
                <EmptyState text="Nenhum streak registrado" />
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-16 border border-border">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
