from __future__ import annotations
import json, os, subprocess, typer
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI

app = typer.Typer()

class ValidationResult(BaseModel):
    issue_number: int
    pr_number: int | None = None
    status: str  # "pass", "fail", "needs_review"
    summary: str
    test_results: Dict[str, Any] = Field(default_factory=dict)
    recommendations: List[str] = Field(default_factory=list)

VALIDATOR_SYS = """You are the Validator for a Garage Inventory system (Angular + .NET, Onion Architecture).
Review the completed work against the original issue requirements and provide:
1. Status assessment (pass/fail/needs_review)
2. Summary of what was implemented
3. Test coverage analysis
4. Code quality observations
5. Recommendations for improvements

Focus on:
- Adherence to Onion Architecture principles
- Proper separation of concerns
- Test coverage (unit + integration)
- Angular best practices (standalone components, OnPush, etc.)
- .NET best practices (CQRS, Repository pattern, etc.)
- Security considerations
"""

def make_llm():
    model = os.getenv("VALIDATOR_MODEL", "gpt-4o")
    return ChatOpenAI(model=model, temperature=0)

def get_issue_details(issue_number: int) -> Dict[str, Any]:
    """Get issue details via GitHub CLI"""
    cmd = ["gh", "issue", "view", str(issue_number), "--json", 
           "title,body,labels,state,assignees,comments"]
    result = subprocess.check_output(cmd, text=True)
    return json.loads(result)

def get_pr_details(pr_number: int) -> Dict[str, Any]:
    """Get PR details and diff via GitHub CLI"""
    cmd = ["gh", "pr", "view", str(pr_number), "--json", 
           "title,body,files,commits,reviews,checks"]
    result = subprocess.check_output(cmd, text=True)
    pr_data = json.loads(result)
    
    # Get diff
    diff_cmd = ["gh", "pr", "diff", str(pr_number)]
    pr_data["diff"] = subprocess.check_output(diff_cmd, text=True)
    return pr_data

def find_related_pr(issue_number: int) -> int | None:
    """Find PR that closes this issue"""
    cmd = ["gh", "pr", "list", "--search", f"closes:#{issue_number}", 
           "--state", "all", "--json", "number"]
    result = subprocess.check_output(cmd, text=True)
    prs = json.loads(result)
    return prs[0]["number"] if prs else None

def validate_implementation(issue_data: Dict, pr_data: Dict | None) -> ValidationResult:
    """Use LLM to validate the implementation"""
    llm = make_llm()
    
    context = f"""
ORIGINAL ISSUE:
Title: {issue_data['title']}
Body: {issue_data['body']}
Labels: {[label['name'] for label in issue_data['labels']]}

IMPLEMENTATION:
"""
    
    if pr_data:
        context += f"""
PR Title: {pr_data['title']}
PR Body: {pr_data['body']}
Files Changed: {len(pr_data['files'])} files
Commits: {len(pr_data['commits'])} commits
Reviews: {len(pr_data['reviews'])} reviews
Checks: {[check['name'] + ':' + check['conclusion'] for check in pr_data.get('checks', [])]}

DIFF SUMMARY:
{pr_data['diff'][:5000]}...  # Truncate for token limits
"""
    else:
        context += "No PR found - issue may still be open or closed without implementation."
    
    prompt = [
        {"role": "system", "content": VALIDATOR_SYS},
        {"role": "user", "content": context}
    ]
    
    response = llm.invoke(prompt).content
    
    # Parse LLM response (simplified - you might want more structured output)
    status = "needs_review"  # Default
    if "status: pass" in response.lower() or "✅" in response:
        status = "pass"
    elif "status: fail" in response.lower() or "❌" in response:
        status = "fail"
    
    return ValidationResult(
        issue_number=issue_data["number"],
        pr_number=pr_data["number"] if pr_data else None,
        status=status,
        summary=response[:500] + "..." if len(response) > 500 else response,
        recommendations=[]  # Could extract from LLM response
    )

@app.command()
def cli(issue_number: int = typer.Argument(..., help="GitHub issue number to validate")):
    """Validate completed work for a GitHub issue"""
    
    # Get issue details
    issue_data = get_issue_details(issue_number)
    print(f"Validating issue #{issue_number}: {issue_data['title']}")
    
    # Find related PR
    pr_number = find_related_pr(issue_number)
    pr_data = None
    if pr_number:
        pr_data = get_pr_details(pr_number)
        print(f"Found related PR #{pr_number}")
    else:
        print("No related PR found")
    
    # Validate implementation
    result = validate_implementation(issue_data, pr_data)
    
    # Save validation report
    with open(f"validation_{issue_number}.json", "w") as f:
        json.dump(result.model_dump(), f, indent=2)
    
    # Post summary as issue comment
    comment_body = f"""## Validation Summary 🤖

**Status**: {result.status.upper()}
**PR**: #{result.pr_number} (if applicable)

{result.summary}

---
*Automated validation by AI Orchestrator*
"""
    
    subprocess.run([
        "gh", "issue", "comment", str(issue_number), 
        "--body", comment_body
    ])
    
    print(f"Validation complete. Status: {result.status}")
    return result.status == "pass"

if __name__ == "__main__":
    app()
