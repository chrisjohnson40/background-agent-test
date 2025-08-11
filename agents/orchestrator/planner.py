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
    ai_ready: bool = True  # if true => label 'fix-me' to trigger OpenHands

class PlanState(BaseModel):
    spec: str
    tasks: List[Task] = Field(default_factory=list)

PLANNER_SYS = """You are the Planner for a Garage Inventory system (Angular + .NET, Onion Arch).
Break the following SPEC into atomic GitHub issues. Each issue must include:
- clear title
- actionable body with acceptance criteria and tests (dotnet, Angular)
- labels (one of: api, ui, infra, docs, test) and priority (p1/p2/p3)
- mark ai_ready=True only if the task is safe for an automated coding agent (no secret rotation, no prod data ops).
Output strictly as JSON list of tasks with fields: title, body, labels, assignees, ai_ready.
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

@app.command()
def cli(spec_path: str = typer.Argument(..., help="Path to feature spec .md")):
    spec = open(spec_path, "r", encoding="utf-8").read()
    tasks = plan_from_spec(spec)
    # Persist plan (artifact)
    with open("planner_output.json","w",encoding="utf-8") as f:
        json.dump([t.model_dump() for t in tasks], f, indent=2)
    # Create issues via gh
    for t in tasks:
        create_issue(t)
    print(f"Created {len(tasks)} issues from {spec_path}")

if __name__ == "__main__":
    app()
