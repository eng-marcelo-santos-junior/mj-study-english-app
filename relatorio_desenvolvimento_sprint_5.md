# Relatório de Desenvolvimento — Sprint 5

## Resumo

Sprint 5 implementou o sistema central de revisão espaçada (SM-2), entregando a funcionalidade principal da aplicação: o usuário pode revisar cards pendentes, ver as duas faces, avaliar com Again/Hard/Good/Easy e ter os intervalos recalculados automaticamente com persistência no banco.

---

## O que foi criado

### Server Actions

**`src/server/actions/review-actions.ts`**

| Função                          | Descrição                                                   |
| ------------------------------- | ----------------------------------------------------------- |
| `getDueCards(deckId)`           | Retorna cards com `nextReviewAt <= now`, ordenados por data |
| `submitRating(cardId, rating)`  | Executa SM-2, atualiza card e cria `ReviewLog` em transação |
| `getReviewedTodayCount(deckId)` | Conta revisões do dia para o deck (via ReviewLog)           |

A função `computeDifficulty` atualiza o campo `difficulty` do card:

- `again` em card maduro (interval ≥ 21d) → `RELEARNING`
- `again` em card novo → `LEARNING`
- interval ≥ 21d → `REVIEW`
- repetitions ≥ 1 → `LEARNING`
- caso contrário → `NEW`

### Componente de sessão

**`src/components/review/review-session.tsx`**

Client Component com a sessão completa de revisão:

- **`ReviewSession`** — componente principal com state machine: `index`, `revealed`, `exiting`, `stats`, `done`
- **`ProgressBar`** — barra de progresso animada (CSS transition)
- **`RatingButtons`** — botões Again/Hard/Good/Easy com dica de intervalo calculado via `calculateNextReview`
- **`ReviewSummary`** — tela final com taxa de retenção, breakdown por rating, ações de retorno

**Animações:**

- Card: `transition-all duration-300` com `scale-95 opacity-0` na saída
- Back reveal: `max-h-0 → max-h-96` com `opacity-0 → opacity-100`
- Progresso: `transition-all duration-500` na barra

**Performance:** `submitRating` e animação de saída correm em paralelo via `Promise.all([serverAction, delay(300ms)])` — UX responsiva sem bloquear na rede.

### Páginas

**`src/app/(auth)/decks/[deckId]/review/page.tsx`**

- Estado vazio: "Tudo em dia!" quando não há cards pendentes
- Estado com cards: renderiza `ReviewSession` com `max-w-xl` centrado

### Páginas atualizadas

**`src/app/(auth)/decks/[deckId]/page.tsx`**

- Botão "Revisar" agora é `Link` para `/review` quando `dueCount > 0`
- Botão desabilitado "Tudo em dia" (com ✓) quando `dueCount === 0`
- Stat "Revisados hoje" agora usa `getReviewedTodayCount` (dado real)

---

## Estrutura de pastas (Sprint 5)

```
src/
  server/actions/
    review-actions.ts        ← novo
  components/review/
    review-session.tsx        ← novo
  app/(auth)/decks/[deckId]/
    review/
      page.tsx               ← novo
    page.tsx                 ← atualizado (Revisar link, revisados hoje real)
```

---

## Rotas implementadas

| Rota                         | Descrição                                       |
| ---------------------------- | ----------------------------------------------- |
| `GET /decks/[deckId]/review` | Sessão de revisão (SM-2)                        |
| `POST` via Server Action     | `submitRating` — atualiza card + cria ReviewLog |

---

## Algoritmo SM-2 aplicado

| Rating | interval_days          | ease_factor         | repetitions |
| ------ | ---------------------- | ------------------- | ----------- |
| Again  | 1                      | max(ef - 0.2, 1.3)  | 0           |
| Hard   | max(1, interval × 1.2) | max(ef - 0.15, 1.3) | mantém      |
| Good   | 1 / 3 / interval×ef    | mantém              | +1          |
| Easy   | interval × ef × 1.3    | ef + 0.15           | +1          |

`next_review_at` é sempre `hoje + round(interval_days)` às 00:00.

---

## Como rodar

```bash
docker compose up -d
npm run dev
```

Acesse: http://localhost:3000

---

## Critérios de aceite alcançados

- [x] Cards pendentes são buscados corretamente (`nextReviewAt <= now`)
- [x] Usuário vê a frente do card primeiro
- [x] Revelar back com animação suave
- [x] Botões Again/Hard/Good/Easy com preview do próximo intervalo
- [x] Algoritmo SM-2 atualiza `intervalDays`, `easeFactor`, `repetitions`, `nextReviewAt`
- [x] Campo `difficulty` atualizado (NEW/LEARNING/REVIEW/RELEARNING)
- [x] Histórico persistido em `ReviewLog` via transação Prisma
- [x] Tela de resumo com taxa de retenção e breakdown por rating
- [x] "Revisados hoje" real no deck detail e dashboard
- [x] Botão "Revisar" navega para `/review`; desabilitado quando não há cards
- [x] TypeScript sem erros (`tsc --noEmit` limpo)

---

## Próximos passos recomendados (Sprint 6)

- **Revisão cruzada (todos os decks)**: rota `/review` global para revisar todos os cards pendentes de uma vez
- **Streak e gamificação**: contador de dias consecutivos, recordes
- **Filtros no deck**: ordenar por dificuldade, busca por texto no front/back
- **Importação de cards**: CSV upload para popular decks rapidamente
- **Modo escuro**: alternância light/dark com Tailwind
