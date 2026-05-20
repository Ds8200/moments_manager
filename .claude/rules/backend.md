---
paths: ["backend/**"]
---

> All rules in `shared.md` apply to this layer. The sections below are backend-specific additions
> and overrides. In case of conflict, the rules below take precedence.

# Backend — Python + FastAPI

---

## Layer 1 — Core Behavior

- **Database:** PostgreSQL is required everywhere — Docker in dev, managed instance in prod. SQLite in dev or test causes hard-to-catch bugs (JSON operators, RETURNING clauses, constraint behavior) and is forbidden except in isolated unit tests with an explanatory comment in the test file.
- All DB access must go through `repository.py` — querying in routers or services directly is forbidden.
- ORM models must never be returned directly from a router — all responses must use a ResponseSchema.
- Secrets must never be committed to source control — `.env.example` only.
- `paho-mqtt` must not be used in async apps — use `aiomqtt`.

---

## Layer 2 — Architecture

### Stack

- Python 3.11+, FastAPI, SQLAlchemy 2.x (async), Pydantic v2, Alembic
- DB drivers: `asyncpg` for PostgreSQL
- MQTT via `aiomqtt`
- Ruff for linting and formatting
- Package manager: `uv`

### Directory Structure

```
backend/
├── src/
│   ├── main.py                     app factory, lifespan, router + middleware registration
│   ├── config.py                   pydantic-settings, all env vars, logging setup
│   ├── database.py                 async engine, session factory, Base
│   │
│   ├── core/                       cross-cutting infrastructure — no business logic here
│   │   ├── constants/
│   │   │   ├── http_messages.py    response message strings (no inline strings in routes)
│   │   │   └── log_messages.py     reusable log message templates
│   │   ├── enums/
│   │   │   └── common_enums.py     shared enums (SortOrder, PaginationDefault, etc.)
│   │   ├── schemas.py              shared Pydantic schemas: PaginationParams, PaginatedResponse
│   │   ├── exceptions.py           custom exception classes (NotFoundError, ConflictError…)
│   │   ├── exception_handlers.py   global FastAPI exception handlers, registered in main.py
│   │   ├── dependencies.py         Depends() factories: get_db, get_current_user [+ get_mqtt when Firmware layer active]
│   │   ├── middleware.py           request logging, CORS, timing headers
│   │   └── security.py             JWT encode/decode, password hashing
│   │                               *** GENERATED ONLY when Authentication is checked in CLAUDE.md ***
│   │
│   ├── mqtt/                       *** GENERATED ONLY when Firmware layer is active in CLAUDE.md ***
│   │   ├── client.py               singleton MQTT client init/teardown via lifespan
│   │   ├── topics.py               all topic string constants
│   │   └── handlers.py             message handlers, subscribe at startup
│   │
│   └── {domain}/                   e.g. devices/, users/, auth/
│       ├── router.py               APIRouter — routes and HTTP wiring only
│       ├── service.py              business logic, calls repository + mqtt
│       ├── repository.py           DB queries (SQLAlchemy) — no logic, only queries
│       ├── models.py               SQLAlchemy ORM models
│       ├── schemas.py              Pydantic: CreateSchema, UpdateSchema, ResponseSchema
│       ├── constants.py            domain-specific string constants (no inline strings)
│       └── enums.py                domain-specific enums (DeviceStatus, UserRole…)
│
├── tests/
│   ├── conftest.py                 shared fixtures: test DB session, async client
│   └── {domain}/
│       ├── test_router.py          HTTP-level integration tests (real PostgreSQL test DB)
│       └── test_service.py         unit tests for business logic
├── alembic/
│   ├── env.py
│   └── versions/
├── pyproject.toml
└── .env.example
```

### Layer Responsibilities

| File | Allowed to call | Must not call |
|------|----------------|-------------|
| `router.py` | `service.py`, `core/dependencies.py` | repository, models, mqtt directly |
| `service.py` | `repository.py`, `mqtt/client.py` | DB session directly |
| `repository.py` | SQLAlchemy session | service, mqtt, HTTP |
| `mqtt/handlers.py` | `service.py` | repository directly |

### FastAPI Conventions

