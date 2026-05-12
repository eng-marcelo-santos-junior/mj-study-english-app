"""
extract_words.py

Recebe uma lista de frases, extrai as palavras, remove duplicatas
e retorna uma lista de palavras únicas preservando a ordem de aparição.

Uso via terminal:
    python extract_words.py '["Hello world.", "The cat sat on the mat."]'
    echo '["Hello world.", "The cat sat."]' | python extract_words.py
    python extract_words.py --file frases.json
    python extract_words.py --json '["Hello world.", "Good morning."]'

Uso como módulo:
    from extract_words import extract_words
    words = extract_words(["Hello world.", "The cat sat on the mat."])
"""

import re
import sys
import json
import argparse


def _tokenize_words(sentence: str) -> list[str]:
    # Normaliza contrações removendo o apóstrofo e sufixo ('s, n't, 're...)
    sentence = re.sub(r"'\w+\b", "", sentence)
    # Extrai palavras (letras e hífens internos, ex: well-known)
    return re.findall(r"\b[a-zA-ZÀ-ÿ]+(?:-[a-zA-ZÀ-ÿ]+)*\b", sentence)


def extract_words(
    sentences: list[str],
    lowercase: bool = True,
) -> list[str]:
    """
    Recebe uma lista de frases e retorna lista de palavras únicas.

    Args:
        sentences: Lista de strings com as frases de entrada.
        lowercase: Se True, normaliza as palavras para minúsculo (padrão: True).

    Returns:
        Lista de strings com palavras únicas, sem duplicatas.
        A ordem de primeira aparição é preservada.
    """
    if not sentences:
        return []

    seen: set[str] = set()
    result: list[str] = []

    for sentence in sentences:
        if not isinstance(sentence, str) or not sentence.strip():
            continue

        for token in _tokenize_words(sentence):
            word = token.lower() if lowercase else token
            key = word.lower()

            if key not in seen:
                seen.add(key)
                result.append(word)

    return result


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Extrai palavras únicas de uma lista de frases.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "sentences",
        nargs="?",
        help='Lista JSON de frases. Ex: \'["Hello world.", "Good morning."]\' '
             "Se omitido, lê de stdin.",
    )
    parser.add_argument(
        "--file", "-f",
        metavar="ARQUIVO",
        help="Lê a lista JSON de frases de um arquivo.",
    )
    parser.add_argument(
        "--keep-case",
        action="store_true",
        help="Preserva o case original das palavras (padrão: minúsculo).",
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
    words = extract_words(sentences, lowercase=not args.keep_case)

    if args.json:
        print(json.dumps(words, ensure_ascii=False, indent=2))
    else:
        for i, word in enumerate(words, 1):
            print(f"{i:>3}. {word}")


if __name__ == "__main__":
    main()
