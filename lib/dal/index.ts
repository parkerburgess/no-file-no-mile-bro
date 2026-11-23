import { isDevBypass } from "@/lib/dev-mode";
import { sqlDataAccess } from "@/lib/dal/sql";
import type { IDataAccess } from "@/lib/dal/types";
import { mockWellnessAccess } from "@/lib/dal/wellness/mock";

/**
 * Under the dev bypass, wellness reads come from in-code mock days so the
 * layout can be seen before the Garmin pull exists. Every other aggregate
 * still reads the database.
 */
function selectDataAccess(): IDataAccess {
  if (isDevBypass()) {
    return { ...sqlDataAccess, wellness: mockWellnessAccess };
  }
  return sqlDataAccess;
}

export const dal: IDataAccess = selectDataAccess();

export type {
  CompletedActivity,
  SkippedStravaActivity,
  StravaMigrationResult,
} from "@/lib/dal/activity/types";

export type { CompleteProfileInput } from "@/lib/dal/athlete/types";

export type { DistanceUnitLookupItem } from "@/lib/dal/lookups/types";

export type {
  StravaRawActivityInput,
  StravaRawZoneInput,
} from "@/lib/dal/strava/types";

export type { DailyWellness } from "@/lib/dal/wellness/types";
