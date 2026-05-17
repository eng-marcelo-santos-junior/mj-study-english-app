# Relatório de Desenvolvimento — Sprint 6

## Resumo

Sprint 6 implementou o sistema completo de analytics e histórico de aprendizado. O usuário agora tem uma página `/stats` com métricas detalhadas de evolução: streak, taxa de acerto, distribuição de avaliações, gráfico de atividade dos últimos 30 dias e comparação semanal.

---

## O que foi criado

### Server Action

**`src/server/actions/analytics-actions.ts`**

Função central `getAnalyticsData()` que retorna todos os dados em uma única chamada ao banco (3 queries paralelas via `Promise.all`):

| Query                      | Descrição                                                 |
| -------------------------- | --------------------------------------------------------- |
| `reviewLog.findMany` (30d) | Logs recentes para distribuição, acerto, atividade diária |
| `reviewLog.findMany` (all) | Datas para cálculo de streak                              |
| `flashcard.count`          | Cards com `difficulty = REVIEW` (maduros)                 |

**Métricas calculadas em JS (sem raw SQL):**

- **Streak atual e recorde**: algoritmo de sequência consecutiva de dias com revisões. Aceita gap de 1 dia (não perde streak se não revisou hoje ainda).
- **Taxa de acerto**: `(good + easy) / total * 100` nos últimos 30 dias
- **Atividade diária**: mapa de 30 dias pré-preenchido com zeros, preenchido com contagens reais
- **Distribuição**: contagem de cada rating nos últimos 30 dias
- **Tendência semanal**: 5 semanas (4 completas + semana atual)
- **Comparação semanal**: esta semana vs anterior (revisões + acerto)

### Componente de gráfico

**`src/components/analytics/activity-chart.tsx`** (Client Component)

Gráfico de barras interativo sem dependências externas:

- 30 barras verticais com altura proporcional ao volume
- Cor por taxa de acerto do dia: cinza (sem revisão) → índigo claro → índigo médio → índigo escuro (≥80%)
- Tooltip com data, quantidade e acerto ao hover
- Marcador do dia atual (bolinha acima da barra)
- Labels de mês nas transições
- Legenda de cores

### Página de Analytics

**`src/app/(auth)/stats/page.tsx`** (Server Component com sub-componentes inline)

**Layout:**

```
[🔥 Streak] [✅ Acerto] [📚 Total] [🎓 Maduros]

Atividade — últimos 30 dias
[ActivityChart — 30 barras interativas]

[Distribuição de avaliações] [Esta semana vs anterior]
[Stacked bar + legenda]      [Barras de comparação]

Tendência semanal
[5 semanas com barras horizontais + contagem + acerto%]

Últimos 7 dias (tabela)
[Data | Revisões | Acerto%]
```

**Sub-componentes Server:**

- `StatCard` — card de métrica reutilizável com accent por cor
- `RatingBar` — barra empilhada colorida (Again/Hard/Good/Easy) com legenda
- `WeeklyTrend` — barras horizontais das últimas 5 semanas
- `WeeklyComparison` — comparação desta semana vs anterior com diff

### Sidebar atualizada

**`src/components/layout/sidebar.tsx`**

Adicionado item "Estatísticas" com ícone de gráfico de barras, rota `/stats`.

---

## Estrutura de pastas (Sprint 6)

```
src/
  server/actions/
    analytics-actions.ts      ← novo
  components/analytics/
    activity-chart.tsx         ← novo (Client Component)
  app/(auth)/stats/
    page.tsx                   ← novo
  components/layout/
    sidebar.tsx                ← atualizado (link Estatísticas)
```

---

## Rota implementada

| Rota         | Descrição                    |
| ------------ | ---------------------------- |
| `GET /stats` | Página de analytics completa |

---

## Algoritmo de streak

```
sortedDatesDesc = datas únicas de revisão, descendentes

canStart = ultimaData === hoje OR ultimaData === ontem

se canStart:
  percorre datas verificando se diff entre consecutivas = 86400s
  incrementa streak enquanto sequência contínua

longestStreak = maior sequência contínua em todo o histórico
```

---

## Performance

- 3 queries paralelas (`Promise.all`) — sem waterfalls
- Nenhuma raw SQL — usa Prisma query builder
- Agregação em JS (volumes de dados são pequenos: 30 dias × N usuários)
- `ActivityChart` é o único Client Component — resto é SSR puro
- Sem dependências extras — gráficos com CSS/HTML puro

---

## Como rodar

```bash
docker compose up -d
npm run dev
```

Acesse: http://localhost:3000/stats

---

## Critérios de aceite alcançados

- [x] Histórico de revisões persistido no `ReviewLog` (implementado desde Sprint 5)
- [x] Dashboard com streak atual e recorde
- [x] Taxa de acerto geral (últimos 30 dias)
- [x] Total de revisões all-time
- [x] Cards maduros (graduados pelo SM-2)
- [x] Gráfico temporal de atividade com 30 dias
- [x] Cores por taxa de acerto no gráfico
- [x] Tooltip interativo (data, revisões, acerto)
- [x] Distribuição de avaliações (Again/Hard/Good/Easy)
- [x] Comparação semanal (esta semana vs anterior)
- [x] Tendência semanal (últimas 5 semanas)
- [x] Tabela dos últimos 7 dias
- [x] Link "Estatísticas" na sidebar
- [x] TypeScript sem erros

---

## Próximos passos recomendados (Sprint 7)

- **Filtros de período**: alternar entre 7d / 30d / 90d na página de stats
- **Revisão global**: rota `/review` que agrupa cards pendentes de todos os decks
- **Exportação CSV**: exportar histórico de revisões
- **Notificações**: lembrete diário via email quando há cards para revisar
- **Teste de cobertura**: adicionar testes unitários para `calculateStreaks` e `getAnalyticsData`