- One `APIRouter` per domain, registered in `main.py`.
- Route prefix: `/api/v1/{domain}`.
- `response_model` must be declared on every route decorator.
- `Depends()` must be used for: DB session, authentication, MQTT client.
- Business logic must not appear in routers — delegate all logic to the service layer.

### CORS Configuration

- CORS middleware must be configured in `main.py` before registering routers.
- `CORS_ORIGINS` must be a `list[str]` loaded from env in `config.py`, defaulting to `["http://localhost:3000"]`.
- `CORS_ORIGINS` must be listed in `backend/.env.example`.

### Pydantic Schemas

- Separate schemas are required: `{Domain}CreateSchema`, `{Domain}UpdateSchema`, `{Domain}ResponseSchema`.
- Returning an ORM model directly from a router is forbidden.
- Response schemas must use `model_config = ConfigDict(from_attributes=True)`.

### Primary Keys

- **UUID4 is required** for all public-facing entity IDs — prevents enumeration and enables distributed ID generation.
- `int` (autoincrement) is permitted only for internal junction tables or high-volume append-only tables (audit logs, events).

### Soft Deletes

`SoftDeleteMixin` must be applied to any model that must never be hard-deleted (users, orders, devices):
- Fields: `is_deleted: bool` (default `False`), `deleted_at: datetime | None`.
- All repository queries must include `.where(Model.is_deleted == False)`.
- `is_deleted` and `deleted_at` must not appear in any `ResponseSchema`.
- Hard delete is permitted only from a dedicated endpoint in `{domain}/admin_router.py`, protected by `role: admin` authorization via `Depends(require_admin)`. Hard delete must never be called from `router.py`, `service.py`, or any code path reachable by non-admin users.

`SoftDeleteMixin` is defined in `src/database.py` alongside `Base`.

### Timestamp Mixin

`TimestampMixin` is required on every model that is not a pure junction table:
- Fields: `created_at: datetime` (set on insert, non-nullable), `updated_at: datetime` (set on insert and update, non-nullable).
- Both fields use `server_default=func.now()` and `onupdate=func.now()`.
- Neither field appears in `CreateSchema` or `UpdateSchema`. Both appear in `ResponseSchema` as `datetime`.
- `TimestampMixin` is defined in `src/database.py` alongside `Base` and `SoftDeleteMixin`.

### SQLAlchemy (Async)

- `AsyncSession` must be used exclusively — synchronous sessions are forbidden.
- All DB access must go through `repository.py`.
- Raw SQL requires a comment explaining why the ORM cannot handle it.
- Schema migrations must be generated only via `alembic revision --autogenerate` — manual DB modification is forbidden.
- Connection strings must come from env only — `DATABASE_URL` for production, `TEST_DATABASE_URL` for the test DB.
- Connection pool settings required in `create_async_engine`: `pool_size=10`, `max_overflow=20`, `pool_pre_ping=True`, `pool_recycle=3600`.

### MQTT Architecture

> **Activation gate:** Generate `src/mqtt/`, add `aiomqtt` to dependencies, and wire `app.state.mqtt` only when the Firmware layer is declared active (`[x]`) in `CLAUDE.md`. When the Firmware layer is inactive, omit this entire section — do not generate and then delete.

- The MQTT client must be initialized once in the app `lifespan` context manager in `main.py`.
- The client must be stored as app state: `app.state.mqtt`.
- Topic subscriptions must be registered at startup in `mqtt/handlers.py`.
- Routers must not call MQTT directly — they must call a service method.
- Services must use `mqtt/client.py` publish functions.
- All topic strings must be defined as constants in `mqtt/topics.py` — inline topic strings are forbidden.
- The MQTT client dependency (`get_mqtt`) must be defined in `src/core/dependencies.py` using `request.app.state.mqtt`.

### Error Handling

- Custom exception classes must be defined in `core/exceptions.py`.
- Global exception handlers must be defined in `core/exception_handlers.py` and registered in `main.py` via `register_exception_handlers(app)`.
- Catch-all `try/except Exception` blocks in routers are forbidden — exceptions must bubble to the global handlers.
- HTTP status codes: 422 for validation errors, 404 for not found, 409 for conflicts.

Built-in exception classes and their HTTP mappings:

