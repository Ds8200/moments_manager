---
paths: ["frontend/**"]
---

> All rules in `shared.md` apply to this layer. The sections below are frontend-specific additions
> and overrides. In case of conflict, the rules below take precedence.

# Frontend — Next.js + TypeScript

---

## Layer 1 — Core Behavior

- **Application framework:** Next.js 14+ (App Router). **Test runner:** Vitest (built on Vite). They serve distinct roles and coexist in the same project. Next.js handles routing, SSR, and the build pipeline; Vitest handles unit and integration tests independently of the Next.js build.
- Default to Server Components — `"use client"` must not be added unless one of the explicit conditions in Layer 3 is met.
- Check `shared/components/` and `shared/hooks/` for an existing match before creating any new component or hook.
- Any component or hook used in 2 or more places must be built in `shared/` first — feature-scoped duplication is forbidden.
- No prop drilling beyond 2 levels — use a Jotai atom instead.
- Atoms must not be imported or called directly in `.tsx` files — access only through the `use` hook.
- Jotai atoms must not be used to cache API responses — use TanStack Query for all server data.
- `api.ts` files are Client-only files used exclusively by Client Components and TanStack Query hooks. They must import and use `apiClient` from `shared/utils/apiClient.ts`. Direct `fetch()` calls in `api.ts` files are forbidden.
- In Server Component files (`page.tsx`, `layout.tsx`, and any `async` function component not marked `"use client"`): use `fetch()` directly with Next.js cache semantics. Server Components must not import `api.ts` files or use `apiClient`.
- In Client Components: use TanStack Query hooks that call `api.ts` functions. Direct `fetch()` calls in `.tsx` Client Component files are forbidden.

---

## Layer 2 — Architecture

### Stack

- Next.js 14+ (App Router), TypeScript (strict mode)
- SCSS Modules for all styling — Tailwind CSS is forbidden in this project
- Jotai for client UI state management
- TanStack Query v5 for server state (fetching, caching, mutations)
- react-hook-form + zod for forms and validation
- ESLint + Prettier for linting
- No shadcn/ui — all UI components are hand-built in `shared/components/` using SCSS Modules

### Directory Structure

```
frontend/
├── app/                              Next.js App Router
│   ├── (routes)/
│   │   ├── page.tsx                  Server Component by default
│   │   ├── loading.tsx               Suspense boundary for this route segment
│   │   └── error.tsx                 error boundary per route segment
│   ├── layout.tsx
│   └── providers.tsx                 QueryClientProvider + JotaiProvider + other wrappers
├── features/
│   └── {featureName}/
│       ├── components/
│       │   └── {ComponentName}/      each component in its own folder
│       │       ├── ComponentName.tsx
│       │       ├── useComponentName.ts
│       │       ├── ComponentName.module.scss
│       │       └── ChildComponent/   child components nested inside parent
│       │           ├── ChildComponent.tsx
│       │           ├── useChildComponent.ts
│       │           └── ChildComponent.module.scss
│       ├── store/featureAtoms.ts     Jotai atoms for this feature
│       ├── queries/                  TanStack Query hooks for this feature
│       ├── constants/                UI labels, API paths, config values
│       ├── enums/                    status/type enums for this feature
│       ├── types.ts
│       ├── api.ts
│       └── index.ts
└── shared/
    ├── components/                   generic reusable UI primitives
    │   └── {ComponentName}/          same folder structure as above
    ├── store/globalAtoms.ts          global Jotai atoms
    ├── constants/                    app-wide constants (routes, errors)
    ├── enums/                        app-wide enums
    ├── hooks/
    ├── utils/
    └── types/
```

### Component Folder Rule

Every component lives in its own folder. No exceptions.

Required files per component:
- `ComponentName.tsx` — JSX only, no logic, no inline strings
- `useComponentName.ts` — all logic, handlers, atom access, query hooks, types
- `ComponentName.module.scss` — component styles

`useComponentName.ts` is required when the component meets any of these conditions:
- Has 2 or more hooks
- Has any `useEffect`
- Accesses Jotai atoms
- Performs data fetching

A single `useState` for a purely local toggle is the only case where inline hook usage in `.tsx` is acceptable.

Additional constraints:
- `try/catch` is permitted in event handlers inside `useComponentName.ts` — it is forbidden in JSX render functions.
- Pure display components (icons, badges, static cards with no logic) do not require a hook file.
- `ComponentName.tsx` must only import from `./useComponentName` and the style file.
- The props interface (`{ComponentName}Props`) is defined in `useComponentName.ts` and exported to `.tsx`.
- `.tsx` files must not exceed 60 lines of JSX — extract child sub-components when this limit is reached.
- No component must render more than 8 direct children — split into sub-components when this limit is reached.

### State Management

**Jotai — client UI state only:**
- Global atoms: `shared/store/globalAtoms.ts`
- Feature atoms: `features/{name}/store/featureAtoms.ts`
- Derived state: use `atom(get => ...)` — never compute derived values inside a component.
- Write logic: use a setter atom or `atomWithReducer` — defined in the hook file.

