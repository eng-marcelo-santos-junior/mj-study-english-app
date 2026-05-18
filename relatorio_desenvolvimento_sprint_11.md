# Relatório de Desenvolvimento — Sprint 11

## Resumo

Sprint 11 evoluiu o microserviço TTS de um script monolítico (`tts-server/server.py`) para uma arquitetura modular completa em `services/tts-service/`. O serviço ganhou arquitetura em camadas (routers, services, schemas), novos endpoints (`/health`, `/tts/generate`), autenticação por API key, upload direto ao Supabase Storage, testes pytest e Dockerfile para deploy independente.

---

## O que foi implementado

### Reestruturação do microserviço Python

**Antes:** `tts-server/server.py` — arquivo único, `/voices` e `/synthesize` apenas.

**Depois:** `services/tts-service/` com separação de responsabilidades:

| Camada  | Arquivo                         | Responsabilidade                                        |
| ------- | ------------------------------- | ------------------------------------------------------- |
| Config  | `app/config.py`                 | Settings com pydantic-settings, leitura de `.env`       |
| Schemas | `app/schemas.py`                | Modelos Pydantic de request/response                    |
| Auth    | `app/dependencies.py`           | Dependência `verify_api_key` para proteção de endpoints |
| Router  | `app/routers/health.py`         | `GET /health`                                           |
| Router  | `app/routers/voices.py`         | `GET /voices?language=<locale>`                         |
| Router  | `app/routers/tts.py`            | `POST /tts/generate` + `POST /synthesize`               |
| Service | `app/services/tts_generator.py` | Wrapper do `edge_tts` com suporte a `rate` e `pitch`    |
| Service | `app/services/storage.py`       | Upload para Supabase Storage via `asyncio.to_thread`    |
| Entry   | `app/main.py`                   | FastAPI app factory com CORS e registro de routers      |

### Novos endpoints

#### `GET /health`

```json
{ "status": "ok" }
```

#### `GET /voices?language=en-US`

Resposta padronizada em snake_case:

```json
{
  "voices": [
    {
      "name": "Microsoft Jenny...",
      "short_name": "en-US-JennyNeural",
      "locale": "en-US",
      "gender": "Female"
    }
  ]
}
```

#### `POST /tts/generate` (novo)

Gera o áudio, faz upload direto ao Supabase Storage e retorna JSON:

```json
{
  "card_id": "cld...",
  "side": "front",
  "audio_url": "https://...supabase.co/storage/v1/sign/...",
  "storage_path": "user-id/card-id/front.mp3",
  "voice": "en-US-JennyNeural",
  "language": "en-US",
  "format": "mp3",
  "audio_size_bytes": 48320
}
```

Aceita também `rate` (ex: `"+10%"`) e `pitch` (ex: `"+2Hz"`) para controle fino da síntese.

#### `POST /synthesize` (mantido)

Retorna bytes MP3 diretamente — usado pelo preview no navegador (sem storage).

### Autenticação TTS_INTERNAL_API_KEY

Quando `TTS_INTERNAL_API_KEY` está configurado, todos os endpoints que modificam dados exigem:

```http
Authorization: Bearer <TTS_INTERNAL_API_KEY>
```

A aplicação web envia o header automaticamente. Quando a variável está vazia, a autenticação é desabilitada (desenvolvimento).

### Mudança de arquitetura no generate

**Antes (Sprint 10):** Next.js chamava `/synthesize` → recebia MP3 → fazia upload ao Supabase.

**Agora (Sprint 11):** Next.js chama `/tts/generate` → Python faz upload ao Supabase → retorna JSON com URL. A chave `SUPABASE_SERVICE_ROLE_KEY` fica exclusivamente no microserviço, nunca no Next.js (que já a tinha, mas o princípio de menor privilégio é reforçado).

### Testes pytest

**`tests/test_health.py`** — 1 teste
**`tests/test_voices.py`** — 3 testes
**`tests/test_tts.py`** — 10 testes

| Teste                                             | O que verifica                               |
| ------------------------------------------------- | -------------------------------------------- |
| `test_health_returns_ok`                          | GET /health retorna status ok                |
| `test_list_voices_returns_all`                    | Retorna lista com shape correto (snake_case) |
| `test_list_voices_filters_by_language`            | Filtra por idioma corretamente               |
| `test_list_voices_returns_empty_on_tts_error`     | Propaga erro 502                             |
| `test_synthesize_success`                         | Retorna bytes MP3                            |
| `test_synthesize_rejects_empty_text`              | Rejeita texto vazio (400)                    |
| `test_synthesize_handles_tts_failure`             | Propaga erro edge_tts (502)                  |
| `test_generate_success`                           | Retorna JSON completo com URL                |
| `test_generate_rejects_empty_text`                | Rejeita texto vazio (422)                    |
| `test_generate_rejects_text_above_limit`          | Rejeita texto > 5000 chars (400)             |
| `test_generate_rejects_invalid_side`              | Rejeita side inválido (422)                  |
| `test_generate_requires_auth_when_key_configured` | Retorna 401 sem token                        |
| `test_generate_accepts_valid_bearer_token`        | Aceita token correto (200)                   |
| `test_generate_handles_tts_failure`               | Propaga falha do edge_tts (502)              |
| `test_generate_handles_storage_failure`           | Propaga falha do Supabase (502)              |
| `test_generate_no_temp_files_created`             | Sem arquivos temporários em disco            |