| Exception | HTTP Status | Use for |
|-----------|-------------|---------|
| `NotFoundError` | 404 | Resource not found by ID |
| `ConflictError` | 409 | Duplicate resource, constraint violation |
| `UnauthorizedError` | 401 | Invalid credentials, expired or invalid token |

Domain-specific exceptions must subclass the same base pattern.

### No Inline Strings

Inline strings in route handlers, services, or repositories are forbidden. All HTTP detail messages must come from `core/constants/http_messages.py`. All log message templates must come from `core/constants/log_messages.py`.

### config.py Minimum Content

`src/config.py` must define a `Settings` class and a module-level `settings` singleton. Required fields at scaffold time: `DATABASE_URL: str`, `TEST_DATABASE_URL: str`, `LOG_LEVEL: str` (default `"INFO"`), `CORS_ORIGINS: list[str]` (default `["http://localhost:3000"]`).

- `Settings` must subclass `BaseSettings` from `pydantic_settings` — not `pydantic.BaseModel`.
- `model_config` must be set to `SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")` — missing this means env vars are not loaded from file in dev.
- `logging.basicConfig` must be called at module level in `config.py` immediately after `settings = Settings()`, using `settings.LOG_LEVEL` to set the level and the format `"%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s"` with datefmt `"%Y-%m-%d %H:%M:%S"` — calling it in `main.py` is forbidden.
- `settings = Settings()` must be the only instantiation of `Settings` in the entire codebase — importing `settings` from `src.config` is the only allowed access pattern.
- Auth fields (`SECRET_KEY: str`, `ACCESS_TOKEN_EXPIRE_MINUTES: int`, `REFRESH_TOKEN_EXPIRE_DAYS: int`) are added to `Settings` only when Authentication is active in `CLAUDE.md`.

---

## Layer 3 — Workflow

### main.py Lifespan Pattern

`main.py` must define an async context manager function named `lifespan` using `@asynccontextmanager` from `contextlib`, and pass it to `FastAPI(lifespan=lifespan)`.

Startup sequence (before `yield`) must run in this exact order:
1. Log application start with a one-line config summary (log level, CORS origins, DB host).
2. Test DB connectivity by executing `SELECT 1` against the async engine. If it fails, raise immediately — do not allow the application to start with a broken DB connection.
3. Start the MQTT client (only when the Firmware layer is active in `CLAUDE.md`).

Shutdown sequence (after `yield`) must run in reverse order:
1. Stop the MQTT client (only when the Firmware layer is active).
2. Dispose the async DB engine.
3. Log application stop.

- `@app.on_event("startup")` and `@app.on_event("shutdown")` are forbidden — they are deprecated in FastAPI and must not appear in any generated file.
- The DB connectivity test in startup must raise and abort launch on failure — silent failure is forbidden.
- MQTT startup and shutdown steps are present only when the Firmware layer is active.

### Health Check Endpoints

Both endpoints are required for every deployment. They must be defined in `main.py` with no auth dependency and no domain router:
- `GET /health/live` — returns `{"status": "ok"}`. Used by Docker restart policy.
- `GET /health/ready` — executes `SELECT 1` against the DB. Returns `{"status": "ok"}` on success, raises HTTP 503 on failure. Used by load balancer routing.

### Rate Limiting

Use `slowapi` for route-level rate limiting.

- The shared limiter instance must be defined in `src/core/rate_limit.py`.
- In `main.py`: attach `limiter` to `app.state.limiter` and register the `RateLimitExceeded` error handler.
- In router files: always import `limiter` from `src.core.rate_limit`, not from `slowapi` directly.
- Rate limits are required on: all authentication endpoints, password reset, any endpoint that calls a third-party API, sends an email, sends a push notification, or writes to an external system outside the application database.


### Authentication (JWT)

> **Activation:** controlled by the "Authentication" checkbox in `CLAUDE.md` → Optional Features.

- **Checkbox unchecked:** do not generate `src/core/security.py` or `src/auth/`. Do not add `Depends(get_current_user)` to any router.
- **Checkbox checked:** implement the full token strategy below.

