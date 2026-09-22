# no-file-no-mile-bro — Interface Plan

Companion to `../sql/001_initial_schema.sql`. Covers the first interface only;
the planning page is noted as a future surface but not designed here.

Ported from the retired Blazor version of this app. The domain decisions
(§2, §5–§9, §12) are unchanged; the platform, routing, component and styling
sections were rewritten for Next.js.

---

## 1. Platform decisions

| Decision | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Data access | `mssql` behind a DAL, split by aggregate |
| Auth | Shared SSO — `auth_token` JWT verified in `proxy.ts` |
| Styling | Tailwind v4 + `@parkerburgess/wandering-parker-theme` |
| Components | `@parkerburgess/wandering-parker-ui` where one exists |
| Hosting | Vercel, as the fifth app in the ecosystem |
| Primary target | Desktop; mobile supported but not optimised |

Server components read through the DAL directly. Client components never touch
the DAL — they call a route handler under `app/api`.

### Authentication — shared SSO

This app is a **resource server**, not an identity provider. It issues no
credentials and owns no passwords. `auth-wandering-parker` (better-auth) remains
the only thing that authenticates anyone.

Flow, matching the other four apps:

1. `proxy.ts` reads the `auth_token` cookie — domain `.wanderingparker.com` in
   production, host-only in development.
2. It verifies signature, `exp`, `iss` and `aud` against the JWKS at
   `{AUTH_SERVICE_URL}/api/auth/jwks`.
3. On any failure it redirects to
   `{WANDERING_PARKER_URL}/login?return_url={this app}` and clears the cookie.
4. `sub` is the user id. `lib/auth.ts` maps it to `training.Athlete.UserId`.

**Authorization is separate and lives in `lib/auth.ts`, not in `proxy.ts`.**
A valid token proves only that someone signed in somewhere in the ecosystem;
without a `dbo.AppAccess` grant for this app they would still get in by typing
the URL. `resolveAthleteAccess()` enforces the grant.

The check deliberately does not live in `proxy.ts`, even though Next runs proxy
on the Node runtime and `mssql` would load there. Next's own proxy guidance is
not to rely on shared modules or globals, because proxy can be deployed to the
CDN separately from the render path — and the SQL connection pool is exactly
such a global. Putting authorization in the render path also means a route that
the proxy matcher misses cannot slip past it.

**The dev bypass skips the grant check.** `DISABLE_AUTH=true` outside production
short-circuits to `dev-user-1`, matching the shared helpers. Requiring a real
grant row locally would make the bypass useless.

**Auto-provisioning.** First sign-in creates an `Athlete` row with a placeholder
birth date of 1900-01-01 and `ProfileCompletedAt` NULL. The MAF ceiling must not
be trusted until the profile is confirmed.

---

## 2. Shell layout

```
┌──────────────────────────────────────────────────────────────┐
│  no file, no mile                               [Account ▾]  │
├───────────┬──────────────────────────────────┬───────────────┤
│ Overall   │  MAF ceiling 123 · 4 of 5 under  │  Today        │
│ Run       │  ────────────────────────────────│  RHR      52  │
│ Cycling   │  [last 14 d – next 14 d ▾]       │  HRV      38  │
│ Other     │  Synced 6 min ago  [↻] [+ Log]   │  Sleep   7:10 │
│           │  ────────────────────────────────│  Weight  81.2 │
│           │  Sat 20  ▸ completed activity    │  Soreness  3  │
│           │  Fri 19  ▸ planned               │  ───────────  │
│           │  Thu 18  ▸ missed                │  [+ log day]  │
└───────────┴──────────────────────────────────┴───────────────┘
```

CSS Grid for the shell, three columns at `>= 1280px`.

---

## 3. Routing

One route segment carries both paths, via an optional catch-all:

```
app/
  layout.tsx                        shell, banner, auth gate
  page.tsx                          Overall board
  activities/[[...sportCode]]/page.tsx
```

`Overall` and each sport are the same board with a different filter. Adding a
sport is a seed row plus a nav entry, never a new page.

---

## 4. Component inventory

### Layout

| Component | Responsibility |
|---|---|
| `app/layout.tsx` | Grid shell, responsive breakpoints, auth gate |
| `components/Banner.tsx` | App name, hosts the shared `UserMenu` |
| `components/SportNav.tsx` | Left rail, driven off `training.Sport` |
| `components/WellnessPanel.tsx` | Right rail, today's `DailyWellness` |
| `components/WellnessEntryInline.tsx` | Inline edit for the manual wellness fields |

`UserMenu` comes from `@parkerburgess/wandering-parker-ui`. So do `Button`,
`Input`, `Select`, `Badge`, `Card` and `Modal` — reach for the shared package
before writing a local primitive.

### Board

