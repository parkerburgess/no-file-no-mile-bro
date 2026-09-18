/* ============================================================================
   no-file-no-mile-bro — initial schema (SQL Server)
   Goal races: 5K  2026-11-14 (B) , 25K 2027-01-23 (A)
   Method: MAF (Maffetone) aerobic base, cycling cross-training
   ============================================================================ */

/* Required for the filtered indexes below. sqlcmd leaves QUOTED_IDENTIFIER
   OFF by default, which makes CREATE INDEX ... WHERE fail with msg 1934.
   Setting it here means the script does not depend on the caller passing -I. */
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF SCHEMA_ID('training') IS NULL
    EXEC ('CREATE SCHEMA training');
GO


/* ============================================================================
   1. Lookups
   ============================================================================ */

CREATE TABLE training.Sport (
    SportId                       INT IDENTITY(1,1)   NOT NULL,
    Code                          VARCHAR(20)         NOT NULL,
    Name                          NVARCHAR(50)        NOT NULL,
    ShowInNav                     BIT                 NOT NULL
        CONSTRAINT DF_Sport_ShowInNav DEFAULT (1),
    SortOrder                     INT                 NOT NULL
        CONSTRAINT DF_Sport_SortOrder DEFAULT (0),
    CONSTRAINT PK_Sport PRIMARY KEY (SportId),
    CONSTRAINT UQ_Sport_Code UNIQUE (Code)
);

CREATE TABLE training.Environment (
    EnvironmentId                 INT IDENTITY(1,1)   NOT NULL,
    Code                          VARCHAR(20)         NOT NULL,
    Name                          NVARCHAR(50)        NOT NULL,
    CONSTRAINT PK_Environment PRIMARY KEY (EnvironmentId),
    CONSTRAINT UQ_Environment_Code UNIQUE (Code)
);

/* Constrains which environments are valid for which sport, and drives the
   environment dropdown once a sport is chosen. */
CREATE TABLE training.sport_environment (
    Sport_EnvironmentId           INT IDENTITY(1,1)   NOT NULL,
    SportId                       INT                 NOT NULL,
    EnvironmentId                 INT                 NOT NULL,
    CONSTRAINT PK_sport_environment PRIMARY KEY (Sport_EnvironmentId),
    CONSTRAINT FK_Sport_sport_environment
        FOREIGN KEY (SportId) REFERENCES training.Sport (SportId),
    CONSTRAINT FK_Environment_sport_environment
        FOREIGN KEY (EnvironmentId) REFERENCES training.Environment (EnvironmentId),
    CONSTRAINT UQ_sport_environment_SportId_EnvironmentId
        UNIQUE (SportId, EnvironmentId)
);

CREATE TABLE training.WorkoutType (
    WorkoutTypeId                 INT IDENTITY(1,1)   NOT NULL,
    Code                          VARCHAR(30)         NOT NULL,
    Name                          NVARCHAR(50)        NOT NULL,
    /* True when the workout must be held at or below the MAF ceiling. */
    IsAerobicCapped               BIT                 NOT NULL
        CONSTRAINT DF_WorkoutType_IsAerobicCapped DEFAULT (1),
    CONSTRAINT PK_WorkoutType PRIMARY KEY (WorkoutTypeId),
    CONSTRAINT UQ_WorkoutType_Code UNIQUE (Code)
);

CREATE TABLE training.TrainingPhase (
    TrainingPhaseId               INT IDENTITY(1,1)   NOT NULL,
    Code                          VARCHAR(20)         NOT NULL,
    Name                          NVARCHAR(50)        NOT NULL,
    SortOrder                     INT                 NOT NULL,
    CONSTRAINT PK_TrainingPhase PRIMARY KEY (TrainingPhaseId),
    CONSTRAINT UQ_TrainingPhase_Code UNIQUE (Code)
);

CREATE TABLE training.RacePriority (
    RacePriorityId                INT IDENTITY(1,1)   NOT NULL,
    Code                          VARCHAR(10)         NOT NULL,
    Name                          NVARCHAR(50)        NOT NULL,
    CONSTRAINT PK_RacePriority PRIMARY KEY (RacePriorityId),
    CONSTRAINT UQ_RacePriority_Code UNIQUE (Code)
);

CREATE TABLE training.TrainingPlanStatus (
    TrainingPlanStatusId          INT IDENTITY(1,1)   NOT NULL,
    Code                          VARCHAR(20)         NOT NULL,
    Name                          NVARCHAR(50)        NOT NULL,
    CONSTRAINT PK_TrainingPlanStatus PRIMARY KEY (TrainingPlanStatusId),
    CONSTRAINT UQ_TrainingPlanStatus_Code UNIQUE (Code)
);

