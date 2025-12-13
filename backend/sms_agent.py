from .rules import rule_score
from .preprocessing import build_vectorizer
from .baseline_models import load, load_vectorizer
from .hf_module import HFSpamClassifier

class SmsSpamAgent:
    def __init__(self, nb_path=None, svm_path=None, vectorizer_path=None, use_hf=False):
        # Load or build vectorizer. Prefer a saved vectorizer to maintain feature consistency.
        if vectorizer_path:
            try:
                self.vectorizer = load_vectorizer(vectorizer_path)
            except Exception:
                self.vectorizer = build_vectorizer()
        else:
            self.vectorizer = build_vectorizer()

        self.nb = load(nb_path) if nb_path else None
        self.svm = load(svm_path) if svm_path else None
        self.hf = HFSpamClassifier() if use_hf else None

    def predict(self, text: str):
        rules = rule_score(text)
        results = {"rules_score": rules}

        if self.nb and self.svm and self.vectorizer:
            # Use transform (not fit_transform) to keep vectorizer consistent with training
            X = self.vectorizer.transform([text])
            results["nb"] = "spam" if int(self.nb.predict(X)[0]) == 1 else "ham"
            results["svm"] = "spam" if int(self.svm.predict(X)[0]) == 1 else "ham"

        if self.hf:
            results["hf"] = self.hf.predict(text)

        return results
