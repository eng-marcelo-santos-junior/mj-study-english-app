"""
extract_expressions.py

Recebe uma lista de frases em inglês e extrai expressões idiomáticas e
phrasal verbs usando LLMs (Anthropic Claude).

Uso via terminal:
    python extract_expressions.py '["She gave up on her dreams.", "He kicked the bucket."]'
    echo '["She gave up.", "It costs an arm and a leg."]' | python extract_expressions.py
    python extract_expressions.py --file frases.json
    python extract_expressions.py --json '["She gave up.", "He ran out of time."]'

Uso como módulo:
    from extract_expressions import extract_expressions
    expressions = extract_expressions(["She gave up.", "It cost an arm and a leg."])

Variáveis de ambiente necessárias:
    ANTHROPIC_API_KEY — chave de API da Anthropic
"""

import re
import sys
import json
import argparse

import anthropic


_MODEL = "claude-sonnet-4-6"

_SYSTEM_PROMPT = """\
You are an expert English language analyst specializing in identifying idiomatic expressions and phrasal verbs in text.

When given a list of English sentences, extract:
1. **Phrasal verbs**: combinations of a verb with a preposition or adverb that create a new meaning \
(e.g., "give up", "look forward to", "run out of", "come across", "put off", "figure out").
2. **Idiomatic expressions**: fixed phrases whose meaning cannot be understood from the individual words \
(e.g., "break a leg", "hit the nail on the head", "cost an arm and a leg", "once in a blue moon", "under the weather").

Rules:
- Return ONLY a valid JSON array of strings: ["expression 1", "expression 2", ...]
- Each expression in its natural base form (e.g., "give up" not "gave up")
- No duplicates
- No explanations, no markdown, no extra text — only the JSON array
- If no expressions are found, return: []\
"""


def _parse_response(text: str) -> list[str]:
    text = text.strip()

    try:
        data = json.loads(text)
        if isinstance(data, list):
            return [str(item) for item in data if item]
    except json.JSONDecodeError:
        pass

    # Fallback: find first JSON array in the text
    match = re.search(r"\[[\s\S]*?\]", text)
    if match:
        try:
            data = json.loads(match.group())
            if isinstance(data, list):
                return [str(item) for item in data if item]
        except json.JSONDecodeError:
            pass

    return []


def extract_expressions(
    sentences: list[str],
    model: str = _MODEL,
) -> list[str]:
    """
    Recebe uma lista de frases em inglês e retorna expressões idiomáticas
    e phrasal verbs extraídos via LLM.

    Args:
        sentences: Lista de strings com frases em inglês.
        model: Model ID da Anthropic (padrão: claude-opus-4-7).

    Returns:
        Lista de strings com as expressões extraídas, sem duplicatas.

    Raises:
        anthropic.AuthenticationError: API key inválida ou ausente.
        anthropic.RateLimitError: Limite de taxa excedido.
        anthropic.APIError: Erro genérico da API.
    """
    if not sentences:
        return []

    sentences = [s for s in sentences if isinstance(s, str) and s.strip()]
    if not sentences:
        return []

    client = anthropic.Anthropic()

    user_content = (
        "Extract all idiomatic expressions and phrasal verbs from the following sentences:\n\n"
        + json.dumps(sentences, ensure_ascii=False, indent=2)
    )

    response = client.messages.create(
        model=model,
        max_tokens=4096,
        thinking={"type": "adaptive"},
        system=[
            {
                "type": "text",
                "text": _SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[{"role": "user", "content": user_content}],
    )

    text_block = next(
        (block for block in response.content if block.type == "text"), None
    )
    if text_block is None:
        return []

    return _parse_response(text_block.text)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Extrai expressões idiomáticas e phrasal verbs de frases em inglês via LLM.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "sentences",
        nargs="?",
        help='Lista JSON de frases. Ex: \'["She gave up.", "It costs an arm and a leg."]\' '
             "Se omitido, lê de stdin.",
    )
    parser.add_argument(
        "--file", "-f",
        metavar="ARQUIVO",
        help="Lê a lista JSON de frases de um arquivo.",
    )
    parser.add_argument(
        "--model", "-m",
        default=_MODEL,
        metavar="MODEL_ID",
        help=f"Model ID da Anthropic (padrão: {_MODEL}).",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Imprime a saída em formato JSON.",
    )
    return parser


def _load_sentences(raw: str) -> list[str]:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Erro: entrada inválida — esperado JSON array de strings. {e}", file=sys.stderr)
        sys.exit(1)

    if not isinstance(data, list):
        print("Erro: a entrada deve ser um array JSON.", file=sys.stderr)
        sys.exit(1)

    return [str(s) for s in data]


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    if args.file:
        try:
            with open(args.file, encoding="utf-8") as f:
                raw = f.read()
        except FileNotFoundError:
            print(f"Erro: arquivo '{args.file}' não encontrado.", file=sys.stderr)
            sys.exit(1)
    elif args.sentences:
        raw = args.sentences
    elif not sys.stdin.isatty():
        raw = sys.stdin.read()
    else:
        parser.print_help()
        sys.exit(0)

    sentences = _load_sentences(raw)

    try:
        expressions = extract_expressions(sentences, model=args.model)
    except anthropic.AuthenticationError:
        print("Erro: API key inválida ou ausente. Configure ANTHROPIC_API_KEY.", file=sys.stderr)
        sys.exit(1)
    except anthropic.RateLimitError:
        print("Erro: limite de taxa da API excedido. Tente novamente mais tarde.", file=sys.stderr)
        sys.exit(1)
    except anthropic.APIError as e:
        print(f"Erro na API: {e}", file=sys.stderr)
        sys.exit(1)

    if args.json:
        print(json.dumps(expressions, ensure_ascii=False, indent=2))
    else:
        if not expressions:
            print("Nenhuma expressão encontrada.")
        else:
            for i, expr in enumerate(expressions, 1):
                print(f"{i:>3}. {expr}")


if __name__ == "__main__":
    main()
