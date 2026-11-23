import ActivityCard from "@/components/ActivityCard";
import type { ActivityTimelineItemDto } from "@/dto";

type Props = {
  items: ActivityTimelineItemDto[];
};

/**
 * Planned workouts carry only a date, so they sort to the end of their day —
 * a workout still to be done belongs above the ones already completed that
 * same day.
 */
function sortKey(item: ActivityTimelineItemDto): string {
  if (item.kind === "activity") {
    return item.sortKey;
  }
  return `${item.sortKey}T23:59:59`;
}

export default function ActivityPanel({ items }: Props) {
  const mostRecentFirst = [...items].sort((left, right) =>
    sortKey(right).localeCompare(sortKey(left))
  );

  // #region Tailwind utility consts
  const emptyCls =
    "rounded-lg border border-dashed border-neutral-300 p-6 text-sm " +
    "text-neutral-500";
  // #endregion

  if (mostRecentFirst.length === 0) {
    return (
      <p className={emptyCls}>No activities or planned workouts yet.</p>
    );
  }

  return (
    <>
      {mostRecentFirst.map((item) => (
        <ActivityCard key={`${item.kind}-${item.id}`} item={item} />
      ))}
    </>
  );
}