Token strategy:
- **Access token:** short-lived JWT (default 15 min), verified stateless via `SECRET_KEY`.
- **Refresh token:** long-lived opaque random string (default 30 days), stored hashed in DB; supports revocation and rotation.
- Each refresh call rotates the token: old token is revoked, new pair is issued.
- Logout revokes the refresh token only; all other routes remain stateless.

When authentication is active, add to `src/config.py`: `SECRET_KEY: str` (min 32 chars), `ACCESS_TOKEN_EXPIRE_MINUTES: int = 15`, `REFRESH_TOKEN_EXPIRE_DAYS: int = 30`.

Required files (generate only when authentication is active):
- `src/core/security.py` — JWT encode/decode, refresh token generation and hashing
- `src/auth/models.py` — `RefreshToken` model with fields: `id`, `user_id`, `token_hash` (SHA-256 hex), `expires_at`, `is_revoked`, `created_at`
- `src/auth/repository.py` — `RefreshTokenRepository` with: `create`, `get_valid_by_hash`, `revoke`, `revoke_all_for_user`
- `src/auth/schemas.py` — `LoginSchema`, `RefreshSchema`, `TokenResponseSchema`
- `src/auth/service.py` — `AuthService` with: `login`, `refresh`, `logout`, `_issue_token_pair`
- `src/auth/router.py` — `POST /api/v1/auth/login` (rate limited 5/min), `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`
- `src/core/dependencies.py` (update) — `get_current_user` using `HTTPBearer`, `decode_access_token`, `UserRepository`


Auth test fixtures in `tests/conftest.py`: `auth_headers` fixture returning `Authorization: Bearer <token>`, `refresh_token_str` fixture creating a valid refresh token in the test DB.

Install when authentication is active: `uv add python-jose[cryptography] passlib[bcrypt]`

### Pagination

- All list endpoints must accept query params: `?page=1&page_size=20` (default page_size 20, max 100).
- Response shape: `{ "items": [...], "total": int, "page": int, "page_size": int, "pages": int }`.
- `PaginationParams` and `PaginatedResponse[T]` in `core/schemas.py` must be used for every list route. Custom pagination shapes per domain are forbidden.

### Background Tasks

- FastAPI's `BackgroundTasks` is permitted for short fire-and-forget operations only (emails, webhooks, push notifications) — tasks under 10 seconds, no durability requirement.
- The async task function must be defined in `service.py`. `BackgroundTasks` is injected in the router.
- Tasks exceeding 10 seconds or requiring durability must use `arq` (async Redis Queue) running as a separate Docker service.
- When task duration is unknown at design time, use `arq`. Optimistically using `BackgroundTasks` and migrating later is forbidden.
- Blocking a route handler with a long-running operation is forbidden.

**arq Worker — required when long-running tasks are needed:**
- Add dependencies: `uv add arq redis`. Add `REDIS_URL` to `backend/.env.example`.
- Worker entry point: `src/workers/worker.py`. Must define: `functions` list, `redis_settings` (from `REDIS_URL` env var), and `on_startup`/`on_shutdown` async hooks.
- Each task is an `async def` in the relevant `service.py` with `ctx: dict` as the first argument.
- Queue names must be defined as constants in `src/core/constants/queue_names.py`. Inline queue name strings are forbidden.
- The `arq` worker runs as a separate service in `docker-compose.yml`.
- Retry policy: default 3 retries with exponential backoff. Override per-task only when the task has documented idempotency guarantees.
- Failed tasks after exhausted retries must be logged at `ERROR` level with the full exception and job ID.

### Alembic Setup

Run once when initializing a new backend:
1. `uv add alembic asyncpg`
2. `alembic init alembic`
3. Replace the generated `alembic/env.py` with the async pattern using `async_engine_from_config` and `asyncio.run`. The `Base.metadata` import must trigger all model imports.
4. Set `sqlalchemy.url = %(DATABASE_URL)s` in `alembic.ini`.
5. In CI: `alembic upgrade head` must run before tests.

### pyproject.toml Minimum Content

`pyproject.toml` must define at minimum:
- `requires-python = ">=3.11"`
- `[tool.pytest.ini_options]` with `asyncio_mode = "auto"` and `testpaths = ["tests"]`
- `[tool.ruff.lint]` with `select = ["E", "F", "I"]`
- Dev dependencies: `pytest`, `pytest-asyncio`, `pytest-cov`, `pytest-mock`, `httpx`

