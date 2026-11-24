import { requireAthlete } from "@/lib/auth";
import { dal } from "@/lib/dal";
import { getAthleteUnits } from "@/lib/page-data";
import { WELLNESS_PANEL_DAYS } from "@/lib/config";
import { pullGarminWellness } from "@/lib/garmin/wellness";
import { shouldPullFromGarmin } from "@/lib/garmin/recency";
import {
  toWellnessCardDto,
  toWellnessFormDto,
} from "@/lib/hydrate/wellness";
import type { WellnessPanelDataDto } from "@/dto";
import WellnessPanel from "@/components/WellnessPanel";

type Props = {
  children: React.ReactNode;
};

/**
 * A failed pull must not take the layout down: the days already stored are
 * still worth showing, so the failure comes back as a message instead.
 */
async function pullWellnessOrError(
  athleteId: number,
  timeZoneId: string
): Promise<string | null> {
  try {
    await pullGarminWellness(athleteId, timeZoneId);
    return null;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error.";
    return `Garmin pull failed: ${reason}`;
  }
}

/** Null when no pull was due, as well as when the pull succeeded. */
async function pullWellnessIfDue(
  athleteId: number,
  timeZoneId: string
): Promise<string | null> {
  const isDue = await shouldPullFromGarmin(athleteId, timeZoneId);
  if (!isDue) {
    return null;
  }
  return pullWellnessOrError(athleteId, timeZoneId);
}

/**
 * Pulls recent Garmin wellness when today isn't stored yet, then reads and
 * hydrates every stored day. The read waits for the pull so the cards
 * include what it just wrote.
 */
async function loadWellnessPanelData(
  athleteId: number,
  timeZoneId: string
): Promise<WellnessPanelDataDto> {
  const pullError = await pullWellnessIfDue(athleteId, timeZoneId);

  const units = await getAthleteUnits();
  const wellness = await dal.wellness.listDailyWellness(
    athleteId,
    WELLNESS_PANEL_DAYS
  );

  return {
    days: wellness.map((day) => toWellnessCardDto(day, units)),
    formDays: wellness.map(toWellnessFormDto),
    pullError,
  };
}

/**
 * The shell shared by every training view: the wellness column beside the
 * view. Next keeps a layout mounted across navigation between its pages, so
 * moving between views re-renders only the view column — and the wellness
 * pull runs once per full page load, not on every view change.
 */
export default async function TrainingLayout({ children }: Props) {
  const athlete = await requireAthlete();

  // #region Tailwind utility consts
  // The columns' track must be minmax(0,1fr), or they size to content and
  // lose their independent scrolling. justify-center keeps the implicit
  // column track at its content width and centres it, so wide windows get
  // empty space either side rather than stretched columns.
  const mainCls = "grid grid-rows-[minmax(0,1fr)] justify-center min-h-0 p-6";
  // Both tracks are fixed: the wellness column, then the view column. The
  // note sits in its own row across both, so the columns keep the rest of
  // the height for their scrolling.
  const columnsCls =
    "grid grid-cols-[300px_600px] grid-rows-[auto_minmax(0,1fr)] " +
    "gap-x-6 gap-y-4 min-h-0";
  const dataNoteCls =
    "col-span-2 rounded-lg bg-warning-100 px-4 py-2 text-sm text-warning-800";
  const viewCls = "grid content-start gap-3 min-h-0 overflow-y-auto pr-1";
  // #endregion

  // Not awaited on purpose: the panel renders at once and streams its body
  // in when the pull and the read have finished.
  const wellnessData = loadWellnessPanelData(
    athlete.athleteId,
    athlete.timeZoneId
  );

  return (
    <main className={mainCls}>
      <div className={columnsCls}>
        <p className={dataNoteCls}>
          This project is a mix of my data and mock data. All other projects
          keep independent data per user with the guest account filled with
          mock data.
        </p>

        <WellnessPanel data={wellnessData} />

        <section className={viewCls}>{children}</section>
      </div>
    </main>
  );
}
