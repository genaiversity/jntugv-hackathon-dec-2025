"""
Phase-specific prompts for generating startup artifacts.
Each phase builds on previous phases' outputs.

Prompting patterns intentionally used in this repo:
- Zero-shot prompting is the default (instructions only).
- Few-shot prompting is used for strict formats (especially JSON/code generation).
- Prompt chaining is implemented in backend orchestration (later phase prompts include earlier artifacts).
- For complex tasks, prompts may request internal step-by-step planning and a self-check,
  while instructing the model to output only the final answer.
"""

# Internal reasoning / meta-prompting helpers.
# These are appended to selected prompts to improve consistency without changing response schemas.
INTERNAL_PLANNING_NOTE = """

Process (do this internally, do not include your reasoning in the output):
1) Identify missing info and make minimal, clearly-stated assumptions.
2) Explore 2–3 plausible options/approaches where relevant.
3) Select the best option based on the constraints and justify briefly in the final answer.
4) Self-check for completeness, clarity, and alignment with the requested format.
"""

SYSTEM_PROMPT = """You are an expert startup advisor and product strategist helping students and early-stage founders transform raw ideas into validated, actionable mini-startup concepts.

Your outputs should be:
- Clear and actionable
- Tailored to the user's experience level and constraints
- Educational (explain WHY something matters, not just WHAT)
- Realistic for small teams with limited resources

When a task is complex, think step-by-step internally and do a quick self-check before answering.
Do not reveal chain-of-thought reasoning; only output the final answer.

Always structure your responses in clear sections with headers."""


