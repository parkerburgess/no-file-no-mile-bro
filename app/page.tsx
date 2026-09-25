import { requireAthlete } from "@/lib/auth";
import { dal } from "@/lib/dal";
import { distanceUnitAbbreviation } from "@/lib/format";
import { parseTabId } from "@/lib/tabs";
import type { TabId } from "@/lib/tabs";
import { samplePlannedWorkouts, sampleRaces } from "@/lib/sample-data";
import type { CompletedActivity } from "@/lib/dal";
import WellnessPanel from "@/components/WellnessPanel";
import TabbedPanel from "@/components/TabbedPanel";
import ActivityPanel from "@/components/ActivityPanel";
import RacePanel from "@/components/RacePanel";
import PlaceholderPanel from "@/components/PlaceholderPanel";
import FriendsPanel from "@/components/FriendsPanel";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Only the active tab's panel is built, so a tab whose data is expensive costs
 * nothing until someone opens it.
 */
function activeTabContent(
  activeTabId: TabId,
  today: string,
  metersPerUnit: number,
  unitAbbreviation: string,
  activities: CompletedActivity[]
): React.ReactNode {
  switch (activeTabId) {
    case "activities":
      return (
        <ActivityPanel
          items={[...activities, ...samplePlannedWorkouts]}
          metersPerUnit={metersPerUnit}
          unitAbbreviation={unitAbbreviation}
        />
      );

    case "races":
      return (
        <RacePanel
          races={sampleRaces}
          today={today}
          metersPerUnit={metersPerUnit}
          unitAbbreviation={unitAbbreviation}
        />
      );

    case "planning":
      return (
        <PlaceholderPanel
          headline="Planning is not built yet"
          detail={
            "This is where a plan gets created — generated from a template " +
            "or assembled by hand — and where an existing plan is opened and " +
            "edited week by week. It waits on lib/dal/plan."
          }
        />
      );

    case "analysis":
      return (
        <PlaceholderPanel
          headline="Analysis is not built yet"
          detail={
            "Charts and tables over time: aerobic drift, time under the " +
            "heart rate ceiling, weekly volume against the plan. It waits on " +
            "a charting library, which has not been chosen."
          }
        />
      );

    case "goals":
      return (
        <PlaceholderPanel
          headline="Goals are not modeled yet"
          detail={
            "There is no goal table in the schema — this tab is a " +
            "placeholder for one. Races already carry a goal time, so " +
            "whatever lands here has to be something a race is not."
          }
        />
      );
  }
}

/**
 * Only the activities tab reads them, and only the active tab's panel is
 * built, so the query is skipped entirely on every other tab.
 */
async function loadActivities(
  activeTabId: TabId,
  athleteId: number
): Promise<CompletedActivity[]> {
  if (activeTabId !== "activities") {
    return [];
  }

  return dal.activity.listActivities(athleteId);
}

export default async function HomePage({ searchParams }: Props) {
  const athlete = await requireAthlete();
  const lookups = await dal.lookups.getAll();
  const activeTabId = parseTabId((await searchParams).tab);
  const activities = await loadActivities(activeTabId, athlete.athleteId);
  // The wellness column is outside the tabs, so it is read on every render
  // rather than gated on the active tab the way activities are.
  const wellness = await dal.wellness.listDailyWellness(athlete.athleteId);

  // Ordering races into upcoming and past is a server-side decision, so this
  // never reaches the client and cannot disagree with a client clock.
  const today = new Date().toISOString().slice(0, 10);

  // The Select in the wellness form takes plain option strings, so the
  // lookup is flattened to its names here rather than in the client bundle.
  const healthRatingNames = lookups.perceivedHealthRatings.map(
    (rating) => rating.name
  );

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
  // The third track is `auto`, not a fixed width: FriendsPanel collapses to a
  // rail, and the timeline is what should get the width back when it does.
  const columnsCls =
    "grid grid-cols-[240px_minmax(0,1fr)_auto] gap-6 min-h-0";
  // #endregion

  return (
    <main className={athlete.isProfileComplete ? mainCls : mainWithNoticeCls}>
      {!athlete.isProfileComplete && (
        <p className={noticeCls}>
          Your profile is not complete. Birth date is still a placeholder, so
          the heart rate ceiling cannot be calculated yet.
        </p>
      )}

      <div className={columnsCls}>
        <WellnessPanel
          days={wellness}
          healthRatingNames={healthRatingNames}
          useImperial={distanceUnit.code === "MILE"}
        />

        <TabbedPanel activeTabId={activeTabId}>
          {activeTabContent(
            activeTabId,
            today,
            distanceUnit.metersPerUnit,
            distanceUnitAbbreviation(distanceUnit.code),
            activities
          )}
        </TabbedPanel>

        <FriendsPanel />
      </div>
    </main>
  );
}
