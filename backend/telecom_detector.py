TELECOM_SENDERS = ["jio", "airtel", "vi", "vodafone", "idea", "bsnl"]

def is_telecom_sender(sender):
    sender = sender.lower()
    return any(t in sender for t in TELECOM_SENDERS)

def telecom_spam_keywords(text):
    keywords = ["recharge today", "pack expires", "validity ends", "top up", "offer ends"]
    return any(k in text.lower() for k in keywords)
