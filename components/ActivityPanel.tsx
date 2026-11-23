import { Panel } from "@parkerburgess/wandering-parker-ui";
import ActivityCard from "@/components/ActivityCard";
import AddEditActivityModal from "@/components/AddEditActivityModal";
import type { ActivityCardDto, ActivityFormDto } from "@/dto";

type Props = {
  activities: ActivityCardDto[];
  formActivities: ActivityFormDto[];
  sportOptions: string[];
};

function newestFirst(left: ActivityCardDto, right: ActivityCardDto): number {
  return right.sortKey.localeCompare(left.sortKey);
}

export default function ActivityPanel({
  activities,
  formActivities,
  sportOptions,
}: Props) {
  const mostRecentFirst = [...activities].sort(newestFirst);

  // #region Tailwind utility consts
  const emptyCls =
    "rounded-lg border border-dashed border-neutral-300 p-4 text-sm " +
    "text-neutral-500";
  // #endregion

  // The button is in both branches on purpose: with no rows yet it is the only
  // way to add the first one.
  if (mostRecentFirst.length === 0) {
    return (
      <Panel title="Activities">
        <AddEditActivityModal
          activities={formActivities}
          sportOptions={sportOptions}
        />
        <p className={emptyCls}>No activities yet.</p>
      </Panel>
    );
  }

  return (
    <Panel title="Activities">
      <AddEditActivityModal
        activities={formActivities}
        sportOptions={sportOptions}
      />

      {mostRecentFirst.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </Panel>
  );
}
