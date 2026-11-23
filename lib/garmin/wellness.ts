import { dal } from "@/lib/dal";
import type { WellnessDayInput } from "@/lib/dal";
import { fetchAccessToken, garminGet } from "@/lib/garmin/client";
import { shiftDays, splitRange, todayIn } from "@/lib/garmin/dates";
import type { DateRange } from "@/lib/garmin/dates";
import {
  GARMIN_SLEEP_MAX_RANGE_DAYS,
  GARMIN_WELLNESS_FIRST_PULL_DAYS,
  GARMIN_WELLNESS_REPULL_DAYS,
} from "@/lib/config";

/**
 * Pulls daily wellness from the Garmin Personal API into
 * training.DailyWellness, one row per day, reading only the metrics the app
 * shows: steps and step goal, resting and max heart rate, sleep duration and
 * score, and weight.
 *
 * Unlike a finished activity, a day keeps changing — steps add up, and last
 * night's sleep is finalised after waking — so the last few stored days are
 * pulled again and overwritten. A first pull goes back a year. Once today
 * has a row, no pull runs until tomorrow, so Garmin is called at most once a
 * day on page loads.
 */

const DAILY_SUMMARIES_PATH = "/usersummary-service/v2/dailysummaries";
const SLEEP_SUMMARIES_PATH = "/sleep-service/sleep/dailySleepSummariesByDate";
const WEIGHT_RANGE_PATH = "/weight-service/weight/range";

const GRAMS_PER_KILOGRAM = 1000;

// #region Garmin response shapes — only the fields the pull reads

type GarminDailySummary = {
  calendarDate: string;
  movement?: {
    steps?: {
      value?: number | null;
      goal?: number | null;
    };
  };
  heartRate?: {
    restingValue?: number | null;
    maxValue?: number | null;
  };
};

type GarminDailySummariesResponse = {
  data: GarminDailySummary[];
};

type GarminSleepSummary = {
  calendarDate: string;
  sleepTimeSeconds?: number | null;
  sleepScores?: {
    overall?: {
      value?: number | null;
    };
  };
};

type GarminWeightDay = {
  summaryDate: string;
  latestWeight?: {
    /** Grams. */
    weight?: number | null;
  };
};

type GarminWeightRangeResponse = {
  dailyWeightSummaries: GarminWeightDay[];
};

// #endregion

function toRangeQuery(range: DateRange): URLSearchParams {
  return new URLSearchParams({
    startDate: range.startDate,
    endDate: range.endDate,
  });
}

/**
 * Sleep summaries a window at a time, since the endpoint rejects long ranges.
 * One after another rather than all at once, to keep a first pull from
 * firing a dozen requests together.
 */
async function fetchSleepSummaries(
  accessToken: string,
  range: DateRange
): Promise<GarminSleepSummary[]> {
  const summaries: GarminSleepSummary[] = [];
  for (const window of splitRange(range, GARMIN_SLEEP_MAX_RANGE_DAYS)) {
    const page = await garminGet<GarminSleepSummary[]>(
      accessToken,
      SLEEP_SUMMARIES_PATH,
      toRangeQuery(window)
    );
    summaries.push(...page);
  }
  return summaries;
}

/**
 * From a few days before the newest stored day, or a year back for a first
 * pull, through today in the athlete's timezone. Null when today is already
 * stored: the pull is skipped, so today's row keeps the values from the first
 * pull of the day.
 */
async function pullRange(
  athleteId: number,
  timeZoneId: string
): Promise<DateRange | null> {
  const endDate = todayIn(timeZoneId);
  const latest = await dal.wellness.latestDate(athleteId);

  if (latest === endDate) {
    return null;
  }
  if (latest === null) {
    return {
      startDate: shiftDays(endDate, -(GARMIN_WELLNESS_FIRST_PULL_DAYS - 1)),
      endDate,
    };
  }
  return {
    startDate: shiftDays(latest, -(GARMIN_WELLNESS_REPULL_DAYS - 1)),
    endDate,
  };
}

function nullIfMissing(value: number | null | undefined): number | null {
  if (value === undefined) {
    return null;
  }
  return value;
}

/** Two decimals to fit DECIMAL(5,2). */
function kilogramsOrNull(grams: number | null | undefined): number | null {
  if (grams === null || grams === undefined) {
    return null;
  }
  return Math.round((grams / GRAMS_PER_KILOGRAM) * 100) / 100;
}

function emptyDay(athleteId: number, date: string): WellnessDayInput {
  return {
    athleteId,
    date,
    steps: null,
    stepGoal: null,
    restingHeartRate: null,
    maxHeartRate: null,
    sleepDurationSeconds: null,
    sleepScore: null,
    bodyWeightKilograms: null,
  };
}

/** A day Garmin returned with nothing in it (watch not worn) is not stored. */
function hasAnyMetric(day: WellnessDayInput): boolean {
  return [
    day.steps,
    day.stepGoal,
    day.restingHeartRate,
    day.maxHeartRate,
    day.sleepDurationSeconds,
    day.sleepScore,
    day.bodyWeightKilograms,
  ].some((value) => value !== null);
}

async function fetchWellnessDays(
  athleteId: number,
  range: DateRange
): Promise<WellnessDayInput[]> {
  const accessToken = await fetchAccessToken();

  const [summaries, sleeps, weights] = await Promise.all([
    garminGet<GarminDailySummariesResponse>(
      accessToken,
      DAILY_SUMMARIES_PATH,
      toRangeQuery(range)
    ),
    fetchSleepSummaries(accessToken, range),
    garminGet<GarminWeightRangeResponse>(
      accessToken,
      `${WEIGHT_RANGE_PATH}/${range.startDate}/${range.endDate}`,
      new URLSearchParams({ includeAll: "true" })
    ),
  ]);

  const daysByDate = new Map<string, WellnessDayInput>();
  function dayFor(date: string): WellnessDayInput {
    const existing = daysByDate.get(date);
    if (existing !== undefined) {
      return existing;
    }
    const created = emptyDay(athleteId, date);
    daysByDate.set(date, created);
    return created;
  }

  for (const summary of summaries.data) {
    const day = dayFor(summary.calendarDate);
    day.steps = nullIfMissing(summary.movement?.steps?.value);
    day.stepGoal = nullIfMissing(summary.movement?.steps?.goal);
    day.restingHeartRate = nullIfMissing(summary.heartRate?.restingValue);
    day.maxHeartRate = nullIfMissing(summary.heartRate?.maxValue);
  }

  for (const sleep of sleeps) {
    const day = dayFor(sleep.calendarDate);
    day.sleepDurationSeconds = nullIfMissing(sleep.sleepTimeSeconds);
    day.sleepScore = nullIfMissing(sleep.sleepScores?.overall?.value);
  }

  for (const weight of weights.dailyWeightSummaries) {
    const day = dayFor(weight.summaryDate);
    day.bodyWeightKilograms = kilogramsOrNull(weight.latestWeight?.weight);
  }

  return [...daysByDate.values()].filter(hasAnyMetric);
}

/** Returns how many days were written; 0 when today was already stored. */
export async function pullGarminWellness(
  athleteId: number,
  timeZoneId: string
): Promise<number> {
  const range = await pullRange(athleteId, timeZoneId);
  if (range === null) {
    return 0;
  }

  const days = await fetchWellnessDays(athleteId, range);

  for (const day of days) {
    await dal.wellness.upsertDay(day);
  }
  return days.length;
}
