import { levelFromXP } from "@/lib/game-logic";

export default function Dashboard() {
  const dayXP = 420;
  const levelXP = 12650;
  const totalXP = 29500;
  const rank = 17;
  const friendRank = 2;
  const clanRank = 5;
  const streak = 14;
  const level = levelFromXP(levelXP);

  return (
    <section>
      <h1>Dashboard Principal</h1>
      <p className="muted">Foco em competição, identidade social e retenção anual.</p>

      <div className="grid" style={{ marginTop: 16 }}>
        <div className="card"><div className="muted">XP do dia</div><div className="metric">{dayXP}</div></div>
        <div className="card"><div className="muted">Level XP</div><div className="metric">{levelXP}</div></div>
        <div className="card"><div className="muted">Total XP</div><div className="metric">{totalXP}</div></div>
        <div className="card"><div className="muted">Streak 🔥</div><div className="metric">{streak} dias</div></div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Nível {level.level} • {level.tier}</h3>
        <div className="xpBar"><div className="xpFill" style={{ width: `${level.progress}%` }} /></div>
        <p className="muted">Desbloqueios a cada 5 níveis: molduras, cores, efeitos e customizações.</p>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <div className="card"><h3>Rankings</h3><p>Global: #{rank}</p><p>Amigos: #{friendRank}</p><p>Clã: #{clanRank}</p></div>
        <div className="card"><h3>Missões do dia</h3><p className="badge">3 atividades seguidas</p><p className="badge">+300 XP no dia</p></div>
        <div className="card"><h3>Meta semanal</h3><p>XP: 2100 / 3500</p><p>Minutos: 480 / 900</p><p>Atividades: 22 / 35</p></div>
      </div>
    </section>
  );
}
