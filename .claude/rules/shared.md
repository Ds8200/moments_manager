# Shared Conventions (All Layers)

All rules in this file apply to every active layer. Layer-specific rule files (`frontend.md`,
`backend.md`, `firmware.md`) extend and specialize these shared rules. In case of conflict
between a shared rule and a layer rule, the layer rule takes precedence for that layer only.

---

## Layer 1 — Core Behavior

- Read existing code before generating anything new.
- Edit existing files rather than creating new ones unless a new file is explicitly required.
- Scan for existing functions, utilities, and patterns before proposing new implementations.
- Produce minimal diff changes — never generate beyond what the task requires.
- Never invent systems, patterns, or abstractions not explicitly defined in these rules or the task.

### Package Managers

- **Python (backend):** `uv` only — use `uv add <pkg>`, `uv run <cmd>`, `uv sync`. `pip install` is forbidden.
- **Node (frontend):** `npm` only — all generated commands, Husky setup, and CI scripts use `npm`. `pnpm` and `yarn` are forbidden.
- Mixing package managers within a layer is forbidden.

---

## Layer 2 — Architecture

### Naming Conventions

| Context             | Convention             | Example                      |
|---------------------|------------------------|------------------------------|
| MQTT topic segments | snake_case             | `device_status`              |
| Env var names       | SCREAMING_SNAKE_CASE   | `MQTT_BROKER_URL`            |
| Python modules      | snake_case.py          | `device_service.py`          |
| React components    | PascalCase.tsx         | `DeviceCard.tsx`             |
| React style files   | PascalCase.module.scss | `DeviceCard.module.scss`     |
| C++ class files     | PascalCase.cpp/.h      | `MqttClient.cpp`             |
| C++ variables       | camelCase              | `deviceId`                   |
| C++ constants       | SCREAMING_SNAKE_CASE   | `MAX_PAYLOAD_SIZE`           |
| Python functions/variables | snake_case      | `get_device_by_id`           |

### File Size

- Source files must not exceed 300 lines.
- A file exceeding 300 lines must be split into separate files by responsibility. The split rationale must be documented in the PR description.
- **Exempt from the 300-line limit:** config files, migration files, test fixtures, generated files, and `.claude/rules/*.md` specification files.

### Secrets Management

- Secrets must never be committed to source control. This rule has no exceptions.
- `.env` files must be listed in `.gitignore` and must never be staged.
- Only `.env.example` files (with placeholder values) are committed.
- Firmware secrets: `firmware/include/secrets.h` is gitignored; `firmware/include/secrets.h.example` is committed.

### Docker

- `docker-compose.yml` at repo root defines all services.
- Each layer has its own `Dockerfile` in `docker/{service}/`.
- Ports must be read from environment variables only — hardcoding ports in application code is forbidden.
- `docker compose up --build` is the canonical dev start command.
- `.dockerignore` must exclude: `.git`, `node_modules`, `.venv`, `.pio`, `__pycache__`.


---

## Layer 3 — Workflow

### Execution Sequence

Every task must follow this sequence without skipping any phase:
1. **Analyze** — read all relevant existing files before writing anything.
2. **Plan** — identify exactly which files change and why. Stop and report if requirements are ambiguous before proceeding.
3. **Implement** — make only the changes identified in the Plan phase.
4. **Validate** — run all post-task validation commands for the affected layers. Fix all failures before reporting the task done.

### Git — Conventional Commits

Format: `type(scope): short description`

- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`
- Scope matches layer: `feat(frontend):`, `fix(backend):`, `chore(firmware):`
- Subject line must be 72 characters or fewer, imperative mood ("add" not "added")
- `WIP` commits to `main` are forbidden — use a feature branch

### Branch Naming

- `feat/short-slug`
- `fix/issue-slug`
- `chore/task-slug`
- `docs/short-slug`
- `test/short-slug`
- `refactor/short-slug`

### Merge Policy

- Merge strategy: **squash merge** — every PR lands as a single commit on `main`
- `main` is protected: no direct push; all changes go through a PR
- Feature branches are deleted after merge
- `--no-ff` merge commits are forbidden
- `--no-verify` on git hooks is forbidden. There are no exceptions.

### Husky + lint-staged

Pre-commit hook runs linters per path. Setup steps (run once at project root after `npm install`):

1. Run `npm install --save-dev husky lint-staged`
2. Run `npx husky init`
3. Run `echo "npx lint-staged" > .husky/pre-commit`
   Windows (PowerShell): `"npx lint-staged" | Out-File .husky/pre-commit -Encoding utf8NoBOM`


lint-staged path mappings:
- `*.ts, *.tsx` → eslint + prettier
- `*.py` → ruff check + ruff format
- `*.cpp, *.h` → clang-format

Pre-push hook setup (run after Husky is initialized):

1. Create `.husky/pre-push`
2. Content must include, in this order:
   a. `sh scripts/bootstrap.sh` — repo-level validation (secrets, `.gitignore`, `[PROJECT_NAME]` check). This line is always first.
   b. Layer test commands for active layers only:
      - If Frontend layer is active: `npm --prefix frontend run test:run`
      - If Backend layer is active: `(cd backend && uv run pytest -x --tb=short -q)`
   When both layers are active, both commands must appear — Frontend first.
3. Make it executable:
   - Unix/Mac: `chmod +x .husky/pre-push`
   - Windows: `git update-index --chmod=+x .husky/pre-push`

### Post-Task Validation

Run after every task. Fix all failures before reporting the task done. Commenting out failing tests is forbidden.

| Layer changed | Command to run |
|---------------|----------------|
| `frontend/**` | `cd frontend && npm run lint && npm run test:run` |
| `backend/**`  | `cd backend && ruff check . && pytest -x --tb=short -q` |
| `firmware/**` | `cd firmware && pio test -e native` |

When multiple layers change in a single task, run all relevant commands.

### CI Pipeline

`.github/workflows/ci.yml` must define the following jobs for active layers only:

| Job | Layer | Required steps |
|-----|-------|----------------|
| `lint-frontend` | Frontend | `cd frontend && npm run lint` |
| `test-frontend` | Frontend | `cd frontend && npm run test:run && npm run test:coverage` |
| `lint-backend` | Backend | `cd backend && ruff check .` |
| `test-backend` | Backend | `alembic upgrade head` then `pytest --cov=src --cov-fail-under=80` |
| `test-firmware` | Firmware | `pio test -e native` |

Required CI environment variables (must be set as repository secrets):
- `CI_DB_PASSWORD` — used to construct `TEST_DATABASE_URL` in CI
- `TEST_DATABASE_URL` — must point to a separate test DB, not `DATABASE_URL`

Rules:
- Jobs for inactive layers must not appear in `ci.yml`.
- `alembic upgrade head` must run before `pytest` in the backend test job.
- A coverage drop below 80% must fail the build — coverage thresholds are non-negotiable.
- `ci.yml` must not hardcode ports — read from env vars or GitHub secrets.

---

## Layer 4 — Quality Control

### Logging

**Format across all layers:** `TIMESTAMP | LEVEL | FILE:LINE | message`

**What to log:**
- Startup and shutdown events with configuration summary
- Errors and warnings with context (what failed, relevant IDs)
- Important state transitions (device connected/disconnected, user authenticated)
- External I/O boundaries: HTTP requests, MQTT publish/subscribe, DB queries (one line each)

**What must not be logged:**
- Routine operations inside loops or hot paths
- Sensitive data: tokens, passwords, raw credentials
- Every function entry/exit — only entries that matter
- Successful low-level operations that generate noise without value

**Log levels:**
- `DEBUG` — dev only, verbose detail
- `INFO` — normal operational events
- `WARN` — unexpected but recoverable situation
- `ERROR` — failure requiring attention

Direct calls to `console.log`, `print()`, and `Serial.print()` are forbidden — all output must go through the project logger.

### Testing

- Tests are written together with the feature — never added in a follow-up commit.
- Every new public function, hook, service method, and route requires at least one test.
- Integration tests must use a real test DB — database mocking in integration tests is forbidden.
- All tests must pass before a task is reported as done.
- **Coverage target: 80%** on business logic files (`useXxx.ts`, `api.ts`, routers, services).

**Coverage enforcement:**

| Layer    | Coverage command |
|----------|-----------------|
| Frontend | `cd frontend && npm run test:coverage` (thresholds enforced by `vitest.config.ts`) |
| Backend  | `cd backend && pytest --cov=src --cov-fail-under=80 --cov-report=term-missing` |

Both commands run in CI. Coverage regressions fail the build automatically.

**What must be tested per layer:**

- **Frontend:** custom hooks (`useXxx.ts`) — logic, state transitions, error handling. Component render tests cover non-trivial conditional rendering and user interactions only.
- **Backend:** every route (HTTP integration via test client + real PostgreSQL test DB), every service method (unit test with mocked repository).
- **Firmware:** pure logic modules (parsers, state machines, calculations). Hardware-dependent code (GPIO, WiFi, MQTT connection) is excluded — test the logic around it, not the hardware interface.

---

## Layer 5 — Failure and Decision

- When loading a rule file, check whether its very first line (line 1 of the file) is exactly `# LAYER INACTIVE`. This line must appear before any other content — before the `shared.md` reference blockquote and before any heading. If the first line is `# LAYER INACTIVE`, all rules in that file are void and must not be applied. The file must be treated as if it does not exist.
- Stop and report on ambiguity — never assume intent.
- Flag conflicts explicitly before proceeding — never silently resolve them.
- When a shared rule conflicts with a layer rule, apply the layer rule for that layer and document the conflict in the PR description.
- Use existing implementation patterns. Create a new pattern only when no existing pattern satisfies the requirement; document the justification in the PR description.
- Escalate missing requirements — do not fill gaps with guesses.
