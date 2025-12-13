"""Simple CLI to predict if an SMS is spam using saved models.

Usage:
    python -m backend.scripts.predict_cli "your message here"
"""

import sys
from pathlib import Path
from backend.baseline_models import load, load_vectorizer

ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = ROOT / "models"
nb_path = MODELS_DIR / "nb.joblib"
svm_path = MODELS_DIR / "svm.joblib"
vec_path = MODELS_DIR / "vectorizer.joblib"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Please provide a text message to classify.")
        sys.exit(1)

    text = sys.argv[1]

    if not nb_path.exists() or not svm_path.exists() or not vec_path.exists():
        print("Trained models not found. Run python -m backend.scripts.train_spam to train models.")
        sys.exit(1)

    nb = load(str(nb_path))
    svm = load(str(svm_path))
    vec = load_vectorizer(str(vec_path))

    X = vec.transform([text])

    print("nb:", "spam" if nb.predict(X)[0] == 1 else "ham")
    print("svm:", "spam" if svm.predict(X)[0] == 1 else "ham")
