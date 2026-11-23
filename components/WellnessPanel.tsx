import { Panel } from "@parkerburgess/wandering-parker-ui";
import AddEditWellnessModal from "@/components/AddEditWellnessModal";
import DailyWellnessCard from "@/components/DailyWellnessCard";
import type { WellnessCardDto, WellnessFormDto } from "@/dto";

type Props = {
  days: WellnessCardDto[];
  formDays: WellnessFormDto[];
};

export default function WellnessPanel({ days, formDays }: Props) {
  const mostRecentFirst = [...days].sort((left, right) =>
    right.dateKey.localeCompare(left.dateKey)
  );

  // #region Tailwind utility consts
  const emptyCls =
    "rounded-lg border border-dashed border-neutral-300 p-4 text-sm " +
    "text-neutral-500";
  // #endregion

  // The button is in both branches on purpose: with no rows yet it is the only
  // way to add the first one.
  if (mostRecentFirst.length === 0) {
    return (
      <Panel title="Daily">
        <AddEditWellnessModal days={formDays} />
        <p className={emptyCls}>No wellness entries recorded yet.</p>
      </Panel>
    );
  }

  return (
    <Panel title="Daily">
      <AddEditWellnessModal days={formDays} />

      {mostRecentFirst.map((day) => (
        <DailyWellnessCard key={day.id} wellness={day} />
      ))}
    </Panel>
  );
}
