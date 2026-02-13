import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Flame, Zap, Trophy, Target, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try { const res = await api.get("/dashboard"); setData(res.data); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const levelInfo = data.level_info || {};
  const xpPercent = levelInfo.next_level_xp > 0 ? (levelInfo.current_xp / levelInfo.next_level_xp) * 100 : 0;
  const getRankColor = (rank) => {
    const c = { "Bronze": "text-bronze", "Prata": "text-silver", "Ouro": "text-gold", "Rubi": "text-ruby", "Platina Lendario": "text-platinum" };
    return c[rank] || "text-neon-red";
  };

  return (
    <div className="space-y-5" data-testid="dashboard-page">
      {/* Header */}
      <div>
        <p className="text-xs font-mono text-zinc-600 tracking-widest">DASHBOARD</p>
        <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-wider text-white mt-1">
          OLA, <span className="text-neon-red neon-text">{(user?.display_name || user?.name || "").toUpperCase()}</span>
        </h1>
      </div>

      {/* ── Level Card (Hero) ── */}
      <div className="glass-strong p-5 sm:p-6 neon-glow" data-testid="level-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-mono text-zinc-500 tracking-widest">NIVEL</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-stat text-5xl sm:text-6xl font-bold text-white">{levelInfo.level}</span>
              <span className={`font-heading text-sm font-bold tracking-wider ${getRankColor(levelInfo.rank)}`}>
                {levelInfo.rank}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono text-zinc-500 tracking-widest">TOTAL XP</p>
            <p className="font-stat text-3xl font-bold text-neon-red neon-text mt-1" data-testid="total-xp-value">{data.total_xp}</p>
          </div>
        </div>
        <div className="xp-bar-track h-3">
          <div className="xp-bar-fill h-full animate-xp-fill" style={{ width: `${xpPercent}%` }} data-testid="xp-progress-bar" />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-mono text-zinc-600">{levelInfo.current_xp} XP</span>
          <span className="text-[10px] font-mono text-zinc-600">{levelInfo.next_level_xp} XP</span>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center" data-testid="today-xp-card">
          <Zap className="h-4 w-4 text-neon-red mx-auto mb-1" strokeWidth={1.5} />
          <p className="font-stat text-2xl font-bold text-white" data-testid="today-xp-value">{data.today_xp}</p>
          <p className="text-[9px] font-mono text-zinc-600 tracking-widest">XP HOJE</p>
        </div>
        <div className="glass-card p-4 text-center" data-testid="streak-card">
          <Flame className="h-4 w-4 text-orange-500 mx-auto mb-1" strokeWidth={1.5} />
          <p className="font-stat text-2xl font-bold text-white">{data.streak}</p>
          <p className="text-[9px] font-mono text-zinc-600 tracking-widest">STREAK</p>
          {data.streak >= 3 && (
            <Badge className="mt-1 bg-orange-500/10 text-orange-400 border-orange-500/20 text-[9px] font-mono">
              +{data.streak >= 30 ? "50" : data.streak >= 7 ? "25" : "10"}%
            </Badge>
          )}
        </div>
        <div className="glass-card p-4 text-center" data-testid="rank-card">
          <Trophy className="h-4 w-4 text-gold mx-auto mb-1" strokeWidth={1.5} />
          <p className="font-stat text-2xl font-bold text-white">#{data.global_rank || "-"}</p>
          <p className="text-[9px] font-mono text-zinc-600 tracking-widest">RANKING</p>
        </div>
      </div>

      {/* ── Chart + Missions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Productivity Chart */}
        <div className="glass-card p-4 lg:col-span-3" data-testid="productivity-chart">
          <p className="text-xs font-mono text-zinc-600 tracking-widest mb-3">PRODUTIVIDADE - 7 DIAS</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.productivity_chart}>
              <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: 'rgba(15,3,3,0.9)', border: '1px solid rgba(255,26,26,0.2)', borderRadius: '12px', color: '#f2f2f2', fontSize: 11, backdropFilter: 'blur(10px)' }} />
              <Bar dataKey="xp" fill="#ff1a1a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Missions */}
        <div className="glass-card p-4 lg:col-span-2" data-testid="missions-card">
          <p className="text-xs font-mono text-zinc-600 tracking-widest mb-3">MISSOES DO DIA</p>
          <div className="space-y-2">
            {(data.missions || []).map((m) => (
              <div key={m.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                m.completed ? "bg-neon-red/8 border-neon-red/20" : "bg-zinc-900/30 border-zinc-800/50"
              }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  m.completed ? "bg-neon-red/20 text-neon-red" : "bg-zinc-800 text-zinc-500"
                }`}>
                  {m.completed ? <CheckCircle className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{m.title}</p>
                  <p className="text-[10px] font-mono text-neon-red/60">+{m.reward} XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Weekly Goals + Pending ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4" data-testid="weekly-goals-card">
          <p className="text-xs font-mono text-zinc-600 tracking-widest mb-4">METAS SEMANAIS</p>
          {data.weekly_goals && (
            <div className="space-y-4">
              <GoalRow label="XP" current={data.weekly_goals.xp_progress} target={data.weekly_goals.xp_goal} icon={<Zap className="h-3 w-3 text-neon-red" />} />
              <GoalRow label="Minutos" current={data.weekly_goals.minutes_progress} target={data.weekly_goals.minutes_goal} icon={<Clock className="h-3 w-3 text-neon-red" />} />
              <GoalRow label="Atividades" current={data.weekly_goals.activities_progress} target={data.weekly_goals.activities_goal} icon={<CheckCircle className="h-3 w-3 text-neon-red" />} />
            </div>
          )}
        </div>

        <div className="glass-card p-4" data-testid="pending-activities-card">
          <p className="text-xs font-mono text-zinc-600 tracking-widest mb-3">ATIVIDADES PENDENTES</p>
          <div className="space-y-2">
            {(data.pending_activities || []).slice(0, 5).map((a) => (
              <div key={a.activity_id} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                <div className="w-1.5 h-8 rounded-full bg-yellow-500/60" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{a.title}</p>
                  <p className="text-[10px] font-mono text-zinc-600">{a.subject}</p>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">{"*".repeat(a.difficulty)}</span>
              </div>
            ))}
            {(data.pending_activities || []).length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-6">Nenhuma pendente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalRow({ label, current, target, icon }) {
  const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-zinc-400">{icon} {label}</span>
        <span className="text-[10px] font-mono text-zinc-500">{current}/{target}</span>
      </div>
      <div className="xp-bar-track h-1.5">
        <div className="xp-bar-fill h-full" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
