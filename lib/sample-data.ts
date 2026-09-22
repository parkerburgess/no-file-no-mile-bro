/**
 * PLACEHOLDER DATA — NOT REAL, NOT FROM THE DATABASE.
 *
 * The activity, plan and wellness DAL surfaces do not exist yet, and every
 * transactional table is empty. This module exists so the layout can be
 * designed at realistic density. Delete it once the real DAL lands; the types
 * below deliberately mirror training.DailyWellness, training.Activity and
 * training.TrainingPlanWorkout so that swap is mechanical.
 *
 * Values are stored the way the database stores them — canonical metric,
 * seconds, kilograms — and converted at the UI edge.
 */

export type DailyWellness = {
  recordedOn: string;
  restingHeartRate: number | null;
  heartRateVariabilityMs: number | null;
  sleepDurationSeconds: number | null;
  sleepScore: number | null;
  bodyWeightKilograms: number | null;
  sorenessRating: number | null;
  energyRating: number | null;
  moodRating: number | null;
  isGarminSourced: boolean;
};

export type CompletedActivity = {
  kind: "activity";
  id: number;
  sportName: string;
  environmentName: string;
  startedAt: string;
  durationSeconds: number;
  distanceMeters: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  secondsAboveMafCeiling: number | null;
  perceivedExertion: number | null;
  isPlanned: boolean;
};

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

export const sampleWellness: DailyWellness[] = [
  {
    recordedOn: "2026-09-21",
    restingHeartRate: 48,
    heartRateVariabilityMs: 71,
    sleepDurationSeconds: 27000,
    sleepScore: 84,
    bodyWeightKilograms: 79.4,
    sorenessRating: 3,
    energyRating: 8,
    moodRating: 8,
    isGarminSourced: true,
  },
  {
    recordedOn: "2026-09-20",
    restingHeartRate: 51,
    heartRateVariabilityMs: 63,
    sleepDurationSeconds: 21600,
    sleepScore: 68,
    bodyWeightKilograms: 79.8,
    sorenessRating: 5,
    energyRating: 6,
    moodRating: 7,
    isGarminSourced: true,
  },
  {
    recordedOn: "2026-09-19",
    restingHeartRate: 49,
    heartRateVariabilityMs: 69,
    sleepDurationSeconds: 25200,
    sleepScore: 79,
    bodyWeightKilograms: 79.6,
    sorenessRating: 2,
    energyRating: 7,
    moodRating: 8,
    isGarminSourced: true,
  },
  {
    recordedOn: "2026-09-18",
    restingHeartRate: 47,
    heartRateVariabilityMs: 74,
    sleepDurationSeconds: 28800,
    sleepScore: 88,
    bodyWeightKilograms: 79.5,
    sorenessRating: 2,
    energyRating: 9,
    moodRating: 9,
    isGarminSourced: true,
  },
  {
    recordedOn: "2026-09-17",
    restingHeartRate: 53,
    heartRateVariabilityMs: 58,
    sleepDurationSeconds: 19800,
    sleepScore: 61,
    bodyWeightKilograms: 80.1,
    sorenessRating: 6,
    energyRating: 5,
    moodRating: 6,
    isGarminSourced: false,
  },
  {
    recordedOn: "2026-09-16",
    restingHeartRate: 50,
    heartRateVariabilityMs: 66,
    sleepDurationSeconds: 24300,
    sleepScore: 75,
    bodyWeightKilograms: 79.9,
    sorenessRating: null,
    energyRating: 7,
    moodRating: null,
    isGarminSourced: true,
  },
];

export const sampleTimeline: TimelineItem[] = [
  {
    kind: "planned",
    id: 502,
    sportName: "Run",
    environmentName: "Road",
    workoutTypeName: "Race",
    scheduledDate: "2026-11-14",
    targetDurationSeconds: null,
    targetDistanceMeters: 5000,
    // WorkoutType RACE is the one aerobic-uncapped type, so no MAF ceiling.
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
    kind: "activity",
    id: 412,
    sportName: "Run",
    environmentName: "Treadmill",
    startedAt: "2026-09-21T06:12:00",
    durationSeconds: 2705,
    distanceMeters: 6437,
    averageHeartRate: 134,
    maxHeartRate: 146,
    secondsAboveMafCeiling: 95,
    perceivedExertion: 4,
    isPlanned: true,
  },
  {
    kind: "activity",
    id: 411,
    sportName: "Cycling",
    environmentName: "Stationary",
    startedAt: "2026-09-20T17:40:00",
    durationSeconds: 3600,
    distanceMeters: 24140,
    averageHeartRate: 128,
    maxHeartRate: 141,
    secondsAboveMafCeiling: 0,
    perceivedExertion: 3,
    isPlanned: true,
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
  {
    kind: "activity",
    id: 410,
    sportName: "Run",
    environmentName: "Trail",
    startedAt: "2026-09-18T06:30:00",
    durationSeconds: 3310,
    distanceMeters: 8047,
    averageHeartRate: 137,
    maxHeartRate: 158,
    secondsAboveMafCeiling: 430,
    perceivedExertion: 6,
    isPlanned: false,
  },
  {
    kind: "activity",
    id: 409,
    sportName: "Strength",
    environmentName: "Home",
    startedAt: "2026-09-17T19:05:00",
    durationSeconds: 1800,
    distanceMeters: null,
    averageHeartRate: null,
    maxHeartRate: null,
    secondsAboveMafCeiling: null,
    perceivedExertion: 5,
    isPlanned: true,
  },
  {
    kind: "activity",
    id: 408,
    sportName: "Run",
    environmentName: "Treadmill",
    startedAt: "2026-09-16T06:20:00",
    durationSeconds: 2400,
    distanceMeters: 5632,
    averageHeartRate: 131,
    maxHeartRate: 140,
    secondsAboveMafCeiling: 0,
    perceivedExertion: 4,
    isPlanned: true,
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
