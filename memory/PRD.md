# Shadow Scholar - PRD

## Problema Original
Plataforma web gamificada de produtividade estudantil com foco em competição, identidade social, economia interna baseada em XP e retenção anual.

## Arquitetura
- **Frontend**: React + TailwindCSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Auth**: Emergent Google OAuth

## User Personas
- Estudantes brasileiros (6º ano a Faculdade)
- Jovens competitivos que respondem a gamificação
- Focados em produtividade e crescimento

## Requisitos Core (Estáticos)
- Autenticação Google OAuth
- Onboarding obrigatório (nome, cidade, escola, ano, matérias)
- Sistema de Atividades com XP
- Sistema de XP dual (Level XP + Total XP)
- Sistema de Nível (até 100)
- Sistema de Streak
- Rankings (global, amigos, clãs, streak)
- Loja interna com Total XP
- Sistema de Amigos e Rivais
- Sistema de Clãs
- Badges/Conquistas
- Missões Diárias
- Metas Semanais
- Sistema Anti-Fraude
- Perfil customizável estilo gamer card

## Implementado (Feb 2026)
- [x] Google Auth (Emergent managed) + session management
- [x] Onboarding (nome único, cidade, escola, ano, matérias)
- [x] Dashboard Bento Grid (XP, nível, streak, gráfico, missões, metas, pendentes)
- [x] Activities CRUD + XP calculation (anti-fraud, streak multiplier, combo)
- [x] XP System dual (Level XP + Total XP independentes)
- [x] Level System (até 100: Bronze/Prata/Ouro/Rubi/Platina)
- [x] Streak System (multipliers: 3d=+10%, 7d=+25%, 30d=+50%)
- [x] Rankings (global diário, amigos, clãs, streak)
- [x] Loja Interna (15 itens por raridade)
- [x] Friends (busca, solicitações, rival)
- [x] Clãs (criar, entrar, sair, ranking)
- [x] Badges (9 conquistas automáticas)
- [x] Missões Diárias + Metas Semanais
- [x] Anti-Fraude (validação títulos, limites tempo, spam)
- [x] Perfil gamer card (banner, avatar, bio, redes sociais)
- [x] **DESIGN CYBERPUNK** - Preto + Vermelho Neon (#ff1a1a)
- [x] **Glassmorphism** em todos os cards (backdrop-blur + red tint)
- [x] **Mobile-First** com bottom nav (5 ícones)
- [x] **Timer de Estudo** com glow pulsante cyberpunk
- [x] **Microinterações CSS** (hover glow, XP fill animation, level up burst)
- [x] **XP Bar** com gradiente vermelho animado
- [x] Fontes: Orbitron (headings) + Rajdhani (stats) + Inter (body) + JetBrains Mono
- [x] Footer: "Autoral por Henrique Feldhaus – Desenvolvedor Junior"

## Backlog Priorizado
### P0 (Crítico)
- Nenhum bloqueante

### P1 (Alta Prioridade)
- Timer real de estudo (cronômetro start/stop)
- Upload de imagem em atividades
- Checklist funcional dentro de atividades
- Sistema de link de convite para amigos
- Notificações in-app

### P2 (Média Prioridade)
- Animação especial ao subir de nível (mais elaborada)
- Efeitos visuais compráveis na loja
- Eventos de clãs
- Preparar auth Discord e Apple
- Histórico detalhado por matéria
- Página de configurações

### P3 (Baixa Prioridade)
- PWA / Mobile optimization
- Sistema de temporadas/reset anual
- Compartilhamento em redes sociais
- Modo competição entre clãs

## Próximas Tarefas
1. Timer de estudo real com cronômetro
2. Upload de imagem
3. Checklist quadrado funcional
4. Link de convite para amigos
5. Melhorar animação de level up
