# 🏆 FanPulse — Plano de Sprints GitHub

> Coordenação técnica do projeto com controle de Sprints via GitHub Issues + Milestones.

---

## 📋 Labels

Crie as seguintes labels no repositório GitHub:

| Label | Cor | Descrição |
|-------|-----|-----------|
| `sprint-1` | `#0E8A16` | Sprint 1 — Fundação |
| `sprint-2` | `#1D76DB` | Sprint 2 — API Football |
| `sprint-3` | `#D93F0B` | Sprint 3 — Anti-Fraude |
| `sprint-4` | `#5319E7` | Sprint 4 — Deploy & Polish |
| `backend` | `#FBCA04` | Tarefas de backend |
| `frontend` | `#C2E0C6` | Tarefas de frontend |
| `anti-fraud` | `#B60205` | Sistema anti-fraude |
| `api-integration` | `#0075CA` | Integração API externa |
| `critical` | `#E11D48` | Prioridade crítica |
| `bug` | `#D73A4A` | Bug report |
| `enhancement` | `#A2EEEF` | Melhoria |
| `documentation` | `#0075CA` | Documentação |

---

## 🗓️ Milestones

### Sprint 1 — Fundação (Semana 1)
> Infraestrutura base: tipos, banco de dados, configuração

### Sprint 2 — API-Football (Semana 2)
> Integração completa com API esportiva externa

### Sprint 3 — Anti-Fraude & Votação (Semana 3)
> Motor anti-fraude e sistema de votação funcional

### Sprint 4 — Deploy & Polish (Semana 4)
> CI/CD, deploy na Vercel, otimizações finais

---

## 📌 Issues por Sprint

### Sprint 1 — Fundação

1. **[BACKEND] Definir tipos TypeScript do domínio** ✅
   - Labels: `sprint-1`, `backend`
   - Arquivo: `lib/types.ts`
   - Desc: Criar interfaces para Player, Vote, VoteCategory, User, AntiFraudResult

2. **[BACKEND] Configurar validação de variáveis de ambiente** ✅
   - Labels: `sprint-1`, `backend`
   - Arquivo: `lib/env.ts`
   - Desc: Validação com Zod, lazy loading para evitar erros em build time

3. **[BACKEND] Criar schema SQL do banco de dados** ✅
   - Labels: `sprint-1`, `backend`, `critical`
   - Arquivo: `lib/db/schema.ts`
   - Desc: Tables: users, players, vote_categories, votes. Includes UNIQUE constraint anti-fraude

4. **[BACKEND] Implementar cliente Neon Postgres** ✅
   - Labels: `sprint-1`, `backend`
   - Arquivo: `lib/db/client.ts`
   - Desc: Singleton com tagged template literals, query logging em dev

5. **[CONFIG] Criar .env.example e configurar .gitignore** ✅
   - Labels: `sprint-1`, `documentation`
   - Arquivos: `.env.example`, `.env.local`

---

### Sprint 2 — API-Football

6. **[API] Tipagem completa da API-Football v3** ✅
   - Labels: `sprint-2`, `api-integration`
   - Arquivo: `lib/api-football/types.ts`
   - Desc: Interfaces para Players, Fixtures, Standings, Squads

7. **[API] Sistema de cache 2 camadas (memory + Redis)** ✅
   - Labels: `sprint-2`, `api-integration`, `critical`
   - Arquivo: `lib/api-football/cache.ts`
   - Desc: In-memory (5min) → Upstash Redis (1h) → API call

8. **[API] Implementar APIFootballClient com retry** ✅
   - Labels: `sprint-2`, `api-integration`, `critical`
   - Arquivo: `lib/api-football/client.ts`
   - Desc: Retry exponencial, rate limit handling, cache-aside

9. **[API] Route Handler GET /api/players** ✅
   - Labels: `sprint-2`, `backend`
   - Arquivo: `app/api/players/route.ts`
   - Desc: Lista jogadores com votos, fallback API-Football

