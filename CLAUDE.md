# no-file-no-mile-bro

## Project Overview

Training tracker built around the MAF (Maffetone) method: aerobic-base running
with cycling cross-training, held under a heart rate ceiling of roughly
180 − age. Plans are generated from templates into dated workouts; actual work
arrives from Garmin and is reconciled against the plan.

Goal races: 5K on 2026-11-14 (B, tune-up) and 25K on 2027-01-23 (A, goal).

Fifth app in the wandering-parker ecosystem. It replaces a Blazor Server version
that was abandoned when the app had to be Vercel-hosted.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind v4 via `@parkerburgess/wandering-parker-theme`
- **Components**: `@parkerburgess/wandering-parker-ui`
- **Data**: `mssql` against the shared Azure SQL database
- **Auth**: shared SSO via `@parkerburgess/wandering-parker-server`

## Architecture

### Data Access Layer

The schema is 26 tables, so the DAL is **split by aggregate** rather than
exposed as one flat interface:

```
lib/dal/
  index.ts        composition root — export const dal: IDataAccess
  types.ts        IDataAccess: one property per aggregate
  mapping.ts      Date -> ISO string helpers
  athlete/        types.ts + sql.ts
  lookups/        types.ts + sql.ts
  sql/index.ts    assembles the SQL implementations
```

Adding an aggregate: a new folder with `types.ts` and `sql.ts`, one property on
`IDataAccess`, one line in `lib/dal/sql/index.ts`. Planned next are `plan`,
`activity`, `garmin` and `maf` — each arrives with the surface that needs it.

**Always go through `executeQuery` from the shared server package**, never
`pool.request()` directly. The shared Azure SQL instance auto-pauses, and
`executeQuery` is what retries a query that fails while the database is still
waking up.

@docs/database-schema.md

### Auth

- `proxy.ts` handles **authentication only** — verify the `auth_token` JWT
  against the auth service JWKS, redirect to the hub login on failure.
- `lib/auth.ts` handles **authorization** — `resolveAthleteAccess()` checks the
  `dbo.AppAccess` grant and resolves or auto-provisions the `Athlete` row.
  It is `cache()`d per request.
- Server components call `requireAthlete()`, which redirects a non-granted user
  to the hub. Route handlers call `resolveAthleteAccess()` and return
  `forbidden(...)` on denial.
- Do **not** move the AppAccess check into `proxy.ts`. Next's proxy guidance is
  not to rely on shared modules or globals there, and the connection pool is one.
- `DISABLE_AUTH=true` outside production skips both the JWT check and the grant
  check, and signs in as `dev-user-1`.

## Development Rules

- Route handlers handle all data operations for client components; components
  never import the DAL directly. Server components may read the DAL.
- Async/await everywhere.
- Strongly typed — no `any`, no `object`.
- No hardcoded names or paths — `lib/config.ts` holds the app name, defaults and
  schema name.
- API response helpers live in `lib/api-response.ts` — `badRequest`,
  `unauthorized`, `forbidden`, `notFound`, `unprocessable`, `serverError`. Never
  build an error response inline in a route.
- Run `npm run build` and `npx eslint` after changes.

## Styling Rules

- Every `className` is a named `const` declared inside the component function,
  above the `return`, grouped in a `// #region Tailwind utility consts` block.
  Name for role with a `Cls` suffix — `startBtnCls`, not `blueButtonCls`.
- Conditional classes go in a named function returning `string`, never an inline
  ternary in JSX.
- No inline multi-statement arrow functions on JSX event props — extract to a
  named handler.
- Input placeholders always get an explicit colour; never rely on the browser
  default.
- Use theme colours (`neutral`, `brand`, `correct`, `incorrect`, `caution`), not
  raw Tailwind palette names.
- Grid over flex. Spacing on the 4px scale. `cursor-pointer` on active controls,
  `cursor-not-allowed` on disabled.

## Gotchas

- **Tailwind v4 skips `node_modules`.** Any new `@parkerburgess/*` package that
  ships JSX with Tailwind classes needs a matching `@source` line in the theme
  package, or its classes silently produce no CSS.
- **The React Compiler lint rules are stricter here than in the older apps.**
  The `useState` + `useEffect` mount guard those apps use for `next-themes` is a
  lint error; `components/Banner.tsx` uses `useSyncExternalStore` instead.
- **Filtered indexes need `QUOTED_IDENTIFIER ON`.** sqlcmd leaves it off, so
  `001_initial_schema.sql` sets it in its own preamble rather than relying on
  the caller passing `-I`. Any future script with a filtered index needs the
  same preamble, or it fails with msg 1934 partway through.
- **`drop_all.sql` touches only the `training` schema.** `dbo` on that database
  is the auth service's. Never add an unqualified drop.

## Interface Plan

@docs/ui-plan.md
