# CrimIA — Sistema de Investigação Criminal

Jogo investigativo web com personagens como agentes de IA independentes (Claude API).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + TypeScript + Vite + Tailwind + Zustand |
| Backend | Node.js + Express + TypeScript + Socket.io |
| Banco | PostgreSQL + Prisma |
| Cache | Redis |
| IA | Groq API (Llama 3.3 70B) — gratuito |
| Infra | Docker + docker-compose |

## Setup (Fase 1)

### 1. Obter API key gratuita (Groq)

1. Acesse [console.groq.com/keys](https://console.groq.com/keys)
2. Crie uma conta gratuita e gere uma API key

```bash
cp .env.example apps/backend/.env
# Edite apps/backend/.env e adicione sua GROQ_API_KEY
```

### 2. Subir infraestrutura

```bash
docker-compose up -d
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Rodar migration do banco

```bash
npm run db:migrate
```

### 5. Iniciar em desenvolvimento

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Prisma Studio: `npm run db:studio`

## Estrutura

```
crimIA/
├── apps/
│   ├── frontend/       # React + Vite
│   └── backend/        # Node + Express
│       └── cases/      # JSONs dos casos
├── packages/
│   └── shared-types/   # DTOs e interfaces
├── docker-compose.yml
└── .env.example
```

## Fases de Desenvolvimento

- [x] **Fase 1** — Setup & Fundação
- [ ] **Fase 2** — Motor de Casos
- [ ] **Fase 3** — Chat 1-a-1
- [ ] **Fase 4** — Locais & Pistas
- [ ] **Fase 5** — Discovery Graph
- [ ] **Fase 6** — Chat em Grupo
- [ ] **Fase 7** — Parceiro Detetive
- [ ] **Fase 8** — Avaliação Final
- [ ] **Fase 9** — Polimento & Deploy
# crimIA
