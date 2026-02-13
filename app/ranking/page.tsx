export default function RankingPage() {
  return (
    <section>
      <h1>Ranking</h1>
      <div className="grid">
        <div className="card"><h3>Global diário (UTC-3)</h3><p>Reset às 00:00 e considera apenas XP do dia.</p></div>
        <div className="card"><h3>Amigos</h3><p>Link de convite, rival ativo e competição privada.</p></div>
        <div className="card"><h3>Clãs</h3><p>Ranking global por XP coletivo + ranking interno.</p></div>
        <div className="card"><h3>Maior streak 🔥</h3><p>Classificação por consistência contínua.</p></div>
      </div>
    </section>
  );
}