**TanStack Query — server state:**
- Queries are defined in `features/{name}/queries/` as custom hooks.
- Query keys pattern: `[domain, id?]` — e.g., `["devices"]`, `["devices", deviceId]`.
- `queryClient.invalidateQueries` must be called after every mutation — manually updating atom state with server data is forbidden.
- Hydration from Server Components: use `<HydrationBoundary>` with `prefetchQuery` for SSR.

### API Client

- The shared fetch wrapper lives at `shared/utils/apiClient.ts` and exports `apiClient<T>` and `ApiError`.
- All feature `api.ts` files must import and use `apiClient` — calling `fetch()` directly is forbidden.
- `ApiError` must be handled in TanStack Query `onError` — silent swallowing is forbidden.
- `NEXT_PUBLIC_API_URL` must be declared in `frontend/.env.example`.

### TypeScript

- `strict: true` in `tsconfig.json` — no exceptions.
- `any` is forbidden — use `unknown` with type narrowing or define a specific type.
- All exported functions and hooks must have explicit return types.
- Use `interface` for object shapes, `type` for unions and intersections.
- Type assertions (`as`) require a comment explaining why narrowing cannot be used.

Scaffold config files required at project init: `frontend/tsconfig.json`, `frontend/package.json` (replace `<project-slug>`), `frontend/next.config.ts`, `frontend/eslint.config.mjs`. No `tailwind.config.ts` — Tailwind is not used.

`frontend/package.json` must define the npm scripts: `dev`, `build`, `lint`, `test`, `test:run`, `test:coverage`.

`frontend/vitest.config.ts` must define at minimum: `environment: 'jsdom'`, coverage thresholds (`lines: 80, functions: 80, branches: 80`), and `setupFiles` pointing to the MSW server setup file.

`frontend/next.config.ts` must define at minimum: `images.remotePatterns` (empty array by default, populated per project) and `reactStrictMode: true`.

`app/providers.tsx` must be a Client Component (`"use client"`). It must wrap children with `QueryClientProvider` (TanStack Query) and `Provider` (Jotai) in that order. No data fetching or business logic is permitted in this file.

### SCSS Modules

- Tailwind CSS is forbidden — do not install it, do not import it, do not use utility class names in JSX.
- All styling must be written in `.module.scss` files — one per component.
- Style files must be named `{ComponentName}.module.scss`.
- Global design tokens (colors, spacing, typography, shadows, breakpoints) must be defined in `shared/styles/_variables.scss` and imported via `@use` in each module file.
- Shared mixins (responsive breakpoints, flex/grid helpers) must live in `shared/styles/_mixins.scss`.
- A global reset and base typography must live in `app/globals.scss`.
- Inline `style={{}}` props are forbidden.
- Global class names are forbidden — all selectors must be scoped via CSS Modules.
- `!important` is forbidden.

### Export Rules

- `export const` is required for all exports — `export default` is forbidden except in Next.js-required files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).
- Components must use named function expressions — arrow function components are forbidden because they display as anonymous in React DevTools.
- Arrow functions must be used for hooks — hooks do not appear in React DevTools.

### No Inline Strings

Raw strings in JSX or logic are forbidden. Every string must come from a constants or enums file.

Constants file naming:
- UI labels → `constants/{topic}Labels.ts`
- Status/type values → `enums/{topic}Enums.ts`
- Route paths → `shared/constants/routes.ts`
- API endpoints → `shared/constants/apiEndpoints.ts`
- Error messages → `shared/constants/errorMessages.ts`

---

## Layer 3 — Workflow

### Server vs Client Components

`"use client"` must be added only when the component uses one or more of:
- `useState`
- `useEffect`
- Browser APIs
- Event handlers
- Jotai atoms
- TanStack Query hooks

`"use client"` must not appear on a layout file — it forces all children to be client components.

`error.tsx` files must be `"use client"` (Next.js requirement).

`useRouter`, `usePathname`, `useSearchParams`, and `redirect` must be imported from `next/navigation` — importing from `next/router` (Pages Router) is forbidden.

Data fetching in Server Components: use `fetch()` directly — Next.js caches automatically. Data fetching in Client Components: use TanStack Query.

### Page Metadata (SEO)

- `<head>` tags must not be set directly — use `generateMetadata` or `metadata` exports.
- Static pages: export a `metadata` const of type `Metadata`.
- Dynamic pages: export a `generateMetadata` async function.
- Root `layout.tsx` sets site-wide defaults — child pages override only what differs.
- `<title>` and `<meta>` tags must not appear inside `"use client"` components.

### Images and Fonts

- `next/image` is required for all images — raw HTML `<img>` tags are forbidden.
- `next/font` is required for all fonts — `<link>` to external font CDNs is forbidden.

### Loading States (Suspense Boundaries)

Every route segment that fetches data requires a `loading.tsx` file:

