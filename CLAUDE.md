Você é um engenheiro de software sênior especialista em aplicações web, arquitetura full stack, Next.js, TypeScript, PostgreSQL e boas práticas de produto.

Desenvolva uma aplicação web de revisão espaçada, semelhante ao Anki, usando:

- Next.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Tailwind CSS
- NextAuth.js ou Auth.js para autenticação
- Zod para validação
- React Hook Form para formulários

# Objetivo da aplicação

Criar uma ferramenta web para estudo com flashcards e revisão espaçada.

A aplicação deve permitir que usuários criem decks, criem flashcards, revisem cards diariamente e acompanhem seu progresso.

# Requisito principal

A primeira página da aplicação deve ser uma tela de autenticação.

O usuário não autenticado deve ser redirecionado para `/login`.

Após login, o usuário deve ser redirecionado para `/dashboard`.

# Funcionalidades obrigatórias

## 1. Autenticação

Implementar:

- tela de login
- tela de cadastro
- logout
- proteção de rotas privadas
- sessão do usuário
- hash seguro de senha
- validação de formulário

Rotas:

- `/login`
- `/register`
- `/dashboard`

## 2. Dashboard

Criar uma página inicial após login contendo:

- total de decks
- total de cards
- cards pendentes para revisar hoje
- cards revisados hoje
- botão para criar novo deck
- lista dos decks do usuário

## 3. Decks

O usuário deve conseguir:

- criar deck
- listar decks
- editar deck
- excluir deck
- acessar detalhes de um deck

Campos do deck:

- id
- user_id
- name
- description
- created_at
- updated_at

## 4. Flashcards

O usuário deve conseguir:

- criar flashcard
- listar flashcards por deck
- editar flashcard
- excluir flashcard

Campos do flashcard:

- id
- deck_id
- front
- back
- difficulty
- interval_days
- ease_factor
- repetitions
- next_review_at
- created_at
- updated_at

## 5. Revisão espaçada

Implementar uma tela de revisão:

Rota:

- `/decks/[deckId]/review`

Fluxo:

1. Buscar cards do deck cujo `next_review_at` seja menor ou igual à data atual.
2. Mostrar a frente do card.
3. Permitir revelar a resposta.
4. Depois de revelar, mostrar botões:

- Again
- Hard
- Good
- Easy

5. Atualizar os dados do card conforme a resposta do usuário.
6. Avançar para o próximo card.
7. Ao finalizar, mostrar resumo da sessão.

## Algoritmo inicial de revisão espaçada

Use uma versão simplificada do SM-2.

Regras:

- Again:
  - interval_days = 1
  - ease_factor = max(ease_factor - 0.2, 1.3)
  - repetitions = 0

- Hard:
  - interval_days = max(1, interval_days \* 1.2)
  - ease_factor = max(ease_factor - 0.15, 1.3)

- Good:
  - se repetitions == 0, interval_days = 1
  - se repetitions == 1, interval_days = 3
  - se repetitions >= 2, interval_days = interval_days \* ease_factor
  - ease_factor permanece igual
  - repetitions += 1

- Easy:
  - interval_days = interval_days _ ease_factor _ 1.3
  - ease_factor = ease_factor + 0.15
  - repetitions += 1

Sempre atualizar:

- next_review_at
- updated_at

## 6. Banco de dados

Use PostgreSQL com Prisma.

Criar modelos:

- User
- Deck
- Flashcard
- ReviewLog

### Modelo User

Campos:

- id
- name
- email
- password_hash
- created_at
- updated_at

### Modelo Deck

Campos:

- id
- user_id
- name
- description
- created_at
- updated_at

Relacionamento:

- um usuário possui muitos decks

### Modelo Flashcard

Campos:

- id
- deck_id
- front
- back
- difficulty
- interval_days
- ease_factor
- repetitions
- next_review_at
- created_at
- updated_at

Relacionamento:

- um deck possui muitos flashcards

### Modelo ReviewLog

Campos:

- id
- flashcard_id
- user_id
- rating
- reviewed_at
- previous_interval_days
- new_interval_days
- previous_ease_factor
- new_ease_factor

Objetivo:

Registrar histórico das revisões.

## 7. Interface

Criar uma interface moderna, limpa e responsiva.

Requisitos de UI:

- layout responsivo
- sidebar ou navbar após login
- design simples e minimalista
- componentes reutilizáveis
- mensagens de erro claras
- estados de loading
- estados vazios

## 8. Estrutura sugerida do projeto

Use App Router do Next.js.

Estrutura:

```
src/
  app/
    login/
    register/
    dashboard/
    decks/
      page.tsx
      new/
      [deckId]/
        page.tsx
        edit/
        review/
  components/
    ui/
    layout/
    forms/
    cards/
  lib/
    auth.ts
    prisma.ts
    validations.ts
    spaced-repetition.ts
  server/
    actions/
      auth-actions.ts
      deck-actions.ts
      flashcard-actions.ts
      review-actions.ts
  prisma/
    schema.prisma
```

## 9. Boas práticas obrigatórias

O código deve seguir:

- TypeScript estrito
- separação clara de responsabilidades
- validação com Zod
- uso de Server Actions quando fizer sentido
- tratamento de erros
- autenticação segura
- proteção contra acesso indevido aos dados de outros usuários
- componentes reutilizáveis
- código limpo
- nomes claros
- migrations do Prisma
- seed inicial opcional

## 10. Segurança

Garantir que:

- usuário só acesse seus próprios decks
- usuário só revise seus próprios cards
- senha nunca seja salva em texto puro
- rotas privadas sejam protegidas
- inputs sejam validados
- erros não exponham informações sensíveis

## 11. Entregáveis esperados

Ao finalizar, entregue:

1. Estrutura completa do projeto
2. Arquivo Prisma schema
3. Código das páginas principais
4. Componentes reutilizáveis
5. Server Actions ou API Routes
6. Função do algoritmo de revisão espaçada
7. Instruções para rodar localmente
8. Comandos de instalação
9. Comandos de migration
10. Exemplo de variáveis de ambiente

## 12. Desenvolvimento por sprints

O projeto será desenvolvido de forma incremental, particionado em sprints.

Cada sprint deve:

- ter um escopo claro e delimitado
- entregar funcionalidades funcionais e testáveis ao final
- seguir a ordem lógica de dependências entre módulos
- gerar um arquivo de relatório chamado `relatorio_desenvolvimento_sprint_[numero]` ao final, contendo:
  - resumo do que foi implementado
  - estrutura de pastas criada ou modificada
  - principais comandos para rodar
  - como executar migrations (se houver)
  - como rodar testes (se houver)
  - próximos passos recomendados para a sprint seguinte

Não implemente funcionalidades fora do escopo da sprint atual. Conclua, valide e documente antes de avançar.

## 13. Critérios de aceite

A aplicação será considerada concluída quando:

- usuário conseguir se cadastrar
- usuário conseguir fazer login
- usuário autenticado acessar dashboard
- usuário criar decks
- usuário criar flashcards
- usuário revisar cards
- sistema recalcular próxima revisão
- histórico de revisão for salvo
- usuário não conseguir acessar dados de outro usuário
- aplicação rodar localmente com PostgreSQL
