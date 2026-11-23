/**
 * The name this application is registered under in the auth service's
 * dbo.AppAccess table, and its subdomain under wanderingparker.com.
 */
export const APP_NAME = "no-file-no-mile";

export const DEFAULT_DISTANCE_UNIT_CODE = "MILE";

export const DEFAULT_TIME_ZONE_ID = "America/Denver";

/**
 * training.Sport codes whose activities read as speed (16.2 mph) rather than
 * pace (9:45 /mi). Every other sport shows pace.
 */
export const SPEED_SPORT_CODES: readonly string[] = ["CYCLE"];

/** training.DataSource.Name for activities pulled from the Garmin API. */
export const GARMIN_DATA_SOURCE_NAME = "Garmin";

/** Garmin Personal API host. The key in GARMIN_API_KEY is exchanged here. */
export const GARMIN_API_BASE_URL = "https://personal.connectapi.garmin.com";

/** Activities requested per page of the activity search. */
export const GARMIN_PAGE_SIZE = 50;

/**
 * Garmin activityType.typeKey → training.Sport.Code. A type missing here is
 * skipped by the pull and named in its result, so a new one shows up rather
 * than landing under the wrong sport.
 */
export const GARMIN_SPORT_CODE_BY_TYPE_KEY: Readonly<Record<string, string>> = {
  running: "RUN",
  treadmill_running: "RUN",
  trail_running: "RUN",
  track_running: "RUN",
  indoor_running: "RUN",
  virtual_run: "RUN",
  cycling: "CYCLE",
  indoor_cycling: "CYCLE",
  road_biking: "CYCLE",
  gravel_cycling: "CYCLE",
  mountain_biking: "CYCLE",
  virtual_ride: "CYCLE",
  strength_training: "STRENGTH",
  walking: "WALK",
  casual_walking: "WALK",
  speed_walking: "WALK",
  hiking: "HIKE",
};

/** How far back a first wellness pull goes, in days including today. */
export const GARMIN_WELLNESS_FIRST_PULL_DAYS = 365;

/**
 * Days re-pulled and overwritten on every wellness pull, counting back from
 * the newest stored day. Garmin keeps filling in recent days — steps add up,
 * sleep is finalised after waking, a watch can sync late.
 */
export const GARMIN_WELLNESS_REPULL_DAYS = 3;

/**
 * The sleep-summaries endpoint rejects a range much over a month (32 days
 * worked, 35 returned 400), so longer pulls ask for it in windows this long.
 */
export const GARMIN_SLEEP_MAX_RANGE_DAYS = 31;

/**
 * Stored wellness days the Daily panel (and its edit modal) shows, newest
 * first. The table holds a year; rendering all of it made the page slow.
 */
export const WELLNESS_PANEL_DAYS = 30;
