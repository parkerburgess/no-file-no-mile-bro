/**
 * PLACEHOLDER DATA — NOT REAL, NOT FROM THE DATABASE.
 *
 * Completed activities and wellness days are no longer here: they come from
 * training.Activity and training.DailyWellness through lib/dal/activity and
 * lib/dal/wellness. What is left waits on the plan DAL, which does not exist
 * yet, so the layout can still be designed at realistic density. The types
 * below deliberately mirror training.TrainingPlanWorkout and training.Race so
 * each swap is mechanical.
 *
 * Values are stored the way the database stores them — canonical metric,
 * seconds, kilograms — and converted at the UI edge.
 */

import type { CompletedActivity } from "@/lib/dal";

/**
 * A race is not a separate kind of row — the schema models it as an ordinary
 * TrainingPlanWorkout whose WorkoutType is RACE, joined to a Race record
 * through trainingplan_race. This carries that joined record when there is
 * one.
 */
export type PlannedRace = {
  name: string;
  priorityCode: "A" | "B" | "C";
  priorityName: string;
};

export type PlannedWorkout = {
  kind: "planned";
  id: number;
  sportName: string;
  environmentName: string | null;
  workoutTypeName: string;
  scheduledDate: string;
  targetDurationSeconds: number | null;
  targetDistanceMeters: number | null;
  heartRateCeiling: number | null;
  isAerobicCapped: boolean;
  isSkipped: boolean;
  race: PlannedRace | null;
};

export type TimelineItem = CompletedActivity | PlannedWorkout;

/* The timeline mixes a real table with placeholder rows, which is the whole
   reason CompletedActivity is imported rather than declared here. */

/**
 * Planned workouts only. The completed side of the timeline is read from
 * training.Activity, so these are the rows that still have no table behind
 * them.
 */
export const samplePlannedWorkouts: PlannedWorkout[] = [
  {
    kind: "planned",
    id: 502,
    sportName: "Run",
    environmentName: "Road",
    workoutTypeName: "Race",
    scheduledDate: "2026-11-14",
    targetDurationSeconds: null,
    targetDistanceMeters: 5000,
    // WorkoutType RACE is the one aerobic-uncapped type, so no HR ceiling.
    heartRateCeiling: null,
    isAerobicCapped: false,
    isSkipped: false,
    race: {
      name: "Harvest Hustle 5K",
      priorityCode: "B",
      priorityName: "Tune-up",
    },
  },
  {
    kind: "planned",
    id: 501,
    sportName: "Run",
    environmentName: "Road",
    workoutTypeName: "Long Aerobic",
    scheduledDate: "2026-09-23",
    targetDurationSeconds: 5400,
    targetDistanceMeters: 16093,
    heartRateCeiling: 139,
    isAerobicCapped: true,
    isSkipped: false,
    race: null,
  },
  {
    kind: "planned",
    id: 500,
    sportName: "Cycling",
    environmentName: "Stationary",
    workoutTypeName: "Cross Training",
    scheduledDate: "2026-09-22",
    targetDurationSeconds: 2700,
    targetDistanceMeters: null,
    heartRateCeiling: 139,
    isAerobicCapped: true,
    isSkipped: false,
    race: null,
  },
  {
    kind: "planned",
    id: 499,
    sportName: "Run",
    environmentName: "Road",
    workoutTypeName: "Aerobic Base",
    scheduledDate: "2026-09-19",
    targetDurationSeconds: 2400,
    targetDistanceMeters: null,
    heartRateCeiling: 139,
    isAerobicCapped: true,
    isSkipped: true,
    race: null,
  },
];

/**
 * A race the athlete is tracking, mirroring training.Race.
 *
 * `isInPlan` is NOT a column. The schema models plan membership as a
 * training.trainingplan_race row pointing at a TrainingPlan, and many races
 * can belong to one plan at once — the November tune-up and the January goal
 * race sit in the same build. It is flattened onto the race here only because
 * there is no plan DAL to join through yet; when lib/dal/plan lands, this
 * becomes a join and the toggle becomes an insert or delete of a junction
 * row. The junction's IsGoalRace flag is deliberately not surfaced yet.
 */
export type TrackedRace = {
  id: number;
  name: string;
  priorityCode: "A" | "B" | "C";
  priorityName: string;
  sportName: string;
  raceDate: string;
  distanceMeters: number;
  goalDurationSeconds: number | null;
  actualDurationSeconds: number | null;
  location: string | null;
  url: string | null;
  notes: string | null;
  isInPlan: boolean;
};

export const sampleRaces: TrackedRace[] = [
  {
    id: 12,
    name: "Harvest Hustle 5K",
    priorityCode: "B",
    priorityName: "Tune-up",
    sportName: "Run",
    raceDate: "2026-11-14",
    distanceMeters: 5000,
    goalDurationSeconds: 1500,
    actualDurationSeconds: null,
    location: "Riverside Park",
    url: "https://example.com/harvest-hustle-5k",
    notes:
      "Tune-up for the January 25K, not a peak effort. Flat two-loop course " +
      "on crushed gravel. Registration closes the first week of November, " +
      "and the shirt is only guaranteed if you sign up before then.",
    isInPlan: true,
  },
  {
    id: 13,
    name: "Riverbend Winter 25K",
    priorityCode: "A",
    priorityName: "Goal",
    sportName: "Run",
    raceDate: "2027-01-23",
    distanceMeters: 25000,
    goalDurationSeconds: 8100,
    actualDurationSeconds: null,
    location: "Riverbend Trailhead",
    url: "https://example.com/riverbend-winter-25k",
    notes:
      "The goal race the whole build points at. Rolling trail with roughly " +
      "300 m of climbing, and January weather means the aid stations may be " +
      "thin. Plan to carry.",
    isInPlan: true,
  },
  {
    id: 14,
    name: "Turkey Trot 10K",
    priorityCode: "C",
    priorityName: "Training",
    sportName: "Run",
    raceDate: "2026-11-26",
    distanceMeters: 10000,
    goalDurationSeconds: null,
    actualDurationSeconds: null,
    location: "Town Common",
    url: "https://example.com/turkey-trot-10k",
    notes:
      "Twelve days after the 5K. Only worth adding as an easy aerobic effort " +
      "if the legs came back clean.",
    isInPlan: false,
  },
  {
    id: 15,
    name: "Frostbite Half Marathon",
    priorityCode: "C",
    priorityName: "Training",
    sportName: "Run",
    raceDate: "2026-12-13",
    distanceMeters: 21097,
    goalDurationSeconds: null,
    actualDurationSeconds: null,
    location: null,
    url: "https://example.com/frostbite-half",
    notes: null,
    isInPlan: false,
  },
  {
    id: 11,
    name: "Summer Sunset 5K",
    priorityCode: "C",
    priorityName: "Training",
    sportName: "Run",
    raceDate: "2026-08-15",
    distanceMeters: 5000,
    goalDurationSeconds: 1560,
    actualDurationSeconds: 1588,
    location: "Lakeshore Drive",
    url: null,
    notes: "Went out too hard and paid for it in the last kilometre.",
    isInPlan: false,
  },
];
