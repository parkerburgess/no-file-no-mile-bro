/* ============================================================================
   no-file-no-mile-bro — teardown

   Drops every object in FK dependency order: children before the parents they
   reference. Safe to run repeatedly.

   This doubles as the reset script for re-running 001_initial_schema.sql and
   002_fit_import.sql, in that order, during development.

   Every name here is schema-qualified to [training]. Nothing in this file
   touches dbo, which on this shared database belongs to
   auth-wandering-parker (the better-auth tables and AppAccess).

   DROP TABLE IF EXISTS requires SQL Server 2016 or later.
   ============================================================================ */

DROP TABLE IF EXISTS training.MafTestSplit;
DROP TABLE IF EXISTS training.MafTest;
DROP TABLE IF EXISTS training.GarminActivity;
DROP TABLE IF EXISTS training.GarminActivityExclusion;
DROP TABLE IF EXISTS training.FitFileImport;
DROP TABLE IF EXISTS training.Activity;
DROP TABLE IF EXISTS training.TrainingPlanWorkout;
DROP TABLE IF EXISTS training.TrainingPlanWeek;
DROP TABLE IF EXISTS training.trainingplan_race;
DROP TABLE IF EXISTS training.TrainingPlan;
DROP TABLE IF EXISTS training.TrainingPlanTemplateWorkout;
DROP TABLE IF EXISTS training.TrainingPlanTemplateWeek;
DROP TABLE IF EXISTS training.TrainingPlanTemplate;
DROP TABLE IF EXISTS training.DailyWellness;
DROP TABLE IF EXISTS training.GarminWellness;
DROP TABLE IF EXISTS training.Race;
DROP TABLE IF EXISTS training.HeartRateProfile;
-- Dropped by 002_fit_import.sql on a database already at 002. Kept here,
-- guarded by IF EXISTS, so this script still works on a database that only
-- has 001 applied.
DROP TABLE IF EXISTS training.GarminConnection;
DROP TABLE IF EXISTS training.Athlete;
DROP TABLE IF EXISTS training.sport_environment;
DROP TABLE IF EXISTS training.Sport;
DROP TABLE IF EXISTS training.Environment;
DROP TABLE IF EXISTS training.WorkoutType;
DROP TABLE IF EXISTS training.TrainingPhase;
DROP TABLE IF EXISTS training.RacePriority;
DROP TABLE IF EXISTS training.TrainingPlanStatus;
DROP TABLE IF EXISTS training.DistanceUnit;
DROP TABLE IF EXISTS training.HeartRateAdjustmentReason;
GO
