import { sqlDataAccess } from "@/lib/dal/sql";
import type { IDataAccess } from "@/lib/dal/types";

export const dal: IDataAccess = sqlDataAccess;

export type { Activity, ImportedActivityInput } from "@/lib/dal/activity/types";

export type { CompleteProfileInput } from "@/lib/dal/athlete/types";

export type { DistanceUnitLookupItem } from "@/lib/dal/lookups/types";

export type {
  DailyWellness,
  WellnessDayInput,
} from "@/lib/dal/wellness/types";
