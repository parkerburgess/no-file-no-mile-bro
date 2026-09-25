import { sqlDataAccess } from "@/lib/dal/sql";
import type { IDataAccess } from "@/lib/dal/types";

export const dal: IDataAccess = sqlDataAccess;

export type {
  SkippedStravaActivity,
  StravaMigrationResult,
} from "@/lib/dal/activity/types";

export type { CompleteProfileInput } from "@/lib/dal/athlete/types";

export type {
  StravaRawActivityInput,
  StravaRawZoneInput,
} from "@/lib/dal/strava/types";