10. **[API] Route Handler GET /api/matches** ✅
    - Labels: `sprint-2`, `backend`
    - Arquivo: `app/api/matches/route.ts`
    - Desc: Jogos ao vivo e agendados com cache adaptativo

---

### Sprint 3 — Anti-Fraude & Votação

11. **[ANTI-FRAUD] Layer 1: Rate Limiter (sliding window)** ✅
    - Labels: `sprint-3`, `anti-fraud`, `critical`
    - Arquivo: `lib/anti-fraud/rate-limiter.ts`
    - Desc: 5 votos/min/IP via Redis sorted sets

12. **[ANTI-FRAUD] Layer 4: Fingerprint server-side** ✅
    - Labels: `sprint-3`, `anti-fraud`
    - Arquivo: `lib/anti-fraud/fingerprint.ts`
    - Desc: SHA-256 de IP + User-Agent + Accept-Language

13. **[ANTI-FRAUD] Motor Anti-Fraude (4 camadas)** ✅
    - Labels: `sprint-3`, `anti-fraud`, `critical`
    - Arquivo: `lib/anti-fraud/engine.ts`
    - Desc: Rate limit → User unique → IP throttle → Fingerprint

14. **[BACKEND] Route Handler POST/GET /api/vote** ✅
    - Labels: `sprint-3`, `backend`, `critical`
    - Arquivo: `app/api/vote/route.ts`
    - Desc: Votação com todas as camadas anti-fraude

15. **[BACKEND] Route Handler GET /api/ranking** ✅
    - Labels: `sprint-3`, `backend`
    - Arquivo: `app/api/ranking/route.ts`
    - Desc: RANK() window function + cache 60s

16. **[BACKEND] Route Handler GET /api/ranking/live** ✅
    - Labels: `sprint-3`, `backend`
    - Arquivo: `app/api/ranking/live/route.ts`
    - Desc: Contagem 24h + trending players

17. **[FRONTEND] Integrar botão Votar com API** 🔲
    - Labels: `sprint-3`, `frontend`
    - Desc: Conectar page.tsx e ranking/page.tsx com endpoints reais

---

### Sprint 4 — Deploy & Polish

18. **[AUTH] Route Handler POST /api/auth/login** ✅
    - Labels: `sprint-4`, `backend`
    - Arquivo: `app/api/auth/login/route.ts`
    - Desc: JWT via HttpOnly cookie, mensagem genérica (RF02)

19. **[AUTH] Route Handler POST /api/auth/register** ✅
    - Labels: `sprint-4`, `backend`
    - Arquivo: `app/api/auth/register/route.ts`
    - Desc: Validação CPF, bcrypt cost 12, auto-login

20. **[AUTH] Route Handler GET/DELETE /api/auth/me** ✅
    - Labels: `sprint-4`, `backend`
    - Arquivo: `app/api/auth/me/route.ts`
    - Desc: Session check + logout

21. **[DEPLOY] Configurar vercel.json** 🔲
    - Labels: `sprint-4`, `critical`
    - Arquivo: `vercel.json`
    - Desc: Region gru1, cron jobs

22. **[DEPLOY] GitHub Actions CI pipeline** 🔲
    - Labels: `sprint-4`
    - Arquivo: `.github/workflows/ci.yml`
    - Desc: lint + typecheck + build

23. **[DEPLOY] Cron job de sincronização de jogadores** 🔲
    - Labels: `sprint-4`, `api-integration`
    - Arquivo: `app/api/cron/sync-players/route.ts`

---

## 🔄 Workflow Git

```
main (produção)
  └── develop (staging)
       ├── feature/sprint-1-fundacao
       ├── feature/sprint-2-api-football
       ├── feature/sprint-3-anti-fraud
       └── feature/sprint-4-deploy
```

### Convenção de Commits
```
feat: nova funcionalidade
fix: correção de bug
refactor: refatoração sem mudança de comportamento
docs: documentação
chore: tarefas de manutenção
```

### Pull Request Template
- Descrição da mudança
- Issue(s) relacionada(s)
- Checklist: testes, lint, type-check
- Screenshots (se UI)
