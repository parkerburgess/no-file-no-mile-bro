import ActivityCard from "@/components/ActivityCard";
import AddEditActivityModal from "@/components/AddEditActivityModal";
import type { ActivityCardDto, ActivityPanelDataDto } from "@/dto";

type Props = {
  data: Promise<ActivityPanelDataDto>;
};

function newestFirst(left: ActivityCardDto, right: ActivityCardDto): number {
  return right.sortKey.localeCompare(left.sortKey);
}

/**
 * Suspends on the page's pull-and-read promise; ActivityPanel shows the
 * spinner until it resolves.
 */
export default async function ActivityPanelBody({ data }: Props) {
  const { activities, formActivities, sportOptions, pullError } = await data;
  const mostRecentFirst = [...activities].sort(newestFirst);

  // #region Tailwind utility consts
  const errorCls = "text-sm text-danger-700";
  const emptyCls =
    "rounded-lg border border-dashed border-neutral-300 p-4 text-sm " +
    "text-neutral-500";
  // #endregion

  return (
    <>
      <AddEditActivityModal
        activities={formActivities}
        sportOptions={sportOptions}
      />

      {pullError !== null && <p className={errorCls}>{pullError}</p>}

      {mostRecentFirst.length === 0 && (
        <p className={emptyCls}>No activities yet.</p>
      )}

      {mostRecentFirst.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </>
  );
}
