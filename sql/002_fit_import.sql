/* ============================================================================
   no-file-no-mile-bro — 002: FIT-file-only Garmin ingestion (SQL Server)

   Replaces the 001 design, which modelled Garmin as an OAuth API sync
   (GarminConnection tokens, ExternalActivityId from Garmin Connect). The app
   now reads .fit files copied off the watch by USB — there is no API, no
   OAuth connection, and no Garmin Connect activity id to key on. The original
   file bytes are never retained; every ingest reads a file once, in memory,
   and discards it.

   Assumes 001_initial_schema.sql has run and no Garmin-sourced rows exist yet
   (build order step 8, Garmin sync, has not shipped). The NOT NULL columns
   added below rely on that — there is no backfill step.

   Sensible defaults taken without a design conversation, worth revisiting:
     - Sleep, HRV and VO2 max have no source in a Forerunner 170 activity or
       monitoring file (confirmed against real files, not the FIT spec) and
       stay manual-entry only. DailyWellness keeps its columns for them;
       nothing here populates them.
     - Stress and respiration are captured as a daily average (and stress's
       daily minimum) in GarminWellness, as the closest available proxy for
       the recovery signal HRV would have given.
     - Step count and active calories from monitoring are not captured — not
       MAF-relevant.
     - AverageStrideLengthMeters is renamed to AverageStepLengthMeters: the
       FIT field is a step length, not a stride (two steps), and the two
       differ by a factor of two.
     - Session workoutRpe (0-100) is meant to auto-populate
       Activity.PerceivedExertion (1-10) on import, hand-editable after like
       every other resolved Activity value. No schema change needed for that
       — it is import-logic, not modelled here.
     - subSport "virtualActivity" (e.g. Garmin Connect virtual runs) maps to
       the existing Treadmill environment rather than a new lookup row.
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO


/* ============================================================================
   1. Drop the OAuth sync design
   ============================================================================ */

ALTER TABLE training.GarminActivity DROP CONSTRAINT FK_GarminConnection_GarminActivity;
ALTER TABLE training.GarminActivity DROP CONSTRAINT UQ_GarminActivity_ExternalActivityId;
ALTER TABLE training.GarminActivity DROP COLUMN GarminConnectionId, ExternalActivityId, RawSummaryJson;

ALTER TABLE training.GarminActivityExclusion DROP CONSTRAINT UQ_GarminActivityExclusion_AthleteId_ExternalActivityId;
ALTER TABLE training.GarminActivityExclusion DROP COLUMN ExternalActivityId;

DROP TABLE training.GarminConnection;
GO


/* ============================================================================
   2. Re-key GarminActivity and GarminActivityExclusion off the file, not an
      external id. A file has no server-assigned identity, so identity is the
      file's own content hash plus the device+session pair the FIT file_id
      message carries — belt and suspenders against a hash collision and
      against the same activity being exported twice in different encodings.
   ============================================================================ */

ALTER TABLE training.GarminActivity ADD
    DeviceSerialNumber             BIGINT              NOT NULL
        CONSTRAINT DF_GarminActivity_DeviceSerialNumber DEFAULT (0),
    FileHash                       BINARY(32)          NOT NULL
        CONSTRAINT DF_GarminActivity_FileHash DEFAULT (0x),
    FileCreatedAt                  DATETIME2(0)        NOT NULL
        CONSTRAINT DF_GarminActivity_FileCreatedAt DEFAULT (SYSUTCDATETIME()),
    /* file_id.time_created and the session's local_timestamp, in minutes.
       Needed because the auto-link rule in the UI plan matches an imported
       activity to a planned workout by date, and UTC alone gets that date
       wrong near midnight or across a timezone change. */
    LocalTimeOffsetMinutes         SMALLINT            NULL;

/* The defaults above only exist to satisfy NOT NULL while the table is known
   empty; nothing should ever insert through them. Drop them once added so a
   future insert that forgets these columns fails loudly instead of writing
   zeros. */
ALTER TABLE training.GarminActivity DROP CONSTRAINT DF_GarminActivity_DeviceSerialNumber;
ALTER TABLE training.GarminActivity DROP CONSTRAINT DF_GarminActivity_FileHash;
ALTER TABLE training.GarminActivity DROP CONSTRAINT DF_GarminActivity_FileCreatedAt;

ALTER TABLE training.GarminActivity ADD
    CONSTRAINT UQ_GarminActivity_FileHash UNIQUE (FileHash),
    CONSTRAINT UQ_GarminActivity_DeviceSerialNumber_FileCreatedAt
        UNIQUE (DeviceSerialNumber, FileCreatedAt);

ALTER TABLE training.GarminActivityExclusion ADD
    FileHash                       BINARY(32)          NOT NULL
        CONSTRAINT DF_GarminActivityExclusion_FileHash DEFAULT (0x);
ALTER TABLE training.GarminActivityExclusion DROP CONSTRAINT DF_GarminActivityExclusion_FileHash;

ALTER TABLE training.GarminActivityExclusion ADD
    CONSTRAINT UQ_GarminActivityExclusion_AthleteId_FileHash UNIQUE (AthleteId, FileHash);