CREATE TABLE training.DistanceUnit (
    DistanceUnitId                INT IDENTITY(1,1)   NOT NULL,
    Code                          VARCHAR(20)         NOT NULL,
    Name                          NVARCHAR(50)        NOT NULL,
    MetersPerUnit                 DECIMAL(12,6)       NOT NULL,
    CONSTRAINT PK_DistanceUnit PRIMARY KEY (DistanceUnitId),
    CONSTRAINT UQ_DistanceUnit_Code UNIQUE (Code)
);

/* The Maffetone adjustment factors applied on top of (180 - age). */
CREATE TABLE training.HeartRateAdjustmentReason (
    HeartRateAdjustmentReasonId INT IDENTITY(1,1)   NOT NULL,
    Code                          VARCHAR(40)         NOT NULL,
    Name                          NVARCHAR(100)       NOT NULL,
    DeltaBeatsPerMinute           SMALLINT            NOT NULL,
    CONSTRAINT PK_HeartRateAdjustmentReason PRIMARY KEY (HeartRateAdjustmentReasonId),
    CONSTRAINT UQ_HeartRateAdjustmentReason_Code UNIQUE (Code)
);


/* ============================================================================
   2. Identity and athlete profile
   ============================================================================ */

CREATE TABLE training.Athlete (
    AthleteId                     INT IDENTITY(1,1)   NOT NULL,
    DistanceUnitId                INT                 NOT NULL,
    /* Links to dbo.[user].UserId in the auth-wandering-parker service.
       NVARCHAR, not INT: getUserId() returns the JWT's `sub` as a string,
       dbo.AppAccess.UserId is itself NVARCHAR, and the shared dev bypass
       yields the non-numeric 'dev-user-1'.
       No FK: that table is owned by a separate service. */
    UserId                        NVARCHAR(50)        NULL,
    Email                         NVARCHAR(256)       NOT NULL,
    DisplayName                   NVARCHAR(100)       NOT NULL,
    BirthDate                     DATE                NOT NULL,
    TimeZoneId                    NVARCHAR(100)       NOT NULL
        CONSTRAINT DF_Athlete_TimeZoneId DEFAULT ('America/Denver'),
    /* NULL until the athlete confirms the auto-provisioned profile.
       BirthDate is a placeholder until then and must not be trusted. */
    ProfileCompletedAt            DATETIME2(0)        NULL,
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_Athlete_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_Athlete PRIMARY KEY (AthleteId),
    CONSTRAINT FK_DistanceUnit_Athlete
        FOREIGN KEY (DistanceUnitId) REFERENCES training.DistanceUnit (DistanceUnitId),
    CONSTRAINT UQ_Athlete_Email UNIQUE (Email)
);

CREATE UNIQUE INDEX UX_Athlete_UserId
    ON training.Athlete (UserId) WHERE UserId IS NOT NULL;

/* Token values are written already encrypted by the application layer.
   Nothing in this table is ever populated from configuration. */
CREATE TABLE training.GarminConnection (
    GarminConnectionId            INT IDENTITY(1,1)   NOT NULL,
    AthleteId                     INT                 NOT NULL,
    GarminUserKey                 NVARCHAR(100)       NOT NULL,
    ProtectedAccessToken          NVARCHAR(MAX)       NOT NULL,
    ProtectedRefreshToken         NVARCHAR(MAX)       NOT NULL,
    AccessTokenExpiresAt          DATETIME2(0)        NOT NULL,
    Scopes                        NVARCHAR(500)       NULL,
    LastSyncedAt                  DATETIME2(0)        NULL,
    IsActive                      BIT                 NOT NULL
        CONSTRAINT DF_GarminConnection_IsActive DEFAULT (1),
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_GarminConnection_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_GarminConnection PRIMARY KEY (GarminConnectionId),
    CONSTRAINT FK_Athlete_GarminConnection
        FOREIGN KEY (AthleteId) REFERENCES training.Athlete (AthleteId),
    CONSTRAINT UQ_GarminConnection_AthleteId UNIQUE (AthleteId)
);

/* MAF heart rate is not a constant: it moves on a birthday and whenever an
   adjustment factor changes. An activity is scored against the row whose
   effective range covers the activity date. */
