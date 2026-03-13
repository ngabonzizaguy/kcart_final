# Skill: documentation-writer

## Name
documentation-writer

## Description
Transforms completed implementation work into clear, maintainable project knowledge across README, architecture/context docs, and long-term memory artifacts.

## When to Activate
- Immediately after any feature, fix, refactor, or infra/config modification.
- When architecture or workflows change.
- When documentation drift is detected.

## Step-by-Step Execution Plan
1. **Load required context** from `context/`.
2. **Collect implementation deltas**
   - What changed, why it changed, and what users/developers must know.
3. **Update primary docs**
   - Edit README and task-relevant guides if setup/usage/behavior changed.
4. **Update context**
   - Sync `context/project-overview.md`, `context/architecture.md`, `context/tech-stack.md`, and `context/coding-standards.md` as needed.
5. **Update memory**
   - Append dated entries to `.ai-memory/*.md` files.
6. **Cross-verify**
   - Confirm docs match code paths, route names, and configuration.
7. **Publish summary**
   - Provide concise notes that can be copied into commits or PR descriptions.
