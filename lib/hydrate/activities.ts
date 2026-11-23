import type { CompletedActivity } from "@/lib/dal";
import type { PlannedRace, PlannedWorkout } from "@/lib/sample-data";
import type {
  CompletedActivityRowDto,
  PlannedRaceDto,
  PlannedWorkoutRowDto,
} from "@/dto";
import { SPEED_SPORT_CODES } from "@/lib/config";
import {
  formatDayLabel,
  formatDuration,
  formatPace,
  formatSpeed,
} from "@/lib/format";
import {
  formatDistanceOrNull,
  formatDurationOrNull,
  stringOrNull,
} from "@/lib/hydrate/units";
import type { UnitDisplay } from "@/lib/hydrate/units";

function overCeilingDuration(seconds: number | null): string | null {
  if (seconds === null || seconds <= 0) {
    return null;
  }
  return formatDuration(seconds);
}

function isSpeedSport(sportCode: string): boolean {
  return SPEED_SPORT_CODES.includes(sportCode);
}

function paceLabel(sportCode: string): string {
  if (isSpeedSport(sportCode)) {
    return "Speed";
  }
  return "Pace";
}

/** Pace for most sports, speed for the ones in SPEED_SPORT_CODES. */
function paceOrNull(
  activity: CompletedActivity,
  units: UnitDisplay
): string | null {
  if (activity.distanceMeters === null || activity.distanceMeters <= 0) {
    return null;
  }
  if (activity.durationSeconds <= 0) {
    return null;
  }

  const distanceUnits = activity.distanceMeters / units.metersPerUnit;
  if (isSpeedSport(activity.sportCode)) {
    return formatSpeed(
      activity.durationSeconds,
      distanceUnits,
      units.speedAbbreviation
    );
  }
  return formatPace(
    activity.durationSeconds,
    distanceUnits,
    units.distanceAbbreviation
  );
}

function sportLabel(workout: PlannedWorkout): string {
  if (workout.environmentName === null) {
    return workout.sportName;
  }
  return `${workout.sportName} · ${workout.environmentName}`;
}

function toPlannedRaceDto(race: PlannedRace | null): PlannedRaceDto | null {
  if (race === null) {
    return null;
  }
  return {
    name: race.name,
    priorityLabel: `${race.priorityCode} · ${race.priorityName}`,
  };
}

export function toCompletedActivityRowDto(
  activity: CompletedActivity,
  units: UnitDisplay
): CompletedActivityRowDto {
  return {
    kind: "activity",
    id: String(activity.id),
    sortKey: activity.startedAt,
    dayLabel: formatDayLabel(activity.startedAt),
    sportName: activity.sportName,
    overCeilingDuration: overCeilingDuration(
      activity.secondsAboveHeartRateCeiling
    ),
    duration: formatDuration(activity.durationSeconds),
    distance: formatDistanceOrNull(activity.distanceMeters, units),
    paceLabel: paceLabel(activity.sportCode),
    pace: paceOrNull(activity, units),
    averageHeartRate: stringOrNull(activity.averageHeartRate),
    maxHeartRate: stringOrNull(activity.maxHeartRate),
  };
}

export function toPlannedWorkoutRowDto(
  workout: PlannedWorkout,
  units: UnitDisplay
): PlannedWorkoutRowDto {
  return {
    kind: "planned",
    id: String(workout.id),
    sortKey: workout.scheduledDate,
    dayLabel: formatDayLabel(workout.scheduledDate),
    sportLabel: sportLabel(workout),
    workoutTypeName: workout.workoutTypeName,
    race: toPlannedRaceDto(workout.race),
    isSkipped: workout.isSkipped,
    targetDuration: formatDurationOrNull(workout.targetDurationSeconds),
    targetDistance: formatDistanceOrNull(workout.targetDistanceMeters, units),
    heartRateCeiling: stringOrNull(workout.heartRateCeiling),
  };
}
