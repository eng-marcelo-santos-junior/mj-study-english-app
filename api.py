from fastapi import FastAPI
from pydantic import BaseModel

from extract_sentences import extract_sentences
from extract_words import extract_words
from extract_expressions import extract_expressions

app = FastAPI(title="Word Extractor API")


class TextInput(BaseModel):
    text: str


class SentencesInput(BaseModel):
    sentences: list[str]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/extract-sentences")
def api_extract_sentences(body: TextInput):
    sentences = extract_sentences(body.text)
    return {"sentences": sentences}


@app.post("/extract-words")
def api_extract_words(body: SentencesInput):
    words = extract_words(body.sentences)
    return {"words": words}


@app.post("/extract-expressions")
def api_extract_expressions(body: SentencesInput):
    expressions = extract_expressions(body.sentences)
    return {"expressions": expressions}


@app.post("/process")
def api_process(body: TextInput):
    sentences = extract_sentences(body.text)
    words = extract_words(sentences)
    return {"sentences": sentences, "words": words}
