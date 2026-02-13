import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Plus, CheckCircle, Trash2, Zap, Filter, Play, Square, Clock } from "lucide-react";
import { Toaster, toast } from "sonner";

const DIFFICULTIES = [
  { value: "1", label: "Muito Facil" },
  { value: "2", label: "Facil" },
  { value: "3", label: "Medio" },
  { value: "4", label: "Dificil" },
  { value: "5", label: "Muito Dificil" },
];

function StudyTimer({ activity, onStop }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const start = () => {
    setRunning(true);
    startTimeRef.current = new Date().toISOString();
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stop = async () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    const endTime = new Date().toISOString();
    if (activity && startTimeRef.current) {
      try {
        await api.put(`/activities/${activity.activity_id}`, {
          actual_time_start: startTimeRef.current,
          actual_time_end: endTime,
        });
        if (onStop) onStop();
      } catch (e) { console.error(e); }
    }
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="glass-strong p-5 text-center" data-testid="study-timer">
      <p className="text-xs font-mono text-zinc-600 tracking-widest mb-3">TIMER DE ESTUDO</p>
      <div className={`inline-flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40 rounded-full border-2 transition-all duration-500 ${
        running ? "border-neon-red/50 animate-timer-pulse" : "border-zinc-800"
      }`}>
        <span className={`font-stat text-4xl sm:text-5xl font-bold ${running ? "text-neon-red neon-text" : "text-zinc-400"}`}>
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </span>
      </div>
      {activity && <p className="text-xs text-zinc-500 mt-3 truncate">{activity.title}</p>}
      <div className="flex gap-3 justify-center mt-4">
        {!running ? (
          <button onClick={start} disabled={!activity} data-testid="timer-start"
            className="h-12 px-8 rounded-xl bg-neon-red text-white font-heading font-bold text-sm tracking-wider neon-glow disabled:opacity-30 hover:bg-neon-red/90 transition-all flex items-center gap-2">
            <Play className="h-4 w-4" /> START
          </button>
        ) : (
          <button onClick={stop} data-testid="timer-stop"
            className="h-12 px-8 rounded-xl bg-zinc-800 border border-red-500/30 text-red-400 font-heading font-bold text-sm tracking-wider hover:bg-red-500/10 transition-all flex items-center gap-2">
            <Square className="h-4 w-4" /> STOP
          </button>
        )}
      </div>
    </div>
  );
}