CREATE TABLE training.HeartRateProfile (
    HeartRateProfileId            INT IDENTITY(1,1)   NOT NULL,
    AthleteId                     INT                 NOT NULL,
    HeartRateAdjustmentReasonId INT                 NOT NULL,
    MafHeartRate                  SMALLINT            NOT NULL,
    AerobicFloorHeartRate         SMALLINT            NULL,
    MaxHeartRate                  SMALLINT            NULL,
    RestingHeartRate              SMALLINT            NULL,
    EffectiveFrom                 DATE                NOT NULL,
    EffectiveTo                   DATE                NULL,
    Notes                         NVARCHAR(500)       NULL,
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_HeartRateProfile_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_HeartRateProfile PRIMARY KEY (HeartRateProfileId),
    CONSTRAINT FK_Athlete_HeartRateProfile
        FOREIGN KEY (AthleteId) REFERENCES training.Athlete (AthleteId),
    CONSTRAINT FK_HeartRateAdjustmentReason_HeartRateProfile
        FOREIGN KEY (HeartRateAdjustmentReasonId)
        REFERENCES training.HeartRateAdjustmentReason (HeartRateAdjustmentReasonId),
    CONSTRAINT UQ_HeartRateProfile_AthleteId_EffectiveFrom UNIQUE (AthleteId, EffectiveFrom),
    CONSTRAINT CK_HeartRateProfile_EffectiveRange
        CHECK (EffectiveTo IS NULL OR EffectiveTo >= EffectiveFrom)
);


/* ============================================================================
   3. Races and goals
   ============================================================================ */

CREATE TABLE training.Race (
    RaceId                        INT IDENTITY(1,1)   NOT NULL,
    AthleteId                     INT                 NOT NULL,
    RacePriorityId                INT                 NOT NULL,
    SportId                       INT                 NOT NULL,
    Name                          NVARCHAR(200)       NOT NULL,
    RaceDate                      DATE                NOT NULL,
    DistanceMeters                DECIMAL(10,2)       NOT NULL,
    GoalDurationSeconds           INT                 NULL,
    ActualDurationSeconds         INT                 NULL,
    Location                      NVARCHAR(200)       NULL,
    /* Race information or registration page. */
    URL                           NVARCHAR(500)       NULL,
    Notes                         NVARCHAR(1000)      NULL,
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_Race_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_Race PRIMARY KEY (RaceId),
    CONSTRAINT FK_Athlete_Race
        FOREIGN KEY (AthleteId) REFERENCES training.Athlete (AthleteId),
    CONSTRAINT FK_RacePriority_Race
        FOREIGN KEY (RacePriorityId) REFERENCES training.RacePriority (RacePriorityId),
    CONSTRAINT FK_Sport_Race
        FOREIGN KEY (SportId) REFERENCES training.Sport (SportId)
);


/* ============================================================================
   4. Plan templates — the blueprint a generated plan is built from
   ============================================================================ */

CREATE TABLE training.TrainingPlanTemplate (
    TrainingPlanTemplateId        INT IDENTITY(1,1)   NOT NULL,
    SportId                       INT                 NOT NULL,
    Name                          NVARCHAR(200)       NOT NULL,
    Description                   NVARCHAR(1000)      NULL,
    WeekCount                     INT                 NOT NULL,
    TargetRaceDistanceMeters      DECIMAL(10,2)       NULL,
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_TrainingPlanTemplate_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_TrainingPlanTemplate PRIMARY KEY (TrainingPlanTemplateId),
    CONSTRAINT FK_Sport_TrainingPlanTemplate
        FOREIGN KEY (SportId) REFERENCES training.Sport (SportId),
    CONSTRAINT UQ_TrainingPlanTemplate_Name UNIQUE (Name)
);

/* WeekNumber counts forward from the start of the build: 1 is the first week,
   WeekCount is race week. */
CREATE TABLE training.TrainingPlanTemplateWeek (
    TrainingPlanTemplateWeekId    INT IDENTITY(1,1)   NOT NULL,
    TrainingPlanTemplateId        INT                 NOT NULL,
    TrainingPhaseId               INT                 NOT NULL,
    WeekNumber                    INT                 NOT NULL,
    TargetDurationSeconds         INT                 NULL,
    TargetDistanceMeters          DECIMAL(10,2)       NULL,
    IsRecoveryWeek                BIT                 NOT NULL
        CONSTRAINT DF_TrainingPlanTemplateWeek_IsRecoveryWeek DEFAULT (0),
    Notes                         NVARCHAR(1000)      NULL,
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_TrainingPlanTemplateWeek_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_TrainingPlanTemplateWeek PRIMARY KEY (TrainingPlanTemplateWeekId),
    CONSTRAINT FK_TrainingPlanTemplate_TrainingPlanTemplateWeek
        FOREIGN KEY (TrainingPlanTemplateId) REFERENCES training.TrainingPlanTemplate (TrainingPlanTemplateId),
    CONSTRAINT FK_TrainingPhase_TrainingPlanTemplateWeek
        FOREIGN KEY (TrainingPhaseId) REFERENCES training.TrainingPhase (TrainingPhaseId),
    CONSTRAINT UQ_TrainingPlanTemplateWeek_TrainingPlanTemplateId_WeekNumber
        UNIQUE (TrainingPlanTemplateId, WeekNumber)
);

