import sql from "mssql";
import { executeQuery } from "@parkerburgess/wandering-parker-server";
import { toDateOnly, toTimestamp } from "@/lib/dal/mapping";
import type {
  Activity,
  IActivityAccess,
  ImportedActivityInput,
} from "@/lib/dal/activity/types";

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

  async latestStartDate(
    athleteId: number,
    dataSourceName: string
  ): Promise<string | null> {
    try {
      const result = await executeQuery((request) =>
        request
          .input("athleteId", sql.Int, athleteId)
          .input("dataSourceName", sql.NVarChar(100), dataSourceName)
          .query<{ LatestStartDate: Date | null }>(`
            SELECT CAST(MAX(A.StartedAt) AS DATE) AS LatestStartDate
            FROM training.Activity A
            JOIN training.DataSource DS
              ON DS.DataSourceId = A.DataSourceId
            WHERE A.AthleteId = @athleteId
              AND DS.Name = @dataSourceName
          `)
      );

      const latest = result.recordset[0]?.LatestStartDate ?? null;
      return latest === null ? null : toDateOnly(latest);
    } catch (err) {
      console.error("[DAL] activity.latestStartDate failed", { err });
      throw err;
    }
  },

  /* Guarded by NOT EXISTS on the source's id (and the unique constraint
     behind it), so running it twice inserts once — executeQuery's retry is
     safe here. */
  async insertImported(input: ImportedActivityInput): Promise<boolean> {
    try {
      const result = await executeQuery((request) =>
        request
          .input("athleteId", sql.Int, input.athleteId)
          .input("dataSourceName", sql.NVarChar(100), input.dataSourceName)
          .input("internalId", sql.BigInt, input.dataSourceInternalId)
          .input("sportCode", sql.VarChar(20), input.sportCode)
          .input("startedAt", sql.VarChar(19), input.startedAtLocal)
          .input("durationSeconds", sql.Int, input.durationSeconds)
          .input("distanceMeters", sql.Decimal(10, 2), input.distanceMeters)
          .input("averageHeartRate", sql.SmallInt, input.averageHeartRate)
          .input("maxHeartRate", sql.SmallInt, input.maxHeartRate)
          .input("zone1Seconds", sql.Int, input.zone1Seconds)
          .input("zone2Seconds", sql.Int, input.zone2Seconds)
          .input("zone3Seconds", sql.Int, input.zone3Seconds)
          .input("zone4Seconds", sql.Int, input.zone4Seconds)
          .input("zone5Seconds", sql.Int, input.zone5Seconds)
          .query(`
            INSERT INTO training.Activity
                (AthleteId, SportId, DataSourceId, DataSourceInternalId,
                 StartedAt, DurationSeconds, DistanceMeters,
                 AverageHeartRate, MaxHeartRate,
                 Zone1Seconds, Zone2Seconds, Zone3Seconds, Zone4Seconds,
                 Zone5Seconds, CreatedAt)
            SELECT @athleteId, S.SportId, DS.DataSourceId, @internalId,
                   CONVERT(DATETIME2, @startedAt, 120), @durationSeconds,
                   @distanceMeters, @averageHeartRate, @maxHeartRate,
                   @zone1Seconds, @zone2Seconds, @zone3Seconds,
                   @zone4Seconds, @zone5Seconds, SYSUTCDATETIME()
            FROM training.Sport S
            CROSS JOIN training.DataSource DS
            WHERE S.Code = @sportCode
              AND DS.Name = @dataSourceName
              AND NOT EXISTS (
                SELECT 1
                FROM training.Activity A
                WHERE A.DataSourceId = DS.DataSourceId
                  AND A.DataSourceInternalId = @internalId
              )
          `)
      );

      return result.rowsAffected[0] > 0;
    } catch (err) {
      console.error("[DAL] activity.insertImported failed", { err });
      throw err;
    }
  },
};