PHASE_PROMPTS = {
    "ideation": {
        "problem_statement": """Based on this startup idea, create a refined problem statement.

**Project:** {name}
**Description:** {description}
**User Type:** {user_type}
**Constraints:** {constraints}
**Skills:** {skills}
**Time Available:** {time_available}

Generate a clear problem statement that includes:
1. **The Problem** - What specific pain point or gap exists?
2. **Who Experiences It** - Who suffers from this problem?
3. **Current Solutions** - How do people currently address it (and why that's inadequate)?
4. **Impact** - Why does solving this matter?

Keep it concise but insightful. Write for someone who needs to explain this in 30 seconds.""",

        "personas": """Based on this startup idea, create 2-3 target user personas.

**Project:** {name}
**Description:** {description}
**Problem Statement:** {problem_statement}

For each persona, include:
1. **Name & Role** - Give them a realistic name and title
2. **Demographics** - Age, background, situation
3. **Goals** - What are they trying to achieve?
4. **Pain Points** - What frustrates them about current solutions?
5. **Jobs to Be Done** - What tasks do they need to accomplish?
6. **Why They'd Use This** - Specific value proposition for them

Make personas distinct and realistic for {user_type} building this.""",

        "idea_variants": """Based on this startup idea, generate 3 solution variants.

**Project:** {name}
**Description:** {description}
**Problem Statement:** {problem_statement}
**Personas:** {personas}

Create 3 different approaches to solving this problem:

**Variant 1: MVP/Simple** - Minimal viable approach, buildable in 1-2 weeks
**Variant 2: Standard** - More complete solution, buildable in 1-2 months  
**Variant 3: Ambitious** - Full vision with advanced features

For each variant, include:
- Core concept (2-3 sentences)
- Key differentiator
- Main risk/challenge
- Best suited for: (which persona)

The user has these constraints: {constraints}
Available skills: {skills}
Time available: {time_available}"""
    },

    "concept_design": {
        "feature_list": """Based on the ideation phase, create a prioritized feature list.

**Project:** {name}
**Description:** {description}
**Problem Statement:** {problem_statement}
**Personas:** {personas}
**Selected Approach:** {idea_variants}

Create a feature breakdown:

**Must-Have (MVP)** - Features needed for day-1 launch
**Should-Have** - Important but can wait for v1.1
**Nice-to-Have** - Future enhancements

For each feature:
- Feature name
- One-line description
- Which persona benefits most
- Complexity estimate (Low/Medium/High)

Consider the user's constraints: {constraints}
Skills: {skills}
Time: {time_available}""",

        "user_flows": """Create user journey flows for the main features.

**Project:** {name}
**Features:** {feature_list}
**Personas:** {personas}

Design 2-3 key user flows:

For each flow:
1. **Flow Name** (e.g., "New User Onboarding")
2. **Persona** - Which user
3. **Goal** - What they want to accomplish
4. **Steps** - Numbered sequence (keep to 5-8 steps)
5. **Success State** - How do they know it worked?
6. **Edge Cases** - What could go wrong?

Format flows in a way that can be easily converted to diagrams (Mermaid-compatible descriptions are great)."""
    },

    "launch_content": {
        "landing_page": """Create landing page copy for this product.

**Project:** {name}
**Description:** {description}
**Problem Statement:** {problem_statement}
**Features:** {feature_list}
**Personas:** {personas}

Generate complete landing page content:

**Hero Section:**
- Headline (powerful, benefit-focused)
- Subheadline (clarify what it is)
- CTA button text

**Value Propositions:** (3-4 key benefits with icons suggestions)

**How It Works:** (3-4 simple steps)

**Features Section:** (top 4-6 features with descriptions)

**Social Proof Section:** (suggest testimonial themes/quotes)

**FAQ Section:** (5-6 common questions and answers)

**Final CTA:** (closing statement + button)

Write in a tone appropriate for {user_type} users.""",

        "pitch_outline": """Create a pitch outline for this startup.

**Project:** {name}
**Description:** {description}
**Problem Statement:** {problem_statement}
**Personas:** {personas}
**Features:** {feature_list}

Generate a pitch structure (2-3 minute verbal pitch):

1. **Hook** (Opening line to grab attention)
2. **Problem** (The pain point - make it relatable)
3. **Solution** (Your product in one sentence)
4. **How It Works** (Simple explanation)
5. **Target Market** (Who and how big)
6. **Traction/Validation** (What you've learned or built)
7. **Business Model** (How you'll make money - even if simple)
8. **Ask** (What you need - feedback, users, team, funding)
9. **Memorable Close** (End on a strong note)

Also provide:
- 3 tagline options
- One-liner elevator pitch
- 3 potential objections and how to address them""",

        "taglines": """Generate marketing taglines and messaging.

**Project:** {name}
**Description:** {description}
**Problem Statement:** {problem_statement}
**Value Props:** {landing_page}

Create:
1. **Primary Tagline** - The main slogan (5-8 words)
2. **5 Alternative Taglines** - Different angles
3. **Elevator Pitch** - 30-second version
4. **Tweet-length Description** - Under 280 characters
5. **Email Subject Lines** - 5 options for outreach
6. **Social Media Bio** - For Twitter/LinkedIn"""
    },

    "validation": {
        "experiment_plan": """Create a validation experiment plan.

**Project:** {name}
**Description:** {description}
**Problem Statement:** {problem_statement}
**Personas:** {personas}
**Features:** {feature_list}
**User Type:** {user_type}
**Constraints:** {constraints}
**Time Available:** {time_available}

Design 3-4 experiments to validate assumptions:

For each experiment:
1. **Hypothesis** - What assumption are you testing?
2. **Experiment Type** - (Survey, Fake Door, Interview, Landing Page Test, Manual MVP, etc.)
3. **Method** - Step-by-step how to run it
4. **Success Criteria** - What result would validate the hypothesis?
5. **Timeline** - How long will it take?
6. **Resources Needed** - What do you need?

Prioritize experiments that are:
- Fast (can be done given time constraints)
- Cheap (no/low budget)
- Learning-focused (provide clear insights)""",

        "survey_questions": """Create survey questions for user research.

**Project:** {name}
**Problem Statement:** {problem_statement}
**Personas:** {personas}
**Experiments:** {experiment_plan}

Design a user research survey (15-20 questions max):

**Screener Questions** (2-3 to qualify respondents)

**Problem Validation** (4-5 questions)
- Do they experience the problem?
- How severe is it?
- How often?

**Current Behavior** (3-4 questions)
- How do they currently solve it?
- What tools do they use?
- What's frustrating about current solutions?

**Solution Interest** (3-4 questions)
- Would they use this?
- What features matter most?
- How much would they pay?

**Demographics** (2-3 questions)

Include mix of:
- Multiple choice
- Rating scales (1-5)
- Open-ended (sparingly)""",

        "metrics": """Define key metrics to track.

**Project:** {name}
**Features:** {feature_list}
**Experiments:** {experiment_plan}
**User Type:** {user_type}

Create a metrics framework:

**North Star Metric** - The ONE metric that best captures value delivered

**Acquisition Metrics**
- How will you measure people finding you?

**Activation Metrics**
- How will you measure first-time value?

**Engagement Metrics**
- How will you measure ongoing usage?

**Retention Metrics**
- How will you measure people coming back?

**Revenue Metrics** (even if free/pre-revenue)
- How will you measure business viability?

For each metric:
- Definition
- How to measure it
- Target goal for MVP
- Why it matters"""
    },

    "tech_build": {
        "tech_stack": """Recommend a tech stack for this project.

**Project:** {name}
**Features:** {feature_list}
**User Flows:** {user_flows}
**User Type:** {user_type}
**Skills:** {skills}
**Time Available:** {time_available}
**Constraints:** {constraints}

First, briefly evaluate 2–3 viable stack options (different levels of complexity) and then pick ONE recommended stack.

For each option, include:
- What it is (frontend/backend/db/auth/deploy)
- Pros/cons for this project
- Risk (what could go wrong)

Then provide the final recommended stack with:

**Frontend**
- Recommendation
- Why it fits

**Backend**
- Recommendation
- Why it fits

**Database**
- Recommendation
- Why it fits

**Authentication**
- Recommendation

**Hosting/Deployment**
- Recommendation
- Rough cost estimate

**Additional Services**

**Development Tools**

Constraints to optimize for:
- User skill level: {skills}
- Time: {time_available}
- Keep it MVP-simple for {user_type}

""" + INTERNAL_PLANNING_NOTE,

        "api_design": """Design the API structure for this project.

**Project:** {name}
**Features:** {feature_list}
**User Flows:** {user_flows}
**Tech Stack:** {tech_stack}

Design an MVP-friendly RESTful API.

Before you write endpoints, identify:
1) Core resources (entities)
2) The 2–3 most important flows to support first (from the user flows)

Then provide:

**Core Resources**

**Endpoints** (grouped by resource)
- GET /resource
- GET /resource/:id
- POST /resource
- PUT /resource/:id
- DELETE /resource/:id

**Authentication**

**Key request/response examples** (2–3 endpoints)

**Error handling** (one standard JSON error shape)

Few-shot example of the response style (use your project’s real names/fields below):

Example error shape:
{
  "detail": "Human-readable message",
  "code": "SOME_ERROR_CODE",
  "meta": {"field": "optional"}
}

Keep it simple and appropriate for MVP scope.

""" + INTERNAL_PLANNING_NOTE,

        "project_tasks": """Break down the project into development tasks.

**Project:** {name}
**Features:** {feature_list}
**Tech Stack:** {tech_stack}
**API Design:** {api_design}
**Time Available:** {time_available}

Create a task breakdown:

**Week 1: Foundation**
- Setup tasks
- Core infrastructure

**Week 2: Core Features**
- Main functionality tasks

**Week 3: Polish & Launch**
- Testing, refinement
- Deployment

For each task:
- Task name
- Description (1-2 sentences)
- Estimated time
- Dependencies (what needs to be done first)
- Priority (P0/P1/P2)

Format as a checklist that can be imported to GitHub Issues or Notion."""
    },

    "code_generation": {
        "generated_app": """You are an expert full-stack developer generating a starter application.

CRITICAL JSON FORMATTING RULES:
1. Output ONLY valid JSON - no markdown code blocks, no explanations before or after
2. Start your response with { and end with }
3. ALL string content must have special characters escaped:
   - Newlines: use \\n (two characters: backslash + n)
   - Tabs: use \\t
   - Quotes inside strings: use \\"
   - Backslashes: use \\\\ (two characters: backslash + backslash)
4. Do NOT use actual line breaks inside JSON string values
5. Each file's content must be a single-line JSON string with escaped newlines

REQUIRED JSON FORMAT:
{"files": [{"path": "filename.ext", "content": "line1\\nline2\\nline3"}], "instructions": "Setup steps here"}

EXAMPLE OF CORRECT OUTPUT:
{"files": [{"path": "index.html", "content": "<!DOCTYPE html>\\n<html>\\n<head>\\n  <title>App</title>\\n</head>\\n<body>\\n  <h1>Hello</h1>\\n</body>\\n</html>"}, {"path": "style.css", "content": "body {\\n  margin: 0;\\n  padding: 20px;\\n}"}], "instructions": "Open index.html in a browser"}

FILES TO GENERATE (based on tech stack):

For HTML/CSS/JS projects:
- index.html (main page)
- style.css (styles)
- script.js (functionality)
- README.md

For Python/Flask/FastAPI:
- app.py or main.py
- requirements.txt
- config.py
- models.py
- templates/index.html
- static/css/style.css
- README.md

For Node.js/Express:
- package.json
- server.js or index.js
- routes/index.js
- public/index.html
- public/css/style.css
- README.md

For React/Next.js:
- package.json
- src/App.jsx or app/page.tsx
- src/components/Header.jsx
- src/index.css
- README.md

GENERATION RULES:
1. Generate 5-10 files with COMPLETE working code
2. Include proper error handling
3. Include basic styling
4. Match the specified tech stack
5. Implement the core features listed

PROJECT DETAILS:
Name: {name}
Description: {description}

TECH STACK:
{tech_stack}

FEATURES:
{feature_list}

API ENDPOINTS:
{api_design}

USER FLOWS:
{user_flows}

OUTPUT ONLY THE JSON OBJECT - NO OTHER TEXT:"""
    },

    "final_spec": {
        "full_spec": """Create a concise project specification document.

**Project:** {name}
**Description:** {description}

Using the following key inputs, create a 1-2 page executive summary:

**Problem:** {problem_statement}

**Key Features:** {feature_list}

**Tech Stack:** {tech_stack}

Write an outline first (as headings + bullets), then write the final spec.

Generate a spec with these sections:
1. Executive Summary (2-3 sentences)
2. Problem & Solution (brief)
3. Core Features (bullet points)
4. Technical Approach (brief)
5. Top 3 Risks & Mitigations
6. Immediate Next Steps (3-5 actions)

Keep it concise and actionable - this is a summary document.

""" + INTERNAL_PLANNING_NOTE
    }
}


def get_phase_artifacts(phase_type: str) -> list:
    """Get the list of artifact types for a given phase."""
    return list(PHASE_PROMPTS.get(phase_type, {}).keys())


def get_prompt(phase_type: str, artifact_type: str) -> str:
    """Get the prompt template for a specific phase and artifact."""
    return PHASE_PROMPTS.get(phase_type, {}).get(artifact_type, "")