/* DayOfWeek matches JavaScript's Date.getDay(): 0 = Sunday .. 6 = Saturday. */
CREATE TABLE training.TrainingPlanTemplateWorkout (
    TrainingPlanTemplateWorkoutId INT IDENTITY(1,1)   NOT NULL,
    TrainingPlanTemplateWeekId    INT                 NOT NULL,
    SportId                       INT                 NOT NULL,
    WorkoutTypeId                 INT                 NOT NULL,
    DayOfWeek                     SMALLINT            NOT NULL,
    SequenceInDay                 SMALLINT            NOT NULL
        CONSTRAINT DF_TrainingPlanTemplateWorkout_SequenceInDay DEFAULT (1),
    TargetDurationSeconds         INT                 NULL,
    TargetDistanceMeters          DECIMAL(10,2)       NULL,
    Notes                         NVARCHAR(1000)      NULL,
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_TrainingPlanTemplateWorkout_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_TrainingPlanTemplateWorkout PRIMARY KEY (TrainingPlanTemplateWorkoutId),
    CONSTRAINT FK_TrainingPlanTemplateWeek_TrainingPlanTemplateWorkout
        FOREIGN KEY (TrainingPlanTemplateWeekId) REFERENCES training.TrainingPlanTemplateWeek (TrainingPlanTemplateWeekId),
    CONSTRAINT FK_Sport_TrainingPlanTemplateWorkout
        FOREIGN KEY (SportId) REFERENCES training.Sport (SportId),
    CONSTRAINT FK_WorkoutType_TrainingPlanTemplateWorkout
        FOREIGN KEY (WorkoutTypeId) REFERENCES training.WorkoutType (WorkoutTypeId),
    CONSTRAINT CK_TrainingPlanTemplateWorkout_DayOfWeek CHECK (DayOfWeek BETWEEN 0 AND 6)
);


/* ============================================================================
   5. Generated plan
   ============================================================================ */

CREATE TABLE training.TrainingPlan (
    TrainingPlanId                INT IDENTITY(1,1)   NOT NULL,
    AthleteId                     INT                 NOT NULL,
    TrainingPlanTemplateId        INT                 NULL,
    TrainingPlanStatusId          INT                 NOT NULL,
    Name                          NVARCHAR(200)       NOT NULL,
    StartDate                     DATE                NOT NULL,
    EndDate                       DATE                NOT NULL,
    GeneratedAt                   DATETIME2(0)        NULL,
    Notes                         NVARCHAR(1000)      NULL,
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_TrainingPlan_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_TrainingPlan PRIMARY KEY (TrainingPlanId),
    CONSTRAINT FK_Athlete_TrainingPlan
        FOREIGN KEY (AthleteId) REFERENCES training.Athlete (AthleteId),
    CONSTRAINT FK_TrainingPlanTemplate_TrainingPlan
        FOREIGN KEY (TrainingPlanTemplateId) REFERENCES training.TrainingPlanTemplate (TrainingPlanTemplateId),
    CONSTRAINT FK_TrainingPlanStatus_TrainingPlan
        FOREIGN KEY (TrainingPlanStatusId) REFERENCES training.TrainingPlanStatus (TrainingPlanStatusId),
    CONSTRAINT CK_TrainingPlan_DateRange CHECK (EndDate >= StartDate)
);

/* One plan can span several races: the Jan 25K is the goal race, the Nov 5K is
   a tune-up inside the same build. At most one goal race per plan. */
CREATE TABLE training.trainingplan_race (
    TrainingPlan_RaceId           INT IDENTITY(1,1)   NOT NULL,
    TrainingPlanId                INT                 NOT NULL,
    RaceId                        INT                 NOT NULL,
    IsGoalRace                    BIT                 NOT NULL
        CONSTRAINT DF_trainingplan_race_IsGoalRace DEFAULT (0),
    CONSTRAINT PK_trainingplan_race PRIMARY KEY (TrainingPlan_RaceId),
    CONSTRAINT FK_TrainingPlan_trainingplan_race
        FOREIGN KEY (TrainingPlanId) REFERENCES training.TrainingPlan (TrainingPlanId),
    CONSTRAINT FK_Race_trainingplan_race
        FOREIGN KEY (RaceId) REFERENCES training.Race (RaceId),
    CONSTRAINT UQ_trainingplan_race_TrainingPlanId_RaceId UNIQUE (TrainingPlanId, RaceId)
);

CREATE UNIQUE INDEX UX_trainingplan_race_TrainingPlanId_IsGoalRace
    ON training.trainingplan_race (TrainingPlanId) WHERE IsGoalRace = 1;

