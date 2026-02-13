import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { X, Zap } from "lucide-react";

const CITIES = [
  "Sao Paulo","Rio de Janeiro","Belo Horizonte","Brasilia","Salvador",
  "Fortaleza","Curitiba","Recife","Porto Alegre","Manaus",
  "Belem","Goiania","Guarulhos","Campinas","Sao Luis",
  "Maceio","Duque de Caxias","Natal","Campo Grande","Teresina",
  "Sao Bernardo do Campo","Joao Pessoa","Osasco","Santo Andre","Florianopolis",
  "Joinville","Londrina","Niteroi","Vitoria","Aracaju","Outra"
];

const GRADES = [
  "6o Ano","7o Ano","8o Ano","9o Ano",
  "1o Ano EM","2o Ano EM","3o Ano EM",
  "Cursinho","Faculdade"
];

const SUBJECTS_LIST = [
  "Matematica","Portugues","Fisica","Quimica","Biologia",
  "Historia","Geografia","Ingles","Espanhol","Filosofia",
  "Sociologia","Arte","Educacao Fisica","Redacao","Literatura",
  "Programacao","Economia"
];

export default function OnboardingPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleSubject = (s) => {
    setSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/onboarding", { display_name: displayName, city, school, grade, subjects });
      setUser(res.data);
      navigate("/dashboard");
    } catch (e) {
      setError(e.response?.data?.detail || "Erro ao completar cadastro");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return displayName.length >= 3;
    if (step === 2) return city && school && grade;
    if (step === 3) return subjects.length >= 1;
    return false;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative" data-testid="onboarding-page">
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,26,26,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,26,26,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="w-full max-w-lg space-y-8 relative z-10">
        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-neon-red neon-glow" : "bg-zinc-900"}`} />
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-mono text-zinc-600 tracking-widest">PASSO {step} DE 3</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-wider text-white">
            {step === 1 && "IDENTIDADE"}
            {step === 2 && "ESCOLA"}
            {step === 3 && "MATERIAS"}
          </h1>
        </div>

        {error && (
          <div className="p-3 glass-card border-red-500/30 text-red-400 text-sm" data-testid="onboarding-error">{error}</div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-slide-up" data-testid="onboarding-step-1">
            <div>
              <label className="text-xs font-mono text-zinc-600 tracking-widest mb-2 block">NOME DE EXIBICAO</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome unico..." maxLength={20} data-testid="display-name-input"
                className="bg-zinc-900/50 border-zinc-800 h-12 font-mono rounded-xl focus:border-neon-red/50 focus:ring-neon-red/20" />
              <p className="text-xs text-zinc-700 mt-1 font-mono">{displayName.length}/20</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-slide-up" data-testid="onboarding-step-2">
            <div>
              <label className="text-xs font-mono text-zinc-600 tracking-widest mb-2 block">CIDADE</label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 h-12 rounded-xl" data-testid="city-select">
                  <SelectValue placeholder="Selecione sua cidade" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {CITIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-mono text-zinc-600 tracking-widest mb-2 block">ESCOLA</label>
              <Input value={school} onChange={(e) => setSchool(e.target.value)}
                placeholder="Nome da sua escola..." data-testid="school-input"
                className="bg-zinc-900/50 border-zinc-800 h-12 font-mono rounded-xl focus:border-neon-red/50" />
            </div>
            <div>
              <label className="text-xs font-mono text-zinc-600 tracking-widest mb-2 block">ANO LETIVO</label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 h-12 rounded-xl" data-testid="grade-select">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {GRADES.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-slide-up" data-testid="onboarding-step-3">
            <p className="text-sm text-zinc-500">Selecione suas materias:</p>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS_LIST.map((s) => (
                <button key={s} onClick={() => toggleSubject(s)} data-testid={`subject-${s}`}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                    subjects.includes(s)
                      ? "bg-neon-red/15 text-neon-red border-neon-red/30 neon-border"
                      : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600"
                  }`}>
                  {s} {subjects.includes(s) && <X className="inline h-3 w-3 ml-1" />}
                </button>
              ))}
            </div>
            {subjects.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {subjects.map((s) => (
                  <Badge key={s} className="bg-neon-red/10 text-neon-red border-neon-red/20 text-xs font-mono">{s}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} data-testid="onboarding-back"
              className="flex-1 h-12 rounded-xl border border-zinc-800 text-zinc-400 font-heading font-bold text-sm tracking-wider hover:border-zinc-600 transition-colors">
              VOLTAR
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canProceed()} data-testid="onboarding-next"
              className="flex-1 h-12 rounded-xl bg-neon-red text-white font-heading font-bold text-sm tracking-wider neon-glow disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neon-red/90 transition-all">
              PROXIMO
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!canProceed() || loading} data-testid="onboarding-submit"
              className="flex-1 h-12 rounded-xl bg-neon-red text-white font-heading font-bold text-sm tracking-wider neon-glow disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neon-red/90 transition-all">
              {loading ? "SALVANDO..." : "COMECAR"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
