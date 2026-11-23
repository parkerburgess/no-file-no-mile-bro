import sql from "mssql";
import { executeQuery } from "@parkerburgess/wandering-parker-server";
import { toTimestamp } from "@/lib/dal/mapping";
import type { Activity, IActivityAccess } from "@/lib/dal/activity/types";

type ActivityRow = {
  ActivityId: number;
  SportCode: string;
  SportName: string;
  Notes: string | null;
  StartedAt: Date;
  DurationSeconds: number;
  DistanceMeters: number | null;
  AverageHeartRate: number | null;
  MaxHeartRate: number | null;
};

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.ActivityId,
    sportCode: row.SportCode,
    sportName: row.SportName,
    name: row.Notes,
    startedAt: toTimestamp(row.StartedAt),
    durationSeconds: row.DurationSeconds,
    /* DECIMAL: the driver can hand these back as strings, so they are widened
       rather than trusted to arrive as numbers. */
    distanceMeters:
      row.DistanceMeters === null ? null : Number(row.DistanceMeters),
    averageHeartRate: row.AverageHeartRate,
    maxHeartRate: row.MaxHeartRate,
  };
}

export const sqlActivityAccess: IActivityAccess = {
  async listActivities(athleteId: number): Promise<Activity[]> {
    try {
      const result = await executeQuery((request) =>
        request.input("athleteId", sql.Int, athleteId).query<ActivityRow>(`
          SELECT A.ActivityId,
                 S.Code AS SportCode,
                 S.Name AS SportName,
                 A.Notes,
                 A.StartedAt,
                 A.DurationSeconds,
                 A.DistanceMeters,
                 A.AverageHeartRate,
                 A.MaxHeartRate
          FROM training.Activity A
          JOIN training.Sport S
            ON S.SportId = A.SportId
          WHERE A.AthleteId = @athleteId
        `)
      );

      return result.recordset.map(toActivity);
    } catch (err) {
      console.error("[DAL] activity.listActivities failed", { err });
      throw err;
    }
  },
};
