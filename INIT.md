# Project Initialization Guide

> This file is consumed once during project setup. After all checklist items are checked,
> this file is a historical record. Do not reference it during routine development tasks.

## Before You Begin

This directory is the **init template** — a master copy. Do not develop inside it.

To start a new project:
1. Copy this entire directory to a new location:
   - Unix/Mac: `cp -r /path/to/init /path/to/my-project`
   - Windows (PowerShell): `Copy-Item "C:\path\to\init" -Destination "C:\path\to\my-project" -Recurse`
2. Open the **new directory** in Claude Code.
3. Follow the checklist below from Step 1.

The `rule-system-architect` agent is for **improving existing rule files** in a project that has already been initialized. It is not used during initial setup.

---

## Project Init Checklist

Run this checklist **once** when bootstrapping a new project. Check each item off as you complete it.

**Step 1 — Identity**
- [ ] Replace `[PROJECT_NAME]` on line 1 of `CLAUDE.md` with the actual project name
- [ ] Replace the one-line description on line 3 of `CLAUDE.md` with a real description

**Step 2 — Layers**
- [ ] For each unused layer: remove its `@` line from `CLAUDE.md` and add `# LAYER INACTIVE` as the first line of that rule file (do not delete the file)
- [ ] Delete the rows for inactive layers from the Stack table in `CLAUDE.md`
- [ ] Delete the directory entries for inactive layers from the Monorepo Structure below
- [ ] Remove the MQTT Topology section below if the firmware layer is inactive
- [ ] Set `APPROVALS_REQUIRED` in the Merge Policy section of `CLAUDE.md`: `0` for solo projects, `1` for team projects

**Step 3 — Generate Scaffold Files**

Generate all scaffold files based on the active layers confirmed in Step 2. All files in this step must be generated before running `git init`.

- [ ] Generate `.gitignore` — must cover all three layers including `firmware/include/secrets.h`, `firmware/include/certs.h`, `.env` files, `node_modules/`, `.venv/`, `.pio/`, `__pycache__/`
- [ ] Generate `.dockerignore` — must exclude: `.git`, `node_modules`, `.venv`, `.pio`, `__pycache__`
- [ ] Generate `scripts/bootstrap.sh` — must exit non-zero if any check fails. Must verify exactly:
  1. `[PROJECT_NAME]` does not appear in `CLAUDE.md`
  2. `.gitignore` exists at repo root
  3. If Firmware layer is active: `firmware/include/secrets.h` is listed in `.gitignore`
  4. No real `.env` files (non-`*.example`) are staged: `git diff --cached --name-only | grep -E '(^|/)\.env$'`

  > **Windows note:** `scripts/bootstrap.sh` is a bash script. Run it with Git Bash (`bash scripts/bootstrap.sh`) or WSL (`wsl bash scripts/bootstrap.sh`). Git for Windows ships Git Bash — it is available in any repo opened via Git.
- [ ] Generate `.github/workflows/ci.yml` — lint + test jobs for active layers only
- [ ] Generate `.github/pull_request_template.md`
- [ ] Generate `docker-compose.yml` — services for active layers only
- [ ] Generate `.env.example` (root) — includes `POSTGRES_PASSWORD` placeholder
- [ ] Generate `package.json` (root) — Husky + lint-staged config; replace `<project-slug>` with the actual project slug (see `shared.md` for lint-staged path mappings)
- [ ] `git init && git add . && git commit -m "chore: init project template"`
- [ ] At repo root: `npm install` (installs Husky + lint-staged from the generated root `package.json`)
- [ ] `npx husky init && echo "npx lint-staged" > .husky/pre-commit`
      Windows (PowerShell): `npx husky init; "npx lint-staged" | Out-File .husky/pre-commit -Encoding utf8NoBOM`
- [ ] Create `.husky/pre-push` with `sh scripts/bootstrap.sh` as the first line, followed by layer test commands for active layers (see `shared.md` pre-push hook section for exact content)
      Make executable — Unix/Mac: `chmod +x .husky/pre-push` | Windows: `git update-index --chmod=+x .husky/pre-push`
- [ ] `git remote add origin <repo-url>` and push the initial commit
- [ ] Add `CI_DB_PASSWORD` to GitHub repository Secrets (Settings → Secrets → Actions)

**Step 4 — Frontend** (skip entirely if Frontend layer is inactive)
- [ ] Generate `frontend/` scaffold: `app/`, `features/`, `shared/`, `vitest.config.ts`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `eslint.config.mjs`, `package.json`, `frontend/.env.example`, `docker/frontend/Dockerfile`
- [ ] `cd frontend && npm install`
- [ ] Copy `frontend/.env.example` → `frontend/.env` and fill in values

