/**
 * training.Activity is the canonical, resolved record of work performed. It
 * never receives an API payload directly: each source lands in its own raw
 * staging table first, and a migration promotes those rows here. The source
 * and its own key for the record are kept on the row
 * (DataSourceId, DataSourceInternalId), which is what makes a promotion
 * repeatable without producing a second row.
 */

/**
 * One completed activity, as the activity timeline renders it. `kind` is the
 * timeline's discriminant against a planned workout, which still comes from
 * lib/sample-data until a plan DAL exists.
 *
 * training.Activity carries no name column, so `name` is Notes — which is
 * where the migration puts the name the source gave the activity, and the one
 * field the athlete can edit afterward.
 */
export type CompletedActivity = {
  kind: "activity";
  id: number;
  sportName: string;
  name: string | null;
  startedAt: string;
  durationSeconds: number;
  distanceMeters: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  /** Null when the activity was recorded without heart rate zone data. */
  secondsAboveHeartRateCeiling: number | null;
};

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
   * Every completed activity for one athlete, newest first. Unbounded on
   * purpose: the timeline shows all of them, and a window can be added when
   * the volume justifies guessing at one.
   */
  listActivities(athleteId: number): Promise<CompletedActivity[]>;

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
