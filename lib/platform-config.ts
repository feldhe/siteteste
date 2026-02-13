export const supportedAuthProviders = [
  { id: "google", status: "active" },
  { id: "discord", status: "planned" },
  { id: "apple", status: "planned" }
] as const;

export const cityOptions = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Salvador"];
export const schoolYearOptions = ["9º ano", "1º EM", "2º EM", "3º EM", "Pré-vestibular", "Ensino Superior"];
export const subjectOptions = ["Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Linguagens"];

export const socialRegex: Record<string, RegExp> = {
  instagram: /^https:\/\/(www\.)?instagram\.com\/.+/i,
  x: /^https:\/\/(www\.)?(x\.com|twitter\.com)\/.+/i,
  tiktok: /^https:\/\/(www\.)?tiktok\.com\/.+/i,
  youtube: /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i,
  linkedin: /^https:\/\/(www\.)?linkedin\.com\/.+/i,
  custom: /^https:\/\/.+/i
};

export function isValidSocialUrl(type: keyof typeof socialRegex, url: string): boolean {
  return socialRegex[type].test(url);
}
