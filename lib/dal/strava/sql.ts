import sql from "mssql";
import { executeQuery } from "@parkerburgess/wandering-parker-server";
import type {
  IStravaAccess,
  StravaRawActivityInput,
  StravaRawZoneInput,
} from "@/lib/dal/strava/types";

type ActivityIdRow = {
  activity_id: number;
};

/**
 * UPDATE-then-INSERT rather than MERGE: it reads plainly, and MERGE carries
 * concurrency caveats that buy nothing here. The unique constraints on
 * activity_id are what actually guarantee one row per activity.
 */
async function saveActivity(input: StravaRawActivityInput): Promise<void> {
  await executeQuery((request) =>
    request
      .input("athleteId", sql.Int, input.athleteId)
      .input("stravaAthleteId", sql.BigInt, input.stravaAthleteId)
      .input("activityId", sql.BigInt, input.activityId)
      .input("name", sql.NVarChar(255), input.name)
      .input("distance", sql.Decimal(10, 1), input.distance)
      .input("elapsedTime", sql.Int, input.elapsedTime)
      .input("type", sql.NVarChar(50), input.type)
      /* Strava suffixes start_date_local with Z even though the value is the
         athlete's local wall clock, not UTC. Keeping the Z and passing a Date
         makes the driver write those exact clock components: it converts a
         Date to UTC, and with the Z the UTC components already are the local
         reading. Stripping the Z instead makes the driver treat the text as
         server-local time and shift it. */
      .input("startDateLocal", sql.DateTime2(0), new Date(input.startDateLocal))
      .input("averageHeartRate", sql.Decimal(4, 1), input.averageHeartRate)
      .input("maxHeartRate", sql.SmallInt, input.maxHeartRate).query(`
        UPDATE training.StravaRawActivity
        SET AthleteId         = @athleteId,
            strava_athlete_id = @stravaAthleteId,
            [name]            = @name,
            distance          = @distance,
            elapsed_time      = @elapsedTime,
            [type]            = @type,
            start_date_local  = @startDateLocal,
            average_heartrate = @averageHeartRate,
            max_heartrate     = @maxHeartRate
        WHERE activity_id = @activityId;

        IF @@ROWCOUNT = 0
          INSERT INTO training.StravaRawActivity
            (AthleteId, strava_athlete_id, activity_id, [name], distance,
             elapsed_time, [type], start_date_local, average_heartrate,
             max_heartrate)
          VALUES
            (@athleteId, @stravaAthleteId, @activityId, @name, @distance,
             @elapsedTime, @type, @startDateLocal, @averageHeartRate,
             @maxHeartRate);
      `)
  );
}

async function saveZone(input: StravaRawZoneInput): Promise<void> {
  await executeQuery((request) =>
    request
      .input("activityId", sql.BigInt, input.activityId)
      .input("score", sql.Int, input.score)
      .input("zone1Time", sql.Int, input.zone1Time)
      .input("zone2Time", sql.Int, input.zone2Time)
      .input("zone3Time", sql.Int, input.zone3Time)
      .input("zone4Time", sql.Int, input.zone4Time)
      .input("zone5Time", sql.Int, input.zone5Time).query(`
        UPDATE training.StravaRawZoneData
        SET score      = @score,
            Zone1_time = @zone1Time,
            Zone2_time = @zone2Time,
            Zone3_time = @zone3Time,
            Zone4_time = @zone4Time,
            Zone5_time = @zone5Time
        WHERE activity_id = @activityId;

        IF @@ROWCOUNT = 0
          INSERT INTO training.StravaRawZoneData
            (activity_id, score, Zone1_time, Zone2_time, Zone3_time,
             Zone4_time, Zone5_time)
          VALUES
            (@activityId, @score, @zone1Time, @zone2Time, @zone3Time,
             @zone4Time, @zone5Time);
      `)
  );
}

export const sqlStravaAccess: IStravaAccess = {
  async saveActivities(activities: StravaRawActivityInput[]): Promise<number> {
    for (const activity of activities) {
      await saveActivity(activity);
    }
    return activities.length;
  },

  async getRecentActivityIds(limit: number): Promise<number[]> {
    const result = await executeQuery((request) =>
      request.input("limit", sql.Int, limit).query<ActivityIdRow>(`
        SELECT TOP (@limit) activity_id
        FROM training.StravaRawActivity
        ORDER BY start_date_local DESC
      `)
    );

    /* activity_id is BIGINT. Every current Strava id is far inside the safe
       integer range, so Number is lossless here. */
    return result.recordset.map((row) => Number(row.activity_id));
  },

  async saveZones(zones: StravaRawZoneInput[]): Promise<number> {
    for (const zone of zones) {
      await saveZone(zone);
    }
    return zones.length;
  },
};
