import { cache } from "react";
import { dal } from "@/lib/dal";
import { todayIn } from "@/lib/garmin/dates";

/**
 * Whether a page load should pull from Garmin at all. Once today's wellness
 * row is stored, the page-load pulls for both wellness and activities are
 * skipped until tomorrow, so Garmin is called on at most one load a day.
 * The Activities panel's pull button goes through /api/garmin/pull and does
 * not ask this.
 *
 * cache()d per request because the layout and the page render at the same
 * time: without it, the wellness pull could store today's row before the
 * activities page asked, and the first load of the day would skip the
 * activity pull. With it, both read one answer, taken before any write.
 */
export const shouldPullFromGarmin = cache(async function shouldPullFromGarmin(
  athleteId: number,
  timeZoneId: string
): Promise<boolean> {
  const latest = await dal.wellness.latestDate(athleteId);
  return latest !== todayIn(timeZoneId);
});
