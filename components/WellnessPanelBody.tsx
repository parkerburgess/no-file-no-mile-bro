import AddEditWellnessModal from "@/components/AddEditWellnessModal";
import DailyWellnessCard from "@/components/DailyWellnessCard";
import type { WellnessCardDto, WellnessPanelDataDto } from "@/dto";

type Props = {
  data: Promise<WellnessPanelDataDto>;
};

function newestFirst(left: WellnessCardDto, right: WellnessCardDto): number {
  return right.dateKey.localeCompare(left.dateKey);
}

/**
 * Suspends on the layout's pull-and-read promise; WellnessPanel shows the
 * spinner until it resolves.
 */
export default async function WellnessPanelBody({ data }: Props) {
  const { days, formDays, pullError } = await data;
  const mostRecentFirst = [...days].sort(newestFirst);

  // #region Tailwind utility consts
  const errorCls = "text-sm text-danger-700";
  const emptyCls =
    "rounded-lg border border-dashed border-neutral-300 p-4 text-sm " +
    "text-neutral-500";
  // #endregion

  return (
    <>
      <AddEditWellnessModal days={formDays} />

      {pullError !== null && <p className={errorCls}>{pullError}</p>}

      {mostRecentFirst.length === 0 && (
        <p className={emptyCls}>No wellness entries recorded yet.</p>
      )}

      {mostRecentFirst.map((day) => (
        <DailyWellnessCard key={day.id} wellness={day} />
      ))}
    </>
  );
}
