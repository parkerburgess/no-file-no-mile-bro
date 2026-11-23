/** Calendar-day helpers for Garmin's "yyyy-MM-dd" date parameters. */

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_LENGTH = 10;

export function shiftDays(isoDate: string, days: number): string {
  const shifted = new Date(
    Date.parse(`${isoDate}T00:00:00Z`) + days * MILLISECONDS_PER_DAY
  );
  return shifted.toISOString().slice(0, ISO_DATE_LENGTH);
}

/** Today's date in the given IANA timezone. en-CA formats as yyyy-MM-dd. */
export function todayIn(timeZoneId: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZoneId,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Tomorrow in UTC, so "today" is covered in every timezone. */
export function tomorrowUtc(): string {
  const today = new Date().toISOString().slice(0, ISO_DATE_LENGTH);
  return shiftDays(today, 1);
}

export type DateRange = {
  startDate: string;
  endDate: string;
};

/** Splits an inclusive range into consecutive windows of at most maxDays. */
export function splitRange(range: DateRange, maxDays: number): DateRange[] {
  const windows: DateRange[] = [];
  let windowStart = range.startDate;

  while (windowStart <= range.endDate) {
    const furthestEnd = shiftDays(windowStart, maxDays - 1);
    const windowEnd =
      furthestEnd < range.endDate ? furthestEnd : range.endDate;
    windows.push({ startDate: windowStart, endDate: windowEnd });
    windowStart = shiftDays(windowEnd, 1);
  }
  return windows;
}
