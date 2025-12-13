import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[0] / "data"
DATA_DIR.mkdir(exist_ok=True)
SPAM_FILE = DATA_DIR / "spam_messages.json"

def load_spam():
    if SPAM_FILE.exists():
        return json.loads(SPAM_FILE.read_text())
    return []

def save_spam(msg):
    data = load_spam()
    data.append(msg)
    SPAM_FILE.write_text(json.dumps(data, indent=2))

def auto_delete():
    SPAM_FILE.write_text("[]")