**Step 5 — Backend** (skip entirely if Backend layer is inactive)
- [ ] Generate `backend/` scaffold: `src/main.py`, `src/config.py`, `src/database.py`, `src/core/`, `alembic/env.py`, `alembic.ini`, `pyproject.toml`, `backend/.env.example`, `docker/backend/Dockerfile`
- [ ] Generate `docker/postgres/init.sql` — creates `appdb_test` on first `docker compose up`:
  ```sql
  SELECT 'CREATE DATABASE appdb_test'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'appdb_test')\gexec
  GRANT ALL PRIVILEGES ON DATABASE appdb_test TO appuser;
  ```
- [ ] `cd backend && uv sync`
- [ ] Copy `backend/.env.example` → `backend/.env` and fill in values
- [ ] `docker compose up -d postgres` then `alembic revision --autogenerate -m "init"` then `alembic upgrade head`
- [ ] Confirm the test DB was created by `docker/postgres/init.sql` on first `docker compose up`
- [ ] If the postgres volume already existed before this init and the test DB is missing (init.sql does not re-run on existing volumes), run:
  ```bash
  docker compose exec postgres psql -U appuser -c "SELECT 'CREATE DATABASE appdb_test' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'appdb_test')\gexec"
  ```

**Step 6 — Firmware** (skip entirely if Firmware layer is inactive)
- [ ] Generate `firmware/` scaffold: `platformio.ini`, `.clang-format`, `src/main.cpp`, `include/pins.h`, `include/topics.h`, `include/config.h`, `include/logger.h`, `include/secrets.h.example`, `docker/mosquitto/mosquitto.conf`
  - `docker/mosquitto/mosquitto.conf` must contain at minimum (Mosquitto 2.x blocks anonymous connections by default):
    ```
    listener 1883
    allow_anonymous true
    persistence true
    persistence_location /mosquitto/data/
    log_dest stdout
    ```
- [ ] Copy `firmware/include/secrets.h.example` → `firmware/include/secrets.h` and fill in credentials
- [ ] Generate a random OTA password: `openssl rand -base64 24` and set it as `SECRETS_OTA_PASSWORD` in `secrets.h`
      > **Windows note:** `openssl` is available in Git Bash. PowerShell alternative: `[Convert]::ToBase64String((1..18 | ForEach-Object { Get-Random -Max 256 }))`

**Step 7 — Smoke test**
- [ ] `docker compose up --build` — confirm all services start without errors
- [ ] `GET /health/live` on the backend — expect `{"status": "ok"}`
- [ ] Open `http://localhost:3000` — confirm frontend loads without errors
- [ ] `cd frontend && npm run lint && npm run test:run`
- [ ] `cd backend && ruff check . && pytest -x --tb=short -q`
- [ ] `cd firmware && pio test -e native` (run only if Firmware layer is active)

## Monorepo Structure

```
/
├── .github/
│   ├── workflows/      ci.yml — lint + test all active layers on push/PR
│   └── pull_request_template.md
├── frontend/           Next.js app (App Router)
├── backend/            FastAPI server
│   └── src/
│       ├── {domain}/   router, service, repository, schemas, models
│       ├── mqtt/       MQTT client singleton (firmware layer only)
│       └── core/       exceptions, dependencies, config, shared schemas
├── firmware/           PlatformIO project (firmware layer only)
│   ├── src/
│   │   ├── main.cpp    orchestrator only — calls Module::begin() and Module::loop()
│   │   └── {Module}/   Module.h + Module.cpp
│   └── include/        pins.h, topics.h, config.h, logger.h, secrets.h
├── scripts/
│   └── bootstrap.sh        pre-commit validation (identity, .gitignore, secrets)
├── docker/             Dockerfile per service + supporting configs
│   ├── backend/Dockerfile
│   ├── frontend/Dockerfile
│   ├── postgres/init.sql   creates appdb_test on first run (pre-created in template)
│   └── mosquitto/mosquitto.conf
├── docker-compose.yml
├── .env.example        root-level env template (postgres ports, service ports)
└── CLAUDE.md
```

## Running the Stack

- Full stack: `docker compose up --build`
- Frontend only: `cd frontend && npm run dev` (port 3000)
- Backend only: `cd backend && uv run uvicorn src.main:app --reload`
- Firmware: PlatformIO extension in VS Code → Upload button

## MQTT Topology (firmware layer only)

Remove this entire section when the Firmware layer is inactive.

- Broker: `mqtt://localhost:1883` (dev) / `MQTT_BROKER_URL` env var (prod)
- ESP32 → server: `device/{device_id}/telemetry` (QoS 1)
- Server → ESP32: `device/{device_id}/command` (QoS 2)
- All topic strings must be defined as constants — inline topic strings are forbidden

## Environment Variables

- Frontend: `frontend/.env.example`
- Backend: `backend/.env.example`
- Firmware: `firmware/include/secrets.h.example` (gitignored; actual file is `secrets.h`)
