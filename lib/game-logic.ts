export type Difficulty = "facil" | "medio" | "dificil";

export interface ActivityInput {
  title: string;
  difficulty: Difficulty;
  startedAt: Date;
  finishedAt: Date;
  streakDays: number;
  comboCount: number;
  allDayCompleted: boolean;
}

const randomLikePattern = /(.)\1\1|asdf|qwer|1234|teste/i;

export function validateTitle(title: string, todayTitles: string[]): string[] {
  const errors: string[] = [];
  const normalized = title.trim().toLowerCase();

  if (normalized.length < 4) errors.push("Título deve ter no mínimo 4 caracteres.");
  if (todayTitles.map((t) => t.toLowerCase()).includes(normalized)) {
    errors.push("Título duplicado no mesmo dia.");
  }
  if (randomLikePattern.test(normalized)) {
    errors.push("Título detectado como spam/aleatório.");
  }

  return errors;
}

function streakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 1.5;
  if (streakDays >= 7) return 1.25;
  if (streakDays >= 3) return 1.1;
  return 1;
}

function difficultyMultiplier(difficulty: Difficulty): number {
  if (difficulty === "dificil") return 1.3;
  if (difficulty === "medio") return 1.15;
  return 1;
}

export function computeActivityXP(input: ActivityInput): { levelXP: number; totalXP: number } {
  const minutes = Math.max(1, (input.finishedAt.getTime() - input.startedAt.getTime()) / 60000);
  const timeFactor = Math.min(200, Math.max(50, Math.round(minutes * 2.2)));
  const base = timeFactor * difficultyMultiplier(input.difficulty) * streakMultiplier(input.streakDays);
  const combo = input.comboCount >= 3 ? 20 : 0;
  const allDayBonus = input.allDayCompleted ? 30 : 0;
  const xp = Math.round(base + combo + allDayBonus);

  return {
    levelXP: xp,
    totalXP: xp
  };
}

export function checkTimeFraud(startedAt: Date, finishedAt: Date): string | null {
  const duration = finishedAt.getTime() - startedAt.getTime();
  if (duration <= 0) return "Tempo inválido: fim antes do início.";
  if (duration > 8 * 60 * 60 * 1000) return "Tempo suspeito: acima do limite de 8h por atividade.";
  return null;
}

export function levelFromXP(levelXP: number): { level: number; tier: string; progress: number } {
  const level = Math.min(100, Math.floor(levelXP / 500) + 1);
  const nextLevelXP = level * 500;
  const currentLevelXP = (level - 1) * 500;
  const progress = Math.round(((levelXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100);

  const tier =
    level >= 100 ? "Platina Lendário" :
    level >= 75 ? "Rubi" :
    level >= 50 ? "Ouro" :
    level >= 25 ? "Prata" : "Bronze";

  return { level, tier, progress: Math.max(0, Math.min(100, progress)) };
}
