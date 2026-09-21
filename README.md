# no-file-no-mile-bro

MAF training tracker — aerobic-base running with cycling cross-training, plans
generated from templates, actuals imported from Garmin.

Fifth app in the wandering-parker ecosystem. Next.js 16, TypeScript, Tailwind v4,
SQL Server, shared SSO.

## Setup

```bash
npm install
```

`npm install` reads `@parkerburgess/*` from GitHub Packages, which needs
`WANDERING_PARKER_PACKAGES_TOKEN` set to a **classic** PAT with `read:packages`.
Fine-grained PATs do not work with the GitHub Packages npm registry.

## Environment

`.env.local` for local development; the same names are set per-project in Vercel.

| Variable | Purpose |
|---|---|
| `DB_SERVER` | Azure SQL server host |
| `DB_DATABASE` | Database name |
| `DB_USER` | SQL login |
| `DB_PASSWORD` | SQL password |
| `AUTH_SERVICE_URL` | better-auth service, e.g. `http://localhost:3001` |
| `WANDERING_PARKER_URL` | Hub that owns the login page, e.g. `http://localhost:3000` |
| `DISABLE_AUTH` | `true` outside production signs in as `dev-user-1` |
| `WANDERING_PARKER_PACKAGES_TOKEN` | GitHub Packages read token |

## Running

```bash
npm run dev
```

Serves on port **3004** and opens an incognito Chrome window. Use
`npm run dev:server-only` to skip the browser.

## Database

Scripts in `sql/`, run against the shared Azure SQL database. All objects live in
the `training` schema.

```bash
sqlcmd -S <server> -d <database> -U <user> -P <password> -i sql/001_initial_schema.sql
```

`sql/drop_all.sql` resets the `training` schema. It never touches `dbo`, which
belongs to the auth service.

## Before it will admit anyone in production

Two registrations outside this repo, neither done yet:

1. An `AppAccess` row granting your user `no-file-no-mile-bro`.
2. An entry in the hub's `data/projects.json` so the app appears in the launcher.

Local development does not need either — `DISABLE_AUTH=true` skips the grant
check.

## Documentation

- `docs/database-schema.md` — the 26 tables, readable
- `docs/ui-plan.md` — interface plan and build order
- `CLAUDE.md` — architecture and working rules


