# Relatório de Desenvolvimento — Sprint 12

**Feature:** Free Practice Mode  
**Data:** 2026-05-19

---

## Resumo do que foi implementado

Implementação completa do **Free Practice Mode**: permite que o usuário pratique flashcards quantas vezes quiser, independentemente do agendamento de revisão espaçada, sem nunca alterar os campos SM-2 dos cards (intervalDays, easeFactor, repetitions, nextReviewAt).

### Funcionalidades entregues

- **Seleção de filtro**: o usuário escolhe qual subconjunto de cards praticar — todos, novos (repetitions=0), difíceis (LEARNING/RELEARNING) ou vencidos hoje.
- **Contagens por filtro**: exibidas em tempo real na tela de seleção.
- **Sessão de prática**: layout idêntico à revisão diária — flip de card, áudio, atalhos de teclado (1-4 e Espaço/Enter).
- **Botões Again/Hard/Good/Easy**: registram apenas a auto-avaliação, sem tocar no agendamento oficial.
- **Encerrar sessão**: botão disponível a qualquer momento para terminar a prática antes de concluir todos os cards.
- **Resumo da sessão**: cards vistos, acertos, erros, taxa de acerto e tempo de prática.
- **Histórico separado**: registros em `practice_sessions` e `practice_reviews`, completamente separados de `review_logs`.
- **Cards embaralhados**: a cada sessão os cards são apresentados em ordem aleatória.
- **Navegação**: "Prática Livre" adicionado ao sidebar e ao menu mobile; botão "Praticar livremente" na página de detalhes do deck.
- **18 testes automatizados**: cobrindo stats computation e isolamento SM-2.

---

## Estrutura de pastas criada ou modificada

```
prisma/
  schema.prisma                          ← adicionados PracticeSession, PracticeReview + relations

src/
  lib/
    practice-stats.ts                    ← [NOVO] funções puras de estatísticas
  server/actions/
    practice-actions.ts                  ← [NOVO] server actions de prática livre
  components/
    practice/
      practice-page.tsx                  ← [NOVO] componente client (filtro + sessão + resumo)
  app/(auth)/
    practice/
      page.tsx                           ← [NOVO] página de seleção de deck para praticar
    decks/[deckId]/
      practice/
        page.tsx                         ← [NOVO] página de prática por deck
      page.tsx                           ← [MODIFICADO] adicionado botão "Praticar livremente"
  components/layout/
    sidebar.tsx                          ← [MODIFICADO] adicionado item "Prática Livre"
    mobile-header.tsx                    ← [MODIFICADO] adicionado item "Prática Livre"

tests/unit/
  practice-stats.test.ts                ← [NOVO] 12 testes de stats
  practice-isolation.test.ts            ← [NOVO] 6 testes de isolamento SM-2
```

---

## Principais comandos para rodar

```bash
# Instalar dependências
npm install

# Criar e aplicar a migration do banco
npx prisma migrate dev --name add_practice_mode

# Gerar o client Prisma
npx prisma generate

# Rodar em desenvolvimento
npm run dev
```

---

## Como executar migrations

```bash
# Migration automática (gera SQL + aplica)
npx prisma migrate dev --name add_practice_mode

# Apenas aplicar migrations existentes (produção)
npx prisma migrate deploy

# Inspecionar o banco via UI
npx prisma studio
```

---

## Como rodar os testes

```bash
# Todos os testes
npm test

# Apenas os novos testes do Free Practice Mode
npx vitest run tests/unit/practice-stats.test.ts tests/unit/practice-isolation.test.ts

# Modo watch
npm run test:watch
```

**Resultado:** 80 testes passando (inclui os 18 novos).

---

## Garantia de isolamento SM-2

O isolamento é garantido em dois níveis:

1. **Arquitetural**: `submitPracticeRating` nunca chama `prisma.flashcard.update`. Apenas cria um registro em `practice_reviews`.
2. **Automatizado**: `tests/unit/practice-isolation.test.ts` verifica explicitamente que `prisma.flashcard.update` **não é chamado** para todos os ratings (again/hard/good/easy).

---

## Rotas adicionadas

| Rota                       | Descrição                                             |
| -------------------------- | ----------------------------------------------------- |
| `/practice`                | Landing page — lista decks disponíveis para praticar  |
| `/decks/[deckId]/practice` | Página de prática por deck (filtro + sessão + resumo) |

---

## Modelos de banco adicionados

### `practice_sessions`

| Campo       | Tipo      | Descrição                           |
| ----------- | --------- | ----------------------------------- |
| id          | cuid      | PK                                  |
| user_id     | string    | FK → users                          |
| deck_id     | string    | FK → decks                          |
| filter      | string    | Filtro usado: all/new/difficult/due |
| total_cards | int       | Total de cards no início da sessão  |
| started_at  | DateTime  | Timestamp de início                 |
| ended_at    | DateTime? | Timestamp de encerramento           |

### `practice_reviews`

| Campo        | Tipo     | Descrição              |
| ------------ | -------- | ---------------------- |
| id           | cuid     | PK                     |
| session_id   | string   | FK → practice_sessions |
| flashcard_id | string   | FK → flashcards        |
| rating       | string   | again/hard/good/easy   |
| reviewed_at  | DateTime | Timestamp da avaliação |

---

## Próximos passos recomendados para a sprint seguinte

1. **Tags nos cards**: permitir filtrar prática por tag (requisito mencionado no prompt original).
2. **Cards favoritos**: marcar cards como favoritos e usá-los como filtro de prática.
3. **Histórico de práticas**: tela mostrando sessões anteriores com estatísticas.
4. **Estatísticas de prática no dashboard**: mostrar "Sessões de prática esta semana".
5. **Limitar cards por sessão**: opção de praticar apenas N cards por vez.
