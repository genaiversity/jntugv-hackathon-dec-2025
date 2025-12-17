from collections import Counter

def calculate_trends(all_skills):
    """
    Calculate skill frequency from all extracted skills.
    
    Returns:
        Dict with skill: count
    """
    counter = Counter()
    for skills in all_skills:
        for skill in skills:
            counter[skill] += 1
    return dict(counter)

def get_trending_skills(skill_frequency: dict, total_jobs: int, threshold: float = 0.3) -> list:
    """
    Identify trending skills based on frequency threshold.
    
    A skill is trending if it appears in >= threshold% of all jobs.
    
    Args:
        skill_frequency: Dict of skill: count
        total_jobs: Total number of jobs analyzed
        threshold: Minimum percentage (default 0.3 = 30%)
        
    Returns:
        List of trending skill strings
    """
    min_count = max(1, int(total_jobs * threshold))
    trending = [skill for skill, count in skill_frequency.items() if count >= min_count]
    return sorted(trending)

