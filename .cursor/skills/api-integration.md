# Skill: api-integration

## Name
api-integration

## Description
Implements reliable integrations between UI, API routes, and persistence layers with clear contracts, validation, and error handling.

## When to Activate
- Adding or changing API endpoints.
- Connecting frontend flows to backend services.
- Updating auth, validation, Prisma access, or external provider calls.

## Step-by-Step Execution Plan
1. **Load required context** from `context/`.
2. **Define contract**
   - Specify request/response schema, auth expectations, and status codes.
3. **Locate integration points**
   - Identify caller components, API route handlers, and data-layer dependencies.
4. **Implement server changes**
   - Add validation, business logic, and consistent error mapping.
5. **Implement client integration**
   - Add typed fetch layer, retries/timeouts where needed, and UX state handling.
6. **Verify end-to-end flow**
   - Run targeted checks for success, validation errors, auth failures, and edge cases.
7. **Coordinate with testing**
   - Provide scenario matrix and expected payloads.
8. **Document updates**
   - Record API behavior changes in context/docs/memory.
