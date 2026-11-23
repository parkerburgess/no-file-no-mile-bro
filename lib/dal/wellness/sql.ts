import sql from "mssql";
import { executeQuery } from "@parkerburgess/wandering-parker-server";
import { toDateOnly } from "@/lib/dal/mapping";
import type {
  DailyWellness,
  IWellnessAccess,
  WellnessDayInput,
} from "@/lib/dal/wellness/types";

type DailyWellnessRow = {
  DailyWellnessId: number;
  DailyWellnessDate: Date;
  Steps: number | null;
  StepGoal: number | null;
  RestingHeartRate: number | null;
  MaxHeartRate: number | null;
  SleepDurationSeconds: number | null;
  SleepScore: number | null;
  BodyWeightKilograms: number | null;
};

function toDailyWellness(row: DailyWellnessRow): DailyWellness {
  return {
    id: row.DailyWellnessId,
    /* DATETIME2, but it carries a training day rather than an instant, so the
       time half is dropped here instead of being passed to the UI to ignore. */
    dailyWellnessDate: toDateOnly(row.DailyWellnessDate),
    steps: row.Steps,
    stepGoal: row.StepGoal,
    restingHeartRate: row.RestingHeartRate,
    maxHeartRate: row.MaxHeartRate,
    sleepDurationSeconds: row.SleepDurationSeconds,
    sleepScore: row.SleepScore,
    /* DECIMAL: the driver can hand these back as strings, so it is widened
       rather than trusted to arrive as a number. */
    bodyWeightKilograms:
      row.BodyWeightKilograms === null ? null : Number(row.BodyWeightKilograms),
  };
}

export const sqlWellnessAccess: IWellnessAccess = {
  async listDailyWellness(
    athleteId: number,
    dayCount: number
  ): Promise<DailyWellness[]> {
    try {
      const result = await executeQuery((request) =>
        request
          .input("athleteId", sql.Int, athleteId)
          .input("dayCount", sql.Int, dayCount)
          .query<DailyWellnessRow>(`
            SELECT TOP (@dayCount)
                   DW.DailyWellnessId,
                   DW.DailyWellnessDate,
                   DW.Steps,
                   DW.StepGoal,
                   DW.RestingHeartRate,
                   DW.MaxHeartRate,
                   DW.SleepDurationSeconds,
                   DW.SleepScore,
                   DW.BodyWeightKilograms
            FROM training.DailyWellness DW
            WHERE DW.AthleteId = @athleteId
            ORDER BY DW.DailyWellnessDate DESC
          `)
      );

      return result.recordset.map(toDailyWellness);
    } catch (err) {
      console.error("[DAL] wellness.listDailyWellness failed", { err });
      throw err;
    }
  },

  async latestDate(athleteId: number): Promise<string | null> {
    try {
      const result = await executeQuery((request) =>
        request
          .input("athleteId", sql.Int, athleteId)
          .query<{ LatestDate: Date | null }>(`
            SELECT MAX(DW.DailyWellnessDate) AS LatestDate
            FROM training.DailyWellness DW
            WHERE DW.AthleteId = @athleteId
          `)
      );

      const latest = result.recordset[0]?.LatestDate ?? null;
      return latest === null ? null : toDateOnly(latest);
    } catch (err) {
      console.error("[DAL] wellness.latestDate failed", { err });
      throw err;
    }
  },

  /* An upsert on the natural key (AthleteId, DailyWellnessDate) that sets
     absolute values, so running it twice leaves the same row — executeQuery's
     retry is safe here. The day is stored at midnight, which is what keeps
     UQ_DailyWellness_AthleteId_DailyWellnessDate one row per day. */
  async upsertDay(input: WellnessDayInput): Promise<void> {
    try {
      await executeQuery((request) =>
        request
          .input("athleteId", sql.Int, input.athleteId)
          .input("date", sql.VarChar(10), input.date)
          .input("steps", sql.Int, input.steps)
          .input("stepGoal", sql.Int, input.stepGoal)
          .input("restingHeartRate", sql.SmallInt, input.restingHeartRate)
          .input("maxHeartRate", sql.Int, input.maxHeartRate)
          .input("sleepDurationSeconds", sql.Int, input.sleepDurationSeconds)
          .input("sleepScore", sql.SmallInt, input.sleepScore)
          .input(
            "bodyWeightKilograms",
            sql.Decimal(5, 2),
            input.bodyWeightKilograms
          )
          .query(`
            DECLARE @day DATETIME2 = CONVERT(DATETIME2, @date, 23);

            UPDATE training.DailyWellness
            SET Steps                = @steps,
                StepGoal             = @stepGoal,
                RestingHeartRate     = @restingHeartRate,
                MaxHeartRate         = @maxHeartRate,
                SleepDurationSeconds = @sleepDurationSeconds,
                SleepScore           = @sleepScore,
                BodyWeightKilograms  = @bodyWeightKilograms,
                UpdatedAt            = SYSUTCDATETIME()
            WHERE AthleteId = @athleteId
              AND DailyWellnessDate = @day;

            IF @@ROWCOUNT = 0
                INSERT INTO training.DailyWellness
                    (AthleteId, DailyWellnessDate, Steps, StepGoal,
                     RestingHeartRate, MaxHeartRate, SleepDurationSeconds,
                     SleepScore, BodyWeightKilograms, CreatedAt)
                VALUES
                    (@athleteId, @day, @steps, @stepGoal,
                     @restingHeartRate, @maxHeartRate,
                     @sleepDurationSeconds, @sleepScore,
                     @bodyWeightKilograms, SYSUTCDATETIME());
          `)
      );
    } catch (err) {
      console.error("[DAL] wellness.upsertDay failed", { err });
      throw err;
    }
  },
};
