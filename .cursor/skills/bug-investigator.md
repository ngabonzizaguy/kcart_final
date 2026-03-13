# Skill: bug-investigator

## Name
bug-investigator

## Description
Performs structured debugging to isolate root causes, implement minimal safe fixes, and prevent regressions.

## When to Activate
- A bug report, incident, or regression is received.
- Build/test/lint failures appear.
- Behavior diverges from documented requirements.

## Step-by-Step Execution Plan
1. **Load required context** from `context/`.
2. **Reproduce issue**
   - Capture exact environment, inputs, and expected vs actual results.
3. **Narrow scope**
   - Use logs, diffs, and module boundaries to isolate likely source.
4. **Validate hypotheses**
   - Confirm root cause with targeted instrumentation or checks.
5. **Implement smallest safe fix**
   - Avoid broad refactors while resolving the defect.
6. **Add regression protection**
   - Introduce/extend tests or explicit verification steps.
7. **Verify fix**
   - Re-run reproduction steps and nearby scenarios.
8. **Document findings**
   - Append root cause and prevention notes to `.ai-memory/lessons-learned.md`.
