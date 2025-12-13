from fastapi import FastAPI
from pathlib import Path
from .sms_agent import SmsSpamAgent

app = FastAPI(title="SMS Spam Agent API")

# Try to load pre-trained models from ./models if available
MODELS_DIR = Path(__file__).resolve().parents[0] / "models"
nb_path = MODELS_DIR / "nb.joblib"
svm_path = MODELS_DIR / "svm.joblib"
vec_path = MODELS_DIR / "vectorizer.joblib"

agent = SmsSpamAgent(
    nb_path=str(nb_path) if nb_path.exists() else None,
    svm_path=str(svm_path) if svm_path.exists() else None,
    vectorizer_path=str(vec_path) if vec_path.exists() else None,
    use_hf=True,
)

@app.post("/predict")
def predict(payload: dict):
    return agent.predict(payload.get("text", ""))
