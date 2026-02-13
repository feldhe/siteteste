import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
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
          api.get("/rankings/global"), api.get("/rankings/streak"),
          api.get("/rankings/friends"), api.get("/rankings/clans"),
        ]);
        setGlobalRanking(g.data); setStreakRanking(s.data);
        setFriendsRanking(f.data); setClansRanking(c.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const getPosStyle = (pos) => {
    if (pos === 1) return "bg-gold/20 text-gold border-gold/30 neon-glow-strong";
    if (pos === 2) return "bg-silver/10 text-silver border-silver/20";
    if (pos === 3) return "bg-bronze/10 text-bronze border-bronze/20";
    return "bg-zinc-900/30 text-zinc-400 border-zinc-800";
  };

  const renderRow = (item, i, valueKey, valueLabel) => {
    const pos = item.position || i + 1;
    return (
      <div key={item.user_id || item.clan_id || i}
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all animate-slide-up ${
          pos <= 3 ? getPosStyle(pos) : "glass-card"
        }`}
        style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}
        data-testid={`rank-row-${i}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-stat font-bold text-sm ${
          pos === 1 ? "bg-gold/20 text-gold" : pos === 2 ? "bg-silver/10 text-silver" : pos === 3 ? "bg-bronze/10 text-bronze" : "bg-zinc-800 text-zinc-500"
        }`}>
          {pos}
        </div>
        <Avatar className="h-8 w-8">
          <AvatarImage src={item.picture || item.photo} />
          <AvatarFallback className="bg-neon-red/10 text-neon-red text-xs font-bold">
            {(item.display_name || item.name || "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.display_name || item.name}</p>
          {item.level !== undefined && <p className="text-[10px] font-mono text-zinc-600">Nv. {item.level}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-stat text-lg font-bold text-neon-red">{item[valueKey] || 0}</p>
          <p className="text-[9px] font-mono text-zinc-600 tracking-widest">{valueLabel}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5" data-testid="rankings-page">
      <div>
        <p className="text-xs font-mono text-zinc-600 tracking-widest">COMPETICAO</p>
        <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-wider text-white mt-1">RANKING</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="glass h-11 p-1 w-full grid grid-cols-4 rounded-xl border border-zinc-800/50" data-testid="ranking-tabs">
          <TabsTrigger value="global" className="rounded-lg font-heading font-bold text-[10px] sm:text-xs tracking-wider data-[state=active]:bg-neon-red/15 data-[state=active]:text-neon-red">
            <Trophy className="h-3 w-3 mr-1" /> Global
          </TabsTrigger>
          <TabsTrigger value="friends" className="rounded-lg font-heading font-bold text-[10px] sm:text-xs tracking-wider data-[state=active]:bg-neon-red/15 data-[state=active]:text-neon-red">
            <Users className="h-3 w-3 mr-1" /> Amigos
          </TabsTrigger>
          <TabsTrigger value="clans" className="rounded-lg font-heading font-bold text-[10px] sm:text-xs tracking-wider data-[state=active]:bg-neon-red/15 data-[state=active]:text-neon-red">
            <Shield className="h-3 w-3 mr-1" /> Clas
          </TabsTrigger>
          <TabsTrigger value="streak" className="rounded-lg font-heading font-bold text-[10px] sm:text-xs tracking-wider data-[state=active]:bg-neon-red/15 data-[state=active]:text-neon-red">
            <Flame className="h-3 w-3 mr-1" /> Streak
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center h-32 mt-4">
            <div className="w-6 h-6 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <TabsContent value="global" className="mt-4 space-y-2">
              <p className="text-[10px] font-mono text-zinc-700 mb-2">XP ganho hoje (reset 00:00 UTC-3)</p>
              {globalRanking.length > 0 ? globalRanking.map((item, i) => renderRow(item, i, "xp", "XP")) : <Empty text="Nenhum XP hoje" />}
            </TabsContent>
            <TabsContent value="friends" className="mt-4 space-y-2">
              {friendsRanking.length > 0 ? friendsRanking.map((item, i) => renderRow(item, i, "xp", "XP")) : <Empty text="Adicione amigos" />}
            </TabsContent>
            <TabsContent value="clans" className="mt-4 space-y-2">
              {clansRanking.length > 0 ? clansRanking.map((item, i) => renderRow(item, i, "total_xp", "XP Total")) : <Empty text="Nenhum cla" />}
            </TabsContent>
            <TabsContent value="streak" className="mt-4 space-y-2">
              {streakRanking.length > 0 ? streakRanking.map((item, i) => renderRow(item, i, "streak", "Dias")) : <Empty text="Nenhum streak" />}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function Empty({ text }) {
  return <div className="text-center py-16 glass-card"><p className="text-sm text-zinc-600">{text}</p></div>;
}
