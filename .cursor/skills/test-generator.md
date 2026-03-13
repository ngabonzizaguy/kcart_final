# Skill: test-generator

## Name
test-generator

## Description
Generates focused test coverage and validation checklists that protect critical behavior and reduce regressions.

## When to Activate
- New features or bug fixes are implemented.
- High-risk logic paths change (auth, payments, orders, admin operations).
- Existing coverage is missing or outdated.

## Step-by-Step Execution Plan
1. **Load required context** from `context/`.
2. **Identify behavior under test**
   - Map acceptance criteria, invariants, and known edge cases.
3. **Select test strategy**
   - Unit, integration, route-level, and/or manual verification matrix.
4. **Generate tests/checklists**
   - Cover happy path, boundaries, error states, and regression scenarios.
5. **Run and iterate**
   - Execute checks and fix unstable assumptions.
6. **Attach evidence**
   - Record what passed, what failed, and remaining gaps.
7. **Handoff**
   - Share outcomes with Project Manager and Documentation agents.
8. **Document**
   - Add coverage notes to `.ai-memory/agent-notes.md` or relevant docs.
