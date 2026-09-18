/**
 * mssql hands back DATE and DATETIME2 columns as JavaScript Date objects at UTC
 * midnight. The app moves dates around as ISO strings so nothing silently
 * shifts a training day across a timezone boundary on the way to the browser.
 */

export function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function toDateOnlyOrNull(value: Date | null): string | null {
  return value === null ? null : toDateOnly(value);
}

export function toTimestamp(value: Date): string {
  return value.toISOString();
}

export function toTimestampOrNull(value: Date | null): string | null {
  return value === null ? null : toTimestamp(value);
}
