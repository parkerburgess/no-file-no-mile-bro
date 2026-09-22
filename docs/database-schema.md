# Database Schema

Source of truth is `../sql/001_initial_schema.sql` plus `../sql/002_fit_import.sql`
on top of it. This file is the readable summary — 27 tables is more than is
reasonable to re-derive from DDL each time.

All tables live in the **`training`** schema on the shared Azure SQL database
(`parkerfreedbserver` / `parkerfreedb`). `dbo` on that same database belongs to
`auth-wandering-parker` and is never written by this app.

## Conventions

- Table names singular; junction tables `table1_table2` in lower snake case.
- PK is `INT IDENTITY`, named `[Table]Id`, and is the first column.
- FKs follow the PK. `CreatedAt` / `UpdatedAt` are last.
- Constraints: `PK_[table]`, `FK_[foreign table]_[table]`, `UQ_[table]_[columns]`,
  `DF_[table]_[column]`, `CK_[table]_[rule]`.
- Distances are stored in **metres**, durations in **seconds**, and converted at
  the UI edge. Timestamps are UTC.

## 1. Lookups

| Table | Notes |
|---|---|
| `Sport` | `Code`, `Name`, `ShowInNav`, `SortOrder`. Drives the data-driven nav. |
| `Environment` | Treadmill, Road, Trail, Stationary, Single Track, Gym, Home. |
| `sport_environment` | Which environments are legal for which sport. |
| `WorkoutType` | `IsAerobicCapped` marks the types held at or below the MAF ceiling. |
| `TrainingPhase` | Base, Build, Sharpen, Taper, Race Week, Recovery. |
| `RacePriority` | A goal race, B tune-up, C training effort. |
| `TrainingPlanStatus` | Draft, Active, Completed, Abandoned. |
| `DistanceUnit` | `MetersPerUnit` — kilometre and mile. |
| `HeartRateAdjustmentReason` | `DeltaBeatsPerMinute`, the Maffetone adjustments to 180−age. |

## 2. Identity and profile

| Table | Notes |
|---|---|
| `Athlete` | `UserId NVARCHAR(50)` links to the auth service with **no FK**; unique via the filtered index `UX_Athlete_UserId`. `BirthDate` is a 1900-01-01 placeholder until `ProfileCompletedAt` is set. |
| `HeartRateProfile` | Effective-dated. MAF HR moves on a birthday or an adjustment change, so an activity is scored against the row covering its date. |

## 3. Races

| Table | Notes |
|---|---|
| `Race` | Goal and tune-up races, with distance, goal and actual time. `URL` links the event or registration page. |

## 4. Plan templates

The blueprint a plan is generated from.

| Table | Notes |
|---|---|
| `TrainingPlanTemplate` | Named template for a sport, with a week count. |
| `TrainingPlanTemplateWeek` | `WeekNumber` counts forward; 1 is first, `WeekCount` is race week. |
| `TrainingPlanTemplateWorkout` | `DayOfWeek` matches `Date.getDay()`: 0 = Sunday. |

## 5. Generated plan

| Table | Notes |
|---|---|
| `TrainingPlan` | Instantiated from a template, or free-standing. |
| `trainingplan_race` | A plan can span several races; at most one goal race, enforced by a filtered unique index. |
| `TrainingPlanWeek` | Dated weeks. |
| `TrainingPlanWorkout` | The dated planned workout. `EnvironmentId` is nullable — treadmill vs road is unknown at generation time. `HeartRateCeiling` is snapshotted so a later profile change never rewrites history. |

## 6. Actual work

| Table | Notes |
|---|---|
| `Activity` | **Canonical resolved truth.** Every analysis query reads this and never a source table. Nullable `TrainingPlanWorkoutId` makes unplanned activities legal. |
| `GarminActivity` | What a decoded `.fit` file reported, kept separate so a re-import never overwrites a hand correction. Zero or one per `Activity`. Keyed on `FileHash` (SHA-256 of the file bytes) plus `(DeviceSerialNumber, FileCreatedAt)` from the FIT `file_id` message — not an external id, since there is no API. |
| `GarminActivityExclusion` | Tombstone, keyed on `FileHash`. Stops a deleted junk activity being re-imported the next time its file is uploaded. |

## 7. MAF test

| Table | Notes |
|---|---|
| `MafTest` | Warm up, hold MAF HR for a fixed distance. Progress is the pace trend across tests at equal HR. |
| `MafTestSplit` | One row per split. |

## 8. Wellness

| Table | Notes |
|---|---|
| `DailyWellness` | One row per athlete per day. Resting HR, stress and respiration can come from `GarminWellness`; sleep, HRV and body weight have no source on the current watch and, along with soreness, energy and mood, are manual. Rising morning RHR is the earliest overreaching signal. |
| `GarminWellness` | What a decoded monitoring `.fit` file reported for a day, kept separate so a re-import never overwrites a hand correction. One row per athlete per day, upserted as the day's monitoring file is re-uploaded (it is not immutable — the watch appends to it all day) — never de-duplicated by file hash the way `GarminActivity` is. |

## 9. FIT import

| Table | Notes |
|---|---|
| `FitFileImport` | Audit log, one row per upload attempt, shared by the activity and monitoring paths. `Outcome` is `Imported`, `Duplicate`, `Failed` or `Unsupported` — a duplicate is expected and logged, not an error, since the normal source is the whole watch folder re-uploaded on every sync. |

## Settled modelling decisions

- **Planned and actual are separate tables.** `TrainingPlanWorkout` vs
  `Activity`, linked by a nullable FK.
- **Garmin is the only external source, and it arrives only as `.fit` files
  copied off the watch over USB.** There is no Garmin Connect API, no OAuth,
  no stored tokens, and the original file bytes are never retained — each
  upload is decoded in memory and discarded. Strava and Zwift are deferred,
  not planned. Garmin is modelled as measurement *of* an `Activity`, never as
  a separate activity.
- **De-duplication differs by file type.** Activity files are immutable, so
  `GarminActivity` de-dupes on a content hash. Monitoring files are not — the
  watch appends to the current day's file all day — so `GarminWellness`
  de-dupes by upserting on `(AthleteId, RecordedOn)` instead.
- **Sleep, HRV and VO2 max have no source on a Forerunner 170** (confirmed
  against real files, not the FIT spec) and stay manual-entry only. This may
  not hold for every Garmin model.
- **Time-series streams are deferred.** Stream tables would hang off the source
  table, not off `Activity`, which keeps the refactor cost low for now.
- **No soft deletes.** `GarminActivityExclusion` is the one narrow tombstone.
- `User` and `Plan` are T-SQL reserved words, hence `Athlete` and `TrainingPlan`.
- Sport and Environment are separate dimensions joined by a junction, not one
  flattened list.
- **No treadmill calibration factor** — treadmill data is trusted as reported.
