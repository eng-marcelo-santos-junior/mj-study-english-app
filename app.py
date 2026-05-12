import requests
import gradio as gr

API_URL = "http://localhost:8000/process"


def process_text(text: str):
    if not text or not text.strip():
        return "", "0 palavras encontradas"

    try:
        response = requests.post(API_URL, json={"text": text}, timeout=30)
        response.raise_for_status()
        data = response.json()
        words = data.get("words", [])

        words_output = "\n".join(words)
        count = f"{len(words)} palavra(s) encontrada(s)"
        return words_output, count

    except requests.exceptions.ConnectionError:
        return "", "Erro: não foi possível conectar à API. Verifique se está rodando em localhost:8000."
    except requests.exceptions.Timeout:
        return "", "Erro: timeout ao chamar a API."
    except Exception as e:
        return "", f"Erro inesperado: {e}"


with gr.Blocks(title="Word Extractor") as demo:
    gr.Markdown("# Word Extractor")
    gr.Markdown(
        "Insira um texto abaixo. A aplicação vai extrair as frases, "
        "coletar todas as palavras únicas e retornar a lista."
    )

    with gr.Row():
        with gr.Column(scale=1):
            text_input = gr.Textbox(
                label="Texto de entrada",
                lines=10,
                placeholder="Digite ou cole o texto aqui...",
            )
            btn = gr.Button("Extrair Palavras", variant="primary", size="lg")

        with gr.Column(scale=1):
            words_output = gr.Textbox(
                label="Palavras extraídas (uma por linha)",
                lines=10,
                interactive=False,
            )
            count_label = gr.Textbox(
                label="Total",
                interactive=False,
                max_lines=1,
            )

    btn.click(fn=process_text, inputs=text_input, outputs=[words_output, count_label])

    gr.Markdown("_Pipeline: Gradio → API (extract-sentences → extract-words) → resposta_")


if __name__ == "__main__":
    demo.launch(theme=gr.themes.Soft())
