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
