/**
 * Display formatting for values the database stores canonically — metric
 * distances, seconds, kilograms. Everything here converts at the UI edge.
 *
 * Dates are parsed from their string parts rather than through the Date
 * constructor's local-time parsing, so a server render and a client render
 * cannot disagree about which calendar day a value falls on.
 */

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function parseDateParts(isoDate: string): DateParts {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return { year, month, day };
}

export function formatDayLabel(isoDate: string): string {
  const { year, month, day } = parseDateParts(isoDate);
  const weekday = WEEKDAY_NAMES[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday}, ${MONTH_NAMES[month - 1]} ${day}`;
}

export function formatTimeOfDay(isoDateTime: string): string {
  const [rawHour, minute] = isoDateTime.slice(11, 16).split(":").map(Number);
  const suffix = rawHour < 12 ? "AM" : "PM";
  const hour = rawHour % 12 === 0 ? 12 : rawHour % 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function formatDistance(
  meters: number,
  metersPerUnit: number,
  unitAbbreviation: string
): string {
  return `${(meters / metersPerUnit).toFixed(2)} ${unitAbbreviation}`;
}

/**
 * The schema has no mass-unit preference — only DistanceUnit — so the distance
 * choice stands in for it. An athlete on miles is assumed to want pounds. If
 * that assumption ever needs to break, it needs a real column, not a patch
 * here.
 */
export function formatWeight(kilograms: number, useImperial: boolean): string {
  if (useImperial) {
    return `${(kilograms * 2.20462).toFixed(1)} lb`;
  }
  return `${kilograms.toFixed(1)} kg`;
}

export function distanceUnitAbbreviation(code: string): string {
  return code === "MILE" ? "mi" : "km";
}
