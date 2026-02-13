import { computeActivityXP, validateTitle } from "@/lib/game-logic";

export default function AtividadesPage() {
  const validation = validateTitle("Lista 01 de função", ["Revisão de química"]);
  const xp = computeActivityXP({
    title: "Lista 01 de função",
    difficulty: "medio",
    startedAt: new Date("2026-01-01T19:00:00Z"),
    finishedAt: new Date("2026-01-01T20:10:00Z"),
    streakDays: 7,
    comboCount: 3,
    allDayCompleted: false
  });

  return (
    <section>
      <h1>Atividades</h1>
      <p className="muted">Título único por dia, checklist, upload de imagem e anti-fraude de tempo.</p>
      <div className="card">
        <h3>Exemplo de cálculo XP reforçado</h3>
        <p>Level XP ganho: {xp.levelXP}</p>
        <p>Total XP ganho: {xp.totalXP}</p>
        <p>Status de validação: {validation.length === 0 ? "OK" : validation.join(", ")}</p>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Filtros de busca</h3>
        <p className="badge">Concluídas</p> <p className="badge">Pendentes</p> <p className="badge">Antigas não feitas</p>
        <p className="badge">Por matéria</p> <p className="badge">Por data</p>
      </div>
    </section>
  );
}
