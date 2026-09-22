import { executeQuery } from "@parkerburgess/wandering-parker-server";
import type {
  DistanceUnitLookupItem,
  ILookupAccess,
  Lookups,
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
      const [sports, workoutTypes, distanceUnits] =
        await Promise.all([
          executeQuery((request) =>
            request.query<SportRow>(`
              SELECT SportId, Code, Name, ShowInNav, SortOrder
              FROM training.Sport
              ORDER BY SortOrder, SportId
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
        workoutTypes: workoutTypes.recordset.map(toWorkoutType),
        distanceUnits: distanceUnits.recordset.map(toDistanceUnit),
      };
    } catch (err) {
      console.error("[DAL] lookups.getAll failed", { err });
      throw err;
    }
  },
};
