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
- CSS Modules + SCSS for all component styles — Tailwind CSS is forbidden
- Jotai for client UI state management
- TanStack Query v5 for server state (fetching, caching, mutations)
- react-hook-form + zod for forms and validation
- next-intl for i18n (internationalization)
- ESLint + Prettier for linting
- shadcn/ui — default UI component library; initialize once with `npx shadcn@latest init`, then add components individually with `npx shadcn@latest add <component>`. shadcn generates files into `components/ui/` by default. Every shadcn-generated component must be immediately moved into `shared/components/{ComponentName}/` and wrapped in the standard component folder structure (`.tsx`, `useComponentName.ts`, `.module.scss`). The generated file in `components/ui/` must be deleted. The `components/ui/` directory must not exist after initialization.

### Directory Structure

```
frontend/
├── messages/                         i18n translation files
│   ├── he.json                       Hebrew (default locale)
│   └── en.json                       English
├── i18n/
│   ├── routing.ts                    next-intl locale config and pathnames
│   └── request.ts                    getRequestConfig — loads messages per locale
├── middleware.ts                     next-intl locale detection and routing
├── app/
│   └── [locale]/                     locale segment wraps all routes
│       ├── (routes)/
│       │   ├── page.tsx              Server Component by default
│       │   ├── loading.tsx           Suspense boundary for this route segment
│       │   └── error.tsx             error boundary per route segment
│       ├── layout.tsx                sets <html lang={locale}>
│       └── providers.tsx             NextIntlClientProvider + QueryClientProvider + JotaiProvider
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
│       ├── constants/                non-translatable constants (API paths, config values)
│       ├── enums/                    status/type enums for this feature
│       ├── types.ts
│       ├── api.ts
│       └── index.ts
└── shared/
    ├── components/                   generic reusable UI primitives
    │   └── {ComponentName}/          same folder structure as above
    ├── store/globalAtoms.ts          global Jotai atoms
    ├── constants/                    app-wide non-translatable constants (routes, errors)
    ├── enums/                        app-wide enums
    ├── hooks/
    ├── utils/
    └── types/
```

### Component Folder Rule

**Every component lives in its own folder containing exactly these three files. No exceptions.**

```
ComponentName/
├── ComponentName.tsx          JSX structure only
├── useComponentName.ts        all logic, state, and handlers
└── ComponentName.module.scss  all styles
```

#### `ComponentName.tsx` — JSX only

**What is forbidden inside `.tsx`:**
- Logic of any kind — no `if/else` outside JSX, no data transformations, no calculations
- Hook calls (except the single `use` hook that returns everything from `useComponentName.ts`)
- `try/catch` blocks
- Inline styles — `style={{}}` props are forbidden
- Hardcoded strings — every text value comes from `t('key')` via the hook or from a constants file
- Direct imports of atoms, query hooks, API functions, or services

**What `.tsx` may contain:**
- The component declaration: `export const ComponentName = (props: ComponentNameProps): JSX.Element => { ... }`
- A single destructure of the hook: `const { ... } = useComponentName(props)`
- JSX return — structure, class names from the SCSS module, and values from the hook
- Imports: `useComponentName`, the SCSS module, child components, and Next.js/React types only

#### `useComponentName.ts` — all logic

Everything that is not JSX structure lives here:
- All hook calls (`useState`, `useEffect`, `useTranslations`, TanStack Query hooks, Jotai atoms)
- Event handlers and callbacks
- Derived values and data transformations
- The `ComponentNameProps` interface (exported for use in `.tsx`)
- The return type interface `UseComponentNameReturn` (exported and declared explicitly)

The hook signature must always be: `export const useComponentName = (props: ComponentNameProps): UseComponentNameReturn => { ... }`

#### `ComponentName.module.scss` — all styles

All visual styling lives here. Nothing visual goes elsewhere:
- No inline `style={{}}` in `.tsx`
- No Tailwind utility classes anywhere
- Use CSS logical properties (`margin-inline-start`, `padding-block`) for RTL compatibility

#### When each file is required

