/* ============================================================================
   no-file-no-mile-bro — 008: remove the Strava staging tables

   The Strava integration is removed from the app. This drops the two raw
   staging tables it wrote to:

     - training.StravaRawZoneData (first: its rows key on activity_id)
     - training.StravaRawActivity

   Deliberately left in place:

     - training.Activity rows already promoted from Strava, and the Strava row
       in training.DataSource they reference. They remain the athlete's
       completed activities.
     - training.DataSource, Activity.DataSourceId / DataSourceInternalId and
       UQ_Activity_DataSourceId_DataSourceInternalId, and the ZoneNSeconds
       columns. None of them is Strava-specific; the next source uses them.

   Dropping a table deletes its rows. This cannot be undone.

   Each drop checks before acting, so the script can be re-run safely.
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO


DROP TABLE IF EXISTS training.StravaRawZoneData;
GO

DROP TABLE IF EXISTS training.StravaRawActivity;
GO
