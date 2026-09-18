import { sqlDataAccess } from "@/lib/dal/sql";
import type { IDataAccess } from "@/lib/dal/types";

export const dal: IDataAccess = sqlDataAccess;

export type { IDataAccess } from "@/lib/dal/types";

export {
  PLACEHOLDER_BIRTH_DATE,
  type Athlete,
  type CompleteProfileInput,
  type IAthleteAccess,
  type ProvisionAthleteInput,
} from "@/lib/dal/athlete/types";

export type {
  DistanceUnitLookupItem,
  ILookupAccess,
  LookupItem,
  Lookups,
  SportEnvironment,
  SportLookupItem,
  WorkoutTypeLookupItem,
} from "@/lib/dal/lookups/types";
