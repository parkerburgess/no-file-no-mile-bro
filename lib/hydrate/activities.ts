import type { CompletedActivity } from "@/lib/dal";
import type { PlannedRace, PlannedWorkout } from "@/lib/sample-data";
import type {
  CompletedActivityRowDto,
  PlannedRaceDto,
  PlannedWorkoutRowDto,
} from "@/dto";
import {
  formatDayLabel,
  formatDuration,
  formatTimeOfDay,
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
    timeLabel: formatTimeOfDay(activity.startedAt),
    sportName: activity.sportName,
    name: activity.name,
    overCeilingDuration: overCeilingDuration(
      activity.secondsAboveHeartRateCeiling
    ),
    duration: formatDuration(activity.durationSeconds),
    distance: formatDistanceOrNull(activity.distanceMeters, units),
    averageHeartRate: stringOrNull(activity.averageHeartRate),
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
