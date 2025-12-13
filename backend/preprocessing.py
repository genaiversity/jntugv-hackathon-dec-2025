import re
from sklearn.feature_extraction.text import TfidfVectorizer

def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    return text.strip()

def build_vectorizer():
    return TfidfVectorizer(
        preprocessor=clean_text,
        stop_words="english",
        ngram_range=(1,2),
        max_features=5000
    )
