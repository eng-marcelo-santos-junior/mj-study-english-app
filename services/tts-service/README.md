---
title: MJ Study TTS Service
emoji: 🎙️
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# TTS Service

Microserviço Python que gera áudio MP3 a partir de texto usando a biblioteca `edge-tts` (Microsoft Edge TTS) e salva os arquivos no Supabase Storage.

---

## Objetivo

Expor uma API HTTP para que a aplicação web possa:

1. Listar vozes disponíveis por idioma.
2. Gerar preview de áudio (retorna bytes MP3 diretamente).
3. Gerar e persistir áudio de um card no Supabase Storage (retorna URL assinada).

---

## Endpoints

| Método | Rota            | Descrição                                           |
| ------ | --------------- | --------------------------------------------------- |
| `GET`  | `/health`       | Health check                                        |
| `GET`  | `/voices`       | Lista vozes; filtra por `?language=en-US`           |
| `POST` | `/tts/generate` | Gera áudio, faz upload no Supabase, retorna JSON    |
| `POST` | `/synthesize`   | Gera áudio, retorna bytes MP3 (preview sem storage) |

Todos os endpoints que modificam dados requerem `Authorization: Bearer <TTS_INTERNAL_API_KEY>` quando a variável `TTS_INTERNAL_API_KEY` estiver configurada.

---

## Instalação

```bash
cd services/tts-service
python -m venv .venv
# Linux/macOS
source .venv/bin/activate
# Windows
.venv\Scripts\activate

pip install -r requirements.txt
```

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_AUDIO_BUCKET=flashcard-audios

MAX_TTS_TEXT_LENGTH=5000
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app
TTS_INTERNAL_API_KEY=your-strong-shared-secret
PORT=5001
```

Encontre as chaves em **Supabase Dashboard → Project Settings → API**.

> **Importante:** `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser exposta no frontend. Ela fica exclusivamente neste serviço.

---

## Como rodar localmente

```bash
# Desenvolvimento com auto-reload
uvicorn app.main:app --port 5001 --reload

# Ou diretamente
python app/main.py
```

Acesse a documentação interativa em: http://localhost:5001/docs

---

## Como rodar os testes

```bash
pytest
# Com cobertura
pytest --tb=short -v
```

---

## Build Docker

```bash
docker build -t tts-service .
docker run -p 5001:5001 --env-file .env tts-service
```

---

## Exemplos de chamadas HTTP

### Health check

```http
GET /health
```

```json
{ "status": "ok" }
```

---

### Listar vozes

```http
GET /voices?language=en-US
```

```json
{
  "voices": [
    {
      "name": "Microsoft Jenny Online (Natural) - English (United States)",
      "short_name": "en-US-JennyNeural",
      "locale": "en-US",
      "gender": "Female"
    }
  ]
}
```

---

### Gerar e salvar áudio

```http
POST /tts/generate
Authorization: Bearer <TTS_INTERNAL_API_KEY>
Content-Type: application/json

{
  "card_id": "clxyz123",
  "user_id": "user-abc",
  "side": "front",
  "text": "Based on the requirements, we need to redesign the data pipeline.",
  "language": "en-US",
  "voice": "en-US-JennyNeural",
  "rate": "+0%",
  "pitch": "+0Hz"
}
```

```json
{
  "card_id": "clxyz123",
  "side": "front",
  "audio_url": "https://....supabase.co/storage/v1/sign/flashcard-audios/user-abc/clxyz123/front.mp3?token=...",
  "storage_path": "user-abc/clxyz123/front.mp3",
  "voice": "en-US-JennyNeural",
  "language": "en-US",
  "format": "mp3",
  "audio_size_bytes": 48320
}
```

---

### Preview de áudio (sem storage)

```http
POST /synthesize
Authorization: Bearer <TTS_INTERNAL_API_KEY>
Content-Type: application/json

{
  "text": "Hello, this is a preview.",
  "voice": "en-US-GuyNeural"
}
```

Retorna bytes MP3 com `Content-Type: audio/mpeg`.

---

## Estrutura do projeto

```
services/tts-service/
├── app/
│   ├── main.py           ← FastAPI app factory
│   ├── config.py         ← Settings via pydantic-settings
│   ├── schemas.py        ← Pydantic request/response models
│   ├── dependencies.py   ← Auth dependency (API key)
│   ├── routers/
│   │   ├── health.py     ← GET /health
│   │   ├── voices.py     ← GET /voices
│   │   └── tts.py        ← POST /tts/generate + POST /synthesize
│   └── services/
│       ├── tts_generator.py  ← edge_tts wrapper
│       └── storage.py        ← Supabase Storage upload
├── tests/
│   ├── conftest.py
│   ├── test_health.py
│   ├── test_voices.py
│   └── test_tts.py
├── requirements.txt
├── pyproject.toml
├── Dockerfile
└── .env.example
```

---

## Armazenamento

O áudio é gerado **inteiramente em memória** (sem gravar no disco). O buffer de bytes é enviado diretamente para o Supabase Storage via API REST. Não há arquivos temporários locais.

Estrutura de paths no bucket:

```
flashcard-audios/
└── {user_id}/
    └── {card_id}/
        ├── front.mp3
        └── back.mp3
```

---

## Aviso de uso

`edge-tts` acessa a infraestrutura de TTS do Microsoft Edge. Valide os termos de uso antes de utilizar em produção comercial. A arquitetura foi projetada para troca fácil de provedor: substitua `app/services/tts_generator.py` por um wrapper de outro serviço (Azure Speech, Google Cloud TTS, AWS Polly) sem alterar routers, schemas ou a aplicação web.
