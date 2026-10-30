# Team Development Rules for Antigravity (VS Code)

When contributing code to the AI Agent Visual Workflow Builder project, Antigravity MUST adhere to the following rules:

## 1. Frontend Modularization (App.tsx Protection)
- **NEVER** add large component definitions, modal dialogs, or inline UI blocks directly into `frontend/src/App.tsx`.
- Always create new components inside `frontend/src/components/` (or subdirectories like `components/modals/`, `components/canvas/`).
- Isolate complex business logic and API requests inside custom hooks under `frontend/src/hooks/`.
- Ensure TypeScript strict typing is preserved. Run `npx tsc -b` to verify zero type errors.

## 2. Backend Security & RBAC Enforcement
- All sensitive API endpoints in `backend_fastapi/app/routers/` must be guarded using `require_role(...)`.
- Workflow creation must always record `owner_id = current_user.id`.
- Modifying or deleting a workflow must enforce ownership isolation: builders can only edit/delete workflows they own; admins and superadmins can manage all.
- Every new endpoint or role-protected route must have a corresponding test suite added in `backend_fastapi/tests/`.

## 3. Coolify Production & Docker Safety
- In `docker-compose.yml`, **NEVER** bind `ports: ["80:80"]` for the frontend service. Always use `expose: ["80"]` to prevent port collision with Traefik.
- Local development configurations must be maintained in `docker-compose.dev.yml` with hot-reload enabled.

## 4. Git & Code Quality Gates
- Follow Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.
- Ensure all automated tests pass before committing:
  - Backend: `uv run pytest` (100% pass required)
  - Frontend: `npx tsc -b && npm run build` (zero errors required)
