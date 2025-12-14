from sqlmodel import Session, select
from datetime import datetime
from typing import Optional, Dict, Any
import json

from .models import Project, Phase, Artifact, PhaseType, ArtifactType
from .llm import call_primary_model, call_coder_model
from .prompts import SYSTEM_PROMPT, get_phase_artifacts, get_prompt


PHASE_ORDER = [
    PhaseType.IDEATION,
    PhaseType.CONCEPT_DESIGN,
    PhaseType.LAUNCH_CONTENT,
    PhaseType.VALIDATION,
    PhaseType.TECH_BUILD,
    PhaseType.CODE_GENERATION,
    PhaseType.FINAL_SPEC
]

ARTIFACT_TYPE_MAP = {
    "problem_statement": ArtifactType.PROBLEM_STATEMENT,
    "personas": ArtifactType.PERSONAS,
    "idea_variants": ArtifactType.IDEA_VARIANTS,
    "feature_list": ArtifactType.FEATURE_LIST,
    "user_flows": ArtifactType.USER_FLOWS,
    "landing_page": ArtifactType.LANDING_PAGE,
    "pitch_outline": ArtifactType.PITCH_OUTLINE,
    "taglines": ArtifactType.TAGLINES,
    "experiment_plan": ArtifactType.EXPERIMENT_PLAN,
    "survey_questions": ArtifactType.SURVEY_QUESTIONS,
    "metrics": ArtifactType.METRICS,
    "tech_stack": ArtifactType.TECH_STACK,
    "api_design": ArtifactType.API_DESIGN,
    "project_tasks": ArtifactType.PROJECT_TASKS,
    "starter_code": ArtifactType.STARTER_CODE,
    "generated_app": ArtifactType.GENERATED_APP,
    "full_spec": ArtifactType.FULL_SPEC
}

TECH_ARTIFACTS = {"tech_stack", "api_design", "starter_code", "project_tasks", "generated_app"}


def ensure_project_phases(session: Session, project: Project) -> list[Phase]:
    """Ensure the project has all phases defined in PHASE_ORDER.

    This keeps older databases/projects compatible when new phases are added.
    """
    existing = session.exec(select(Phase).where(Phase.project_id == project.id)).all()
    existing_types = {p.phase_type for p in existing}

    created: list[Phase] = []
    for phase_type in PHASE_ORDER:
        if phase_type in existing_types:
            continue
        phase = Phase(project_id=project.id, phase_type=phase_type, status="pending")
        session.add(phase)
        created.append(phase)

    if created:
        session.commit()
        for p in created:
            session.refresh(p)

    # Return list sorted in the canonical phase order (not lexicographic)
    phases = session.exec(select(Phase).where(Phase.project_id == project.id)).all()
    phases.sort(key=lambda p: PHASE_ORDER.index(p.phase_type) if p.phase_type in PHASE_ORDER else 999)
    return phases


def create_project_phases(session: Session, project: Project) -> list[Phase]:
    """Create all phases for a new project."""
    phases = []
    for phase_type in PHASE_ORDER:
        phase = Phase(
            project_id=project.id,
            phase_type=phase_type,
            status="pending"
        )
        session.add(phase)
        phases.append(phase)
    session.commit()
    for p in phases:
        session.refresh(p)
    return phases


def get_project_context(session: Session, project: Project) -> Dict[str, Any]:
    """Gather all existing artifacts for prompt context."""
    context: Dict[str, Any] = {
        "name": project.name,
        "description": project.description,
        "user_type": project.user_type.value,
        "constraints": project.constraints or "None specified",
        "skills": project.skills or "Not specified",
        "time_available": project.time_available or "Not specified",
    }

    # Get all artifacts for this project
    statement = (
        select(Artifact)
        .join(Phase)
        .where(Phase.project_id == project.id)
        .order_by(Artifact.created_at)
    )
    artifacts = session.exec(statement).all()

    for artifact in artifacts:
        key = artifact.artifact_type.value
        context[key] = artifact.content

    # Convenience: provide a single string blob for prompts that want the whole context.
    # Keep it stable/LLM-friendly.
    context["project_context"] = json.dumps(context, indent=2, ensure_ascii=False)

    return context


def build_prompt(template: str, context: Dict[str, Any]) -> str:
    """Build prompt by filling in context values."""
    prompt = template
    for key, value in context.items():
        placeholder = "{" + key + "}"
        if placeholder in prompt:
            prompt = prompt.replace(placeholder, str(value))
    # Remove any unfilled placeholders.
    # IMPORTANT: only treat {placeholder_name} (alnum/underscore) as placeholders.
    # Do NOT replace arbitrary brace blocks, otherwise templates that include JSON/CSS examples
    # get corrupted (e.g. {"files": ...} becomes "[Not yet generated]").
    import re
    prompt = re.sub(r'\{[A-Za-z_][A-Za-z0-9_]*\}', '[Not yet generated]', prompt)
    return prompt


