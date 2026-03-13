# Skill: repository-analyzer

## Name
repository-analyzer

## Description
Automatically inspects the repository to produce a current structural and architectural understanding that all agents can use for safe planning and implementation.

## When to Activate
- Automatically when a new workspace is opened.
- Automatically when repository structure changes (new/removed/moved modules, key config updates).
- Manually before major features, refactors, or incident investigations.

## Step-by-Step Execution Plan
1. **Load required context**
   - Read all mandatory files in `context/` first.
2. **Scan repository structure**
   - Identify top-level directories and ownership boundaries.
   - Map key paths: app routes, API routes, shared libs, config, scripts, docs.
3. **Detect programming languages**
   - Classify dominant languages by extension and build config.
4. **Identify frameworks and tooling**
   - Detect framework/runtime/package manager/ORM/state management/testing tools.
5. **Infer architecture patterns**
   - Determine routing model, service boundaries, data flow, auth model, and persistence strategy.
6. **Generate architecture diagrams**
   - Produce/update Mermaid diagrams for:
     - system context
     - request/data flow
     - module dependency map
7. **Produce repository summary**
   - Output concise summaries:
     - project purpose
     - core domains
     - critical paths
     - high-risk areas
     - pending gaps
8. **Publish updates**
   - Update `context/project-overview.md`, `context/architecture.md`, and `.ai-memory/agent-notes.md` with dated findings.
