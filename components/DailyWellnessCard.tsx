import { Fragment } from "react";
import { Card } from "@parkerburgess/wandering-parker-ui";
import type { WellnessCardDto } from "@/dto";

type Props = {
  wellness: WellnessCardDto;
};

/**
 * One card row: a label and up to two values. `second` is null for a
 * single-value row (weight), whose value then spans both value columns.
 */
type WellnessRow = {
  label: string;
  first: string;
  second: string | null;
};

/** Every column on the row is nullable, so every value can read as absent. */
const EMPTY_VALUE = "—";

function valueOrDash(value: string | null): string {
  if (value === null) {
    return EMPTY_VALUE;
  }
  return value;
}

export default function DailyWellnessCard({ wellness }: Props) {
  const rows: WellnessRow[] = [
    {
      label: "Steps / goal",
      first: valueOrDash(wellness.steps),
      second: valueOrDash(wellness.stepGoal),
    },
    {
      label: "HR rest / max",
      first: valueOrDash(wellness.restingHeartRate),
      second: valueOrDash(wellness.maxHeartRate),
    },
    {
      label: "Sleep score / dur",
      first: valueOrDash(wellness.sleepScore),
      second: valueOrDash(wellness.sleep),
    },
    {
      label: "Weight",
      first: valueOrDash(wellness.weight),
      second: null,
    },
  ];

  // #region Tailwind utility consts
  const contentCls = "grid gap-4";
  const dayCls = "text-sm font-semibold text-neutral-900";
  // Label, first value, second value. The cells stay stretched rather than
  // justify-self'd, so each row's border runs unbroken across all three; the
  // gap between the value columns is padding for the same reason. The shared
  // leading keeps the cells the same height, which keeps the line continuous.
  const listCls = "grid grid-cols-[1fr_auto_auto]";
  const labelCls =
    "border-b border-neutral-400 py-1.5 pr-4 text-left text-xs leading-5 " +
    "text-neutral-500";
  const valueBaseCls =
    "border-b border-neutral-400 py-1.5 text-right text-sm leading-5 " +
    "font-medium text-neutral-900 tabular-nums";
  const secondValueCls = `${valueBaseCls} pl-4`;
  // #endregion

  function firstValueCls(row: WellnessRow): string {
    if (row.second === null) {
      return `${valueBaseCls} col-span-2`;
    }
    return valueBaseCls;
  }

  return (
    <Card>
      <div className={contentCls}>
        <h3 className={dayCls}>{wellness.dayLabel}</h3>

        <dl className={listCls}>
          {rows.map((row) => (
            <Fragment key={row.label}>
              <dt className={labelCls}>{row.label}</dt>
              <dd className={firstValueCls(row)}>{row.first}</dd>
              {row.second !== null && (
                <dd className={secondValueCls}>{row.second}</dd>
              )}
            </Fragment>
          ))}
        </dl>
      </div>
    </Card>
  );
}