| File | Required when |
|------|---------------|
| `ComponentName.tsx` | Always |
| `useComponentName.ts` | Component has any hook, handler, atom access, query, or derived value. Omit only for pure static display (icon, badge, static text card with zero interactivity). |
| `ComponentName.module.scss` | Component has any visual styling. Omit only if all styling is inherited from a parent scope with no component-specific classes needed. |

A pure static display component with no logic and no unique styles is the only case where one or two of the three files may be absent. When in doubt, create all three.

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

Scaffold config files required at project init: `frontend/tsconfig.json`, `frontend/package.json` (replace `<project-slug>`), `frontend/next.config.ts`, `frontend/eslint.config.mjs`, `frontend/middleware.ts`, `frontend/i18n/routing.ts`, `frontend/i18n/request.ts`, `frontend/messages/he.json`, `frontend/messages/en.json`.

`frontend/package.json` must define the npm scripts: `dev`, `build`, `lint`, `test`, `test:run`, `test:coverage`.

`frontend/vitest.config.ts` must define at minimum: `environment: 'jsdom'`, coverage thresholds (`lines: 80, functions: 80, branches: 80`), and `setupFiles` pointing to the MSW server setup file.

`frontend/next.config.ts` must define at minimum: `images.remotePatterns` (empty array by default, populated per project) and `reactStrictMode: true`.

`app/providers.tsx` must be a Client Component (`"use client"`). It must wrap children with `QueryClientProvider` (TanStack Query) and `Provider` (Jotai) in that order. No data fetching or business logic is permitted in this file.

### CSS Modules + SCSS

- **Tailwind CSS is forbidden** — do not install it, do not use utility classes in JSX.
- All styling must be done exclusively via CSS Modules + SCSS.
- Style files must be named `{ComponentName}.module.scss`.
- Inline `style={{}}` props are forbidden.
- Global class names are forbidden — all selectors must be scoped via CSS Modules.
- `!important` is forbidden.

### Export Rules

- `export const` is required for all exports — `export default` is forbidden except in Next.js-required files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).
- **All components and hooks must use the `export const Name = () => ...` arrow function syntax** — named function expressions (`export function Name()`) are forbidden. Modern React DevTools resolves the variable name from `export const`, so there is no DevTools display issue.
- Example component: `export const UserCard = ({ user }: UserCardProps): JSX.Element => { ... }`
- Example hook: `export const useUserCard = (): UseUserCardReturn => { ... }`
- The return type must always be declared explicitly on every exported function and hook.

### No Inline Strings

**Zero inline strings are permitted anywhere in the codebase.** Every string that appears in JSX, logic, or hooks must come from one of the sources below — no exceptions.

| String type | Source |
|-------------|--------|
| UI text visible to the user (labels, titles, placeholders, button text, error messages shown in UI) | `messages/he.json` (and its locale siblings) via `next-intl` — see i18n section |
| Status / type values used in logic | `enums/{topic}Enums.ts` |
| Route paths | `shared/constants/routes.ts` |
| API endpoint paths | `shared/constants/apiEndpoints.ts` |
| Non-translatable error codes or internal keys | `shared/constants/errorCodes.ts` |
| Feature-specific non-translatable constants | `features/{name}/constants/{topic}.ts` |

**Applying the rule:**
- If a string is ever visible to the user → it goes in the messages JSON and is accessed via `t('key')`.
- If a string is a code-internal value (enum member, config key, URL path) → it goes in a constants or enums file.
- A string literal typed directly in a `.tsx`, `.ts`, or `.test.ts` file is a hard violation.

### i18n — Internationalization (next-intl)

**Package:** `next-intl` — install with `npm install next-intl`.

**Default locale:** `he` (Hebrew). English (`en`) is the secondary locale. Additional locales are added by creating a new `messages/{locale}.json` file and registering the locale in `i18n/routing.ts`.

**Setup files (scaffold once):**

`i18n/routing.ts` — defines supported locales and default:
```ts
import { defineRouting } from 'next-intl/routing';
export const routing = defineRouting({
  locales: ['he', 'en'],
  defaultLocale: 'he',
});
```

