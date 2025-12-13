"""Train Spam Classifiers (Naive Bayes and SVM) using spam.csv and save models.

Usage:
    python -m backend.scripts.train_spam

Outputs (written to `backend/models/`):
 - nb.joblib
 - svm.joblib
 - vectorizer.joblib
 - metrics.txt
"""

import os
from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

from backend.baseline_models import train_nb, train_svm, save, save_vectorizer
from backend.preprocessing import build_vectorizer

ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = ROOT / "data" / "spam.csv"
MODELS_DIR = ROOT / "models"
MODELS_DIR.mkdir(exist_ok=True)

NB_PATH = MODELS_DIR / "nb.joblib"
SVM_PATH = MODELS_DIR / "svm.joblib"
VEC_PATH = MODELS_DIR / "vectorizer.joblib"
METRICS_PATH = MODELS_DIR / "metrics.txt"


def load_dataset(path):
    # dataset has columns v1 (label) and v2 (text)
    df = pd.read_csv(path, encoding="latin-1")
    df = df.rename(columns={"v1": "label", "v2": "text"})[["label", "text"]]
    df = df.dropna()
    return df


def train_and_save():
    df = load_dataset(DATA_PATH)
    X_text = df["text"].values
    y = df["label"].map({"ham": 0, "spam": 1}).values

    vec = build_vectorizer()
    X = vec.fit_transform(X_text)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("Training MultinomialNB...")
    nb = train_nb(X_train, y_train)
    save(nb, NB_PATH)

    print("Training LinearSVC (SVM)...")
    svm = train_svm(X_train, y_train)
    save(svm, SVM_PATH)

    save_vectorizer(vec, VEC_PATH)

    # Evaluate
    results = []
    for name, model in [("nb", nb), ("svm", svm)]:
        y_pred = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        p, r, f, _ = precision_recall_fscore_support(y_test, y_pred, average="binary")
        results.append((name, acc, p, r, f))

    with open(METRICS_PATH, "w") as f:
        for name, acc, p, r, fscore in results:
            f.write(f"{name}: accuracy={acc:.4f}, precision={p:.4f}, recall={r:.4f}, f1={fscore:.4f}\n")

    print("Saved models to:")
    print(f" - {NB_PATH}\n - {SVM_PATH}\n - {VEC_PATH}\n - {METRICS_PATH}")


if __name__ == "__main__":
    train_and_save()
