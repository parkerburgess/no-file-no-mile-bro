import { requireAthlete } from "@/lib/auth";
import { dal } from "@/lib/dal";
import { getAthleteUnits } from "@/lib/page-data";
import {
  toWellnessCardDto,
  toWellnessFormDto,
} from "@/lib/hydrate/wellness";
import WellnessPanel from "@/components/WellnessPanel";
import PullStravaAction from "@/components/PullStravaAction";

type Props = {
  children: React.ReactNode;
};

/**
 * The shell shared by every training view: the Strava pull row, the profile
 * notice, and the wellness column beside the view. Next keeps a layout
 * mounted across navigation between its pages, so moving between views
 * re-renders only the view column.
 */
export default async function TrainingLayout({ children }: Props) {
  const athlete = await requireAthlete();
  const units = await getAthleteUnits();
  const wellness = await dal.wellness.listDailyWellness(athlete.athleteId);

  // #region Tailwind utility consts
  // One track per child: the pull row, then the columns. The columns' track
  // must be the 1fr one, or they size to content and lose their independent
  // scrolling. justify-center keeps the implicit column track at its content
  // width and centres it, so wide windows get empty space either side rather
  // than stretched columns.
  const mainCls =
    "grid grid-rows-[auto_minmax(0,1fr)] justify-center min-h-0 gap-6 p-6";
  // Both tracks are fixed: the wellness column, then the view column.
  const columnsCls = "grid grid-cols-[300px_600px] gap-6 min-h-0";
  const viewCls = "grid content-start gap-3 min-h-0 overflow-y-auto pr-1";
  // #endregion

  return (
    <main className={mainCls}>
      <PullStravaAction />
      <div className={columnsCls}>
        <WellnessPanel
          days={wellness.map((day) => toWellnessCardDto(day, units))}
          formDays={wellness.map(toWellnessFormDto)}
        />

        <section className={viewCls}>{children}</section>
      </div>
    </main>
  );
}
