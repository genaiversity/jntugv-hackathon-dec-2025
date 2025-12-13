# API & Model Training

## FastAPI Endpoints

- POST `/predict`
  - Request Body: `{ "text": "Your SMS message here" }`
  - Response: `{ "nb": "spam|ham", "svm": "spam|ham", "hf": { "label": ..., "score": ... }, "rules_score": <int> }`

## Training local models (using `backend/data/spam.csv`)

Train and save local MultinomialNB and LinearSVC (SVM) models along with the TF-IDF vectorizer using the provided script:

```bash
python -m backend.scripts.train_spam
```

This will create a `backend/models/` directory with:
- `nb.joblib` — MultinomialNB model
- `svm.joblib` — LinearSVC model
- `vectorizer.joblib` — TF-IDF vectorizer
- `metrics.txt` — evaluation metrics on a held-out test set

After training, the FastAPI server will automatically load these models (if present) when started via:

```bash
uvicorn backend.main:app --reload
```
