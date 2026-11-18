import type { DailyWellness } from "@/lib/dal";
import type { WellnessCardDto, WellnessFormDto } from "@/dto";
import { formatDayLabel, formatWeight } from "@/lib/format";
import { formatDurationOrNull, stringOrNull } from "@/lib/hydrate/units";
import type { UnitDisplay } from "@/lib/hydrate/units";

const SECONDS_PER_MINUTE = 60;

function weightOrNull(
  kilograms: number | null,
  units: UnitDisplay
): string | null {
  if (kilograms === null) {
    return null;
  }
  return formatWeight(kilograms, units.useImperial);
}

function toFieldValue(value: number | string | null): string {
  if (value === null) {
    return "";
  }
  return String(value);
}

/**
 * Sleep is stored in seconds because that is what the sources report, but a
 * field asking for 27000 is unusable, so the form works in minutes.
 */
function toMinutesValue(seconds: number | null): string {
  if (seconds === null) {
    return "";
  }
  return String(Math.round(seconds / SECONDS_PER_MINUTE));
}

export function toWellnessCardDto(
  wellness: DailyWellness,
  units: UnitDisplay
): WellnessCardDto {
  return {
    id: String(wellness.id),
    dateKey: wellness.dailyWellnessDate,
    dayLabel: formatDayLabel(wellness.dailyWellnessDate),
    restingHeartRate: stringOrNull(wellness.restingHeartRate),
    sleep: formatDurationOrNull(wellness.sleepDurationSeconds),
    sleepScore: stringOrNull(wellness.sleepScore),
    weight: weightOrNull(wellness.bodyWeightKilograms, units),
    health: wellness.perceivedHealthName,
  };
}

export function toWellnessFormDto(wellness: DailyWellness): WellnessFormDto {
  return {
    id: String(wellness.id),
    date: wellness.dailyWellnessDate,
    restingHeartRate: toFieldValue(wellness.restingHeartRate),
    sleepMinutes: toMinutesValue(wellness.sleepDurationSeconds),
    sleepScore: toFieldValue(wellness.sleepScore),
    bodyWeightKilograms: toFieldValue(wellness.bodyWeightKilograms),
    health: toFieldValue(wellness.perceivedHealthName),
    notes: toFieldValue(wellness.notes),
  };
}