Todos os testes usam mocks para `edge_tts` e Supabase — sem dependências externas.

### Atualização das rotas Next.js

| Arquivo                                   | O que mudou                                                                                                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/tts/voices/route.ts`                 | Aceita novo formato `{"voices":[...]}` (snake_case) com fallback para formato antigo; usa parâmetro `language=` em vez de `locale=`; envia `Authorization` header             |
| `api/tts/[flashcardId]/generate/route.ts` | Chama `/tts/generate` (Python faz upload); recebe JSON com `audio_url`; aceita `rate` e `pitch`; envia `Authorization` header; remove dependência de Supabase no lado Next.js |
| `api/tts/preview/route.ts`                | Adiciona `Authorization` header na chamada ao Python `/synthesize`                                                                                                            |

### Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
EXPOSE 5001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5001"]
```

---

## Estrutura de pastas criada

```
services/
  tts-service/
    app/
      __init__.py
      main.py
      config.py
      schemas.py
      dependencies.py
      routers/
        __init__.py
        health.py
        voices.py
        tts.py
      services/
        __init__.py
        tts_generator.py
        storage.py
    tests/
      __init__.py
      conftest.py
      test_health.py
      test_voices.py
      test_tts.py
    requirements.txt
    pyproject.toml
    Dockerfile
    README.md
    .env.example
```

Removido: `tts-server/` (substituído por `services/tts-service/`)

---

## Variáveis de ambiente necessárias

### Aplicação web (`.env`)

```env
TTS_SERVER_URL=http://localhost:5001
TTS_INTERNAL_API_KEY=sua-chave-secreta-forte
```

### Serviço TTS (`services/tts-service/.env`)

```env
SUPABASE_URL=https://SEU_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
SUPABASE_AUDIO_BUCKET=flashcard-audios
MAX_TTS_TEXT_LENGTH=5000
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://seu-app.vercel.app
TTS_INTERNAL_API_KEY=sua-chave-secreta-forte
PORT=5001
```

> `TTS_INTERNAL_API_KEY` deve ser o mesmo valor em ambos os lados.

---

## Como rodar

### Serviço TTS (Python)

```bash
cd services/tts-service
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # preencher as variáveis
uvicorn app.main:app --port 5001 --reload
```

### Aplicação web (Next.js)

```bash
docker compose up -d   # PostgreSQL
npm run dev
```

---

## Como rodar os testes

```bash
cd services/tts-service
pytest
# Ou com verbose:
pytest -v --tb=short
```

---

## Critérios de aceite alcançados

- [x] Microserviço Python com arquitetura modular (routers/services/schemas)
- [x] `GET /health` retorna status ok
- [x] `GET /voices?language=` retorna `{"voices":[...]}` em snake_case
- [x] `POST /tts/generate` gera áudio e salva no Supabase Storage
- [x] `POST /tts/generate` retorna JSON com `audio_url`, `storage_path`, metadados
- [x] `POST /synthesize` mantido para preview sem storage
- [x] Suporte a `rate` e `pitch` na geração
- [x] `TTS_INTERNAL_API_KEY` protege endpoints quando configurado
- [x] Áudio processado inteiramente em memória (sem arquivos temporários)
- [x] Testes cobrindo health, voices, synthesize, generate (16 testes)
- [x] Dockerfile para deploy independente
- [x] README com exemplos de chamadas HTTP e instruções de deploy
- [x] Aplicação web atualizada para nova API do serviço
- [x] `Authorization` header adicionado em todas as chamadas da web ao serviço
- [x] `tts-server/` removido (código consolidado em `services/tts-service/`)

---

## Próximos passos recomendados (Sprint 12)

1. **Gravação de áudio no browser** — `MediaRecorder` API como alternativa ao upload de arquivo e à geração TTS
2. **Paginação e busca** na lista de flashcards por deck
3. **Importação CSV** de flashcards em lote
4. **Fixtures de autenticação para Playwright** — testes E2E com sessão logada
5. **Deploy do TTS service** em Render/Railway com variáveis configuradas
6. **Revisão global** — rota `/review` que agrupa cards pendentes de todos os decks