CREATE TABLE training.TrainingPlanWeek (
    TrainingPlanWeekId            INT IDENTITY(1,1)   NOT NULL,
    TrainingPlanId                INT                 NOT NULL,
    TrainingPhaseId               INT                 NOT NULL,
    WeekNumber                    INT                 NOT NULL,
    StartDate                     DATE                NOT NULL,
    EndDate                       DATE                NOT NULL,
    TargetDurationSeconds         INT                 NULL,
    TargetDistanceMeters          DECIMAL(10,2)       NULL,
    IsRecoveryWeek                BIT                 NOT NULL
        CONSTRAINT DF_TrainingPlanWeek_IsRecoveryWeek DEFAULT (0),
    Notes                         NVARCHAR(1000)      NULL,
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_TrainingPlanWeek_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_TrainingPlanWeek PRIMARY KEY (TrainingPlanWeekId),
    CONSTRAINT FK_TrainingPlan_TrainingPlanWeek
        FOREIGN KEY (TrainingPlanId) REFERENCES training.TrainingPlan (TrainingPlanId),
    CONSTRAINT FK_TrainingPhase_TrainingPlanWeek
        FOREIGN KEY (TrainingPhaseId) REFERENCES training.TrainingPhase (TrainingPhaseId),
    CONSTRAINT UQ_TrainingPlanWeek_TrainingPlanId_WeekNumber UNIQUE (TrainingPlanId, WeekNumber),
    CONSTRAINT CK_TrainingPlanWeek_DateRange CHECK (EndDate >= StartDate)
);

/* EnvironmentId is nullable: at generation time treadmill vs road is unknown.
   HeartRateCeiling is snapshotted from the HeartRateProfile in force on the
   scheduled date, so a later profile change never rewrites history. */
CREATE TABLE training.TrainingPlanWorkout (
    TrainingPlanWorkoutId         INT IDENTITY(1,1)   NOT NULL,
    TrainingPlanWeekId            INT                 NOT NULL,
    SportId                       INT                 NOT NULL,
    EnvironmentId                 INT                 NULL,
    WorkoutTypeId                 INT                 NOT NULL,
    TrainingPlanTemplateWorkoutId INT                 NULL,
    ScheduledDate                 DATE                NOT NULL,
    SequenceInDay                 SMALLINT            NOT NULL
        CONSTRAINT DF_TrainingPlanWorkout_SequenceInDay DEFAULT (1),
    TargetDurationSeconds         INT                 NULL,
    TargetDistanceMeters          DECIMAL(10,2)       NULL,
    HeartRateCeiling              SMALLINT            NULL,
    IsMafTest                     BIT                 NOT NULL
        CONSTRAINT DF_TrainingPlanWorkout_IsMafTest DEFAULT (0),
    IsSkipped                     BIT                 NOT NULL
        CONSTRAINT DF_TrainingPlanWorkout_IsSkipped DEFAULT (0),
    Notes                         NVARCHAR(1000)      NULL,
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_TrainingPlanWorkout_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_TrainingPlanWorkout PRIMARY KEY (TrainingPlanWorkoutId),
    CONSTRAINT FK_TrainingPlanWeek_TrainingPlanWorkout
        FOREIGN KEY (TrainingPlanWeekId) REFERENCES training.TrainingPlanWeek (TrainingPlanWeekId),
    CONSTRAINT FK_Sport_TrainingPlanWorkout
        FOREIGN KEY (SportId) REFERENCES training.Sport (SportId),
    CONSTRAINT FK_Environment_TrainingPlanWorkout
        FOREIGN KEY (EnvironmentId) REFERENCES training.Environment (EnvironmentId),
    CONSTRAINT FK_WorkoutType_TrainingPlanWorkout
        FOREIGN KEY (WorkoutTypeId) REFERENCES training.WorkoutType (WorkoutTypeId),
    CONSTRAINT FK_TrainingPlanTemplateWorkout_TrainingPlanWorkout
        FOREIGN KEY (TrainingPlanTemplateWorkoutId)
        REFERENCES training.TrainingPlanTemplateWorkout (TrainingPlanTemplateWorkoutId)
);

CREATE INDEX IX_TrainingPlanWorkout_ScheduledDate ON training.TrainingPlanWorkout (ScheduledDate);


/* ============================================================================
   6. Actual work performed
   ============================================================================ */

/* Canonical, resolved truth. Every analysis query reads this table and never
   touches a source table. A manually entered activity has no GarminActivity
   child row; a Garmin-derived one has exactly one. Values here are copied from
   the source on sync and stay hand-editable afterward. */
