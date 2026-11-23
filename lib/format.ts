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

/** Hours and zero-padded minutes, e.g. 27900 -> "7:45". */
export function formatHoursMinutes(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

/** Minutes and seconds per distance unit, e.g. "9:45 /mi". */
export function formatPace(
  durationSeconds: number,
  distanceUnits: number,
  unitAbbreviation: string
): string {
  const secondsPerUnit = Math.round(durationSeconds / distanceUnits);
  const minutes = Math.floor(secondsPerUnit / 60);
  const seconds = secondsPerUnit % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} /${unitAbbreviation}`;
}

/** Distance units per hour, e.g. "16.2 mph". */
export function formatSpeed(
  durationSeconds: number,
  distanceUnits: number,
  speedAbbreviation: string
): string {
  const unitsPerHour = distanceUnits / (durationSeconds / 3600);
  return `${unitsPerHour.toFixed(1)} ${speedAbbreviation}`;
}

/** Thousands-separated, e.g. 11482 -> "11,482". */
export function formatCount(count: number): string {
  return count.toLocaleString("en-US");
}

export function distanceUnitAbbreviation(code: string): string {
  return code === "MILE" ? "mi" : "km";
}

export function speedUnitAbbreviation(code: string): string {
  return code === "MILE" ? "mph" : "km/h";
}
