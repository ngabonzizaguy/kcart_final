# Architecture Decisions

Purpose: track ADR-style records for architecture and structural trade-offs.

## ADR Template

```md
## ADR-XXX: <title>
- Date:
- Status: proposed | accepted | superseded
- Context:
- Decision:
- Consequences:
- Supersedes:
```

## ADR-001: Agent orchestration via repository-resident Markdown contracts
- Date: 2026-03-13
- Status: accepted
- Context: Multiple AI coding tools must share orchestration logic and task rules.
- Decision: Define agent roles, skills, context loading, and execution policy in versioned Markdown files (`AGENTS.md`, `agents/`, `.cursor/skills/`).
- Consequences: Improves cross-tool consistency and auditability; requires ongoing documentation maintenance.
- Supersedes: none

## ADR-002: Mandatory context bootstrap before execution
- Date: 2026-03-13
- Status: accepted
- Context: Agents can make incorrect assumptions without repository-specific context.
- Decision: Require all agents to read files in `context/` before planning or coding.
- Consequences: Better alignment and fewer architecture regressions; slight startup overhead per task.
- Supersedes: none
