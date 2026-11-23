/* ============================================================================
   no-file-no-mile-bro — 009: remove the Strava-sourced activities

   Garmin is now the one activity source. The rows imported from Strava are
   the same activities the Garmin pull returns, under Strava's ids, so keeping
   them would show every one of them twice. This deletes them; the next Garmin
   pull re-imports them with Garmin's ids and heart rate zones.

   The Strava row in training.DataSource is left in place: nothing references
   it after this, and removing a lookup row gains nothing.

   Deleting rows cannot be undone. Re-running the script deletes nothing more.
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DELETE A
FROM training.Activity A
JOIN training.DataSource DS
  ON DS.DataSourceId = A.DataSourceId
WHERE DS.Name = 'Strava';
GO
