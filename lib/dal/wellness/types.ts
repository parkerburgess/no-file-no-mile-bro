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

/**
 * One day of Garmin wellness metrics, ready to upsert. `date` is the
 * training day, "yyyy-MM-dd". Weight is kilograms and sleep is seconds,
 * matching the columns.
 */
export type WellnessDayInput = {
  athleteId: number;
  date: string;
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
   * The athlete's newest `dayCount` stored days, in no particular order (the
   * component sorts). Windowed because the Garmin pull stores a year of days,
   * and rendering all of them made the page slow.
   */
  listDailyWellness(
    athleteId: number,
    dayCount: number
  ): Promise<DailyWellness[]>;

  /** The newest stored day ("yyyy-MM-dd"), or null when there is none. */
  latestDate(athleteId: number): Promise<string | null>;

  /**
   * Inserts the day, or overwrites its metrics when the athlete already has a
   * row for it — recent days are re-pulled while Garmin is still filling
   * them in.
   */
  upsertDay(input: WellnessDayInput): Promise<void>;
}
