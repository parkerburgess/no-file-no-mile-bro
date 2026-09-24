import { sqlAthleteAccess } from "@/lib/dal/athlete/sql";
import { sqlLookupAccess } from "@/lib/dal/lookups/sql";
import { sqlStravaAccess } from "@/lib/dal/strava/sql";
import type { IDataAccess } from "@/lib/dal/types";

export const sqlDataAccess: IDataAccess = {
  athlete: sqlAthleteAccess,
  lookups: sqlLookupAccess,
  strava: sqlStravaAccess,
};
