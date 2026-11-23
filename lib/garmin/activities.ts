import { dal } from "@/lib/dal";
import type { ImportedActivityInput } from "@/lib/dal";
import type { PullGarminResultDto } from "@/dto";
import { fetchAccessToken, garminGet } from "@/lib/garmin/client";
import { shiftDays, tomorrowUtc } from "@/lib/garmin/dates";
import {
  GARMIN_DATA_SOURCE_NAME,
  GARMIN_PAGE_SIZE,
  GARMIN_SPORT_CODE_BY_TYPE_KEY,
} from "@/lib/config";

/**
 * Pulls activities from the Garmin Personal API into training.Activity.
 *
 * Only the fields the app uses are read; nothing else from Garmin's record is
 * stored. Garmin's activityId goes into DataSourceInternalId, and because a
 * finished activity does not change, an id already stored is never fetched
 * again: each pull starts from the date of the latest Garmin activity on
 * file. The day before it is included too, as a margin for an activity that
 * was uploaded late.
 */

const ACTIVITY_SEARCH_PATH =
  "/activitylist-service/activities/search/activities";

/**
 * The fields of a Garmin activity summary the pull reads. Garmin sends many
 * more; they are ignored rather than typed. Times are seconds (fractional),
 * distance is meters.
 */
type GarminActivitySummary = {
  activityId: number;
  /** "yyyy-MM-dd HH:mm:ss" in the athlete's local time. */
  startTimeLocal: string;
  activityType: {
    typeKey: string;
  };
  duration: number;
  distance?: number | null;
  averageHR?: number | null;
  maxHR?: number | null;
  hrTimeInZone_1?: number | null;
  hrTimeInZone_2?: number | null;
  hrTimeInZone_3?: number | null;
  hrTimeInZone_4?: number | null;
  hrTimeInZone_5?: number | null;
};

async function fetchActivityPage(
  accessToken: string,
  start: number,
  startDate: string | null,
  endDate: string
): Promise<GarminActivitySummary[]> {
  const query = new URLSearchParams({
    start: String(start),
    limit: String(GARMIN_PAGE_SIZE),
    endDate,
  });
  if (startDate !== null) {
    query.set("startDate", startDate);
  }

  return garminGet<GarminActivitySummary[]>(
    accessToken,
    ACTIVITY_SEARCH_PATH,
    query
  );
}

/** Every page of the search, until one comes back short. */
async function fetchActivities(
  startDate: string | null,
  endDate: string
): Promise<GarminActivitySummary[]> {
  const accessToken = await fetchAccessToken();
  const activities: GarminActivitySummary[] = [];

  for (let start = 0; ; start += GARMIN_PAGE_SIZE) {
    const page = await fetchActivityPage(
      accessToken,
      start,
      startDate,
      endDate
    );
    activities.push(...page);

    if (page.length < GARMIN_PAGE_SIZE) {
      return activities;
    }
  }
}

function roundedOrNull(value: number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return Math.round(value);
}

/** Two decimals to fit DECIMAL(10,2); 0 m (strength, yoga) is no distance. */
function distanceOrNull(meters: number | null | undefined): number | null {
  if (meters === null || meters === undefined || meters <= 0) {
    return null;
  }
  return Math.round(meters * 100) / 100;
}

function toImportedActivity(
  athleteId: number,
  sportCode: string,
  activity: GarminActivitySummary
): ImportedActivityInput {
  return {
    athleteId,
    dataSourceName: GARMIN_DATA_SOURCE_NAME,
    dataSourceInternalId: activity.activityId,
    sportCode,
    startedAtLocal: activity.startTimeLocal,
    durationSeconds: Math.round(activity.duration),
    distanceMeters: distanceOrNull(activity.distance),
    averageHeartRate: roundedOrNull(activity.averageHR),
    maxHeartRate: roundedOrNull(activity.maxHR),
    zone1Seconds: roundedOrNull(activity.hrTimeInZone_1),
    zone2Seconds: roundedOrNull(activity.hrTimeInZone_2),
    zone3Seconds: roundedOrNull(activity.hrTimeInZone_3),
    zone4Seconds: roundedOrNull(activity.hrTimeInZone_4),
    zone5Seconds: roundedOrNull(activity.hrTimeInZone_5),
  };
}

/**
 * The search's first day: the day before the latest stored Garmin activity,
 * or no lower bound for a first pull or a full-history pull. A full pull is
 * for when a type mapping is added — activities of that type older than the
 * latest stored one would otherwise never be fetched. Ids already stored are
 * skipped by the insert either way.
 */
async function searchStartDate(
  athleteId: number,
  fullHistory: boolean
): Promise<string | null> {
  if (fullHistory) {
    return null;
  }

  const latest = await dal.activity.latestStartDate(
    athleteId,
    GARMIN_DATA_SOURCE_NAME
  );
  if (latest === null) {
    return null;
  }
  return shiftDays(latest, -1);
}

export async function pullGarminActivities(
  athleteId: number,
  fullHistory: boolean
): Promise<PullGarminResultDto> {
  const startDate = await searchStartDate(athleteId, fullHistory);
  const activities = await fetchActivities(startDate, tomorrowUtc());

  let inserted = 0;
  let alreadyStored = 0;
  const skippedTypes = new Set<string>();

  for (const activity of activities) {
    const typeKey = activity.activityType.typeKey;
    const sportCode = GARMIN_SPORT_CODE_BY_TYPE_KEY[typeKey];
    if (sportCode === undefined) {
      skippedTypes.add(typeKey);
      continue;
    }

    const wasInserted = await dal.activity.insertImported(
      toImportedActivity(athleteId, sportCode, activity)
    );
    if (wasInserted) {
      inserted += 1;
    } else {
      alreadyStored += 1;
    }
  }

  return {
    fetched: activities.length,
    inserted,
    alreadyStored,
    skippedTypes: [...skippedTypes].sort(),
  };
}