### Environment Variables

Required variables for `backend/.env.example` (committed) and `backend/.env` (gitignored):
- `DATABASE_URL=postgresql+asyncpg://appuser:password@localhost:5432/appdb`
- `TEST_DATABASE_URL=postgresql+asyncpg://appuser:password@localhost:5432/appdb_test`
- `LOG_LEVEL=INFO`
- `CORS_ORIGINS=["http://localhost:3000"]`
- Auth variables (commented out until activated): `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`

---

## Layer 4 — Quality Control

### Logging

- Python's `logging` module is required — `print()` is forbidden.
- Configure once in `src/config.py` with format: `"%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s"`, datefmt `"%Y-%m-%d %H:%M:%S"`.
- In every module: `logger = logging.getLogger(__name__)`.
- FastAPI request logging: one `INFO` line per request via middleware, not per route handler.
- Log level: `DEBUG` in dev (via `LOG_LEVEL` env var), `INFO` in prod.
- Log messages must include relevant context: IDs, status codes — never raw objects.

### Linting

- Run `ruff check . --fix && ruff format .` before committing.
- Ignoring `E` or `F` rule groups requires a comment explaining the specific reason.

### Testing

Test structure:

```
tests/
├── conftest.py              shared fixtures: test DB engine, async client, get_db override
└── {domain}/
    ├── conftest.py          domain fixtures (sample records, auth token)
    ├── test_router.py       integration: real HTTP → real PostgreSQL test DB
    └── test_service.py      unit: mock repository with pytest-mock
```

Test DB setup: `appdb_test` is created automatically by `docker/postgres/init.sql` on first `docker compose up`. `TEST_DATABASE_URL` must be in `backend/.env` and must point to a different DB than `DATABASE_URL`.

`conftest.py` must implement:
- `event_loop` fixture (session-scoped)
- `engine` fixture (session-scoped) — creates all tables on setup, drops all on teardown
- `db_session` fixture — yields `AsyncSession`, rolls back after each test
- `client` fixture — overrides `get_db` with `db_session`, yields `AsyncClient`

The `get_db` override must be an `async def` generator — a plain `lambda` cannot yield from an async generator.

**What to test per file:**
- `test_router.py`: every route — status code, response schema shape, error cases (404/409/422)
- `test_service.py`: every service method — logic branches, exception raising, MQTT calls

**Coverage:** 80% minimum on `src/` — enforced with `pytest --cov=src --cov-fail-under=80`.

`asyncio_mode = "auto"` must be set in `pyproject.toml` — without it, `async def` test functions silently pass without running.

`pytest-asyncio` must be listed in `pyproject.toml` dev dependencies — `asyncio_mode = "auto"` has no effect without this package.


**Test commands:**

| Command | When to use |
|---------|-------------|
| `pytest -x --tb=short -q` | After every feature — fail fast |
| `pytest tests/{domain}/ -x` | Run one domain only |
| `pytest --cov=src --cov-report=term-missing --cov-fail-under=80` | Coverage enforcement |

---

## Layer 5 — Failure and Decision

- `TEST_DATABASE_URL` absent → stop. Do not run tests against the main database.
- Authentication feature not activated in `CLAUDE.md` → do not generate `src/core/security.py` or `src/auth/`. Generate them only when the checkbox is checked.
- Firmware layer inactive in `CLAUDE.md` → do not generate `src/mqtt/`, do not add `aiomqtt`, do not add `get_mqtt` to `core/dependencies.py`.
- ORM cannot express a required query → use raw SQL with a mandatory comment explaining why.
- Catch-all `try/except Exception` in a router → remove it. Exceptions must bubble to the global exception handlers.
- Missing `response_model` on a route decorator → add it. Returning an ORM model directly from a route is a hard failure.
- When API requirements are ambiguous (unclear schema field, unspecified status code, undefined authorization rule), stop and report — do not assume behavior.
- When a backend rule conflicts with a shared rule, apply the backend rule for this layer and flag the conflict explicitly in the PR description before proceeding.
- When a specification gap is found (missing endpoint, unspecified error case, undefined business rule), escalate — do not fill the gap with guesses.
