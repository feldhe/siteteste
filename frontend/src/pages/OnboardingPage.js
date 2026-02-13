import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { X } from "lucide-react";

const CITIES = [
  "Sao Paulo", "Rio de Janeiro", "Belo Horizonte", "Brasilia", "Salvador",
  "Fortaleza", "Curitiba", "Recife", "Porto Alegre", "Manaus",
  "Belem", "Goiania", "Guarulhos", "Campinas", "Sao Luis",
  "Maceio", "Duque de Caxias", "Natal", "Campo Grande", "Teresina",
  "Sao Bernardo do Campo", "Joao Pessoa", "Osasco", "Santo Andre", "Florianopolis",
  "Joinville", "Londrina", "Niteroi", "Vitoria", "Aracaju", "Outra"
];

const GRADES = [
  "6o Ano", "7o Ano", "8o Ano", "9o Ano",
  "1o Ano EM", "2o Ano EM", "3o Ano EM",
  "Cursinho", "Faculdade"
];

const SUBJECTS_LIST = [
  "Matematica", "Portugues", "Fisica", "Quimica", "Biologia",
  "Historia", "Geografia", "Ingles", "Espanhol", "Filosofia",
  "Sociologia", "Arte", "Educacao Fisica", "Redacao", "Literatura",
  "Programacao", "Economia"
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
      const res = await api.post("/onboarding", {
        display_name: displayName,
        city, school, grade, subjects,
      });
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4" data-testid="onboarding-page">
      <div className="w-full max-w-lg space-y-8">
        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 transition-colors ${s <= step ? "bg-foreground" : "bg-secondary"}`}
            />
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em]">
            Passo {step} de 3
          </p>
          <h1 className="font-heading text-4xl font-black uppercase tracking-tight">
            {step === 1 && "Identidade"}
            {step === 2 && "Escola"}
            {step === 3 && "Materias"}
          </h1>
        </div>

        {error && (
          <div className="p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm" data-testid="onboarding-error">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-slide-up" data-testid="onboarding-step-1">
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-2 block">
                Nome de Exibicao
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome unico..."
                maxLength={20}
                data-testid="display-name-input"
                className="bg-secondary/50 border-border h-12 font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">{displayName.length}/20 caracteres</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-slide-up" data-testid="onboarding-step-2">
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-2 block">
                Cidade
              </label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="bg-secondary/50 border-border h-12" data-testid="city-select">
                  <SelectValue placeholder="Selecione sua cidade" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-2 block">
                Escola
              </label>
              <Input
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Nome da sua escola..."
                data-testid="school-input"
                className="bg-secondary/50 border-border h-12 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-2 block">
                Ano Letivo
              </label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="bg-secondary/50 border-border h-12" data-testid="grade-select">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-slide-up" data-testid="onboarding-step-3">
            <p className="text-sm text-muted-foreground">Selecione suas materias iniciais:</p>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS_LIST.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSubject(s)}
                  data-testid={`subject-${s}`}
                  className={`px-3 py-1.5 text-sm font-medium border transition-colors ${
                    subjects.includes(s)
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/50"
                  }`}
                >
                  {s}
                  {subjects.includes(s) && <X className="inline h-3 w-3 ml-1" />}
                </button>
              ))}
            </div>
            {subjects.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {subjects.map((s) => (
                  <Badge key={s} variant="secondary" className="font-mono text-xs">{s}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1 h-12 font-heading font-bold uppercase tracking-wider border-2"
              data-testid="onboarding-back"
            >
              Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 h-12 bg-foreground text-background font-heading font-bold uppercase tracking-wider hover:bg-foreground/90"
              data-testid="onboarding-next"
            >
              Proximo
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="flex-1 h-12 bg-foreground text-background font-heading font-bold uppercase tracking-wider hover:bg-foreground/90"
              data-testid="onboarding-submit"
            >
              {loading ? "Salvando..." : "Comecar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
