from __future__ import annotations
import json, os, subprocess, sys, typer
from typing import List, Literal
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, START, END
from langgraph.types import Command
from langchain_openai import ChatOpenAI

app = typer.Typer()

class Task(BaseModel):
    title: str
    body: str
    labels: List[str] = Field(default_factory=list)
    assignees: List[str] = Field(default_factory=list)
    dependencies: List[int] = Field(default_factory=list)  # Issue numbers this depends on
    ai_ready: bool = True  # if true => label 'fix-me' to trigger OpenHands

class PlanState(BaseModel):
    spec: str
    tasks: List[Task] = Field(default_factory=list)

PLANNER_SYS = """You are the Planner for a Garage Inventory system (Angular + .NET, Onion Arch).

CRITICAL: Follow Test-Driven Development (TDD) - tests must be created FIRST, then implementation.

Break the following SPEC into atomic GitHub issues in this EXACT order:
1. TEST issues first (write failing tests)
2. IMPLEMENTATION issues second (make tests pass)  
3. REFINEMENT issues last (styling, accessibility, etc.)

TITLE FORMAT: Use this EXACT format for all issue titles:
"[FEATURE-ID] Step X of Y: Description"

Where:
- FEATURE-ID: Uppercase feature identifier (e.g., LANDING-001, AUTH-002, INVENTORY-003)
- X: Current step number (1, 2, 3, etc.)
- Y: Total number of steps in this feature
- Description: Clear, concise description of the task

Examples:
- "[LANDING-001] Step 1 of 7: Write Tests for LandingPageComponent Creation"
- "[LANDING-001] Step 5 of 7: Implement LandingPageComponent"

Each issue must include:
- title following the exact format above
- actionable body with acceptance criteria and tests (dotnet, Angular)
- labels (array of strings): ONLY use these exact labels: api, ui, infra, docs, test, accessibility, p1, p2, p3
- dependencies (array of integers): step numbers this depends on (e.g., [1, 2])
- ai_ready (boolean): true only if safe for automated coding agent

For TDD compliance:
- Test files (.spec.ts, .Tests.cs) must be created before implementation files
- Each implementation issue should reference its corresponding test issue step numbers
- Use dependencies array to ensure proper order

Output strictly as JSON list of tasks with fields: title (string), body (string), labels (array of strings), assignees (array of strings), ai_ready (boolean), dependencies (array of integers).
"""

def make_llm():
    # Uses OpenAI-compatible; swap to Anthropic via langchain_anthropic if you prefer.
    model = os.getenv("PLANNER_MODEL", "gpt-4o")
    return ChatOpenAI(model=model, temperature=0)

def plan_from_spec(spec: str) -> List[Task]:
    llm = make_llm()
    prompt = [{"role": "system", "content": PLANNER_SYS},
              {"role": "user", "content": spec}]
    raw = llm.invoke(prompt).content
    try:
        data = json.loads(raw)
    except Exception:
        # retry with fenced extraction if the model added prose
        start = raw.find("["); end = raw.rfind("]")+1
        data = json.loads(raw[start:end])
    return [Task(**t) for t in data]

def create_issue(task: Task):
    # First create the issue with basic labels (no fix-me yet)
    labels = task.labels[:]
    cmd = [
        "gh","issue","create",
        "--title", task.title,
        "--body", task.body,
    ]
    if labels: cmd += ["--label", ",".join(labels)]
    
    try:
        # Create issue and capture the issue number
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        issue_url = result.stdout.strip()
        issue_number = issue_url.split('/')[-1]
        
        # If AI-ready, add fix-me label separately to trigger the labeled event
        if task.ai_ready:
            subprocess.check_call([
                "gh", "issue", "edit", issue_number,
                "--add-label", "fix-me"
            ])
            print(f"Added fix-me label to issue #{issue_number} to trigger OpenHands")
            
    except subprocess.CalledProcessError as e:
        print(f"ERROR creating issue '{task.title}': {e}")
        if e.stderr:
            print(f"Error details: {e.stderr}")
        print("Continuing with remaining issues...")
        return  # Skip this issue but continue with others

@app.command()
def cli(spec_path: str = typer.Argument(..., help="Path to feature spec .md")):
    spec = open(spec_path, "r", encoding="utf-8").read()
    tasks = plan_from_spec(spec)
    # Persist plan (artifact)
    with open("planner_output.json","w",encoding="utf-8") as f:
        json.dump([t.model_dump() for t in tasks], f, indent=2)
    # Create issues via gh
    created_count = 0
    issue_numbers = []
    
    for i, t in enumerate(tasks):
        try:
            # Temporarily disable AI-ready for all but first issue
            original_ai_ready = t.ai_ready
            if i > 0:  # Only first issue gets fix-me label initially
                t.ai_ready = False
                
            create_issue(t)
            created_count += 1
            
            # Restore original ai_ready for JSON output
            t.ai_ready = original_ai_ready
            
        except Exception as e:
            print(f"Failed to create issue '{t.title}': {e}")
            continue
            
    print(f"Created {created_count}/{len(tasks)} issues from {spec_path}")
    print("Only the first issue has the fix-me label. Subsequent issues will be triggered when previous ones are completed.")

if __name__ == "__main__":
    app()