```
app/
└── {route}/
    ├── page.tsx       async Server Component
    ├── loading.tsx    shown while page.tsx is streaming
    └── error.tsx      shown when page.tsx throws
```

`loading.tsx` must show skeleton UI that mirrors the structural shape of the loaded content. A spinner must not be used unless the loaded content has no fixed structural shape (a canvas, a media player with dynamic aspect ratio, or user-generated content of unknown dimensions). When a spinner is used instead of a skeleton, `loading.tsx` must include a comment of the form `// spinner: <specific reason why a skeleton cannot be used>`.

For client-side loading (TanStack Query), use the query's `isPending` state, not `loading.tsx`.

### Form Handling

- All forms must use `react-hook-form` — managing form state manually with `useState` is forbidden.
- Validation schema must use `zod`.
- Schema definition and form registration must live in `useComponentName.ts`.
- Submit handlers must call a TanStack Query mutation — direct `fetch()` in submit handlers is forbidden.

### Error Boundaries

- Every route segment requires an `error.tsx` file.
- A shared reusable `ErrorBoundary` must live in `shared/components/ErrorBoundary/`.
- `try/catch` in JSX render functions is forbidden — use error boundaries.
- TanStack Query `isError` and `error` states handle async errors in client components.

### Environment Variables

- Server-only vars: plain name (`SECRET_KEY`) — accessible only in Server Components and API routes.
- Client-accessible vars: `NEXT_PUBLIC_` prefix — bundled into the client.
- Referencing a server-only var in a `"use client"` file is forbidden.
- All env vars must be documented in `frontend/.env.example`.
- Minimum `frontend/.env.example` entry: `NEXT_PUBLIC_API_URL=http://localhost:8000`

---

## Layer 4 — Quality Control

### TypeScript

TypeScript rules are defined in Layer 2 (TypeScript section). The rules in Layer 2 are authoritative. The summary: `strict: true` is non-negotiable; `any` is forbidden in all files.

### Linting

- `npm run lint` must pass before every commit — Husky enforces via lint-staged.
- Disabling ESLint rules inline requires a comment explaining the specific reason.

### Logging

Two loggers — use the correct one per context:

- **Server-side** (Server Components, API routes, server actions): `shared/utils/logger.ts` using `pino`. Production must emit raw JSON; development may use `pino-pretty`.
- **Client-side** (`"use client"` hooks): `shared/utils/clientLogger.ts`. `info` is silenced in production; `warn` and `error` are always active.

Logging must occur in `use` hook files only — `.tsx` component files must not log.

### Testing

**Test runner:** Vitest + React Testing Library. Vitest is built on Vite and runs independently of the Next.js build pipeline.


Test file location — inside the component folder:

```
ComponentName/
├── ComponentName.tsx
├── useComponentName.ts
├── ComponentName.module.scss
└── __tests__/
    ├── useComponentName.test.ts   primary — test all hook logic
    └── ComponentName.test.tsx     secondary — render and interaction only
```

Feature-level tests: `features/{name}/__tests__/` for `api.ts`, atom logic, and query hooks.

**API mocking:** MSW (Mock Service Worker) is required — install with `npm install --save-dev msw`. Mocking `fetch` directly is forbidden.

MSW setup: `shared/mocks/handlers.ts` for handler definitions, `shared/mocks/server.ts` for the server instance. `onUnhandledRequest: "error"` must be set.

**What to test:**
- `useXxx.ts` — all exported values, state transitions, error paths, edge cases
- Components — conditional rendering and user interactions only
- Jotai atoms — test in isolation using `createStore()`
- TanStack Query hooks — wrap in `QueryClientProvider` + MSW handler, assert loading/error/data states
- `api.ts` functions — use MSW to assert request shape and error handling

**What must not be tested:** styling, static markup with no logic, third-party library behavior.

**Test commands:**

| Command | When to use |
|---------|-------------|
| `npm run test:run` | After every feature or fix — single run, no watch |
| `npm run test` | During development — watch mode |
| `npm run test:coverage` | Coverage report — fails if below 80% |

---

## Layer 5 — Failure and Decision

- A missing MSW handler causes a test failure. Do not suppress it — add the missing handler.
- When a component's JSX exceeds 60 lines, extract child sub-components. The limit must not be raised.
- When no shared component exists for a reusable element, build it in `shared/` first. Creating a feature-scoped duplicate is forbidden.
- When the Server vs Client decision is ambiguous, default to Server Component. `"use client"` must be added only when the component satisfies one or more conditions listed in the Layer 3 "Server vs Client Components" section. No other reason is valid.
- When a component exceeds 8 direct children, split into sub-components. The limit must not be raised.
- When component or feature requirements are unclear, stop and report — do not assume intent or invent UI behavior not specified in the task.
- When a frontend rule conflicts with a shared rule, apply the frontend rule for this layer and flag the conflict explicitly in the PR description before proceeding.
- When a specification gap is found (missing route, unspecified state shape, undefined error behavior), escalate — do not fill the gap with guesses.
