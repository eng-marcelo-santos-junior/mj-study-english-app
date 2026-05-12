import requests
import gradio as gr

API_BASE = "http://localhost:8000"


def process_text(text: str):
    if not text or not text.strip():
        return "", "", ""

    sentences = []
    sentences_out = ""
    words_out = ""
    expr_out = ""

    try:
        resp = requests.post(f"{API_BASE}/process", json={"text": text}, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        sentences = data.get("sentences", [])
        words = data.get("words", [])
        sentences_out = "\n".join(sentences)
        words_out = "\n".join(words)
    except requests.exceptions.ConnectionError:
        return "Erro: não foi possível conectar à API.", "", ""
    except requests.exceptions.Timeout:
        return "Erro: timeout ao chamar a API.", "", ""
    except Exception as e:
        return f"Erro inesperado: {e}", "", ""

    if sentences:
        try:
            resp2 = requests.post(
                f"{API_BASE}/extract-expressions",
                json={"sentences": sentences},
                timeout=60,
            )
            resp2.raise_for_status()
            expressions = resp2.json().get("expressions", [])
            expr_out = "\n".join(expressions)
        except requests.exceptions.Timeout:
            expr_out = "Erro: timeout ao extrair expressões."
        except Exception as e:
            expr_out = f"Erro ao extrair expressões: {e}"

    return sentences_out, words_out, expr_out


with gr.Blocks(title="Study English") as demo:
    gr.Markdown("# Study English")
    gr.Markdown(
        "Cole um texto em inglês. A aplicação extrai as **palavras únicas** "
        "e as **expressões idiomáticas / phrasal verbs**."
    )

    text_input = gr.Textbox(
        label="Texto de entrada",
        lines=8,
        placeholder="Digite ou cole o texto em inglês aqui...",
    )

    btn = gr.Button("Analisar", variant="primary", size="lg")

    with gr.Row():
        sentences_output = gr.Textbox(
            label="Frases extraídas",
            lines=20,
            interactive=False,
        )
        words_output = gr.Textbox(
            label="Palavras únicas",
            lines=20,
            interactive=False,
        )
        expressions_output = gr.Textbox(
            label="Expressões idiomáticas e Phrasal Verbs",
            lines=20,
            interactive=False,
        )

    btn.click(
        fn=process_text,
        inputs=text_input,
        outputs=[sentences_output, words_output, expressions_output],
    )


if __name__ == "__main__":
    demo.launch(theme=gr.themes.Soft())
