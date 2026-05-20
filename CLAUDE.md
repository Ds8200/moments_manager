# Moments

מערכת ניהול הזמנות, לקוחות ופיננסים לעסק גרפיקה והדפסות.

@.claude/rules/shared.md
@.claude/rules/frontend.md
@.claude/rules/backend.md

## Active Layers

- [x] Frontend — Next.js + TypeScript (`@.claude/rules/frontend.md`)
- [x] Backend — Python + FastAPI (`@.claude/rules/backend.md`)
- [ ] Firmware — ESP32 + PlatformIO (`@.claude/rules/firmware.md`)

## Optional Features

Activate features independently of layers. Check a box to enable; leave unchecked to omit.

- [x] Authentication — JWT-based user auth (`backend.md` Authentication section).
  - When **checked**: generate `src/core/security.py` and `src/auth/` domain folder.
  - When **unchecked**: do not generate these files at all — do not generate and then delete.

## Behavioral Boundaries

The agent must not:
- Generate files for a layer whose checkbox is `[ ]` (inactive).
- Generate `src/mqtt/` or add `aiomqtt` — Firmware layer is inactive.
- Use Tailwind CSS — styling is SCSS Modules only throughout the entire project.
- Modify `.git/`, `node_modules/`, `__pycache__/`, `.venv/`, or `alembic/versions/`.
- Run `git push`, `docker push`, `npm publish`, or any deploy command without explicit user confirmation.

## Setup

Project initialization steps are defined in `INIT.md`. Read `INIT.md` to complete the
one-time setup checklist. After initialization is confirmed complete (all items checked),
`INIT.md` is a historical record — do not re-read it during routine development.

## Stack

| Layer    | Tech                                                                       |
|----------|----------------------------------------------------------------------------|
| Frontend | Next.js 14+ + TypeScript + SCSS Modules + Jotai + TanStack Query          |
| Backend  | Python 3.11 + FastAPI + SQLAlchemy (async) + uv                            |
| DB       | PostgreSQL — Docker in dev, managed instance in prod                       |

## Merge Policy

<!-- APPROVALS_REQUIRED=0 -->

- Merge strategy: squash merge — every PR lands as a single commit on `main`.
- `main` is protected: no direct push; all changes go through a PR.
- Minimum required approvals: 0 (solo project).
- Feature branches are deleted after merge.
- `--no-ff` merge commits are forbidden.
- `--no-verify` on any git hook is forbidden. There are no exceptions.

## Do Not Touch

- `.git/` — git internals
- `node_modules/`, `__pycache__/`, `.venv/`
- `alembic/versions/` — generate only via `alembic revision --autogenerate`
- Any file with `# DO NOT EDIT` or `// DO NOT EDIT` header comment
- `*.log` files
