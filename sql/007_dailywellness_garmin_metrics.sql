/* ============================================================================
   no-file-no-mile-bro — 007: DailyWellness becomes the Garmin daily record

   training.DailyWellness was shaped for manual entry. It now holds the daily
   metrics the Garmin Personal API reports, so:

     - adds Steps, StepGoal (the goal Garmin sets, not one entered here) and
       MaxHeartRate
     - drops PerceivedHealthRatingId (and its FK) and Notes, the two columns
       only an athlete could supply

   Weight stays BodyWeightKilograms and sleep stays SleepDurationSeconds; both
   are converted for display at the UI edge.

   ALTER TABLE ADD appends, so the new columns land after CreatedAt and
   UpdatedAt rather than before them. Accepted rather than rebuilding the
   table.

   training.PerceivedHealthRating itself is left in place. Nothing reads it
   after this script; dropping it is a separate decision.

   Each step checks before acting, so the script can be re-run safely.
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO


/* ---- Drop the FK to PerceivedHealthRating ---------------------------------
   Looked up by column rather than by name: the constraint predates the naming
   standard, so its name is not certain. */
DECLARE @foreignKeyName SYSNAME;
DECLARE @dropForeignKeySql NVARCHAR(MAX);

SELECT @foreignKeyName = FK.[name]
FROM sys.foreign_keys FK
JOIN sys.foreign_key_columns FKC
  ON FKC.constraint_object_id = FK.[object_id]
JOIN sys.columns C
  ON C.[object_id] = FKC.parent_object_id
 AND C.column_id = FKC.parent_column_id
WHERE FK.parent_object_id = OBJECT_ID(N'training.DailyWellness')
  AND C.[name] = N'PerceivedHealthRatingId';

/* Built into a variable first: EXEC (...) accepts only literals and
   variables, not a function call such as QUOTENAME. */
IF @foreignKeyName IS NOT NULL
BEGIN
    SET @dropForeignKeySql =
        N'ALTER TABLE training.DailyWellness DROP CONSTRAINT '
        + QUOTENAME(@foreignKeyName) + N';';
    EXEC sys.sp_executesql @dropForeignKeySql;
END
GO


/* ---- Drop any index on PerceivedHealthRatingId ----------------------------
   A column cannot be dropped while an index references it. */
DECLARE @indexName SYSNAME;
DECLARE @dropIndexSql NVARCHAR(MAX);

SELECT TOP (1) @indexName = I.[name]
FROM sys.indexes I
JOIN sys.index_columns IC
  ON IC.[object_id] = I.[object_id]
 AND IC.index_id = I.index_id
JOIN sys.columns C
  ON C.[object_id] = IC.[object_id]
 AND C.column_id = IC.column_id
WHERE I.[object_id] = OBJECT_ID(N'training.DailyWellness')
  AND C.[name] = N'PerceivedHealthRatingId'
  AND I.is_primary_key = 0;

IF @indexName IS NOT NULL
BEGIN
    SET @dropIndexSql =
        N'DROP INDEX ' + QUOTENAME(@indexName)
        + N' ON training.DailyWellness;';
    EXEC sys.sp_executesql @dropIndexSql;
END
GO


/* ---- Drop the manual-entry columns ---------------------------------------- */
IF COL_LENGTH(N'training.DailyWellness', N'PerceivedHealthRatingId') IS NOT NULL
    ALTER TABLE training.DailyWellness DROP COLUMN PerceivedHealthRatingId;
GO

IF COL_LENGTH(N'training.DailyWellness', N'Notes') IS NOT NULL
    ALTER TABLE training.DailyWellness DROP COLUMN Notes;
GO


/* ---- Add the Garmin metrics -----------------------------------------------
   Nullable: a day can arrive with some metrics missing (no sleep recorded, no
   weigh-in), and the card shows a dash for each. */
IF COL_LENGTH(N'training.DailyWellness', N'Steps') IS NULL
    ALTER TABLE training.DailyWellness ADD Steps INT NULL;
GO

IF COL_LENGTH(N'training.DailyWellness', N'StepGoal') IS NULL
    ALTER TABLE training.DailyWellness ADD StepGoal INT NULL;
GO

IF COL_LENGTH(N'training.DailyWellness', N'MaxHeartRate') IS NULL
    ALTER TABLE training.DailyWellness ADD MaxHeartRate INT NULL;
GO
