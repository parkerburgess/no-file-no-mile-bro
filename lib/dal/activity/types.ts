/**
 * training.Activity is the canonical, resolved record of work performed. The
 * source and its own key for the record are kept on the row
 * (DataSourceId, DataSourceInternalId), so an import can be repeated without
 * producing a second row.
 */

/**
 * One completed activity.
 *
 * training.Activity carries no name column, so `name` is Notes — the one
 * free-text field on the row.
 */
export type Activity = {
  id: number;
  /** training.Sport.Code, e.g. "RUN" or "CYCLE". */
  sportCode: string;
  sportName: string;
  name: string | null;
  startedAt: string;
  durationSeconds: number;
  distanceMeters: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
};

/**
 * One activity from an external source, ready to insert. The source and its
 * own id for the record go into DataSourceId / DataSourceInternalId, which
 * UQ_Activity_DataSourceId_DataSourceInternalId keeps unique.
 *
 * `startedAtLocal` is "yyyy-MM-dd HH:mm:ss" in the athlete's local time, the
 * same convention as every other StartedAt, so a training day never shifts
 * across midnight UTC.
 */
export type ImportedActivityInput = {
  athleteId: number;
  dataSourceName: string;
  dataSourceInternalId: number;
  /** training.Sport.Code, e.g. "RUN". Must exist in training.Sport. */
  sportCode: string;
  startedAtLocal: string;
  durationSeconds: number;
  distanceMeters: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  zone1Seconds: number | null;
  zone2Seconds: number | null;
  zone3Seconds: number | null;
  zone4Seconds: number | null;
  zone5Seconds: number | null;
};

export interface IActivityAccess {
  /**
   * Every activity for one athlete, in no particular order (the component
   * sorts). Unbounded on purpose: the page shows all of them, and a window can
   * be added when the volume justifies guessing at one.
   */
  listActivities(athleteId: number): Promise<Activity[]>;

  /**
   * The date ("yyyy-MM-dd") of the athlete's latest activity from one source,
   * or null when there is none yet. A pull starts from here.
   */
  latestStartDate(
    athleteId: number,
    dataSourceName: string
  ): Promise<string | null>;

  /**
   * Inserts the activity unless that source's id is already stored. Returns
   * true when a row was inserted, false when it was already there.
   */
  insertImported(input: ImportedActivityInput): Promise<boolean>;
}
