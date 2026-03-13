# Coding Standards

These standards are mandatory for agents working in this repository.

## 1) Execution discipline

1. Read all context files before making changes.
2. Analyze impacted modules and plan before coding.
3. Keep changes scoped to the request; avoid unrelated edits.
4. Use structured, atomic commits (one logical change per commit).
5. Run verification checks relevant to the changed surface.

## 2) Architecture alignment

- Follow existing route and domain boundaries:
  - vendor (`/dashboard`, `/onboarding`, `app/api/vendor/*`)
  - customer (`/<slug>`, `app/api/customer/*`)
  - admin (`/admin`, `app/api/admin/*`)
- Preserve middleware-auth behavior and admin access controls.
- Reuse shared utilities (`lib/*`) instead of duplicating logic.
- Keep Prisma schema and API logic synchronized.

## 3) TypeScript and API quality

- Prefer explicit types at module boundaries.
- Validate external input with Zod or equivalent schema checks.
- Return consistent API responses with clear status codes.
- Handle error paths explicitly (auth failures, validation failures, server errors).

## 4) Frontend quality

- Reuse existing UI primitives from `components/ui/*`.
- Maintain mobile-first and accessible interaction patterns.
- Support bilingual behavior where relevant (EN/RW copy and data).
- Include loading, empty, and error states for async UI flows.

## 5) Data and security

- Do not bypass authentication/authorization checks.
- Respect tenant boundaries (vendor/admin/customer data separation).
- Avoid introducing unsafe defaults, broad data exposure, or secret leakage.

## 6) Documentation and memory

After completing changes, update:

- relevant implementation docs (including `README.md` when setup/usage changes)
- files in `context/` impacted by behavior or architecture updates
- `.ai-memory/` entries with dated notes (decisions, lessons, architecture notes)

## 7) Style conventions

- Match the local style of touched files (imports, quote style, semicolons, formatting).
- Prefer descriptive names over abbreviations.
- Keep functions small and focused when practical.
- Add brief comments only when intent is non-obvious.