| Component | Responsibility |
|---|---|
| `Board.tsx` | Owns sport + date filter state |
| `MafStatusRow.tsx` | Today's ceiling and compliance count for the filtered range |
| `BoardToolbar.tsx` | Date range picker, sync status, sync button, manual log button |
| `TrainingTimeline.tsx` | Ordered list, today divider |
| `TrainingEntryRow.tsx` | Switches on `TrainingEntryState` |
| `PlannedEntryView.tsx` | Target duration, distance, HR ceiling |
| `CompletedEntryView.tsx` | Actuals, with plan targets as secondary "vs. target" |
| `MafComplianceBadge.tsx` | Under / over ceiling indicator |
| `ManualActivityModal.tsx` | Exception path for entering an activity by hand |
| `LinkToPlannedModal.tsx` | Attach an unplanned activity to a plan row |

### Data access

The Blazor version had a service layer. Here that responsibility splits: query
shape lives in the DAL aggregate, and anything a client component needs is
exposed as a route handler.

| DAL aggregate | Responsibility |
|---|---|
| `lib/dal/athlete` | Athlete provisioning, AppAccess grant, profile |
| `lib/dal/lookups` | Sport, Environment, WorkoutType, DistanceUnit |
| `lib/dal/plan` | Templates, generated plans, plan workouts |
| `lib/dal/activity` | The unified timeline read model, manual entry, linking |
| `lib/dal/garmin` | FIT import (activity + wellness), exclusions |
| `lib/dal/maf` | Ceiling in force on a date, MAF tests and splits |

Only `athlete` and `lookups` exist today. Each of the others arrives with the
surface that consumes it.

---

## 5. The unified training entry

A planned workout and its resulting activity are one row. Completing a workout
swaps the presentation; the planned data is never removed or overwritten.

### States

| State | Condition | Renders |
|---|---|---|
| `Planned` | plan row, date >= today, no linked activity | Targets and HR ceiling |
| `Completed` | plan row with linked activity | Actuals, targets shown as secondary |
| `Missed` | plan row, date < today, no activity, `IsSkipped = 0` | Targets, muted, with a log action |
| `Skipped` | plan row, `IsSkipped = 1` | Targets, struck through |
| `Unplanned` | activity with `TrainingPlanWorkoutId IS NULL` | Actuals only, with a link action |

`Missed` and `Skipped` are deliberately distinct. A plan row that quietly did not
happen is the signal worth surfacing; one you consciously skipped is not.

### View model

```ts
export type TrainingEntryState =
  | "planned"
  | "completed"
  | "missed"
  | "skipped"
  | "unplanned";

export type TrainingEntry = {
  state: TrainingEntryState;
  date: string;
  trainingPlanWorkoutId: number | null;
  activityId: number | null;
  sportName: string;
  environmentName: string | null;
  workoutTypeName: string;
  targetDurationSeconds: number | null;
  targetDistanceMeters: number | null;
  heartRateCeiling: number | null;
  actualDurationSeconds: number | null;
  actualDistanceMeters: number | null;
  averageHeartRate: number | null;
  secondsAboveMafCeiling: number | null;
  isManualEntry: boolean;
};
```

### Query shape

`Activity.TrainingPlanWorkoutId` is nullable, which makes this two clean halves:

1. `LEFT JOIN` from `TrainingPlanWorkout` to `Activity` — yields `Planned`,
   `Completed`, `Missed`, `Skipped`.
2. `Activity` rows where `TrainingPlanWorkoutId IS NULL` — yields `Unplanned`.

`UNION ALL` the two, order by date ascending. State is derived in the projection
from the date, the null-ness of the activity, and `IsSkipped`.

---

## 6. Date filtering and ordering

- Single range filter covering past and future. Default: **last 14 days through
  next 14 days**.
- **Ascending by date**, so upcoming reads naturally downward.
- A visual divider marks today; the view scrolls to it on load.

---

## 7. Garmin sync and linking

Garmin import is the normal path. Manual entry is the exception, which is why it
sits behind a toolbar button rather than occupying the top of the page.

**Auto-link rule.** An imported activity links to a planned workout when all of
these hold:

- same athlete
- same date
- same sport
- **exactly one** candidate plan row matches

Anything ambiguous stays `Unplanned` and exposes a "link to planned" action.
Auto-linking on ambiguity would silently mis-attribute workouts, which is worse
than leaving it to a click.

The import also consults `training.GarminActivityExclusion` before inserting,
so deleted junk activities do not return.

**No API, no tokens.** Garmin data arrives only as `.fit` files copied off the
watch over USB — there is no Garmin Connect OAuth, no `GarminConnection`, and
no token storage. The original file bytes are never retained; each upload is
decoded in memory, scored, and discarded. De-duplication is a SHA-256 of the
file bytes plus the device serial number and the FIT `file_id.timeCreated`
(`training.FitFileImport` logs every upload attempt, including duplicates).

---

## 8. Wellness panel

