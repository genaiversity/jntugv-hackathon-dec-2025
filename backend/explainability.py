def generate_explanation(text, rule_hits, model_confidence):
    reasons = []
    if rule_hits.get("url"):
        reasons.append("Message contains a suspicious URL")
    if rule_hits.get("keywords"):
        reasons.append("Spam-related keywords detected")
    if rule_hits.get("urgency"):
        reasons.append("Urgent or pressure-based language found")

    if model_confidence > 0.9:
        reasons.append("ML model confidence is very high")
    elif model_confidence < 0.6:
        reasons.append("Low confidence prediction – needs review")

    return reasons
