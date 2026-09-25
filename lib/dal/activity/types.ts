/**
 * training.Activity is the canonical, resolved record of work performed. It
 * never receives an API payload directly: each source lands in its own raw
 * staging table first, and a migration promotes those rows here. The source
 * and its own key for the record are kept on the row
 * (DataSourceId, DataSourceInternalId), which is what makes a promotion
 * repeatable without producing a second row.
 */

/**
 * A live raw Strava activity the migration left behind because its Strava
 * type has no Sport to map to. The row stays in staging, so adding the
 * mapping and pulling again picks it up.
 */
export type SkippedStravaActivity = {
  activityId: number;
  stravaType: string;
};

export type StravaMigrationResult = {
  /** Rows inserted into training.Activity by this run. */
  migrated: number;
  skipped: SkippedStravaActivity[];
};

export interface IActivityAccess {
  /**
   * Promotes every raw Strava activity that is not marked deleted and has no
   * training.Activity row yet. Insert-only: an activity already promoted is
   * left alone, so a hand edit is never overwritten — and, for the same
   * reason, zone data that arrives after promotion is not backfilled.
   *
   * Safe to call after every pull; with nothing new to promote it inserts
   * nothing.
   */
  migrateStravaActivities(): Promise<StravaMigrationResult>;
}
