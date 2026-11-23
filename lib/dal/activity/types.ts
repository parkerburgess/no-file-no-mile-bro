/**
 * training.Activity is the canonical, resolved record of work performed. The
 * source and its own key for the record are kept on the row
 * (DataSourceId, DataSourceInternalId), so an import can be repeated without
 * producing a second row.
 */

/**
 * One completed activity, as the activity timeline renders it. `kind` is the
 * timeline's discriminant against a planned workout, which still comes from
 * lib/sample-data until a plan DAL exists.
 *
 * training.Activity carries no name column, so `name` is Notes — the one
 * free-text field on the row.
 */
export type CompletedActivity = {
  kind: "activity";
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

export interface IActivityAccess {
  /**
   * Every completed activity for one athlete, in no particular order (the
   * component sorts). Unbounded on purpose: the timeline shows all of them,
   * and a window can be added when the volume justifies guessing at one.
   */
  listActivities(athleteId: number): Promise<CompletedActivity[]>;
}
