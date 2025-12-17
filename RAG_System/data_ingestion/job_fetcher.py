import json
from pathlib import Path

# Job fetcher is now deprecated - using pre-fetched jobs from data/jobs.json
# To fetch fresh jobs, use a different API or web scraping tool

def fetch_jobs_deprecated(query="GenAI Engineer"):
    """
    DEPRECATED: This function used Serper API which has been removed.
    Use pre-fetched jobs from data/jobs.json instead.
    """
    print("❌ Job fetching with Serper is disabled. Using pre-fetched jobs from data/jobs.json")
    return []