# Relatório de Desenvolvimento — Sprint 1

## Resumo

Sprint de infraestrutura base. Objetivo: criar toda a fundação técnica da aplicação de revisão espaçada antes de implementar qualquer funcionalidade de produto.

## O que foi implementado

### Projeto Next.js

- Next.js 16 com App Router, TypeScript estrito, Tailwind CSS e ESLint
- Estrutura `src/` com `app/`, `components/`, `lib/`, `server/`, `types/`
- Alias de importação `@/*` mapeado para `src/`

### Banco de dados

- PostgreSQL 16 via Docker Compose com volume persistente e healthcheck
- Prisma 7 configurado com `prisma.config.ts` e driver adapter `@prisma/adapter-pg`
- Migration inicial `20260517010211_init` aplicada com sucesso

### Schema Prisma

Quatro modelos criados com índices e relacionamentos:

- `User` — usuário com hash de senha
- `Deck` — deck vinculado ao usuário
- `Flashcard` — card com campos SM-2 (intervalDays, easeFactor, repetitions, nextReviewAt)
- `ReviewLog` — histórico completo de revisões

### Autenticação

- NextAuth.js v5 (beta) configurado com estratégia JWT e provider Credentials
- Route handler em `/api/auth/[...nextauth]`
- Types estendidos para incluir `id` na sessão

### Middleware de proteção de rotas

- Redireciona não-autenticados para `/login`
- Redireciona autenticados que acessam `/login` ou `/register` para `/dashboard`

### Utilitários

- `src/lib/prisma.ts` — singleton do PrismaClient com driver adapter pg
- `src/lib/env.ts` — validação de variáveis de ambiente com Zod
- `src/lib/validations.ts` — schemas Zod para register, login, deck e flashcard
- `src/lib/spaced-repetition.ts` — algoritmo SM-2 (Again / Hard / Good / Easy)
- `src/lib/auth.ts` — configuração central do NextAuth

### Qualidade de código

- Prettier configurado com `prettier-plugin-tailwindcss`
- ESLint ajustado com regras TypeScript
- Husky + lint-staged: roda ESLint e Prettier antes de cada commit

### Variáveis de ambiente

- `.env` — valores locais para desenvolvimento
- `.env.example` — template versionável sem secrets

## Estrutura de pastas

```
mj-study-english-app/
├── docker-compose.yml
├── prisma.config.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── 20260517010211_init/
│           └── migration.sql
├── src/
│   ├── middleware.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              ← redireciona para /login
│   │   └── api/
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── forms/
│   │   └── cards/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── env.ts
│   │   ├── validations.ts
│   │   └── spaced-repetition.ts
│   ├── server/
│   │   └── actions/
│   └── types/
│       └── next-auth.d.ts
├── .env
├── .env.example
├── .prettierrc
├── .prettierignore
└── eslint.config.mjs
```

## Comandos principais

### Subir o banco de dados

```bash
docker compose up -d
```

### Parar o banco de dados

```bash
docker compose down
```

### Rodar a aplicação em desenvolvimento

```bash
npm run dev
```

### Verificar tipos TypeScript

```bash
npx tsc --noEmit
```

### Formatar código

```bash
npm run format
```

### Lint

```bash
npm run lint
```

## Como executar migrations

```bash
# Criar nova migration após alterar o schema
npx prisma migrate dev --name <nome-da-migration>

# Aplicar migrations pendentes (produção)
npx prisma migrate deploy

# Visualizar banco no Prisma Studio
npm run db:studio
```

## Variáveis de ambiente necessárias

Copie `.env.example` para `.env` e preencha:

```env
DATABASE_URL="postgresql://studyapp:studyapp123@localhost:5432/studyapp_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-chave-secreta-forte"
POSTGRES_USER="studyapp"
POSTGRES_PASSWORD="studyapp123"
POSTGRES_DB="studyapp_db"
```

## Testes

Nenhum teste implementado nesta sprint (escopo de Sprint 1 é apenas infraestrutura). Testes serão adicionados nas sprints seguintes.

## Notas técnicas

- **Prisma 7**: quebra de compatibilidade — a URL de conexão saiu do `schema.prisma` e foi para `prisma.config.ts`. O PrismaClient em runtime usa o driver adapter `@prisma/adapter-pg`.
- **NextAuth v5**: ainda em beta, mas API estável o suficiente para uso com App Router e Server Actions.
- **Algoritmo SM-2**: implementado em `src/lib/spaced-repetition.ts` como função pura, sem dependências, facilmente testável.

## Próximos passos — Sprint 2

- Criar telas de `/login` e `/register` com React Hook Form + Zod
- Criar Server Actions para cadastro e login de usuário
- Implementar hash de senha com bcryptjs
- Criar layout base autenticado (sidebar/navbar)
- Criar página `/dashboard` com dados estáticos (placeholder)
- Criar testes unitários para o algoritmo de revisão espaçada
