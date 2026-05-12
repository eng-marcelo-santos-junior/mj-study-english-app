# n8n — Ambiente Docker (Community Edition)

Ambiente local do n8n com PostgreSQL rodando via Docker Compose.

## Pré-requisitos

- Docker Desktop instalado e rodando
- Docker Compose v2+

## Como subir

```bash
cd n8n

# 1. Copie o arquivo de variáveis (já existe um .env pronto)
cp .env.example .env   # edite as senhas antes de usar em produção

# 2. Suba os containers
docker compose up -d

# 3. Acesse no navegador
# http://localhost:5678
```

## Como parar

```bash
docker compose down
```

## Como parar e remover os dados (reset total)

```bash
docker compose down -v
```

## Verificar logs

```bash
# todos os serviços
docker compose logs -f

# apenas o n8n
docker compose logs -f n8n
```

## Estrutura

```
n8n/
  docker-compose.yml   # definição dos serviços
  .env                 # variáveis de ambiente (não versionar)
  .env.example         # modelo de variáveis
  .gitignore
  README.md
```

## Serviços

| Serviço    | Imagem              | Porta  |
|------------|---------------------|--------|
| n8n        | n8nio/n8n:latest    | 5678   |
| PostgreSQL | postgres:16-alpine  | —      |

## Volumes persistentes

| Volume        | Conteúdo                        |
|---------------|---------------------------------|
| `n8n_data`    | Workflows, credenciais, configs |
| `postgres_data` | Banco de dados PostgreSQL     |

## Variáveis importantes

| Variável              | Descrição                                |
|-----------------------|------------------------------------------|
| `N8N_ENCRYPTION_KEY`  | Chave de criptografia das credenciais    |
| `POSTGRES_PASSWORD`   | Senha do banco                           |
| `WEBHOOK_URL`         | URL base para webhooks                   |
| `GENERIC_TIMEZONE`    | Fuso horário dos agendamentos            |

> **Importante:** nunca altere `N8N_ENCRYPTION_KEY` após criar workflows com credenciais salvas — isso invalida todas as credenciais armazenadas.
