# Lessons Learned

Purpose: store debugging and delivery insights that reduce repeated mistakes.

## Entry Template

```md
## YYYY-MM-DD - <lesson title>
- Situation:
- What went wrong / what worked:
- Root cause:
- Prevention pattern:
- Related files:
```

## Entries

## 2026-03-13 - Context-first workflow reduces drift
- Situation: Establishing a multi-agent workflow for an existing codebase.
- What went wrong / what worked: Generic agent templates tend to drift from implementation; repo-aware context docs and required bootstrap steps worked better.
- Root cause: Missing shared system understanding across sessions/tools.
- Prevention pattern: Keep `context/*.md` current and enforce mandatory reads in orchestration docs.
- Related files: `AGENTS.md`, `context/project-overview.md`, `context/architecture.md`.
