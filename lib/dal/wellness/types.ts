/**
 * training.DailyWellness is one row per athlete per training day — the daily
 * metrics the Garmin Personal API reports, rather than anything tied to a
 * single activity.
 *
 * `DailyWellnessDate` is the day. Weight is stored in kilograms and sleep in
 * seconds; both are converted for display at the UI edge.
 */

/**
 * One wellness day, as the daily card renders it.
 *
 * AthleteId, CreatedAt and UpdatedAt are deliberately absent — the caller
 * already knows the athlete it asked for, and the audit columns have no
 * reader. `stepGoal` is the goal Garmin sets for the day, not one entered
 * here.
 */
export type DailyWellness = {
  id: number;
  dailyWellnessDate: string;
  steps: number | null;
  stepGoal: number | null;
  restingHeartRate: number | null;
  maxHeartRate: number | null;
  sleepDurationSeconds: number | null;
  sleepScore: number | null;
  bodyWeightKilograms: number | null;
};

export interface IWellnessAccess {
  /**
   * Every wellness day for one athlete, in no particular order (the component
   * sorts). Unbounded for the same reason listActivities is: the panel shows
   * all of them, and a window can be added when the volume justifies picking
   * one.
   */
  listDailyWellness(athleteId: number): Promise<DailyWellness[]>;
}
