import time
from .spam_store import auto_delete

def run_scheduler(interval_hours=24):
    while True:
        time.sleep(interval_hours * 3600)
        auto_delete()