export default function ActivitiesPage() {
  const { user, refreshUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [timerActivity, setTimerActivity] = useState(null);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(undefined);
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("3");
  const [estimatedTime, setEstimatedTime] = useState("30");
  const [creating, setCreating] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterSubject !== "all") params.subject = filterSubject;
      const res = await api.get("/activities", { params });
      setActivities(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterStatus, filterSubject]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post("/activities", { title, subject, description, difficulty: parseInt(difficulty), estimated_time: parseInt(estimatedTime) });
      toast.success("Atividade criada!");
      setCreateOpen(false);
      setTitle(""); setSubject(undefined); setDescription(""); setDifficulty("3"); setEstimatedTime("30");
      fetchActivities();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao criar");
    } finally { setCreating(false); }
  };

  const handleComplete = async (activityId) => {
    try {
      const res = await api.post(`/activities/${activityId}/complete`);
      const d = res.data;
      toast.success(`+${d.xp_earned} XP!`);
      if (d.leveled_up) { setLevelUpInfo(d); setTimeout(() => setLevelUpInfo(null), 4000); }
      refreshUser();
      fetchActivities();
      if (timerActivity?.activity_id === activityId) setTimerActivity(null);
    } catch (e) { toast.error(e.response?.data?.detail || "Erro"); }
  };

  const handleDelete = async (activityId) => {
    try { await api.delete(`/activities/${activityId}`); toast.success("Removida"); fetchActivities(); }
    catch (e) { toast.error("Erro"); }
  };

  const subjects = user?.subjects || [];

  return (
    <div className="space-y-5" data-testid="activities-page">
      <Toaster position="top-center" toastOptions={{ style: { background: 'rgba(15,3,3,0.9)', border: '1px solid rgba(255,26,26,0.2)', color: '#f2f2f2', backdropFilter: 'blur(10px)' }}} />

      {/* Level Up */}
      {levelUpInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90" data-testid="level-up-modal" onClick={() => setLevelUpInfo(null)}>
          <div className="text-center animate-level-up">
            <p className="text-xs font-mono text-neon-red tracking-widest mb-2">SUBIU DE NIVEL!</p>
            <p className="font-stat text-8xl sm:text-9xl font-bold text-white neon-text">{levelUpInfo.new_level}</p>
            <p className={`font-heading text-lg font-bold tracking-wider mt-2 ${
              levelUpInfo.level_info?.rank === "Ouro" ? "text-gold" : levelUpInfo.level_info?.rank === "Prata" ? "text-silver" : "text-neon-red"
            }`}>{levelUpInfo.level_info?.rank}</p>
            <div className="w-24 h-24 mx-auto mt-4 rounded-full border-2 border-neon-red/30 animate-neon-pulse" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono text-zinc-600 tracking-widest">GERENCIAR</p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-wider text-white mt-1">ATIVIDADES</h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <button className="h-10 sm:h-11 px-5 rounded-xl bg-neon-red text-white font-heading font-bold text-xs tracking-wider neon-glow hover:bg-neon-red/90 transition-all flex items-center gap-2" data-testid="create-activity-button">
              <Plus className="h-4 w-4" /> NOVA
            </button>
          </DialogTrigger>
          <DialogContent className="glass border-red-500/10 max-w-md mx-4 rounded-2xl" aria-describedby="create-desc" data-testid="create-activity-dialog">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg font-bold tracking-wider text-neon-red">NOVA ATIVIDADE</DialogTitle>
              <p id="create-desc" className="text-xs text-zinc-600">Preencha para criar</p>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-zinc-600 tracking-widest mb-1 block">TITULO</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Exercicios de Algebra"
                  className="bg-black/50 border-zinc-800 h-10 font-mono text-sm rounded-xl focus:border-neon-red/50 focus:ring-neon-red/20" data-testid="activity-title-input" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-600 tracking-widest mb-1 block">MATERIA</label>
                <Select value={subject || ""} onValueChange={(val) => setSubject(val)}>
                  <SelectTrigger className="bg-black/50 border-zinc-800 h-10 rounded-xl" data-testid="activity-subject-select">
                    <SelectValue placeholder="Selecione a materia" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl">
                    {subjects.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-600 tracking-widest mb-1 block">DESCRICAO</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  className="bg-black/50 border-zinc-800 font-mono text-sm rounded-xl" rows={2} data-testid="activity-description-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-zinc-600 tracking-widest mb-1 block">DIFICULDADE</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="bg-black/50 border-zinc-800 h-10 rounded-xl" data-testid="activity-difficulty-select"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl">
                      {DIFFICULTIES.map((d) => (<SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-600 tracking-widest mb-1 block">TEMPO (MIN)</label>
                  <Input type="number" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)}
                    className="bg-black/50 border-zinc-800 h-10 font-mono rounded-xl" data-testid="activity-time-input" />
                </div>
              </div>
              <button onClick={handleCreate} disabled={!title || !subject || creating} data-testid="submit-activity-button"
                className="w-full h-11 rounded-xl bg-neon-red text-white font-heading font-bold text-sm tracking-wider neon-glow disabled:opacity-30 hover:bg-neon-red/90 transition-all">
                {creating ? "CRIANDO..." : "CRIAR ATIVIDADE"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timer */}
      <StudyTimer activity={timerActivity} onStop={fetchActivities} />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 bg-black/50 border-zinc-800 h-9 rounded-xl text-xs" data-testid="filter-status">
            <Filter className="h-3 w-3 mr-1.5 text-zinc-500" /><SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="completed">Concluidas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-36 bg-black/50 border-zinc-800 h-9 rounded-xl text-xs" data-testid="filter-subject">
            <SelectValue placeholder="Materia" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 rounded-xl">
            <SelectItem value="all">Todas</SelectItem>
            {subjects.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2" data-testid="activities-list">
          {activities.map((a, i) => (
            <div key={a.activity_id}
              className={`glass-card p-3 sm:p-4 flex items-center gap-3 animate-slide-up stagger-${Math.min(i + 1, 6)} ${
                a.status === "completed" ? "border-neon-red/15" : ""
              }`}>
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                a.status === "completed" ? "bg-neon-red/15 text-neon-red" : "bg-zinc-800/60 text-zinc-400"
              }`}>
                {a.status === "completed" ? <CheckCircle className="h-4 w-4" /> : <span className="font-stat font-bold text-sm">{a.difficulty}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium truncate ${a.status === "completed" ? "line-through text-zinc-500" : ""}`}>{a.title}</p>
                  {a.xp_earned > 0 && (
                    <Badge className="bg-neon-red/10 text-neon-red border-neon-red/20 text-[10px] font-mono flex-shrink-0">
                      <Zap className="h-2.5 w-2.5 mr-0.5" />{a.xp_earned}
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] font-mono text-zinc-600 mt-0.5">{a.subject} &middot; {a.estimated_time}min</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {a.status === "pending" && (
                  <>
                    <button onClick={() => setTimerActivity(a)} data-testid={`timer-${a.activity_id}`}
                      className="p-2 rounded-lg hover:bg-neon-red/10 text-zinc-500 hover:text-neon-red transition-colors">
                      <Clock className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleComplete(a.activity_id)} data-testid={`complete-${a.activity_id}`}
                      className="p-2 rounded-lg hover:bg-neon-red/10 text-zinc-500 hover:text-neon-red transition-colors">
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button onClick={() => handleDelete(a.activity_id)} data-testid={`delete-${a.activity_id}`}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center py-16 glass-card">
              <p className="text-zinc-500 text-sm">Nenhuma atividade</p>
              <p className="text-zinc-700 text-xs mt-1">Crie sua primeira para ganhar XP</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
