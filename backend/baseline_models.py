import joblib
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC

def train_nb(X, y):
    model = MultinomialNB()
    model.fit(X, y)
    return model

def train_svm(X, y):
    model = LinearSVC()
    model.fit(X, y)
    return model

def save(model, path):
    joblib.dump(model, path)

def load(path):
    return joblib.load(path)

def save_vectorizer(vec, path):
    joblib.dump(vec, path)

def load_vectorizer(path):
    return joblib.load(path)
