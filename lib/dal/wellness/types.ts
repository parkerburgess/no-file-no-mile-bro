/**
 * training.DailyWellness is one row per athlete per training day — the
 * overnight and subjective numbers that belong to the day rather than to any
 * single activity. Nothing promotes rows here from a staging table: unlike
 * training.Activity, every column is entered by the athlete.
 *
 * `DailyWellnessDate` is the day. `RecordedOn` is being dropped from the
 * database in favour of it, so nothing here reads that column.
 */

/**
 * One wellness day, as the daily card renders it.
 *
 * AthleteId, CreatedAt and UpdatedAt are deliberately absent — the caller
 * already knows the athlete it asked for, and the audit columns have no
 * reader. `perceivedHealthName` is training.PerceivedHealthRating.Name joined
 * through, rather than the raw id: the lookup exists to give the rating words.
 */
export type DailyWellness = {
  id: number;
  dailyWellnessDate: string;
  restingHeartRate: number | null;
  sleepDurationSeconds: number | null;
  sleepScore: number | null;
  bodyWeightKilograms: number | null;
  perceivedHealthName: string | null;
  notes: string | null;
};

export interface IWellnessAccess {
  /**
   * Every wellness day for one athlete, newest first. Unbounded for the same
   * reason listActivities is: the panel shows all of them, and a window can be
   * added when the volume justifies picking one.
   */
  listDailyWellness(athleteId: number): Promise<DailyWellness[]>;
}
