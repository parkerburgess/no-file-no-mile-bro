import sql from "mssql";
import { executeQuery } from "@parkerburgess/wandering-parker-server";
import { toDateOnly } from "@/lib/dal/mapping";
import type { DailyWellness, IWellnessAccess } from "@/lib/dal/wellness/types";

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
  async listDailyWellness(athleteId: number): Promise<DailyWellness[]> {
    try {
      const result = await executeQuery((request) =>
        request
          .input("athleteId", sql.Int, athleteId)
          .query<DailyWellnessRow>(`
            SELECT DW.DailyWellnessId,
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
          `)
      );

      return result.recordset.map(toDailyWellness);
    } catch (err) {
      console.error("[DAL] wellness.listDailyWellness failed", { err });
      throw err;
    }
  },
};
