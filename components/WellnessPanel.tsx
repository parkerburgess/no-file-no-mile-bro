import { Panel } from "@parkerburgess/wandering-parker-ui";
import DailyWellnessCard from "@/components/DailyWellnessCard";
import type { DailyWellness } from "@/lib/dal";

type Props = {
  days: DailyWellness[];
  useImperial: boolean;
};

export default function WellnessPanel({ days, useImperial }: Props) {
  // The DAL already returns these newest first. Sorting again keeps the panel
  // correct for any caller that does not, since it is a prop and not a query.
  const mostRecentFirst = [...days].sort((left, right) =>
    right.dailyWellnessDate.localeCompare(left.dailyWellnessDate)
  );

  // #region Tailwind utility consts
  const emptyCls =
    "rounded-lg border border-dashed border-neutral-300 p-4 text-sm " +
    "text-neutral-500";
  // #endregion

  if (mostRecentFirst.length === 0) {
    return (
      <Panel title="Daily">
        <p className={emptyCls}>No wellness entries recorded yet.</p>
      </Panel>
    );
  }

  return (
    <Panel title="Daily">
      {mostRecentFirst.map((day) => (
        <DailyWellnessCard
          key={day.id}
          wellness={day}
          useImperial={useImperial}
        />
      ))}
    </Panel>
  );
}
