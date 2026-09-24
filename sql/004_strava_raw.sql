/* ============================================================================
   no-file-no-mile-bro — 004: raw Strava staging tables (SQL Server)

   Landing tables for the Strava pull in lib/strava.ts. They mirror the API
   payload rather than the app's own model: StravaRawActivity holds a subset
   of the activity summary, StravaRawZoneData holds the five heart rate
   buckets from /activities/{id}/zones.

   Column names are deliberately Strava's snake_case, not the PascalCase the
   rest of this schema uses. These are raw mirrors — matching the payload
   byte-for-byte keeps the load code free of a name map and makes any drift in
   the API obvious. AthleteId is the exception: it is this application's key,
   not Strava's, so it follows the house convention.

   Assumes 001_initial_schema.sql has run (training.Athlete must exist).

   activity_id and strava_athlete_id are BIGINT, not INT: a current Strava
   activity id such as 20303824480 is an order of magnitude past INT's
   2,147,483,647 ceiling.
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO


/* ============================================================================
   1. StravaRawActivity — one row per pulled activity
   ============================================================================ */

CREATE TABLE training.StravaRawActivity (
    StravaRawActivityId     INT IDENTITY(1,1)   NOT NULL,
    AthleteId               INT                 NOT NULL,
    strava_athlete_id       BIGINT              NOT NULL,
    activity_id             BIGINT              NOT NULL,
    [name]                  NVARCHAR(255)       NOT NULL,
    distance                DECIMAL(10,1)       NOT NULL,
    elapsed_time            INT                 NOT NULL,
    [type]                  NVARCHAR(50)        NOT NULL,
    start_date_local        DATETIME2(0)        NOT NULL,
    /* Nullable: an activity recorded without a heart rate strap has neither. */
    average_heartrate       DECIMAL(4,1)        NULL,
    max_heartrate           SMALLINT            NULL,
    CONSTRAINT PK_StravaRawActivity PRIMARY KEY (StravaRawActivityId),
    CONSTRAINT FK_Athlete_StravaRawActivity
        FOREIGN KEY (AthleteId)
        REFERENCES training.Athlete (AthleteId),
    /* Re-pulling the same activity must update a row, never add a second.
       Also the target the StravaRawZoneData foreign key below points at. */
    CONSTRAINT UQ_StravaRawActivity_activity_id UNIQUE (activity_id)
);
GO


/* ============================================================================
   2. StravaRawZoneData — one row per activity's heart rate distribution

   Strava returns exactly five heart rate buckets, so they are flattened to
   five columns rather than stored as rows. score is the activity's relative
   effort, which Strava leaves null on the pace and power sections and
   populates on heart rate.
   ============================================================================ */

CREATE TABLE training.StravaRawZoneData (
    StravaRawZoneDataId     INT IDENTITY(1,1)   NOT NULL,
    activity_id             BIGINT              NOT NULL,
    score                   INT                 NULL,
    Zone1_time              INT                 NOT NULL,
    Zone2_time              INT                 NOT NULL,
    Zone3_time              INT                 NOT NULL,
    Zone4_time              INT                 NOT NULL,
    Zone5_time              INT                 NOT NULL,
    CONSTRAINT PK_StravaRawZoneData PRIMARY KEY (StravaRawZoneDataId),
    CONSTRAINT FK_StravaRawActivity_StravaRawZoneData
        FOREIGN KEY (activity_id)
        REFERENCES training.StravaRawActivity (activity_id),
    /* One distribution per activity. */
    CONSTRAINT UQ_StravaRawZoneData_activity_id UNIQUE (activity_id)
);
GO
