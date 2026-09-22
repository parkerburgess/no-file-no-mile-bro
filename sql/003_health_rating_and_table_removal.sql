/* ============================================================================
   no-file-no-mile-bro — 003: PerceivedHealthRating lookup, and removal of the
   activity, Garmin, FIT import, heart rate profile, MAF test and environment
   tables (SQL Server)

   Assumes 001_initial_schema.sql and 002_fit_import.sql have run.

   Environment is referenced by TrainingPlanWorkout.EnvironmentId, which is not
   in the removal list, so that FK and column are dropped here as well —
   Environment cannot be dropped while anything still references it.
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO


/* ============================================================================
   1. PerceivedHealthRating lookup
   ============================================================================ */

/* Rating carries the 1-5 value explicitly rather than relying on the identity
   happening to seed as 1..5. */
CREATE TABLE training.PerceivedHealthRating (
    PerceivedHealthRatingId       INT IDENTITY(1,1)   NOT NULL,
    Code                          VARCHAR(20)         NOT NULL,
    Name                          NVARCHAR(50)        NOT NULL,
    Rating                        SMALLINT            NOT NULL,
    CONSTRAINT PK_PerceivedHealthRating PRIMARY KEY (PerceivedHealthRatingId),
    CONSTRAINT UQ_PerceivedHealthRating_Code UNIQUE (Code),
    CONSTRAINT UQ_PerceivedHealthRating_Rating UNIQUE (Rating),
    CONSTRAINT CK_PerceivedHealthRating_Rating CHECK (Rating BETWEEN 1 AND 5)
);

INSERT INTO training.PerceivedHealthRating (Code, Name, Rating) VALUES
    ('BAD',     N'Bad',     1),
    ('POOR',    N'Poor',    2),
    ('AVERAGE', N'Average', 3),
    ('GOOD',    N'Good',    4),
    ('GREAT',   N'Great',   5);

/* Nullable: a wellness row is often partial. ALTER TABLE ADD appends the
   column after UpdatedAt rather than after AthleteId. */
ALTER TABLE training.DailyWellness ADD
    PerceivedHealthRatingId       INT                 NULL
        CONSTRAINT FK_PerceivedHealthRating_DailyWellness
        FOREIGN KEY REFERENCES training.PerceivedHealthRating (PerceivedHealthRatingId);
GO


/* ============================================================================
   2. Drop tables, children before the parents they reference
   ============================================================================ */

DROP TABLE IF EXISTS training.MafTestSplit;
DROP TABLE IF EXISTS training.MafTest;
DROP TABLE IF EXISTS training.GarminActivity;
DROP TABLE IF EXISTS training.GarminActivityExclusion;
DROP TABLE IF EXISTS training.FitFileImport;
DROP TABLE IF EXISTS training.Activity;
DROP TABLE IF EXISTS training.GarminWellness;
DROP TABLE IF EXISTS training.HeartRateProfile;
DROP TABLE IF EXISTS training.HeartRateAdjustmentReason;
DROP TABLE IF EXISTS training.sport_environment;
GO

ALTER TABLE training.TrainingPlanWorkout DROP CONSTRAINT FK_Environment_TrainingPlanWorkout;
ALTER TABLE training.TrainingPlanWorkout DROP COLUMN EnvironmentId;
GO

DROP TABLE IF EXISTS training.Environment;
GO
