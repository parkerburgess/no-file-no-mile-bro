/**
 * Pulls activity data from the Strava API.
 *
 * Credentials come from the environment: a Strava access token only lives for
 * six hours, so the long-lived refresh token is exchanged for a fresh one on
 * every pull rather than storing an access token that would be stale by the
 * next run.
 */

import { dal } from "@/lib/dal";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities";
const STRAVA_ACTIVITY_URL = "https://www.strava.com/api/v3/activities";

/** Activities per request. 200 is the maximum Strava allows. */
const PAGE_SIZE = 200;

/**
 * Total activities to pull, newest first. Strava has no "stop after N"
 * parameter - per_page only sizes each page - so the total is capped here.
 * Set to 0 to pull the full history.
 */
/* Annotated as number, not inferred: the literal type 20 makes the
   MAX_ACTIVITIES === 0 checks below a compile error. */
const MAX_ACTIVITIES: number = 20;

/**
 * How many already-stored activity ids to compare against. Separate from
 * MAX_ACTIVITIES: that bounds what is fetched from Strava, this bounds what is
 * read from the table to recognise it. Both cover the newest activities, so
 * anything Strava returns that is already stored falls inside this window.
 */
const KNOWN_ACTIVITY_LIMIT = 20;

/** Strava returns snake_case; these names mirror the API payload exactly. */
export type StravaActivity = {
  id: number;
  /* The owning athlete, as Strava nests it on every summary activity. */
  athlete: { id: number };
  name: string;
  /* Strava returns both. type is the legacy field, sport_type the current
     one; they agree on every activity seen so far. The raw table stores
     type, matching the column name. */
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  has_heartrate: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  calories?: number;
  trainer: boolean;
  manual: boolean;
};

/**
 * One heart rate zone from Strava's distribution. The top bucket reports its
 * max as -1, meaning "no upper bound".
 */
export type HeartRateZoneBucket = {
  min: number;
  max: number;
  time: number;
};

/**
 * One section of the zones response. Strava returns heartrate, pace and power.
 * Only the heartrate section is stored; the rest are named here so the shape
 * of the response stays documented.
 */
export type ZoneSection = {
  type: string;
  distribution_buckets: HeartRateZoneBucket[];
  score?: number | null;
  sensor_based?: boolean;
  custom_zones?: boolean;
  points?: number;
  resource_state?: number;
};

/** The untouched zones response for one activity, keyed by its Strava id. */
export type ActivityZones = {
  activity_id: number;
  zones: ZoneSection[];
};

type TokenResponse = {
  access_token: string;
  expires_at: number;
  scope: string;
};

/**
 * Listing activities needs activity:read or activity:read_all. The refresh
 * token shown on strava.com/settings/api only grants "read", which is enough
 * for the profile and nothing else, so the scope is checked up front rather
 * than left to surface as an opaque 401 from the activities call.
 */
const REQUIRED_SCOPE = "activity:read";

/**
 * Strava puts the real reason in the response body: a bare 401 says nothing,
 * while the body names the missing scope. Always report both.
 */
async function describeFailure(response: Response): Promise<string> {
  const body = await response.text();
  return `${response.status} ${response.statusText} - ${body}`;
}

function readCredentials(): {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
} {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;

  if (
    clientId === undefined ||
    clientSecret === undefined ||
    refreshToken === undefined
  ) {
    throw new Error(
      "STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET and STRAVA_REFRESH_TOKEN " +
        "must all be set in .env.local."
    );
  }

  return { clientId, clientSecret, refreshToken };
}

async function fetchAccessToken(): Promise<string> {
  const { clientId, clientSecret, refreshToken } = readCredentials();

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    throw new Error(`Strava token refresh failed: ${await describeFailure(response)}`);
  }

  const token = (await response.json()) as TokenResponse;

  if (!token.scope.includes(REQUIRED_SCOPE)) {
    throw new Error(
      `This Strava refresh token only grants "${token.scope}". Listing ` +
        "activities needs activity:read_all - re-authorize the app with that " +
        "scope and replace STRAVA_REFRESH_TOKEN in .env.local."
    );
  }

  return token.access_token;
}

async function fetchActivityPage(
  accessToken: string,
  page: number
): Promise<StravaActivity[]> {
  const url = `${STRAVA_ACTIVITIES_URL}?per_page=${PAGE_SIZE}&page=${page}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(
      `Strava activities request failed on page ${page}: ` +
        `${await describeFailure(response)}`
    );
  }

  return (await response.json()) as StravaActivity[];
}

/**
 * Zone distribution is not on the activity list - it needs one request per
 * activity. The response is returned exactly as Strava sends it. A failure
 * yields undefined rather than throwing, so one bad activity does not cost
 * the whole pull.
 */
async function fetchActivityZones(
  accessToken: string,
  activityId: number
): Promise<ZoneSection[] | undefined> {
  const url = `${STRAVA_ACTIVITY_URL}/${activityId}/zones`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    return undefined;
  }

  return (await response.json()) as ZoneSection[];
}

/** Both halves of an incremental pull, covering only the new activities. */
export type StravaPullResult = {
  activities: StravaActivity[];
  zones: ActivityZones[];
};

async function fetchNewestActivities(
  accessToken: string
): Promise<StravaActivity[]> {
  const activities: StravaActivity[] = [];

  let page = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const pageActivities = await fetchActivityPage(accessToken, page);
    activities.push(...pageActivities);

    hasMorePages =
      pageActivities.length === PAGE_SIZE &&
      (MAX_ACTIVITIES === 0 || activities.length < MAX_ACTIVITIES);
    page += 1;
  }

  return MAX_ACTIVITIES === 0
    ? activities
    : activities.slice(0, MAX_ACTIVITIES);
}

/**
 * Requests are made one at a time rather than in parallel: this is one request
 * per activity, and pacing them keeps the pull inside Strava's limit of 100
 * reads per 15 minutes. An activity recorded without heart rate is skipped
 * without a request, since its zones would carry no heartrate section.
 */
async function collectActivityZones(
  accessToken: string,
  activities: StravaActivity[]
): Promise<ActivityZones[]> {
  const collected: ActivityZones[] = [];

  for (const activity of activities) {
    if (!activity.has_heartrate) {
      continue;
    }

    const zones = await fetchActivityZones(accessToken, activity.id);
    if (zones === undefined) {
      continue;
    }

    collected.push({ activity_id: activity.id, zones });
  }

  return collected;
}

/**
 * Incremental pull. Reads the activity ids already stored, fetches the newest
 * activities from Strava, drops the ones already present, and asks for zone
 * data only for what is left.
 *
 * The cost is one request when nothing new has been recorded, rather than a
 * request per activity every time. Nothing is written here - the caller saves
 * activities before zones, because the zone rows carry a foreign key to
 * StravaRawActivity.activity_id.
 */
export async function pullNewStravaData(): Promise<StravaPullResult> {
  const accessToken = await fetchAccessToken();
  const knownIds = new Set(
    await dal.strava.getRecentActivityIds(KNOWN_ACTIVITY_LIMIT)
  );

  const newest = await fetchNewestActivities(accessToken);
  const activities = newest.filter((activity) => !knownIds.has(activity.id));

  if (activities.length === 0) {
    return { activities: [], zones: [] };
  }

  const zones = await collectActivityZones(accessToken, activities);
  return { activities, zones };
}
