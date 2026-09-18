# Database Schema

Source of truth is `../sql/001_initial_schema.sql`. This file is the readable
summary — 26 tables is more than is reasonable to re-derive from DDL each time.

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
| `GarminConnection` | One per athlete. Tokens stored already encrypted. |
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
| `GarminActivity` | What Garmin reported, kept separate so a re-sync never overwrites a hand correction. Zero or one per `Activity`. |
| `GarminActivityExclusion` | Tombstone. Stops a deleted junk activity being re-imported on the next sync. |

## 7. MAF test

| Table | Notes |
|---|---|
| `MafTest` | Warm up, hold MAF HR for a fixed distance. Progress is the pace trend across tests at equal HR. |
| `MafTestSplit` | One row per split. |

## 8. Wellness

| Table | Notes |
|---|---|
| `DailyWellness` | One row per athlete per day. Garmin supplies RHR, HRV, sleep and weight; soreness, energy and mood are manual. Rising morning RHR is the earliest overreaching signal. |

## Settled modelling decisions

- **Planned and actual are separate tables.** `TrainingPlanWorkout` vs
  `Activity`, linked by a nullable FK.
- **Garmin is the only external source.** Strava and Zwift are deferred, not
  planned. Garmin is modelled as measurement *of* an `Activity`, never as a
  separate activity.
- **Time-series streams are deferred.** Stream tables would hang off the source
  table, not off `Activity`, which keeps the refactor cost low for now.
- **No soft deletes.** `GarminActivityExclusion` is the one narrow tombstone.
- `User` and `Plan` are T-SQL reserved words, hence `Athlete` and `TrainingPlan`.
- Sport and Environment are separate dimensions joined by a junction, not one
  flattened list.
- **No treadmill calibration factor** — treadmill data is trusted as reported.
