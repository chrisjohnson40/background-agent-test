from __future__ import annotations
import json, os, subprocess, sys, typer
from typing import List
from pydantic import BaseModel, Field

app = typer.Typer()

class Task(BaseModel):
    title: str
    body: str
    labels: List[str] = Field(default_factory=list)
    assignees: List[str] = Field(default_factory=list)
    ai_ready: bool = True

def create_issue(task: Task):
    labels = task.labels[:]
    if task.ai_ready and "fix-me" not in labels:
        labels.append("fix-me")  # OpenHands trigger
    cmd = [
        "gh","issue","create",
        "--title", task.title,
        "--body", task.body,
    ]
    if labels: cmd += ["--label", ",".join(labels)]
    subprocess.check_call(cmd)

def mock_plan_from_spec(spec: str) -> List[Task]:
    """Generate mock tasks based on the feature spec"""
    
    # Extract feature name from spec
    lines = spec.split('\n')
    feature_name = "Unknown Feature"
    for line in lines:
        if line.startswith("# Feature:"):
            feature_name = line.replace("# Feature:", "").strip()
            break
    
    # Generate realistic tasks based on common patterns
    tasks = [
        Task(
            title=f"Create API endpoint for {feature_name}",
            body=f"""## Description
Implement the backend API endpoint for {feature_name}.

## Acceptance Criteria
- [ ] Create controller with proper routing
- [ ] Implement request/response DTOs
- [ ] Add input validation using FluentValidation
- [ ] Write unit tests for the controller
- [ ] Add integration tests for the endpoint
- [ ] Update API documentation/Swagger

## Technical Notes
- Follow Onion Architecture principles
- Use Repository pattern for data access
- Implement proper error handling
- Add logging for debugging

## Definition of Done
- [ ] All tests pass
- [ ] Code review completed
- [ ] API documented in Swagger
""",
            labels=["api", "backend", "p1"],
            ai_ready=True
        ),
        Task(
            title=f"Create Angular components for {feature_name}",
            body=f"""## Description
Implement the frontend components for {feature_name}.

## Acceptance Criteria
- [ ] Create standalone Angular components
- [ ] Implement proper TypeScript interfaces
- [ ] Add Angular Material UI components
- [ ] Use OnPush change detection strategy
- [ ] Write component unit tests
- [ ] Add integration tests

## Technical Notes
- Follow Angular Style Guide
- Use reactive forms if applicable
- Implement proper error handling
- Add loading states and user feedback

## Definition of Done
- [ ] All tests pass
- [ ] Components follow design system
- [ ] Accessibility requirements met
""",
            labels=["ui", "frontend", "p1"],
            ai_ready=True
        ),
        Task(
            title=f"Add service layer for {feature_name}",
            body=f"""## Description
Create the application service layer for {feature_name}.

## Acceptance Criteria
- [ ] Implement application service with business logic
- [ ] Create appropriate DTOs for data transfer
- [ ] Add AutoMapper configurations
- [ ] Implement proper validation
- [ ] Write comprehensive unit tests
- [ ] Add integration tests

## Technical Notes
- Follow CQRS pattern if applicable
- Use MediatR for request handling
- Implement proper exception handling
- Add logging and monitoring

## Definition of Done
- [ ] All tests pass (minimum 80% coverage)
- [ ] Service follows domain boundaries
- [ ] Error handling implemented
""",
            labels=["api", "backend", "service", "p2"],
            ai_ready=True
        ),
        Task(
            title=f"Update database schema for {feature_name}",
            body=f"""## Description
Add necessary database changes to support {feature_name}.

## Acceptance Criteria
- [ ] Create Entity Framework migration
- [ ] Update domain entities if needed
- [ ] Add proper indexes for performance
- [ ] Update repository interfaces
- [ ] Write database tests
- [ ] Update seed data if applicable

## Technical Notes
- Follow database naming conventions
- Ensure proper foreign key relationships
- Consider performance implications
- Add appropriate constraints

## Definition of Done
- [ ] Migration runs successfully
- [ ] All tests pass
- [ ] Database performance validated
""",
            labels=["infra", "database", "p2"],
            ai_ready=True
        ),
        Task(
            title=f"Add documentation for {feature_name}",
            body=f"""## Description
Create comprehensive documentation for {feature_name}.

## Acceptance Criteria
- [ ] Update API documentation
- [ ] Add user guide sections
- [ ] Update architectural documentation
- [ ] Add code comments where needed
- [ ] Update README if applicable
- [ ] Create developer notes

## Technical Notes
- Follow existing documentation patterns
- Include examples and use cases
- Add diagrams if helpful
- Keep documentation up to date

## Definition of Done
- [ ] Documentation is clear and complete
- [ ] Examples work as expected
- [ ] Reviewed by team
""",
            labels=["docs", "p3"],
            ai_ready=False  # Human review needed for documentation
        )
    ]
    
    return tasks

@app.command()
def cli(spec_path: str = typer.Argument(..., help="Path to feature spec .md")):
    """Mock planner that generates realistic tasks without requiring AI API"""
    spec = open(spec_path, "r", encoding="utf-8").read()
    tasks = mock_plan_from_spec(spec)
    
    # Persist plan (artifact)
    with open("mock_planner_output.json","w",encoding="utf-8") as f:
        json.dump([t.model_dump() for t in tasks], f, indent=2)
    
    print(f"🤖 Mock Planner Generated {len(tasks)} tasks from {spec_path}")
    print("\nTasks to be created:")
    for i, task in enumerate(tasks, 1):
        ai_status = "🤖 AI-Ready" if task.ai_ready else "👤 Human Review"
        print(f"{i}. {task.title} - {ai_status}")
    
    # Ask for confirmation before creating issues
    if typer.confirm("Create these GitHub issues?"):
        for task in tasks:
            try:
                create_issue(task)
                print(f"✅ Created: {task.title}")
            except subprocess.CalledProcessError as e:
                print(f"❌ Failed to create: {task.title} - {e}")
        print(f"\n🎉 Successfully created issues! Check your GitHub repository.")
        print("Issues with 'fix-me' label will trigger OpenHands automatically.")
    else:
        print("Cancelled. No issues were created.")

if __name__ == "__main__":
    app()
