import { subjectOptions } from "@/lib/platform-config";

export default function MateriasPage() {
  return (
    <section>
      <h1>Matérias</h1>
      <div className="grid">
        {subjectOptions.map((subject) => (
          <div key={subject} className="card">
            <h3>{subject}</h3>
            <p className="muted">Histórico, progresso semanal e produtividade por disciplina.</p>
          </div>
        ))}
      </div>
    </section>
  );
}
