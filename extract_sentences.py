"""
extract_sentences.py

Recebe um texto como entrada e retorna uma lista de frases limpas.
Remove ruídos como HTML, URLs, caracteres especiais soltos, linhas vazias, etc.

Uso via terminal:
    python extract_sentences.py "Texto aqui."
    echo "Texto aqui." | python extract_sentences.py
    python extract_sentences.py --file texto.txt
    python extract_sentences.py --file texto.txt --json

Uso como módulo:
    from extract_sentences import extract_sentences
    sentences = extract_sentences("Texto aqui.")
"""

import re
import sys
import json
import argparse


# ---------------------------------------------------------------------------
# Limpeza do texto bruto
# ---------------------------------------------------------------------------

def _remove_html(text: str) -> str:
    return re.sub(r"<[^>]+>", " ", text)


def _remove_urls(text: str) -> str:
    return re.sub(r"https?://\S+|www\.\S+", " ", text)


def _remove_email(text: str) -> str:
    return re.sub(r"\S+@\S+\.\S+", " ", text)


def _remove_markdown(text: str) -> str:
    # Remove blocos de código
    text = re.sub(r"```.*?```", " ", text, flags=re.DOTALL)
    text = re.sub(r"`[^`]+`", " ", text)
    # Remove negrito/itálico (* ** _ __)
    text = re.sub(r"[*_]{1,3}(.+?)[*_]{1,3}", r"\1", text)
    # Remove headers (# ## ### em qualquer posição)
    text = re.sub(r"#{1,6}\s+", " ", text)
    # Remove bullets e listas
    text = re.sub(r"^\s*[-*+•]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*\d+\.\s+", "", text, flags=re.MULTILINE)
    # Remove links markdown [texto](url)
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    # Remove imagens ![alt](url)
    text = re.sub(r"!\[[^\]]*\]\([^\)]+\)", " ", text)
    # Remove separadores horizontais --- === ***
    text = re.sub(r"^\s*[-=*]{3,}\s*$", " ", text, flags=re.MULTILINE)
    text = re.sub(r"\s[-=*]{3,}\s", " ", text)
    # Remove referências numéricas soltas [1], [23]
    text = re.sub(r"\[\d+\]", " ", text)
    return text


def _normalize_whitespace(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Múltiplas linhas em branco → parágrafo único
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Tabs e espaços múltiplos → espaço único
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def _clean_text(text: str) -> str:
    text = _remove_html(text)
    text = _remove_urls(text)
    text = _remove_email(text)
    text = _remove_markdown(text)
    text = _normalize_whitespace(text)
    return text


# ---------------------------------------------------------------------------
# Tokenização de frases
# ---------------------------------------------------------------------------

def _tokenize_sentences(text: str) -> list[str]:
    """Divide o texto em frases usando NLTK se disponível, senão usa regex."""
    try:
        import nltk
        try:
            return nltk.sent_tokenize(text)
        except LookupError:
            nltk.download("punkt_tab", quiet=True)
            nltk.download("punkt", quiet=True)
            return nltk.sent_tokenize(text)
    except ImportError:
        pass

    # Fallback: regex para inglês e português
    # Divide em . ! ? seguidos de espaço + maiúscula ou fim de string
    pattern = r'(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÀÂÊÔÃÕÜÇ])'
    parts = re.split(pattern, text)
    return [p.strip() for p in parts if p.strip()]


# ---------------------------------------------------------------------------
# Filtro de ruído pós-tokenização
# ---------------------------------------------------------------------------

_NOISE_PATTERNS = [
    re.compile(r"^\W+$"),                     # só símbolos/pontuação
    re.compile(r"^\d+[\d\s.,/-]*$"),           # só números e separadores
    re.compile(r"^[\s\-_=*#+|~]+$"),           # só caracteres de formatação
    re.compile(r"^\s*\[?\d+\]?\s*$"),          # referências [1], [2]...
    re.compile(r"^(page|pg|p|vol|cap)\s*\d+$", re.IGNORECASE),  # "page 3"
]

_MIN_WORDS = 2
_MIN_CHARS = 8


def _is_valid_sentence(sentence: str) -> bool:
    s = sentence.strip()

    if not s:
        return False

    if len(s) < _MIN_CHARS:
        return False

    words = s.split()
    if len(words) < _MIN_WORDS:
        return False

    for pattern in _NOISE_PATTERNS:
        if pattern.match(s):
            return False

    # Deve ter pelo menos uma letra
    if not re.search(r"[a-zA-ZÀ-ÿ]", s):
        return False

    return True


def _clean_sentence(sentence: str) -> str:
    s = sentence.strip()
    # Remove espaço antes de pontuação final
    s = re.sub(r"\s+([.!?,;:])", r"\1", s)
    # Colapsa espaços internos
    s = re.sub(r" {2,}", " ", s)
    return s


# ---------------------------------------------------------------------------
# Função principal
# ---------------------------------------------------------------------------

def extract_sentences(text: str) -> list[str]:
    """
    Recebe um texto bruto e retorna lista de frases limpas.

    Args:
        text: Texto de entrada (pode conter HTML, markdown, URLs, etc.)

    Returns:
        Lista de strings com as frases extraídas e limpas.
    """
    if not text or not text.strip():
        return []

    cleaned = _clean_text(text)
    raw_sentences = _tokenize_sentences(cleaned)

    sentences = []
    for s in raw_sentences:
        s = _clean_sentence(s)
        if _is_valid_sentence(s):
            sentences.append(s)

    return sentences


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Extrai frases limpas de um texto.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "text",
        nargs="?",
        help="Texto de entrada (entre aspas). Se omitido, lê de stdin.",
    )
    parser.add_argument(
        "--file", "-f",
        metavar="ARQUIVO",
        help="Lê o texto de um arquivo.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Imprime a saída em formato JSON.",
    )
    parser.add_argument(
        "--encoding",
        default="utf-8",
        help="Encoding do arquivo (padrão: utf-8).",
    )
    return parser


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    # Origem do texto
    if args.file:
        try:
            with open(args.file, encoding=args.encoding) as f:
                text = f.read()
        except FileNotFoundError:
            print(f"Erro: arquivo '{args.file}' não encontrado.", file=sys.stderr)
            sys.exit(1)
        except UnicodeDecodeError as e:
            print(f"Erro de encoding: {e}", file=sys.stderr)
            sys.exit(1)
    elif args.text:
        text = args.text
    elif not sys.stdin.isatty():
        text = sys.stdin.read()
    else:
        parser.print_help()
        sys.exit(0)

    sentences = extract_sentences(text)

    if args.json:
        print(json.dumps(sentences, ensure_ascii=False, indent=2))
    else:
        for i, sentence in enumerate(sentences, 1):
            print(f"{i:>3}. {sentence}")


if __name__ == "__main__":
    main()
