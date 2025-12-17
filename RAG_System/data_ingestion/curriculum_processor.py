import json
from pathlib import Path
from skill_engine.skill_extractor import extract_skills

def process_curriculum(curriculum_path: str = None):
    """
    Process curriculum JSON and extract all modules with metadata.
    
    Returns:
        curriculum_dict: Original curriculum data
        all_modules: List of module chunks with metadata
    """
    if curriculum_path is None:
        curriculum_path = Path(__file__).parent.parent.parent / "data" / "curriculum.json"
    
    with open(curriculum_path) as f:
        curriculum = json.load(f)
    
    all_modules = []
    
    # Process each course
    for course in curriculum.get("courses", []):
        course_id = course.get("id")
        course_name = course.get("courseName", "")
        
        # Process each module in the course
        for module in course.get("modules", []):
            module_id = module.get("id")
            module_title = module.get("title", "")
            module_desc = module.get("fullDescription", "")
            
            # Extract skills from module description
            module_skills = extract_skills(module_desc)
            
            module_chunk = {
                "text": f"{module_title}\n{module_desc}",
                "metadata": {
                    "courseId": course_id,
                    "courseName": course_name,
                    "moduleId": module_id,
                    "moduleTitle": module_title,
                    "moduleSkills": module_skills,
                    "shortDescription": module.get("shortDescription", "")
                }
            }
            
            all_modules.append(module_chunk)
    
    return curriculum, all_modules
