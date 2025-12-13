try:
    from transformers import pipeline
except ImportError:
    pipeline = None

class HFSpamClassifier:
    def __init__(self):
        if pipeline:
            self.pipe = pipeline("text-classification", model="mrm8488/bert-tiny-finetuned-sms-spam-detection")
        else:
            self.pipe = None

    def predict(self, text: str):
        if not self.pipe:
            return {"label": "UNKNOWN", "score": 0.0}
        return self.pipe(text)[0]
