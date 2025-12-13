import re

SPAM_REGEX = [
    re.compile(r"free\s+\w+", re.I),
    re.compile(r"win\s+\w+", re.I),
    re.compile(r"claim\s+now", re.I),
    re.compile(r"http[s]?://", re.I),
]

PROFANITY = {"lottery", "prize", "winner", "cash"}

def rule_score(text: str) -> int:
    score = 0
    for rx in SPAM_REGEX:
        if rx.search(text):
            score += 1
    for word in PROFANITY:
        if word in text.lower():
            score += 1
    return score
