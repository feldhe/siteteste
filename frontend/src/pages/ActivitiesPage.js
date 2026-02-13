import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Plus, CheckCircle, Trash2, Zap, Filter } from "lucide-react";
import { Toaster, toast } from "sonner";

const DIFFICULTIES = [
  { value: "1", label: "Muito Facil" },
  { value: "2", label: "Facil" },
  { value: "3", label: "Medio" },
  { value: "4", label: "Dificil" },
  { value: "5", label: "Muito Dificil" },
];

export default function ActivitiesPage() {
  const { user, refreshUser } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [levelUpInfo, setLevelUpInfo] = useState(null);

  // Create form
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSubject]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post("/activities", {
        title, subject, description,
        difficulty: parseInt(difficulty),
        estimated_time: parseInt(estimatedTime),
      });
      toast.success("Atividade criada!");
      setCreateOpen(false);
      setTitle(""); setSubject(undefined); setDescription(""); setDifficulty("3"); setEstimatedTime("30");
      fetchActivities();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao criar atividade");
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = async (activityId) => {
    try {
      const res = await api.post(`/activities/${activityId}/complete`);
      const data = res.data;
      toast.success(`+${data.xp_earned} XP!`);
      if (data.leveled_up) {
        setLevelUpInfo(data);
        setTimeout(() => setLevelUpInfo(null), 4000);
      }
      refreshUser();
      fetchActivities();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erro ao completar");
    }
  };

  const handleDelete = async (activityId) => {
    try {
      await api.delete(`/activities/${activityId}`);
      toast.success("Atividade removida");
      fetchActivities();
    } catch (e) {
      toast.error("Erro ao remover");
    }
  };

  const subjects = user?.subjects || [];

  return (
    <div className="space-y-6" data-testid="activities-page">
      <Toaster position="top-right" />

      {/* Level Up Modal */}
      {levelUpInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" data-testid="level-up-modal">
          <div className="text-center space-y-4 animate-level-up">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">Subiu de Nivel!</p>
            <p className="font-heading text-8xl font-black">{levelUpInfo.new_level}</p>
            <p className="font-heading text-xl font-bold uppercase text-gold">
              {levelUpInfo.level_info?.rank}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">Gerenciar</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tight">Atividades</h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-foreground text-background font-heading font-bold uppercase tracking-wider h-12 px-6 hover:bg-foreground/90 hover:-translate-y-0.5 transition-all" data-testid="create-activity-button">
              <Plus className="h-4 w-4 mr-2" /> Nova
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-md" aria-describedby="create-activity-desc" data-testid="create-activity-dialog">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl font-bold uppercase tracking-wider">
                Nova Atividade
              </DialogTitle>
              <p id="create-activity-desc" className="text-xs text-muted-foreground">Preencha os campos para criar</p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-1 block">Titulo</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Exercicios de Algebra"
                  className="bg-secondary/50 border-border h-10 font-mono" data-testid="activity-title-input" />
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-1 block">Materia</label>
                <Select value={subject || ""} onValueChange={(val) => setSubject(val)}>
                  <SelectTrigger className="bg-secondary/50 border-border h-10" data-testid="activity-subject-select">
                    <SelectValue placeholder="Selecione a materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-1 block">Descricao</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  className="bg-secondary/50 border-border font-mono text-sm" data-testid="activity-description-input" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-1 block">Dificuldade</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="bg-secondary/50 border-border h-10" data-testid="activity-difficulty-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-1 block">Tempo (min)</label>
                  <Input type="number" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)}
                    className="bg-secondary/50 border-border h-10 font-mono" data-testid="activity-time-input" />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={!title || !subject || creating}
                className="w-full h-12 bg-foreground text-background font-heading font-bold uppercase tracking-wider"
                data-testid="submit-activity-button">
                {creating ? "Criando..." : "Criar Atividade"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-secondary/50 border-border h-10" data-testid="filter-status">
            <Filter className="h-3 w-3 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="completed">Concluidas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-40 bg-secondary/50 border-border h-10" data-testid="filter-subject">
            <SelectValue placeholder="Materia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activities List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-foreground border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-3" data-testid="activities-list">
          {activities.map((a, i) => (
            <Card key={a.activity_id} className={`bg-card border-border transition-all hover:border-foreground/30 animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                  a.status === "completed" ? "bg-foreground text-background" : "bg-secondary"
                }`}>
                  {a.status === "completed" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="font-heading font-black text-sm">{a.difficulty}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium truncate ${a.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                      {a.title}
                    </p>
                    {a.xp_earned > 0 && (
                      <Badge variant="secondary" className="text-xs font-mono flex-shrink-0">
                        <Zap className="h-3 w-3 mr-0.5" /> {a.xp_earned}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-muted-foreground">{a.subject}</span>
                    <span className="text-xs text-zinc-600">|</span>
                    <span className="text-xs text-muted-foreground">{a.estimated_time}min</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {a.status === "pending" && (
                    <Button variant="ghost" size="icon" onClick={() => handleComplete(a.activity_id)}
                      className="hover:bg-foreground hover:text-background" data-testid={`complete-${a.activity_id}`}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(a.activity_id)}
                    className="hover:bg-destructive hover:text-destructive-foreground" data-testid={`delete-${a.activity_id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {activities.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">Nenhuma atividade encontrada</p>
              <p className="text-xs text-zinc-600 mt-1">Crie sua primeira atividade para comecar a ganhar XP</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
