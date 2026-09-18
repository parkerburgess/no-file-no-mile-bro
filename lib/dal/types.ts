import type { IAthleteAccess } from "@/lib/dal/athlete/types";
import type { ILookupAccess } from "@/lib/dal/lookups/types";

/**
 * The data access layer, split by aggregate rather than exposed as one flat
 * interface. The schema is 26 tables; a single interface would not survive it.
 *
 * Adding an aggregate means: a new folder under lib/dal with its own types.ts
 * and sql.ts, one property here, and one line in lib/dal/sql/index.ts. The
 * planned additions are plan, activity, garmin and maf — each waits for the
 * surface that consumes it.
 */
export interface IDataAccess {
  athlete: IAthleteAccess;
  lookups: ILookupAccess;
}