`i18n/request.ts` — loads the correct message file per request:
```ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? routing.defaultLocale;
  return { locale, messages: (await import(`../messages/${locale}.json`)).default };
});
```

`middleware.ts` (repo root of `frontend/`) — handles locale detection and redirects:
```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
export default createMiddleware(routing);
export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] };
```

**Directory layout for messages:**
- `messages/he.json` — Hebrew strings (source of truth for all UI text)
- `messages/en.json` — English translation (mirrors the exact key structure of `he.json`)
- Keys must be namespaced by feature/domain: `{ "Auth": { "loginButton": "כניסה" }, "Devices": { "title": "מכשירים" } }`
- Flat keys at the root level are forbidden — every key must be under a namespace.

**Usage in Server Components:**
```ts
import { getTranslations } from 'next-intl/server';
const t = await getTranslations('Auth');
return <h1>{t('loginButton')}</h1>;
```

**Usage in Client Components (`"use client"`):**
```ts
import { useTranslations } from 'next-intl';
const t = useTranslations('Auth');
return <button>{t('loginButton')}</button>;
```

**Rules:**
- `useTranslations` requires `"use client"` — it is a hook. When a component only needs translations and has no other client-side requirement, keep it as a Server Component and use `getTranslations` instead.
- `NextIntlClientProvider` must wrap the app in `app/[locale]/providers.tsx`, receiving `messages` and `locale` props from the Server Component layout.
- `app/[locale]/layout.tsx` must pass `messages` to `NextIntlClientProvider` and set `<html lang={locale} dir={locale === 'he' ? 'rtl' : 'ltr'}>`.
- RTL support: when `locale === 'he'`, `dir="rtl"` must be set on `<html>`. SCSS styles must use logical properties (`margin-inline-start`, `padding-inline-end`) instead of directional properties (`margin-left`, `padding-right`) so layout flips automatically with RTL.
- Adding a new user-visible string requires adding the key to **both** `he.json` and `en.json` in the same commit — partial translations that break one locale are forbidden.
- `next.config.ts` must wrap the config with `createNextIntlPlugin`: `import createNextIntlPlugin from 'next-intl/plugin'; const withNextIntl = createNextIntlPlugin(); export default withNextIntl(nextConfig);`

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

- Logic found inside a `.tsx` file (hook calls beyond the single `useComponentName`, data transformations, `if/else` outside JSX) must be moved to `useComponentName.ts` before the task is reported done.
- `style={{}}` found anywhere in a `.tsx` file must be replaced with a CSS Module class — do not leave it as a temporary fix.
- A component file found outside its own folder (e.g., a bare `Button.tsx` in a `components/` directory without a `Button/` subfolder) must be restructured into the three-file folder layout before proceeding.
- A missing MSW handler causes a test failure. Do not suppress it — add the missing handler.
- When a component's JSX exceeds 60 lines, extract child sub-components. The limit must not be raised.
- When no shared component exists for a reusable element, build it in `shared/` first. Creating a feature-scoped duplicate is forbidden.
- When the Server vs Client decision is ambiguous, default to Server Component. `"use client"` must be added only when the component satisfies one or more conditions listed in the Layer 3 "Server vs Client Components" section. No other reason is valid.
- When a component exceeds 8 direct children, split into sub-components. The limit must not be raised.
- When component or feature requirements are unclear, stop and report — do not assume intent or invent UI behavior not specified in the task.
- When a frontend rule conflicts with a shared rule, apply the frontend rule for this layer and flag the conflict explicitly in the PR description before proceeding.
- When a specification gap is found (missing route, unspecified state shape, undefined error behavior), escalate — do not fill the gap with guesses.
- A string literal typed directly in a `.tsx` or `.ts` file is a hard violation — move it to the correct messages JSON or constants/enums file before proceeding.
- A missing translation key in `he.json` or `en.json` is a build-time error with `next-intl` — add it to both files in the same change.
- Tailwind utility classes found in JSX must be removed and replaced with CSS Module classes — do not leave them as a "quick fix".
- `export function ComponentName()` (named function expression) found in a component file must be converted to `export const ComponentName = () => ...` — no exceptions.
