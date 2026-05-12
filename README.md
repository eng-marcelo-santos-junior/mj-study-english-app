# mj-study-english-app

Pipeline para estudo de inglês que extrai frases, palavras e expressões idiomáticas de textos.

## Visão geral

```
Texto bruto
    │
    ▼
extract_sentences  →  lista de frases limpas
    │
    ▼
extract_words      →  lista de palavras únicas
    │
    ▼
extract_expressions →  lista de expressões idiomáticas e phrasal verbs (via LLM)
```

Cada módulo pode ser usado de forma independente via CLI, como biblioteca Python ou via API REST.

---

## Pré-requisitos

- Python 3.12+
- Docker e Docker Compose (para rodar a API em container)
- Chave de API da Anthropic (`ANTHROPIC_API_KEY`) — necessária apenas para `extract_expressions`

---

## Instalação local

```bash
pip install -r requirements.txt
```

---

## Módulos

### `extract_sentences.py`

Recebe um texto bruto e retorna uma lista de frases limpas (remove HTML, URLs, markdown, ruídos).

**Como módulo:**
```python
from extract_sentences import extract_sentences

sentences = extract_sentences("She gave up. It costs an arm and a leg.")
# ['She gave up.', 'It costs an arm and a leg.']
```

**CLI:**
```bash
python extract_sentences.py "She gave up. It costs an arm and a leg."
python extract_sentences.py --file texto.txt
python extract_sentences.py --file texto.txt --json
echo "Some text here." | python extract_sentences.py
```

---

### `extract_words.py`

Recebe uma lista de frases e retorna as palavras únicas, preservando a ordem de aparição.

**Como módulo:**
```python
from extract_words import extract_words

words = extract_words(["She gave up.", "He ran out of time."])
# ['she', 'gave', 'up', 'he', 'ran', 'out', 'of', 'time']
```

**CLI:**
```bash
python extract_words.py '["She gave up.", "He ran out of time."]'
python extract_words.py --file frases.json
python extract_words.py --json '["She gave up.", "Good morning."]'
python extract_words.py --keep-case '["Hello World."]'
```

---

### `extract_expressions.py`

Recebe uma lista de frases em inglês e extrai expressões idiomáticas e phrasal verbs usando o modelo Claude da Anthropic.

**Variável de ambiente necessária:**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

**Como módulo:**
```python
from extract_expressions import extract_expressions

expressions = extract_expressions([
    "She gave up on her dreams.",
    "It costs an arm and a leg.",
    "He ran out of time.",
])
# ['give up', 'cost an arm and a leg', 'run out of']
```

**CLI:**
```bash
python extract_expressions.py '["She gave up.", "It costs an arm and a leg."]'
python extract_expressions.py --file frases.json
python extract_expressions.py --json '["She gave up.", "He ran out of time."]'

# Usar um modelo específico:
python extract_expressions.py --model claude-opus-4-7 '["She gave up."]'
```

---

## API REST

### Subir a API com Docker

```bash
# Criar arquivo .env na raiz (ou exportar a variável):
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

docker compose up --build
```

A API fica disponível em `http://localhost:8000`.

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Verifica se a API está no ar |
| POST | `/extract-sentences` | Extrai frases de um texto |
| POST | `/extract-words` | Extrai palavras únicas de frases |
| POST | `/extract-expressions` | Extrai expressões via LLM |
| POST | `/process` | Extrai frases e palavras em um único passo |

**Exemplos com curl:**

```bash
# Health check
curl http://localhost:8000/health

# Extrair frases
curl -X POST http://localhost:8000/extract-sentences \
  -H "Content-Type: application/json" \
  -d '{"text": "She gave up. It costs an arm and a leg."}'

# Extrair palavras
curl -X POST http://localhost:8000/extract-words \
  -H "Content-Type: application/json" \
  -d '{"sentences": ["She gave up.", "He ran out of time."]}'

# Extrair expressões (requer ANTHROPIC_API_KEY no container)
curl -X POST http://localhost:8000/extract-expressions \
  -H "Content-Type: application/json" \
  -d '{"sentences": ["She gave up.", "It costs an arm and a leg."]}'

# Pipeline completo (frases + palavras)
curl -X POST http://localhost:8000/process \
  -H "Content-Type: application/json" \
  -d '{"text": "She gave up. He ran out of time."}'
```

Documentação interativa disponível em `http://localhost:8000/docs`.

---

## Interface Gradio

Inicia uma UI web para extrair palavras de um texto via browser.

**Pré-requisito:** a API deve estar rodando em `localhost:8000`.

```bash
python app.py
```

Acesse `http://localhost:7860`, cole um texto e clique em **Extrair Palavras**.

---

## n8n (opcional)

O diretório `n8n/` contém um `docker-compose.yml` separado para subir o n8n com PostgreSQL.

```bash
cd n8n
cp .env.example .env   # preencha as variáveis
docker compose up -d
```

Acesse o n8n em `http://localhost:5678`.

### Variáveis do n8n (`.env`)

| Variável | Descrição |
|----------|-----------|
| `POSTGRES_USER` | Usuário do banco |
| `POSTGRES_PASSWORD` | Senha do banco |
| `POSTGRES_DB` | Nome do banco |
| `N8N_ENCRYPTION_KEY` | Chave de criptografia do n8n |
| `N8N_PORT` | Porta do n8n (padrão: 5678) |

---

## Estrutura do projeto

```
mj-study-english-app/
├── extract_sentences.py    # Extrai frases de texto bruto
├── extract_words.py        # Extrai palavras únicas de frases
├── extract_expressions.py  # Extrai expressões via LLM (Anthropic)
├── api.py                  # API REST com FastAPI
├── app.py                  # Interface web com Gradio
├── Dockerfile.api          # Dockerfile da API
├── docker-compose.yml      # Compose da API
├── requirements.txt        # Dependências Python
└── n8n/
    ├── docker-compose.yml  # Compose do n8n + PostgreSQL
    └── .env                # Variáveis de ambiente do n8n (não commitado)
```
