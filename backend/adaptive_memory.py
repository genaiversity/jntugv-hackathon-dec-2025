import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[0] / "data"
DATA_DIR.mkdir(exist_ok=True)
MEMORY_FILE = DATA_DIR / "feedback_memory.json"

def load_memory():
    if MEMORY_FILE.exists():
        return json.loads(MEMORY_FILE.read_text())
    return []

def save_feedback(text, correct_label):
    data = load_memory()
    data.append({"text": text, "label": correct_label})
    MEMORY_FILE.write_text(json.dumps(data, indent=2))
