import type { DailyWellness } from "@/lib/dal";
import type { WellnessCardDto, WellnessFormDto } from "@/dto";
import {
  formatCount,
  formatDayLabel,
  formatHoursMinutes,
  formatWeight,
} from "@/lib/format";
import { stringOrNull } from "@/lib/hydrate/units";
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

function hoursMinutesOrNull(seconds: number | null): string | null {
  if (seconds === null) {
    return null;
  }
  return formatHoursMinutes(seconds);
}

function countOrNull(count: number | null): string | null {
  if (count === null) {
    return null;
  }
  return formatCount(count);
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
    steps: countOrNull(wellness.steps),
    stepGoal: countOrNull(wellness.stepGoal),
    restingHeartRate: stringOrNull(wellness.restingHeartRate),
    maxHeartRate: stringOrNull(wellness.maxHeartRate),
    sleepScore: stringOrNull(wellness.sleepScore),
    sleep: hoursMinutesOrNull(wellness.sleepDurationSeconds),
    weight: weightOrNull(wellness.bodyWeightKilograms, units),
  };
}

export function toWellnessFormDto(wellness: DailyWellness): WellnessFormDto {
  return {
    id: String(wellness.id),
    date: wellness.dailyWellnessDate,
    steps: toFieldValue(wellness.steps),
    restingHeartRate: toFieldValue(wellness.restingHeartRate),
    maxHeartRate: toFieldValue(wellness.maxHeartRate),
    sleepMinutes: toMinutesValue(wellness.sleepDurationSeconds),
    sleepScore: toFieldValue(wellness.sleepScore),
    bodyWeightKilograms: toFieldValue(wellness.bodyWeightKilograms),
  };
}