Displays today's `DailyWellness`. A Forerunner 170 monitoring file supplies
resting HR (today's reading and a rolling baseline), stress and respiration —
captured in `training.GarminWellness`. It has **no sleep or HRV messages**, so
those two columns, plus body weight, stay manual-only for now; soreness,
energy and mood always have been. The panel carries an inline entry rather
than being read-only, or those columns stay null forever.

Monitoring files are not immutable — the watch appends to the current day's
file all day — so a monitoring upload is an upsert keyed on
`(AthleteId, RecordedOn)`, never a file-hash de-dup like the activity path.

---

## 9. Responsive behaviour

| Breakpoint | Behaviour |
|---|---|
| `>= 1280px` | Full three-column grid |
| `1024–1279px` | Wellness panel collapses to a drawer toggled from the banner |
| `< 1024px` | Nav collapses to a hamburger; single column; timeline rows stack |

Desktop-first. Mobile is expected to work, not to be optimal.

---

## 10. Styling conventions

Tailwind, with the ecosystem class-const rule: every `className` is a named
`const` declared inside the component function, above the `return`, grouped in a
`// #region Tailwind utility consts` block and suffixed `Cls`.

```tsx
export default function Shell({ children }: Props) {
  // #region Tailwind utility consts
  const shellCls = "grid grid-cols-[14rem_1fr_18rem] gap-6 min-h-screen bg-neutral-50";
  const navLinkCls = "grid px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer";
  // #endregion

  return <div className={shellCls}>{children}</div>;
}
```

Conditional classes go in a named function returning `string`, never an inline
ternary in JSX.

**Applied design rules**

- Spacing on the 4px scale only: `gap-6`, `p-6`, `px-4 py-2`. Button horizontal
  padding is roughly 2x vertical.
- Three type sizes: headings, body, labels. No fourth.
- Theme colours from the shared package — `neutral`, `brand`, and the semantic
  `correct` / `incorrect` / `caution`. Semantic colour carries meaning only:
  under the MAF ceiling vs over it or missed.
- Borders at the `400` stop, page surfaces at `50`, primary actions at `600`,
  hover at `700`, text at `900`.
- `cursor-pointer` on active buttons and links, `cursor-not-allowed` on disabled.
- Grid over flex for layout.
- All text selectable — no `select-none`.
- Every input placeholder gets an explicit colour.

---

## 11. Database and schema state

Deployed to the shared Azure SQL instance,
`parkerfreedbserver.database.windows.net` / `parkerfreedb`, following the
schema-per-app convention the other apps use. All 26 tables live in the
`training` schema — the app name is a joke, the schema name describes the data.
`dbo` on that same database holds the better-auth tables (`user`, `session`,
`account`, `verification`, `jwks`) and `AppAccess`.

**The two schemas are deliberately not joined.** `training.Athlete.UserId` holds
the better-auth user id with no foreign key, because `dbo` is owned by a
different service with its own migration lifecycle. The uniqueness guarantee is
local: a filtered unique index, `UX_Athlete_UserId`, which permits many unlinked
athlete rows but only one row per linked auth user.

`NVARCHAR(50)` rather than `INT`, even though better-auth is configured
`generateId: "serial"`. The `sub` claim arrives as a string, `dbo.AppAccess.UserId`
is itself `NVARCHAR`, and the shared dev bypass yields the non-numeric
`dev-user-1`. An `INT` column would make this app the only one that cannot use
the standard bypass.

Scripts, in `../sql`:

| Script | Purpose |
|---|---|
| `001_initial_schema.sql` | Schema, all 26 tables, seed data. Idempotent schema creation, not idempotent table creation. |
| `drop_all.sql` | Teardown. Resets the `training` schema only. |

`drop_all.sql` is schema-qualified throughout and never touches `dbo`. The
Blazor version carried a second section that dropped unqualified `dbo` names as
a one-time cleanup; it is not carried over, because this app has no pre-schema
history and `dbo` belongs to the auth service.

---

## 12. Future: planning page

Not designed here, but two things should be left room for now:

- `SportNav` should render a data-driven sport list **and** a separate static
  section, so adding a non-sport entry like "Plan" later does not fight the
  lookup-driven design.
- The board's read model already exposes `trainingPlanWorkoutId`, which is what
  a planning page will need to edit plan rows in place.

---

## 13. Build order

1. ~~Scaffold: config, theme, banner, auth, athlete provisioning~~ — done
2. ~~Run `001_initial_schema.sql` against the shared database~~ — done; run
   `002_fit_import.sql` on top of it before step 8
3. Register the app: hub `projects.json` entry and an `AppAccess` grant row
4. Shell, `SportNav` and layout against seeded lookups
5. `lib/dal/activity` and a read-only timeline
6. Wellness panel with inline entry
7. Manual activity modal and link-to-planned
8. FIT upload, decode, and auto-link
9. *(future)* planning page
