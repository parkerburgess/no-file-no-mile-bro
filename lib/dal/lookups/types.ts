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
  /** True when the workout must be held at or below the heart rate ceiling. */
  isAerobicCapped: boolean;
};

export type DistanceUnitLookupItem = LookupItem & {
  metersPerUnit: number;
};

/**
 * The 1-5 scale behind the name, which is what the ratings sort by — the ids
 * happen to agree today, but the order is a property of the scale.
 */
export type PerceivedHealthRatingLookupItem = LookupItem & {
  rating: number;
};

export type Lookups = {
  sports: SportLookupItem[];
  workoutTypes: WorkoutTypeLookupItem[];
  distanceUnits: DistanceUnitLookupItem[];
  perceivedHealthRatings: PerceivedHealthRatingLookupItem[];
};

export interface ILookupAccess {
  /**
   * Every lookup the activity-entry, wellness-entry and nav surfaces need, in
   * one round trip. The planning lookups (TrainingPhase, RacePriority,
   * TrainingPlanStatus) are deliberately absent until a planning surface
   * exists to consume them.
   */
  getAll(): Promise<Lookups>;
}
