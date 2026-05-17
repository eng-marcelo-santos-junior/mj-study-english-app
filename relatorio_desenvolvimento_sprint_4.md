# Relatório de Desenvolvimento — Sprint 4

## Resumo

Sprint 4 implementou o CRUD completo de flashcards, permitindo ao usuário montar decks com cards completos. O usuário agora pode criar, visualizar, editar (inline) e excluir flashcards diretamente na tela do deck.

---

## O que foi criado

### Server Actions

- **`src/server/actions/flashcard-actions.ts`**
  - `createFlashcard(deckId, data)` — cria card e redireciona ao deck
  - `createFlashcardAndContinue(deckId, data)` — cria card e retorna sem redirecionar (para "salvar e adicionar outro")
  - `updateFlashcard(cardId, data)` — edita card existente com verificação de ownership
  - `deleteFlashcard(cardId)` — exclui card com revalidação do deck e dashboard
  - `getDeckFlashcards(deckId)` — lista cards do deck com verificação de ownership

### Componentes

- **`src/components/forms/flashcard-form.tsx`**
  - React Hook Form + Zod para validação de `front` e `back`
  - Suporte a `onSuccess`, `onCancel`, `submitLabel`
  - Botão "Salvar e adicionar outro" via `onAddAnother` (sem redirect, reseta o form)
  - Feedback visual de sucesso temporário após adicionar card

- **`src/components/cards/flashcard-card.tsx`**
  - Exibe frente/verso com flip ao clicar
  - Badge de dificuldade (Novo / Aprendendo / Revisão / Reaprendendo)
  - Edição inline: expande o `FlashcardForm` no lugar do card
  - Exclusão com `ConfirmModal`
  - Ações visíveis ao hover

### Páginas

- **`src/app/(auth)/decks/[deckId]/cards/new/page.tsx`**
  - Breadcrumb com nome do deck
  - `FlashcardForm` com ambas as ações (salvar / salvar e adicionar outro)
  - Ações criadas via `.bind(null, deckId)` (Server Components)

- **`src/app/(auth)/decks/[deckId]/page.tsx`** (atualizado)
  - Busca `flashcards` em paralelo com deck e dueCount
  - Botão "Adicionar card" ativo (link para `/cards/new`)
  - Estado vazio com CTA para adicionar primeiro card
  - Grid 2 colunas com `FlashcardCard` para cada card

---

## Estrutura de pastas (Sprint 4)

```
src/
  server/actions/
    flashcard-actions.ts     ← novo
  components/
    forms/
      flashcard-form.tsx     ← novo
    cards/
      flashcard-card.tsx     ← novo
  app/(auth)/decks/[deckId]/
    page.tsx                 ← atualizado
    cards/new/
      page.tsx               ← novo
```

---

## Rotas implementadas

| Rota                            | Descrição                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `GET /decks/[deckId]`           | Listagem de flashcards do deck                                                        |
| `GET /decks/[deckId]/cards/new` | Formulário de criação de card                                                         |
| `POST` via Server Action        | `createFlashcard`, `createFlashcardAndContinue`, `updateFlashcard`, `deleteFlashcard` |

---

## Como rodar

```bash
# Subir PostgreSQL
docker compose up -d

# Iniciar servidor
npm run dev
```

Acesse: http://localhost:3000

---

## Critérios de aceite alcançados

- [x] Usuário consegue criar flashcard em um deck
- [x] Usuário consegue criar múltiplos cards sem sair da página ("Salvar e adicionar outro")
- [x] Usuário consegue visualizar todos os cards do deck
- [x] Usuário consegue virar o card (frente/verso) com clique
- [x] Usuário consegue editar flashcard inline
- [x] Usuário consegue excluir flashcard com confirmação
- [x] Deck vazio mostra CTA para adicionar card
- [x] Ownership verificado em todas as operações (usuário só acessa seus próprios decks/cards)
- [x] TypeScript sem erros (`tsc --noEmit` limpo)

---

## Próximos passos recomendados (Sprint 5)

- **Sessão de revisão (SM-2)**: Interface de estudo com os ratings Again/Hard/Good/Easy
- Atualizar `intervalDays`, `easeFactor`, `repetitions`, `nextReviewAt` via `calculateNextReview`
- Contador "Revisados hoje" no dashboard e no deck detail
- Histórico de revisões (`ReviewLog`)
- Rota: `/decks/[deckId]/study`
