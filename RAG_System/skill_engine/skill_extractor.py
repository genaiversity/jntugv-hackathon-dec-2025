import re
from typing import List

# Comprehensive skill/tool/framework database (NO API CALLS)
TECH_SKILLS_DB = {
    # Programming Languages
    "python": ["python", "py"],
    "javascript": ["javascript", "js", "node.js", "nodejs"],
    "typescript": ["typescript", "ts"],
    "java": ["java"],
    "cpp": ["c++", "cpp"],
    "sql": ["sql", "postgres", "mysql", "postgresql", "t-sql"],
    "go": ["golang", "go lang"],
    "rust": ["rust"],
    "kotlin": ["kotlin"],
    "scala": ["scala"],
    
    # ML/AI Frameworks
    "tensorflow": ["tensorflow", "tf"],
    "pytorch": ["pytorch", "torch"],
    "keras": ["keras"],
    "scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
    "hugging face": ["hugging face", "huggingface"],
    "langchain": ["langchain", "lang chain"],
    "openai": ["openai", "gpt"],
    
    # Data Processing
    "pandas": ["pandas", "pd"],
    "numpy": ["numpy", "np"],
    "apache spark": ["spark", "apache spark", "pyspark"],
    "hadoop": ["hadoop"],
    "kafka": ["kafka"],
    
    # Web & APIs
    "fastapi": ["fastapi", "fast api"],
    "django": ["django"],
    "flask": ["flask"],
    "rest api": ["rest api", "restful"],
    "graphql": ["graphql"],
    
    # DevOps & Cloud
    "docker": ["docker"],
    "kubernetes": ["kubernetes", "k8s"],
    "aws": ["aws", "amazon web services"],
    "azure": ["azure", "microsoft azure"],
    "gcp": ["gcp", "google cloud", "cloud platform"],
    "ci/cd": ["ci/cd", "cicd", "continuous integration"],
    
    # NLP & Vision
    "nlp": ["nlp", "natural language processing"],
    "llm": ["llm", "large language model", "language model"],
    "rag": ["rag", "retrieval augmented generation"],
    "embeddings": ["embeddings", "embedding"],
    "transformers": ["transformers", "transformer"],
    "bert": ["bert"],
    "gpt": ["gpt"],
    "opencv": ["opencv", "cv2"],
    "computer vision": ["computer vision", "cv"],
    
    # Databases
    "mongodb": ["mongodb", "mongo"],
    "redis": ["redis"],
    "elasticsearch": ["elasticsearch"],
    "cassandra": ["cassandra"],
    "dynamodb": ["dynamodb"],
    
    # Tools & Concepts
    "git": ["git", "github", "gitlab"],
    "jenkins": ["jenkins"],
    "feature engineering": ["feature engineering"],
    "model deployment": ["model deployment", "deployment"],
    "data preprocessing": ["data preprocessing", "preprocessing"],
    "data cleaning": ["data cleaning", "cleaning"],
    "data pipeline": ["data pipeline", "pipeline"],
    "supervised learning": ["supervised learning"],
    "unsupervised learning": ["unsupervised learning"],
    "deep learning": ["deep learning", "dl"],
    "machine learning": ["machine learning", "ml"],
    "statistics": ["statistics", "statistical"],
    "visualization": ["visualization", "tableau", "power bi", "matplotlib", "seaborn"],
    "distributed systems": ["distributed systems"],
    "cnn": ["cnn", "convolutional neural network"],
    "rnn": ["rnn", "recurrent neural network"],
    "lstm": ["lstm"],
    "model evaluation": ["model evaluation", "evaluation"],
}

def extract_skills(text: str) -> List[str]:
    """
    Extract technical skills, tools, and frameworks from text using keyword matching.
    NO API CALLS - completely local and instant.
    
    Args:
        text: Job description or text to extract skills from
        
    Returns:
        List of extracted skills (normalized names)
    """
    if not text:
        return []
    
    # Convert text to lowercase for matching
    text_lower = text.lower()
    
    # Track extracted skills (avoid duplicates)
    extracted = set()
    
    # Search for each skill in the database
    for canonical_name, keywords in TECH_SKILLS_DB.items():
        for keyword in keywords:
            # Use word boundary matching to avoid partial matches
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, text_lower):
                extracted.add(canonical_name)
                break  # Found this skill, move to next
    
    # Return sorted list for consistency
    return sorted(list(extracted))