CREATE TABLE training.Activity (
    ActivityId                    INT IDENTITY(1,1)   NOT NULL,
    AthleteId                     INT                 NOT NULL,
    SportId                       INT                 NOT NULL,
    EnvironmentId                 INT                 NOT NULL,
    TrainingPlanWorkoutId         INT                 NULL,
    HeartRateProfileId            INT                 NULL,
    StartedAt                     DATETIME2(0)        NOT NULL,
    DurationSeconds               INT                 NOT NULL,
    MovingDurationSeconds         INT                 NULL,
    DistanceMeters                DECIMAL(10,2)       NULL,
    AverageHeartRate              SMALLINT            NULL,
    MaxHeartRate                  SMALLINT            NULL,
    SecondsAboveMafCeiling        INT                 NULL,
    AverageCadence                SMALLINT            NULL,
    AveragePowerWatts             SMALLINT            NULL,
    ElevationGainMeters           DECIMAL(8,2)        NULL,
    CalorieCount                  INT                 NULL,
    PerceivedExertion             SMALLINT            NULL,
    IsManualEntry                 BIT                 NOT NULL
        CONSTRAINT DF_Activity_IsManualEntry DEFAULT (1),
    Notes                         NVARCHAR(1000)      NULL,
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_Activity_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_Activity PRIMARY KEY (ActivityId),
    CONSTRAINT FK_Athlete_Activity
        FOREIGN KEY (AthleteId) REFERENCES training.Athlete (AthleteId),
    CONSTRAINT FK_Sport_Activity
        FOREIGN KEY (SportId) REFERENCES training.Sport (SportId),
    CONSTRAINT FK_Environment_Activity
        FOREIGN KEY (EnvironmentId) REFERENCES training.Environment (EnvironmentId),
    CONSTRAINT FK_TrainingPlanWorkout_Activity
        FOREIGN KEY (TrainingPlanWorkoutId) REFERENCES training.TrainingPlanWorkout (TrainingPlanWorkoutId),
    CONSTRAINT FK_HeartRateProfile_Activity
        FOREIGN KEY (HeartRateProfileId) REFERENCES training.HeartRateProfile (HeartRateProfileId),
    CONSTRAINT CK_Activity_PerceivedExertion
        CHECK (PerceivedExertion IS NULL OR PerceivedExertion BETWEEN 1 AND 10)
);

CREATE INDEX IX_Activity_AthleteId_StartedAt ON training.Activity (AthleteId, StartedAt);

/* What Garmin reported, kept distinct from the resolved Activity values so a
   re-sync never overwrites a hand correction. Zero or one row per Activity. */
CREATE TABLE training.GarminActivity (
    GarminActivityId              INT IDENTITY(1,1)   NOT NULL,
    ActivityId                    INT                 NOT NULL,
    GarminConnectionId            INT                 NOT NULL,
    ExternalActivityId            BIGINT              NOT NULL,
    ActivityTypeKey               NVARCHAR(50)        NULL,
    DeviceName                    NVARCHAR(100)       NULL,
    StartedAt                     DATETIME2(0)        NOT NULL,
    DurationSeconds               INT                 NOT NULL,
    ElapsedDurationSeconds        INT                 NULL,
    MovingDurationSeconds         INT                 NULL,
    DistanceMeters                DECIMAL(10,2)       NULL,
    AverageHeartRate              SMALLINT            NULL,
    MaxHeartRate                  SMALLINT            NULL,
    AverageCadence                SMALLINT            NULL,
    MaxCadence                    SMALLINT            NULL,
    AveragePowerWatts             SMALLINT            NULL,
    NormalizedPowerWatts          SMALLINT            NULL,
    ElevationGainMeters           DECIMAL(8,2)        NULL,
    CalorieCount                  INT                 NULL,
    AerobicTrainingEffect         DECIMAL(3,1)        NULL,
    AnaerobicTrainingEffect       DECIMAL(3,1)        NULL,
    Vo2MaxEstimate                DECIMAL(4,1)        NULL,
    AverageStrideLengthMeters     DECIMAL(5,2)        NULL,
    AverageGroundContactMs        SMALLINT            NULL,
    /* Full summary payload, kept so a mapping fix can be replayed without
       re-calling the Garmin API. This is not a time-series store. */
    RawSummaryJson                NVARCHAR(MAX)       NULL,
    SyncedAt                      DATETIME2(0)        NOT NULL
        CONSTRAINT DF_GarminActivity_SyncedAt DEFAULT (SYSUTCDATETIME()),
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_GarminActivity_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_GarminActivity PRIMARY KEY (GarminActivityId),
    CONSTRAINT FK_Activity_GarminActivity
        FOREIGN KEY (ActivityId) REFERENCES training.Activity (ActivityId),
    CONSTRAINT FK_GarminConnection_GarminActivity
        FOREIGN KEY (GarminConnectionId) REFERENCES training.GarminConnection (GarminConnectionId),
    CONSTRAINT UQ_GarminActivity_ActivityId UNIQUE (ActivityId),
    CONSTRAINT UQ_GarminActivity_ExternalActivityId UNIQUE (ExternalActivityId)
);

/* A deletion tombstone. Deleting a junk Activity takes its GarminActivity row
   and ExternalActivityId with it, so the next sync would see the id as unknown
   and re-import it. The sync checks this table before importing. */
