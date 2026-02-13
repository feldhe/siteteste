# Study Arena — Plataforma web gamificada de produtividade estudantil

MVP em **Next.js + TypeScript** com arquitetura pronta para evoluir para produção escalável.

## Entregas principais

- **Autenticação gerenciada**: Google ativo e providers futuros (Discord e Apple) pré-definidos.
- **Onboarding obrigatório** com nome único, cidade, escola, ano letivo e matérias.
- **Perfil customizável gamer** com bio, banner, foto, moldura, cor e badge ativa.
- **Validação de redes sociais** (Instagram, X, TikTok, YouTube, LinkedIn e link custom).
- **Atividades com anti-fraude**: título único no dia, mínimo de caracteres, anti-spam e proteção de tempo.
- **XP reforçado**: 50–200+ baseados em duração e dificuldade, multiplicadores de streak e bônus de combo.
- **Level XP e Total XP** independentes.
- **Sistema de nível até 100** com tiers (Bronze → Platina Lendário).
- **Dashboard com métricas centrais**: XP do dia, nível, rankings, streak, missões e metas semanais.
- **Módulos de ranking, clã, matérias e perfil** já estruturados.

## Regras de gamificação implementadas

- Multiplicador de streak:
  - 3 dias: +10%
  - 7 dias: +25%
  - 30 dias: +50%
- Combo:
  - 3 atividades seguidas: bônus fixo.
  - Todas as atividades do dia: bônus extra.

## Escalabilidade sugerida (próximo passo)

- Banco relacional (PostgreSQL + Prisma) com índices para ranking diário e streak.
- Fila de eventos para XP/achievements (BullMQ/Kafka).
- Cache de ranking em Redis com reset diário UTC-3.
- Armazenamento de mídia em S3.
- WebSocket para animações em tempo real de ganho de XP e level-up.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.
