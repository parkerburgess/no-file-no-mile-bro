export type LookupItem = {
  id: number;
  code: string;
  name: string;
};

/** Sport drives the data-driven nav, so it carries its own display ordering. */
export type SportLookupItem = LookupItem & {
  showInNav: boolean;
  sortOrder: number;
};

export type WorkoutTypeLookupItem = LookupItem & {
  /** True when the workout must be held at or below the MAF ceiling. */
  isAerobicCapped: boolean;
};

export type DistanceUnitLookupItem = LookupItem & {
  metersPerUnit: number;
};

/** Which environments are legal for which sport. Drives the dependent dropdown. */
export type SportEnvironment = {
  sportId: number;
  environmentId: number;
};

export type Lookups = {
  sports: SportLookupItem[];
  environments: LookupItem[];
  sportEnvironments: SportEnvironment[];
  workoutTypes: WorkoutTypeLookupItem[];
  distanceUnits: DistanceUnitLookupItem[];
};

export interface ILookupAccess {
  /**
   * Every lookup the activity-entry and nav surfaces need, in one round trip.
   * The planning lookups (TrainingPhase, RacePriority, TrainingPlanStatus,
   * HeartRateAdjustmentReason) are deliberately absent until a planning surface
   * exists to consume them.
   */
  getAll(): Promise<Lookups>;
}
