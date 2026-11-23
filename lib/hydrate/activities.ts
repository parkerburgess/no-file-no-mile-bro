import type { Activity } from "@/lib/dal";
import type { ActivityCardDto, ActivityFormDto } from "@/dto";
import { SPEED_SPORT_CODES } from "@/lib/config";
import {
  formatDayLabel,
  formatDuration,
  formatPace,
  formatSpeed,
} from "@/lib/format";
import {
  formatDistanceOrNull,
  stringOrNull,
  toFieldValue,
} from "@/lib/hydrate/units";
import type { UnitDisplay } from "@/lib/hydrate/units";

const SECONDS_PER_MINUTE = 60;

/** "yyyy-MM-ddTHH:mm", the shape a datetime-local input takes. */
const DATETIME_LOCAL_LENGTH = 16;

/**
 * Duration is stored in seconds, but a field asking for 2662 is unusable, so
 * the form works in minutes.
 */
function toMinutesValue(seconds: number): string {
  return String(Math.round(seconds / SECONDS_PER_MINUTE));
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
function paceOrNull(activity: Activity, units: UnitDisplay): string | null {
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

export function toActivityCardDto(
  activity: Activity,
  units: UnitDisplay
): ActivityCardDto {
  return {
    id: String(activity.id),
    sortKey: activity.startedAt,
    dayLabel: formatDayLabel(activity.startedAt),
    sportName: activity.sportName,
    duration: formatDuration(activity.durationSeconds),
    distance: formatDistanceOrNull(activity.distanceMeters, units),
    paceLabel: paceLabel(activity.sportCode),
    pace: paceOrNull(activity, units),
    averageHeartRate: stringOrNull(activity.averageHeartRate),
    maxHeartRate: stringOrNull(activity.maxHeartRate),
  };
}

export function toActivityFormDto(activity: Activity): ActivityFormDto {
  return {
    id: String(activity.id),
    startedAt: activity.startedAt.slice(0, DATETIME_LOCAL_LENGTH),
    sportName: activity.sportName,
    durationMinutes: toMinutesValue(activity.durationSeconds),
    distanceMeters: toFieldValue(activity.distanceMeters),
    averageHeartRate: toFieldValue(activity.averageHeartRate),
    maxHeartRate: toFieldValue(activity.maxHeartRate),
    notes: toFieldValue(activity.name),
  };
}
