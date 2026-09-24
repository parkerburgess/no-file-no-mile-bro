import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";
import { resolveAthleteAccess } from "@/lib/auth";
import { forbidden, serverError } from "@/lib/api-response";
import { pullNewStravaData } from "@/lib/strava";
import type { ActivityZones, StravaActivity } from "@/lib/strava";
import type {
  StravaRawActivityInput,
  StravaRawZoneInput,
} from "@/lib/dal";

/** Strava reports exactly five heart rate buckets when zones are configured. */
const HEART_RATE_ZONE_COUNT = 5;

function toActivityInput(
  athleteId: number,
  activity: StravaActivity
): StravaRawActivityInput {
  return {
    athleteId,
    stravaAthleteId: activity.athlete.id,
    activityId: activity.id,
    name: activity.name,
    distance: activity.distance,
    elapsedTime: activity.elapsed_time,
    type: activity.type,
    startDateLocal: activity.start_date_local,
    averageHeartRate: activity.average_heartrate ?? null,
    maxHeartRate: activity.max_heartrate ?? null,
  };
}

/**
 * Flattens the heart rate section of a zones response into the five columns.
 * Returns null when the activity has no heart rate section, or reports a
 * different number of buckets than the table has columns for.
 */
function toZoneInput(record: ActivityZones): StravaRawZoneInput | null {
  const heartRate = record.zones.find((section) => section.type === "heartrate");
  if (heartRate === undefined) {
    return null;
  }

  const buckets = heartRate.distribution_buckets;
  if (buckets.length !== HEART_RATE_ZONE_COUNT) {
    return null;
  }

  return {
    activityId: record.activity_id,
    score: heartRate.score ?? null,
    zone1Time: buckets[0].time,
    zone2Time: buckets[1].time,
    zone3Time: buckets[2].time,
    zone4Time: buckets[3].time,
    zone5Time: buckets[4].time,
  };
}

function isZoneInput(input: StravaRawZoneInput | null): input is StravaRawZoneInput {
  return input !== null;
}

export async function POST() {
  const access = await resolveAthleteAccess();
  if (access.status === "denied") {
    return forbidden("You do not have access to this application.");
  }

  try {
    const athleteId = access.athlete.athleteId;
    const { activities, zones } = await pullNewStravaData();

    const activityInputs = activities.map((activity) =>
      toActivityInput(athleteId, activity)
    );
    const zoneInputs = zones.map(toZoneInput).filter(isZoneInput);

    /* Activities first: the zone rows carry a foreign key to
       StravaRawActivity.activity_id, so the parent must land first. */
    const activitiesSaved = await dal.strava.saveActivities(activityInputs);
    const zonesSaved = await dal.strava.saveZones(zoneInputs);

    return NextResponse.json({ activitiesSaved, zonesSaved });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error.";
    return serverError(`Strava pull failed: ${reason}`);
  }
}
