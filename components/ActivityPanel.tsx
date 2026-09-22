import ActivityRow from "@/components/ActivityRow";
import type { TimelineItem } from "@/lib/sample-data";

type Props = {
  items: TimelineItem[];
  metersPerUnit: number;
  unitAbbreviation: string;
};

/**
 * Planned workouts carry only a date, so they sort to the end of their day —
 * a workout still to be done belongs above the ones already completed that
 * same day.
 */
function sortKey(item: TimelineItem): string {
  if (item.kind === "activity") {
    return item.startedAt;
  }
  return `${item.scheduledDate}T23:59:59`;
}

export default function ActivityPanel({
  items,
  metersPerUnit,
  unitAbbreviation,
}: Props) {
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
        <ActivityRow
          key={`${item.kind}-${item.id}`}
          item={item}
          metersPerUnit={metersPerUnit}
          unitAbbreviation={unitAbbreviation}
        />
      ))}
    </>
  );
}
