import { requireAthlete } from "@/lib/auth";
import { dal } from "@/lib/dal";
import { distanceUnitAbbreviation } from "@/lib/format";
import { sampleTimeline, sampleWellness } from "@/lib/sample-data";
import WellnessPanel from "@/components/WellnessPanel";
import ActivityPanel from "@/components/ActivityPanel";
import FriendsPanel from "@/components/FriendsPanel";

export default async function HomePage() {
  const athlete = await requireAthlete();
  const lookups = await dal.lookups.getAll();

  // The FK guarantees a match; the fallback only satisfies the type.
  const distanceUnit =
    lookups.distanceUnits.find((unit) => unit.id === athlete.distanceUnitId) ??
    lookups.distanceUnits[0];

  // #region Tailwind utility consts
  // The row track has to be explicit rather than conditional-free: with the
  // notice absent, a single child would land in the auto row and never fill
  // the viewport, which breaks the columns' independent scrolling.
  const mainWithNoticeCls =
    "grid grid-rows-[auto_minmax(0,1fr)] min-h-0 gap-6 p-6";
  const mainCls = "grid grid-rows-[minmax(0,1fr)] min-h-0 gap-6 p-6";
  const noticeCls =
    "rounded-lg border border-warning-400 bg-warning-50 px-6 py-4 text-sm " +
    "text-neutral-800";
  const columnsCls =
    "grid grid-cols-[240px_minmax(0,1fr)_240px] gap-6 min-h-0";
  // #endregion

  return (
    <main className={athlete.isProfileComplete ? mainCls : mainWithNoticeCls}>
      {!athlete.isProfileComplete && (
        <p className={noticeCls}>
          Your profile is not complete. Birth date is still a placeholder, so
          the MAF heart rate ceiling cannot be calculated yet.
        </p>
      )}

      <div className={columnsCls}>
        <WellnessPanel
          days={sampleWellness}
          useImperial={distanceUnit.code === "MILE"}
        />

        <ActivityPanel
          items={sampleTimeline}
          metersPerUnit={distanceUnit.metersPerUnit}
          unitAbbreviation={distanceUnitAbbreviation(distanceUnit.code)}
        />

        <FriendsPanel />
      </div>
    </main>
  );
}