GO


/* ============================================================================
   3. Correct two fields against what the watch actually reports (verified
      against real Forerunner 170 files, not the FIT profile's field list).
   ============================================================================ */

EXEC sp_rename
    'training.GarminActivity.AverageStrideLengthMeters',
    'AverageStepLengthMeters',
    'COLUMN';

/* Garmin reports stance time in fractional milliseconds (e.g. 375.6);
   SMALLINT silently truncated the decimal. */
ALTER TABLE training.GarminActivity ALTER COLUMN AverageGroundContactMs DECIMAL(4,1) NULL;
GO


/* ============================================================================
   4. Import log. One row per upload attempt, for both the activity and
      monitoring paths — a duplicate is an expected, logged outcome here, not
      an error, because the normal source is the whole ACTIVITY/MONITOR
      folder re-copied off the watch on every sync.
   ============================================================================ */

CREATE TABLE training.FitFileImport (
    FitFileImportId                INT IDENTITY(1,1)   NOT NULL,
    AthleteId                      INT                 NOT NULL,
    ActivityId                     INT                 NULL,
    FileType                       NVARCHAR(20)        NOT NULL,
    FileHash                       BINARY(32)          NOT NULL,
    DeviceSerialNumber             BIGINT              NOT NULL,
    FileCreatedAt                  DATETIME2(0)        NOT NULL,
    Outcome                        NVARCHAR(20)        NOT NULL,
    ErrorMessage                   NVARCHAR(500)       NULL,
    CreatedAt                      DATETIME2(0)        NOT NULL
        CONSTRAINT DF_FitFileImport_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_FitFileImport PRIMARY KEY (FitFileImportId),
    CONSTRAINT FK_Athlete_FitFileImport
        FOREIGN KEY (AthleteId) REFERENCES training.Athlete (AthleteId),
    CONSTRAINT FK_Activity_FitFileImport
        FOREIGN KEY (ActivityId) REFERENCES training.Activity (ActivityId),
    CONSTRAINT CK_FitFileImport_FileType
        CHECK (FileType IN (N'Activity', N'Monitoring')),
    CONSTRAINT CK_FitFileImport_Outcome
        CHECK (Outcome IN (N'Imported', N'Duplicate', N'Failed', N'Unsupported'))
);

/* Every upload checks "have I seen this hash for this athlete before" —
   not unique, since a repeat upload is logged again, not rejected. */
CREATE INDEX IX_FitFileImport_AthleteId_FileHash ON training.FitFileImport (AthleteId, FileHash);
GO


/* ============================================================================
   5. What the watch reported for a day, kept separate from DailyWellness for
      the same reason GarminActivity is kept separate from Activity: a re-sync
      must never overwrite a hand correction. One row per athlete per day,
      upserted as monitoring files arrive through the day.
   ============================================================================ */

CREATE TABLE training.GarminWellness (
    GarminWellnessId               INT IDENTITY(1,1)   NOT NULL,
    AthleteId                      INT                 NOT NULL,
    RecordedOn                     DATE                NOT NULL,
    DeviceSerialNumber             BIGINT              NOT NULL,
    /* monitoring_hr_data carries both today's reading and a rolling
       baseline; DailyWellness.RestingHeartRate is fed from the former. */
    RestingHeartRate                SMALLINT           NULL,
    RestingHeartRateBaseline        SMALLINT           NULL,
    StressLevelAverage              SMALLINT           NULL,
    StressLevelMin                  SMALLINT           NULL,
    RespirationRateAverage          DECIMAL(4,1)       NULL,
    /* Hash of the monitoring file last merged into this row. Monitoring
       files are not immutable — the watch appends to the current day's file
       all day — so this is only a same-file short-circuit, never the
       de-dup key; the key is (AthleteId, RecordedOn) below. */
    FileHash                        BINARY(32)         NOT NULL,
    SyncedAt                        DATETIME2(0)       NOT NULL
        CONSTRAINT DF_GarminWellness_SyncedAt DEFAULT (SYSUTCDATETIME()),
    CreatedAt                       DATETIME2(0)       NOT NULL
        CONSTRAINT DF_GarminWellness_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                       DATETIME2(0)       NULL,
    CONSTRAINT PK_GarminWellness PRIMARY KEY (GarminWellnessId),
    CONSTRAINT FK_Athlete_GarminWellness
        FOREIGN KEY (AthleteId) REFERENCES training.Athlete (AthleteId),
    CONSTRAINT UQ_GarminWellness_AthleteId_RecordedOn UNIQUE (AthleteId, RecordedOn)
);
GO


/* ============================================================================
   6. IsGarminSourced no longer means one thing. A DailyWellness row can now
      be part Garmin (RHR, HRV, sleep — when a source exists) and part manual
      (soreness, energy, mood) at the same time; a single bit cannot say that.
      The badge derives instead from the presence of a GarminWellness row for
      the same date.
   ============================================================================ */

ALTER TABLE training.DailyWellness DROP CONSTRAINT DF_DailyWellness_IsGarminSourced;
ALTER TABLE training.DailyWellness DROP COLUMN IsGarminSourced;
GO