CREATE TABLE training.GarminActivityExclusion (
    GarminActivityExclusionId     INT IDENTITY(1,1)   NOT NULL,
    AthleteId                     INT                 NOT NULL,
    ExternalActivityId            BIGINT              NOT NULL,
    Reason                        NVARCHAR(500)       NULL,
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_GarminActivityExclusion_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_GarminActivityExclusion PRIMARY KEY (GarminActivityExclusionId),
    CONSTRAINT FK_Athlete_GarminActivityExclusion
        FOREIGN KEY (AthleteId) REFERENCES training.Athlete (AthleteId),
    CONSTRAINT UQ_GarminActivityExclusion_AthleteId_ExternalActivityId
        UNIQUE (AthleteId, ExternalActivityId)
);


/* ============================================================================
   7. MAF test
   ============================================================================ */

/* The benchmark: warm up, then hold MAF heart rate for a fixed distance and
   record each split. Progress is the pace trend across tests at equal HR. */
CREATE TABLE training.MafTest (
    MafTestId                     INT IDENTITY(1,1)   NOT NULL,
    AthleteId                     INT                 NOT NULL,
    ActivityId                    INT                 NOT NULL,
    HeartRateProfileId            INT                 NOT NULL,
    SportId                       INT                 NOT NULL,
    EnvironmentId                 INT                 NOT NULL,
    TestDate                      DATE                NOT NULL,
    TargetHeartRate               SMALLINT            NOT NULL,
    SplitCount                    SMALLINT            NOT NULL,
    SplitDistanceMeters           DECIMAL(10,2)       NOT NULL,
    TotalDistanceMeters           DECIMAL(10,2)       NOT NULL,
    TotalDurationSeconds          INT                 NOT NULL,
    Notes                         NVARCHAR(1000)      NULL,
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_MafTest_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_MafTest PRIMARY KEY (MafTestId),
    CONSTRAINT FK_Athlete_MafTest
        FOREIGN KEY (AthleteId) REFERENCES training.Athlete (AthleteId),
    CONSTRAINT FK_Activity_MafTest
        FOREIGN KEY (ActivityId) REFERENCES training.Activity (ActivityId),
    CONSTRAINT FK_HeartRateProfile_MafTest
        FOREIGN KEY (HeartRateProfileId) REFERENCES training.HeartRateProfile (HeartRateProfileId),
    CONSTRAINT FK_Sport_MafTest
        FOREIGN KEY (SportId) REFERENCES training.Sport (SportId),
    CONSTRAINT FK_Environment_MafTest
        FOREIGN KEY (EnvironmentId) REFERENCES training.Environment (EnvironmentId),
    CONSTRAINT UQ_MafTest_ActivityId UNIQUE (ActivityId)
);

CREATE TABLE training.MafTestSplit (
    MafTestSplitId                INT IDENTITY(1,1)   NOT NULL,
    MafTestId                     INT                 NOT NULL,
    SplitNumber                   SMALLINT            NOT NULL,
    DistanceMeters                DECIMAL(10,2)       NOT NULL,
    DurationSeconds               INT                 NOT NULL,
    AverageHeartRate              SMALLINT            NULL,
    MaxHeartRate                  SMALLINT            NULL,
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_MafTestSplit_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_MafTestSplit PRIMARY KEY (MafTestSplitId),
    CONSTRAINT FK_MafTest_MafTestSplit
        FOREIGN KEY (MafTestId) REFERENCES training.MafTest (MafTestId),
    CONSTRAINT UQ_MafTestSplit_MafTestId_SplitNumber UNIQUE (MafTestId, SplitNumber)
);


/* ============================================================================
   8. Daily wellness
   ============================================================================ */

/* One row per athlete per day. The morning resting HR trend is the earliest
   warning that aerobic work has tipped into overreaching. */
CREATE TABLE training.DailyWellness (
    DailyWellnessId               INT IDENTITY(1,1)   NOT NULL,
    AthleteId                     INT                 NOT NULL,
    RecordedOn                    DATE                NOT NULL,
    RestingHeartRate              SMALLINT            NULL,
    HeartRateVariabilityMs        SMALLINT            NULL,
    SleepDurationSeconds          INT                 NULL,
    SleepScore                    SMALLINT            NULL,
    BodyWeightKilograms           DECIMAL(5,2)        NULL,
    SorenessRating                SMALLINT            NULL,
    EnergyRating                  SMALLINT            NULL,
    MoodRating                    SMALLINT            NULL,
    IsGarminSourced               BIT                 NOT NULL
        CONSTRAINT DF_DailyWellness_IsGarminSourced DEFAULT (0),
    Notes                         NVARCHAR(1000)      NULL,
    CreatedAt                     DATETIME2(0)        NOT NULL
        CONSTRAINT DF_DailyWellness_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt                     DATETIME2(0)        NULL,
    CONSTRAINT PK_DailyWellness PRIMARY KEY (DailyWellnessId),
    CONSTRAINT FK_Athlete_DailyWellness
        FOREIGN KEY (AthleteId) REFERENCES training.Athlete (AthleteId),
    CONSTRAINT UQ_DailyWellness_AthleteId_RecordedOn UNIQUE (AthleteId, RecordedOn),
    CONSTRAINT CK_DailyWellness_SorenessRating
        CHECK (SorenessRating IS NULL OR SorenessRating BETWEEN 1 AND 10),
    CONSTRAINT CK_DailyWellness_EnergyRating
        CHECK (EnergyRating IS NULL OR EnergyRating BETWEEN 1 AND 10),
    CONSTRAINT CK_DailyWellness_MoodRating
        CHECK (MoodRating IS NULL OR MoodRating BETWEEN 1 AND 10)
);


