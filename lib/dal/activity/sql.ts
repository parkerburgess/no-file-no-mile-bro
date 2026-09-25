import sql from "mssql";
import { executeQuery } from "@parkerburgess/wandering-parker-server";
import type {
  IActivityAccess,
  SkippedStravaActivity,
  StravaMigrationResult,
} from "@/lib/dal/activity/types";

/** The training.DataSource row the Strava staging tables belong to. */
const STRAVA_DATA_SOURCE_NAME = "Strava";

/**
 * Strava's activity type to this app's Sport.Code. Keyed by code rather than
 * SportId so no generated key is written down here: the SQL below joins
 * training.Sport on Code to resolve it.
 *
 * A type absent from this map is skipped by the migration rather than failing
 * it — Strava adds types on its own schedule, and a new one should not stop
 * the pull. Sport has no Sport row for swimming or the rest, so only the
 * types this athlete records are mapped.
 */
const SPORT_CODE_BY_STRAVA_TYPE: Record<string, string> = {
  Run: "RUN",
  VirtualRun: "RUN",
  Ride: "CYCLE",
  VirtualRide: "CYCLE",
  Walk: "WALK",
  Hike: "HIKE",
  WeightTraining: "STRENGTH",
  Workout: "STRENGTH",
};

/** One mapping, carrying the suffix its two bind parameters are named with. */
type SportMapEntry = {
  stravaType: string;
  sportCode: string;
  index: number;
};

type SkippedRow = {
  /* BIGINT: the mssql driver hands these back as strings. */
  activity_id: string;
  type: string;
};

type MigratedCountRow = {
  MigratedCount: number;
};

function toSportMapEntries(): SportMapEntry[] {
  const pairs = Object.entries(SPORT_CODE_BY_STRAVA_TYPE);

  return pairs.map(([stravaType, sportCode], index) => ({
    stravaType,
    sportCode,
    index,
  }));
}

/** `(@stravaType0, @sportCode0), (@stravaType1, @sportCode1), ...` */
function toMapValuesClause(entries: SportMapEntry[]): string {
  const rows = entries.map(
    (entry) => `(@stravaType${entry.index}, @sportCode${entry.index})`
  );

  return rows.join(",\n               ");
}

/** `@stravaType0, @stravaType1, ...` */
function toTypeParameterList(entries: SportMapEntry[]): string {
  const names = entries.map((entry) => `@stravaType${entry.index}`);

  return names.join(", ");
}

function bindStravaTypes(
  request: sql.Request,
  entries: SportMapEntry[]
): sql.Request {
  let bound = request;

  for (const entry of entries) {
    bound = bound.input(
      `stravaType${entry.index}`,
      sql.NVarChar(50),
      entry.stravaType
    );
  }

  return bound;
}

function bindSportMap(
  request: sql.Request,
  entries: SportMapEntry[]
): sql.Request {
  let bound = bindStravaTypes(request, entries);

  for (const entry of entries) {
    bound = bound.input(
      `sportCode${entry.index}`,
      sql.VarChar(20),
      entry.sportCode
    );
  }

  return bound;
}

function toSkipped(row: SkippedRow): SkippedStravaActivity {
  return {
    /* Every Strava activity id is far inside the safe integer range, so
       widening the driver's string back to a number is lossless. */
    activityId: Number(row.activity_id),
    stravaType: row.type,
  };
}

/**
 * Live raw activities whose type is not in the map. Unmapped means they can
 * never be promoted, so there is no need to exclude ones already in
 * training.Activity — by definition none are.
 */
async function findSkippedActivities(
  entries: SportMapEntry[]
): Promise<SkippedStravaActivity[]> {
  const result = await executeQuery((request) =>
    bindStravaTypes(request, entries).query<SkippedRow>(`
      SELECT SRA.activity_id,
             SRA.[type]
      FROM training.StravaRawActivity SRA
      WHERE SRA.IsActivityDeleted = 0
        AND SRA.[type] NOT IN (${toTypeParameterList(entries)})
      ORDER BY SRA.start_date_local DESC
    `)
  );

  return result.recordset.map(toSkipped);
}

/**
 * One set-based insert rather than a row at a time: the rows to promote are
 * defined by a filter, and the only thing the application contributes is the
 * type-to-sport map, passed as a derived table of bind parameters.
 *
 * The heart rate columns are DECIMAL(4,1) in staging and SMALLINT here, so
 * they are rounded to the nearest beat rather than truncated on the way in.
 */
async function insertFromStravaRaw(entries: SportMapEntry[]): Promise<number> {
  const result = await executeQuery((request) =>
    bindSportMap(request, entries)
      .input("dataSourceName", sql.NVarChar(50), STRAVA_DATA_SOURCE_NAME)
      .query<MigratedCountRow>(`
        DECLARE @dataSourceId INT =
          (SELECT DS.DataSourceId
           FROM training.DataSource DS
           WHERE DS.[Name] = @dataSourceName);

        IF @dataSourceId IS NULL
          THROW 50000,
                'training.DataSource has no row for the Strava source.',
                1;

        INSERT INTO training.Activity
          (AthleteId, SportId, DataSourceId, DataSourceInternalId, StartedAt,
           DurationSeconds, DistanceMeters, AverageHeartRate, MaxHeartRate,
           Zone1Seconds, Zone2Seconds, Zone3Seconds, Zone4Seconds,
           Zone5Seconds, Notes, CreatedAt)
        SELECT SRA.AthleteId,
               S.SportId,
               @dataSourceId,
               SRA.activity_id,
               SRA.start_date_local,
               SRA.elapsed_time,
               SRA.distance,
               CAST(ROUND(SRA.average_heartrate, 0) AS SMALLINT),
               SRA.max_heartrate,
               SRZD.Zone1_time,
               SRZD.Zone2_time,
               SRZD.Zone3_time,
               SRZD.Zone4_time,
               SRZD.Zone5_time,
               /* The Strava activity name has no column of its own here, and
                  Notes is the one free-text field the athlete can edit. */
               SRA.[name],
               /* Set explicitly: training.Activity.CreatedAt is NOT NULL and
                  carries no default constraint. */
               SYSUTCDATETIME()
        FROM training.StravaRawActivity SRA
        /* The type-to-sport map, as values rather than a table: it changes
           when Strava adds a type, not when this athlete's data changes. */
        JOIN (VALUES ${toMapValuesClause(entries)})
             AS SM (StravaType, SportCode)
          ON SM.StravaType = SRA.[type]
        JOIN training.Sport S
          ON S.Code = SM.SportCode
        /* LEFT: an activity recorded without a strap has no zone row, and
           should still be promoted with null zone seconds. */
        LEFT JOIN training.StravaRawZoneData SRZD
          ON SRZD.activity_id = SRA.activity_id
        WHERE SRA.IsActivityDeleted = 0
          AND SRA.activity_id NOT IN (SELECT A.DataSourceInternalId
                                      FROM training.Activity A
                                      WHERE A.DataSourceId = @dataSourceId);

        SELECT @@ROWCOUNT AS MigratedCount;
      `)
  );

  return result.recordset[0].MigratedCount;
}

export const sqlActivityAccess: IActivityAccess = {
  async migrateStravaActivities(): Promise<StravaMigrationResult> {
    try {
      const entries = toSportMapEntries();
      const skipped = await findSkippedActivities(entries);
      const migrated = await insertFromStravaRaw(entries);

      return { migrated, skipped };
    } catch (err) {
      console.error("[DAL] activity.migrateStravaActivities failed", { err });
      throw err;
    }
  },
};
