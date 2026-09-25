/* ============================================================================
   no-file-no-mile-bro — 005: one Activity per source record

   training.Activity records where a row came from (DataSourceId) and that
   source's own key for it (DataSourceInternalId), but nothing enforced one
   row per pair. The only guard was the NOT IN filter in the Strava migration,
   and two pulls running at once would both pass it. This puts the rule in the
   database, where it holds regardless of which code path writes.

   Assumes training.Activity and training.DataSource exist.

   Earlier scripts (001-004) were removed from the repository once they had
   been applied; this one is kept so the constraint the migration relies on is
   reproducible.
   ============================================================================ */

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO


ALTER TABLE training.Activity
    ADD CONSTRAINT UQ_Activity_DataSourceId_DataSourceInternalId
        UNIQUE (DataSourceId, DataSourceInternalId);
GO
