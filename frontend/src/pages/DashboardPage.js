import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
      try {
        const res = await api.get("/dashboard");
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent animate-spin" />
      </div>
    );
  }

  const levelInfo = data.level_info || {};
  const xpPercent = levelInfo.next_level_xp > 0
    ? (levelInfo.current_xp / levelInfo.next_level_xp) * 100 : 0;

  const getRankColor = (rank) => {
    const colors = { "Bronze": "text-bronze", "Prata": "text-silver", "Ouro": "text-gold", "Rubi": "text-ruby", "Platina Lendario": "text-platinum" };
    return colors[rank] || "text-foreground";
  };

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">Dashboard</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tight">
          Ola, {user?.display_name || user?.name}
        </h1>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* XP do dia */}
        <Card className="bg-card border-border" data-testid="today-xp-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">XP Hoje</span>
              <Zap className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="font-heading text-4xl font-black" data-testid="today-xp-value">{data.today_xp}</p>
          </CardContent>
        </Card>

        {/* Level */}
        <Card className="bg-card border-border" data-testid="level-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">Nivel</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="font-heading text-4xl font-black">{levelInfo.level}</p>
              <span className={`text-sm font-heading font-bold uppercase ${getRankColor(levelInfo.rank)}`}>
                {levelInfo.rank}
              </span>
            </div>
            <div className="mt-3 space-y-1">
              <Progress value={xpPercent} className="h-2 bg-secondary" data-testid="xp-progress-bar" />
              <p className="text-xs font-mono text-muted-foreground">
                {levelInfo.current_xp} / {levelInfo.next_level_xp} XP
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card className="bg-card border-border" data-testid="streak-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">Streak</span>
              <Flame className="h-4 w-4 text-orange-400" strokeWidth={1.5} />
            </div>
            <div className="flex items-baseline gap-1">
              <p className="font-heading text-4xl font-black">{data.streak}</p>
              <span className="text-sm text-muted-foreground">dias</span>
            </div>
            {data.streak >= 3 && (
              <Badge variant="secondary" className="mt-2 text-xs font-mono">
                +{data.streak >= 30 ? "50" : data.streak >= 7 ? "25" : "10"}% bonus
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Total XP */}
        <Card className="bg-card border-border" data-testid="total-xp-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">Total XP</span>
              <Trophy className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="font-heading text-4xl font-black" data-testid="total-xp-value">{data.total_xp}</p>
            <p className="text-xs text-muted-foreground mt-1">Ranking #{data.global_rank || "-"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Productivity Chart */}
        <Card className="bg-card border-border lg:col-span-2" data-testid="productivity-chart">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">
              Produtividade - 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.productivity_chart}>
                <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#121212', border: '1px solid #27272a', color: '#fafafa', fontSize: 12 }}
                  labelFormatter={(v) => `Data: ${v}`}
                />
                <Bar dataKey="xp" fill="#fafafa" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Missions */}
        <Card className="bg-card border-border" data-testid="missions-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">
              Missoes do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data.missions || []).map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 p-2 border border-border">
                <div className={`w-8 h-8 flex items-center justify-center ${m.completed ? "bg-foreground text-background" : "bg-secondary"}`}>
                  {m.completed ? <CheckCircle className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  <p className="text-xs font-mono text-muted-foreground">+{m.reward} XP</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Third row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Goals */}
        <Card className="bg-card border-border" data-testid="weekly-goals-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">
              Metas Semanais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.weekly_goals && (
              <>
                <GoalRow
                  label="XP"
                  current={data.weekly_goals.xp_progress}
                  target={data.weekly_goals.xp_goal}
                  icon={<Zap className="h-3 w-3" />}
                />
                <GoalRow
                  label="Minutos"
                  current={data.weekly_goals.minutes_progress}
                  target={data.weekly_goals.minutes_goal}
                  icon={<Clock className="h-3 w-3" />}
                />
                <GoalRow
                  label="Atividades"
                  current={data.weekly_goals.activities_progress}
                  target={data.weekly_goals.activities_goal}
                  icon={<CheckCircle className="h-3 w-3" />}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Activities */}
        <Card className="bg-card border-border" data-testid="pending-activities-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">
              Atividades Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data.pending_activities || []).slice(0, 5).map((a) => (
              <div key={a.activity_id} className="flex items-center gap-3 p-2 border border-border">
                <div className="w-2 h-2 bg-yellow-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-xs font-mono text-muted-foreground">{a.subject}</p>
                </div>
                <Badge variant="secondary" className="text-xs font-mono">
                  {"*".repeat(a.difficulty)}
                </Badge>
              </div>
            ))}
            {(data.pending_activities || []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade pendente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GoalRow({ label, current, target, icon }) {
  const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">{icon} {label}</span>
        <span className="text-xs font-mono">{current}/{target}</span>
      </div>
      <Progress value={percent} className="h-1.5 bg-secondary" />
    </div>
  );
}