async def generate_phase_artifacts(
    session: Session,
    project: Project,
    phase: Phase,
    regenerate: bool = False,
    custom_instructions: Optional[str] = None
) -> list[Artifact]:
    """Generate all artifacts for a phase using LLM."""
    
    phase.status = "in_progress"
    phase.started_at = datetime.utcnow()
    session.add(phase)
    session.commit()
    
    artifact_keys = get_phase_artifacts(phase.phase_type.value)
    context = get_project_context(session, project)
    generated_artifacts = []
    
    for artifact_key in artifact_keys:
        artifact_type = ARTIFACT_TYPE_MAP.get(artifact_key)
        if not artifact_type:
            continue
        
        # Check if artifact already exists and we're not regenerating
        if not regenerate:
            existing = session.exec(
                select(Artifact)
                .where(Artifact.phase_id == phase.id)
                .where(Artifact.artifact_type == artifact_type)
            ).first()
            if existing:
                generated_artifacts.append(existing)
                context[artifact_key] = existing.content
                continue
        
        # Get prompt template and build full prompt
        template = get_prompt(phase.phase_type.value, artifact_key)
        if not template:
            continue

        # Guardrail: code generation requires prior context. If it's missing, don't call the LLM
        # (it tends to produce malformed JSON like "[Not yet generated], ...").
        if phase.phase_type == PhaseType.CODE_GENERATION and artifact_key in {"generated_app", "starter_code"}:
            required_keys = ["problem_statement", "feature_list", "user_flows", "tech_stack", "api_design"]
            missing = [k for k in required_keys if not context.get(k)]
            if missing:
                content = (
                    "[Generation failed: missing prerequisite artifacts. Please generate earlier phases first.]\n"
                    f"Missing: {', '.join(missing)}"
                )
                model_used = "error"
            else:
                prompt = build_prompt(template, context)

                if custom_instructions:
                    prompt += f"\n\nAdditional instructions: {custom_instructions}"

                # Choose model based on artifact type
                use_coder = artifact_key in TECH_ARTIFACTS

                try:
                    if use_coder:
                        content = await call_coder_model(prompt, SYSTEM_PROMPT)
                        model_used = "coder"
                    else:
                        content = await call_primary_model(prompt, SYSTEM_PROMPT)
                        model_used = "primary"
                except Exception as e:
                    content = f"[Generation failed: {str(e)}]"
                    model_used = "error"
        else:
            prompt = build_prompt(template, context)

            if custom_instructions:
                prompt += f"\n\nAdditional instructions: {custom_instructions}"

            # Choose model based on artifact type
            use_coder = artifact_key in TECH_ARTIFACTS

            try:
                if use_coder:
                    content = await call_coder_model(prompt, SYSTEM_PROMPT)
                    model_used = "coder"
                else:
                    content = await call_primary_model(prompt, SYSTEM_PROMPT)
                    model_used = "primary"
            except Exception as e:
                content = f"[Generation failed: {str(e)}]"
                model_used = "error"
        
        # Get next version number if regenerating
        version = 1
        if regenerate:
            latest = session.exec(
                select(Artifact)
                .where(Artifact.phase_id == phase.id)
                .where(Artifact.artifact_type == artifact_type)
                .order_by(Artifact.version.desc())
            ).first()
            if latest:
                version = latest.version + 1
        
        artifact = Artifact(
            phase_id=phase.id,
            artifact_type=artifact_type,
            content=content,
            version=version,
            model_used=model_used,
            prompt_used=prompt[:2000]  # Store truncated prompt for reference
        )
        session.add(artifact)
        session.commit()
        session.refresh(artifact)
        
        generated_artifacts.append(artifact)
        context[artifact_key] = content
    
    phase.status = "completed"
    phase.completed_at = datetime.utcnow()
    session.add(phase)
    session.commit()
    
    return generated_artifacts


def get_phase_by_type(session: Session, project_id: int, phase_type: PhaseType) -> Optional[Phase]:
    """Get a specific phase for a project."""
    return session.exec(
        select(Phase)
        .where(Phase.project_id == project_id)
        .where(Phase.phase_type == phase_type)
    ).first()


def get_all_artifacts(session: Session, project_id: int) -> list[Artifact]:
    """Get all artifacts for a project."""
    return session.exec(
        select(Artifact)
        .join(Phase)
        .where(Phase.project_id == project_id)
        .order_by(Phase.phase_type, Artifact.artifact_type)
    ).all()