/* ============================================================================
   9. Lookup seed data
   ============================================================================ */

INSERT INTO training.Sport (Code, Name, ShowInNav, SortOrder) VALUES
    ('RUN',      N'Run',      1, 10),
    ('CYCLE',    N'Cycling',  1, 20),
    ('STRENGTH', N'Strength', 0, 30),
    ('WALK',     N'Walk',     0, 40),
    ('HIKE',     N'Hike',     0, 50);

INSERT INTO training.Environment (Code, Name) VALUES
    ('TREADMILL',       N'Treadmill'),
    ('ROAD',            N'Road'),
    ('TRAIL',           N'Trail'),
    ('STATIONARY',      N'Stationary'),
    ('SINGLE_TRACK',    N'Single Track'),
    ('GYM',             N'Gym'),
    ('HOME',            N'Home');

INSERT INTO training.sport_environment (SportId, EnvironmentId)
SELECT S.SportId, E.EnvironmentId
FROM training.Sport S
JOIN training.Environment E
    ON (S.Code = 'RUN'      AND E.Code IN ('TREADMILL', 'ROAD', 'TRAIL'))
    OR (S.Code = 'CYCLE'    AND E.Code IN ('STATIONARY', 'ROAD', 'SINGLE_TRACK'))
    OR (S.Code = 'STRENGTH' AND E.Code IN ('GYM', 'HOME'))
    OR (S.Code = 'WALK'     AND E.Code IN ('TREADMILL', 'ROAD', 'TRAIL'))
    OR (S.Code = 'HIKE'     AND E.Code IN ('TRAIL', 'ROAD'));

INSERT INTO training.WorkoutType (Code, Name, IsAerobicCapped) VALUES
    ('AEROBIC_BASE',    N'Aerobic Base',        1),
    ('LONG',            N'Long Aerobic',        1),
    ('RECOVERY',        N'Recovery',            1),
    ('MAF_TEST',        N'MAF Test',            1),
    ('CROSS_TRAIN',     N'Cross Training',      1),
    ('STRENGTH',        N'Strength',            0),
    ('STRIDES',         N'Strides',             0),
    ('RACE',            N'Race',                0),
    ('REST',            N'Rest',                1);

INSERT INTO training.TrainingPhase (Code, Name, SortOrder) VALUES
    ('BASE',        N'Aerobic Base',        1),
    ('BUILD',       N'Build',               2),
    ('SHARPEN',     N'Sharpen',             3),
    ('TAPER',       N'Taper',               4),
    ('RACE',        N'Race Week',           5),
    ('RECOVERY',    N'Post-Race Recovery',  6);

INSERT INTO training.RacePriority (Code, Name) VALUES
    ('A', N'A - Goal Race'),
    ('B', N'B - Tune-up'),
    ('C', N'C - Training Effort');

INSERT INTO training.TrainingPlanStatus (Code, Name) VALUES
    ('DRAFT',       N'Draft'),
    ('ACTIVE',      N'Active'),
    ('COMPLETED',   N'Completed'),
    ('ABANDONED',   N'Abandoned');

INSERT INTO training.DistanceUnit (Code, Name, MetersPerUnit) VALUES
    ('KILOMETER',   N'Kilometer',   1000.000000),
    ('MILE',        N'Mile',        1609.344000);

INSERT INTO training.HeartRateAdjustmentReason (Code, Name, DeltaBeatsPerMinute) VALUES
    ('NONE',                    N'No adjustment',                               0),
    ('RECOVERING_OR_MEDICATED', N'Recovering from illness or on medication',   -10),
    ('INJURED_OR_REGRESSING',   N'Injured, regressing, or frequently ill',      -5),
    ('TWO_YEARS_PROGRESS',      N'Training 2+ years without problems',           5),
    ('COMPETITIVE_PROGRESSING', N'Competitive and progressing',                 10);
