import { sqlActivityAccess } from "@/lib/dal/activity/sql";
import { sqlAthleteAccess } from "@/lib/dal/athlete/sql";
import { sqlLookupAccess } from "@/lib/dal/lookups/sql";
import { sqlStravaAccess } from "@/lib/dal/strava/sql";
import { sqlWellnessAccess } from "@/lib/dal/wellness/sql";
import type { IDataAccess } from "@/lib/dal/types";

export const sqlDataAccess: IDataAccess = {
  activity: sqlActivityAccess,
  athlete: sqlAthleteAccess,
  lookups: sqlLookupAccess,
  strava: sqlStravaAccess,
  wellness: sqlWellnessAccess,
};
