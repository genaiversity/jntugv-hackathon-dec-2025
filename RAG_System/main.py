from dotenv import load_dotenv
load_dotenv()

from data_ingestion.job_cleaner import clean_jobs
from data_ingestion.curriculum_processor import process_curriculum
from skill_engine.skill_extractor import extract_skills
from skill_engine.skill_trends import calculate_trends, get_trending_skills
from reasoning.gap_analysis import analyze_gap
from rag.vector_store import VectorStore

import json
from pathlib import Path

# ================== CONFIGURATION ==================
SELECTED_COURSE_ID = 1  # Course ID for "Generative AI"
SKILL_TRENDING_THRESHOLD = 0.30

# ================== STEP 1: Load Data ==================
print("[STEP 1] Loading curriculum and job data...")
curriculum, all_curriculum_modules = process_curriculum()
job_chunks, job_skills_list = clean_jobs()
print(f"  ✓ Loaded {len(all_curriculum_modules)} curriculum modules")
print(f"  ✓ Loaded {len(job_chunks)} job chunks from {len(job_skills_list)} jobs")

# Get selected course
selected_course = None
selected_course_modules = []

for course in curriculum.get("courses", []):
    if course["id"] == SELECTED_COURSE_ID:
        selected_course = course
        selected_course_modules = [
            m for m in all_curriculum_modules 
            if m["metadata"].get("courseId") == SELECTED_COURSE_ID
        ]
        break

if not selected_course:
    print(f"  ❌ Course ID {SELECTED_COURSE_ID} not found")
    exit(1)

SELECTED_COURSE = selected_course["courseName"]
print(f"  ✓ Selected course: {SELECTED_COURSE} (ID: {SELECTED_COURSE_ID})")
print(f"  ✓ Found {len(selected_course_modules)} modules for this course")

# ================== STEP 2: Calculate Skill Trends ==================
print("\n[STEP 2] Calculating skill trends from all jobs...")
skill_frequency = calculate_trends(job_skills_list)
trending_skills = get_trending_skills(skill_frequency, len(job_skills_list), SKILL_TRENDING_THRESHOLD)
print(f"  ✓ Found {len(skill_frequency)} unique skills")
print(f"  ✓ {len(trending_skills)} trending skills (>= 30% frequency)")
print(f"  Sample trending skills: {trending_skills[:10]}")

# ================== STEP 3: Match Jobs to Course ==================
print(f"\n[STEP 3] Matching jobs to '{SELECTED_COURSE}' course...")

matched_job_chunks = []
for chunk in job_chunks:
    job_skills = chunk["metadata"].get("extractedSkills", [])
    if any(skill.lower() in [s.lower() for s in trending_skills] for skill in job_skills):
        matched_job_chunks.append(chunk)

print(f"  ✓ Matched {len(matched_job_chunks)} jobs with course skills")

print("\n  Matched Jobs:")
for i, chunk in enumerate(matched_job_chunks[:10], 1):
    job_title = chunk["metadata"].get("jobTitle")
    company = chunk["metadata"].get("company")
    skills = chunk["metadata"].get("extractedSkills", [])
    print(f"    {i}. {job_title} @ {company}")
    print(f"       Skills: {', '.join(skills[:5])}")

retrieved_job_chunks = matched_job_chunks[:10]

# ================== STEP 4: Gap Analysis ==================
print(f"\n[STEP 4] Running gap analysis for '{SELECTED_COURSE}'...")
print("  Analyzing curriculum against matched job market data...")

gap_analysis_result = analyze_gap(
    course_name=SELECTED_COURSE,
    course_id=SELECTED_COURSE_ID,
    retrieved_job_chunks=retrieved_job_chunks,
    curriculum_modules=selected_course_modules,
    trending_skills=trending_skills,
    skill_frequency=skill_frequency
)

print("\n" + "="*60)
print(f"CURRICULUM GAP ANALYSIS RESULTS - {SELECTED_COURSE}")
print("="*60)

print(json.dumps(gap_analysis_result, indent=2))

# Save to RAG_System directory (for watch script to copy)
rag_output_file = Path(__file__).parent / f"gap_analysis_{SELECTED_COURSE_ID}.json"
with open(rag_output_file, "w") as f:
    json.dump(gap_analysis_result, f, indent=2)

# Also save to Frontend/public directory
output_dir = Path(__file__).parent.parent / "Frontend" / "public"
output_dir.mkdir(parents=True, exist_ok=True)  # Create directory if it doesn't exist
output_file = output_dir / f"gap_analysis_{SELECTED_COURSE_ID}.json"
with open(output_file, "w") as f:
    json.dump(gap_analysis_result, f, indent=2)
print(f"\n✓ Results saved to: {rag_output_file}")
print(f"✓ Results saved to: {output_file}")

