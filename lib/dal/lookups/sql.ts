import { executeQuery } from "@parkerburgess/wandering-parker-server";
import type {
  DistanceUnitLookupItem,
  ILookupAccess,
  LookupItem,
  Lookups,
  SportEnvironment,
  SportLookupItem,
  WorkoutTypeLookupItem,
} from "@/lib/dal/lookups/types";

type SportRow = {
  SportId: number;
  Code: string;
  Name: string;
  ShowInNav: boolean;
  SortOrder: number;
};

type EnvironmentRow = {
  EnvironmentId: number;
  Code: string;
  Name: string;
};

type SportEnvironmentRow = {
  SportId: number;
  EnvironmentId: number;
};

type WorkoutTypeRow = {
  WorkoutTypeId: number;
  Code: string;
  Name: string;
  IsAerobicCapped: boolean;
};

type DistanceUnitRow = {
  DistanceUnitId: number;
  Code: string;
  Name: string;
  MetersPerUnit: number;
};

function toSport(row: SportRow): SportLookupItem {
  return {
    id: row.SportId,
    code: row.Code,
    name: row.Name,
    showInNav: row.ShowInNav,
    sortOrder: row.SortOrder,
  };
}

function toEnvironment(row: EnvironmentRow): LookupItem {
  return {
    id: row.EnvironmentId,
    code: row.Code,
    name: row.Name,
  };
}

function toSportEnvironment(row: SportEnvironmentRow): SportEnvironment {
  return {
    sportId: row.SportId,
    environmentId: row.EnvironmentId,
  };
}

function toWorkoutType(row: WorkoutTypeRow): WorkoutTypeLookupItem {
  return {
    id: row.WorkoutTypeId,
    code: row.Code,
    name: row.Name,
    isAerobicCapped: row.IsAerobicCapped,
  };
}

function toDistanceUnit(row: DistanceUnitRow): DistanceUnitLookupItem {
  return {
    id: row.DistanceUnitId,
    code: row.Code,
    name: row.Name,
    metersPerUnit: Number(row.MetersPerUnit),
  };
}

export const sqlLookupAccess: ILookupAccess = {
  async getAll(): Promise<Lookups> {
    try {
      const [sports, environments, sportEnvironments, workoutTypes, distanceUnits] =
        await Promise.all([
          executeQuery((request) =>
            request.query<SportRow>(`
              SELECT SportId, Code, Name, ShowInNav, SortOrder
              FROM training.Sport
              ORDER BY SortOrder, SportId
            `)
          ),
          executeQuery((request) =>
            request.query<EnvironmentRow>(`
              SELECT EnvironmentId, Code, Name
              FROM training.Environment
              ORDER BY EnvironmentId
            `)
          ),
          executeQuery((request) =>
            request.query<SportEnvironmentRow>(`
              SELECT SportId, EnvironmentId
              FROM training.sport_environment
              ORDER BY SportId, EnvironmentId
            `)
          ),
          executeQuery((request) =>
            request.query<WorkoutTypeRow>(`
              SELECT WorkoutTypeId, Code, Name, IsAerobicCapped
              FROM training.WorkoutType
              ORDER BY WorkoutTypeId
            `)
          ),
          executeQuery((request) =>
            request.query<DistanceUnitRow>(`
              SELECT DistanceUnitId, Code, Name, MetersPerUnit
              FROM training.DistanceUnit
              ORDER BY DistanceUnitId
            `)
          ),
        ]);

      return {
        sports: sports.recordset.map(toSport),
        environments: environments.recordset.map(toEnvironment),
        sportEnvironments: sportEnvironments.recordset.map(toSportEnvironment),
        workoutTypes: workoutTypes.recordset.map(toWorkoutType),
        distanceUnits: distanceUnits.recordset.map(toDistanceUnit),
      };
    } catch (err) {
      console.error("[DAL] lookups.getAll failed", { err });
      throw err;
    }
  },
};
