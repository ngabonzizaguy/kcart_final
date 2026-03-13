# Skill: refactor-assistant

## Name
refactor-assistant

## Description
Improves code maintainability by reducing complexity, duplication, and coupling without changing intended behavior.

## When to Activate
- Files/functions are hard to understand or modify safely.
- Duplicate patterns appear across modules.
- Performance, readability, or architectural drift issues are identified.

## Step-by-Step Execution Plan
1. **Load required context** from `context/`.
2. **Baseline behavior**
   - Identify invariants, interfaces, and existing tests/manual checks.
3. **Define refactor goals**
   - Target readability, modularity, reuse, or performance improvements.
4. **Plan incremental changes**
   - Split into low-risk steps with clear rollback points.
5. **Refactor safely**
   - Preserve public contracts and business rules.
6. **Run verification**
   - Lint/build/typecheck and targeted functional checks.
7. **Assess impact**
   - Ensure no unrelated modules changed.
8. **Document rationale**
   - Record motivation and trade-offs in `.ai-memory/architecture-decisions.md`.
