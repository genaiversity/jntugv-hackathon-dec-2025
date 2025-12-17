import json
import re
from pathlib import Path
from skill_engine.skill_extractor import extract_skills

def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> list[str]:
    """
    Split text into chunks of approximately chunk_size tokens with overlap.
    
    Args:
        text: Text to chunk
        chunk_size: Target number of words per chunk (approximately)
        overlap: Number of words to overlap between chunks
        
    Returns:
        List of text chunks
    """
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    
    return chunks

def clean_jobs(jobs_file_path: str = None):
    """
    Clean and chunk job data with metadata extraction.
    
    Returns:
        job_chunks: List of dicts with chunk text and metadata
        job_skills_list: List of skill lists (for trend calculation)
    """
    if jobs_file_path is None:
        jobs_file_path = Path(__file__).parent.parent.parent / "data" / "jobs.json"
    
    with open(jobs_file_path) as f:
        jobs = json.load(f)

    job_chunks = []
    job_skills_list = []
    
    for job in jobs:
        title = job.get("title", "")
        description = job.get("description", "")
        company = job.get("company", "")
        location = job.get("location", "")
        
        # Clean description
        clean_desc = re.sub(r"\s+", " ", description).strip()
        
        # Extract skills from full job description
        skills = extract_skills(clean_desc)
        job_skills_list.append(skills)
        
        # Chunk the job description (200-500 tokens ~ 150-375 words)
        chunks = chunk_text(clean_desc, chunk_size=300, overlap=50)
        
        # Create chunk records with metadata
        for i, chunk in enumerate(chunks):
            job_chunk = {
                "text": chunk,
                "metadata": {
                    "jobTitle": title,
                    "company": company,
                    "location": location,
                    "extractedSkills": skills,
                    "chunkIndex": i,
                    "totalChunks": len(chunks)
                }
            }
            job_chunks.append(job_chunk)
    
    return job_chunks, job_skills_list

