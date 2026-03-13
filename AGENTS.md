# AI Agent Orchestration Guide

This repository is configured for agent-driven development across **Cursor**, **Windsurf**, **Claude Code**, and **Antigravity**.
All agent definitions and skills are Markdown-first so any of these tools can parse and follow them consistently.

## 1) Mandatory Context Bootstrap (Run First)

Before any task is executed, every agent must read:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/tech-stack.md`
4. `context/coding-standards.md`

If these files are not loaded, the agent must stop and load them before proceeding.

## 2) Agent Topology

- **Project Manager Agent** (orchestrator)
- **Backend Engineer Agent**
- **Frontend Engineer Agent**
- **Testing Agent**
- **DevOps Agent**
- **Documentation Agent**

Agent specs live in `agents/`.

## 3) Delegation Model

### Intake and Planning
1. Project Manager receives task and confirms scope.
2. `repository-analyzer` skill runs (auto on workspace open/repo changes, or manually on demand).
3. Project Manager produces a plan with:
   - impacted modules
   - risks
   - test strategy
   - documentation updates required

### Execution
4. Work is delegated to specialist agents by domain:
   - UI/UX and component tasks -> Frontend Engineer Agent
   - API/data/auth/business logic -> Backend Engineer Agent
   - pipelines/deploy/config/runtime -> DevOps Agent
   - verification/quality gates -> Testing Agent
   - docs, ADRs, changelogs -> Documentation Agent

### Parallel Work
5. Frontend, Backend, and Testing agents may run in parallel on independent scopes.
6. Project Manager coordinates handoffs, resolves merge conflicts, and enforces boundaries.

### Closure
7. Testing Agent verifies acceptance criteria.
8. Documentation Agent updates docs/context/memory.
9. Project Manager confirms done criteria and commit quality.

## 4) Skill Triggering Rules

Skills are defined in `.cursor/skills/`. Triggering can be automatic or manual:

- `repository-analyzer` -> automatic on workspace open and repository changes
- `react-tailwind-feature-builder` -> when editing React UI, App Router pages, or Tailwind styles
- `api-integration` -> when adding/changing API routes, data flow, auth, or Prisma access
- `bug-investigator` -> when debugging regressions, incidents, or failed tests/builds
- `refactor-assistant` -> when complexity, duplication, or maintainability issues are identified
- `test-generator` -> when new behavior is added or bug fixes require regression protection
- `documentation-writer` -> after any completed modification or architectural change

## 5) Task Execution Rules (Required)

All agents must:

1. **Analyze repository first** (structure, dependencies, constraints).
2. **Plan before coding** with explicit assumptions and impacted files.
3. **Generate structured commits** that map 1 logical change = 1 commit.
4. **Follow architecture patterns** already used in this codebase.
5. **Avoid unrelated modules** and keep changes scoped.
6. **Validate behavior** using lint/build/tests or targeted checks.
7. **Escalate blockers early** to Project Manager Agent.

## 6) Self-Documentation Policy

After every feature or modification, agents must update:

- relevant docs in repository (including `README.md` if setup/usage changed)
- impacted files in `context/`
- `.ai-memory/` records (decisions, lessons, notes)

No task is complete until documentation is aligned with code.

## 7) Global Memory System

Long-term memory is stored under `.ai-memory/`:

- `decisions.md`
- `architecture-decisions.md`
- `lessons-learned.md`
- `agent-notes.md`

Agents append concise, dated entries after meaningful changes so future sessions inherit project knowledge.

## 8) Commit and PR Hygiene (Agent Standard)

- Keep commits atomic and descriptive.
- Suggested format: `<area>: <change summary>`
  - Example: `frontend: improve storefront category tabs UX`
- Include test evidence in commit/PR notes (lint/build/test/manual checks).

## 9) Done Criteria

A task is done only when:

- scope is implemented
- tests/checks pass (or documented with reason if unavailable)
- docs/context/memory are updated
- no unrelated files were modified
- Project Manager Agent marks completion
