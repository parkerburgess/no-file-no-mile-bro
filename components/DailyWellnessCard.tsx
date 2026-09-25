import { Fragment } from "react";
import { Card } from "@parkerburgess/wandering-parker-ui";
import type { DailyWellness } from "@/lib/dal";
import { formatDayLabel, formatDuration, formatWeight } from "@/lib/format";

type Props = {
  wellness: DailyWellness;
  useImperial: boolean;
};

/** Every column on the row is nullable, so every row can read as absent. */
const EMPTY_VALUE = "—";

function numberOrDash(value: number | null, suffix: string = ""): string {
  if (value === null) {
    return EMPTY_VALUE;
  }
  return `${value}${suffix}`;
}

function textOrDash(value: string | null): string {
  if (value === null) {
    return EMPTY_VALUE;
  }
  return value;
}

export default function DailyWellnessCard({ wellness, useImperial }: Props) {
  const rows = [
    {
      label: "Resting HR",
      value: numberOrDash(wellness.restingHeartRate),
    },
    {
      label: "Sleep",
      value:
        wellness.sleepDurationSeconds === null
          ? EMPTY_VALUE
          : formatDuration(wellness.sleepDurationSeconds),
    },
    {
      label: "Sleep score",
      value: numberOrDash(wellness.sleepScore),
    },
    {
      label: "Weight",
      value:
        wellness.bodyWeightKilograms === null
          ? EMPTY_VALUE
          : formatWeight(wellness.bodyWeightKilograms, useImperial),
    },
    {
      // PerceivedHealthRating carries both a name and a 1-5 rating; the name
      // is what it exists for, so the number stays out of the UI.
      label: "Health",
      value: textOrDash(wellness.perceivedHealthName),
    },
  ];

  // #region Tailwind utility consts
  const contentCls = "grid gap-4";
  const dayCls = "text-sm font-semibold text-neutral-900";
  // The cells stay stretched rather than justify-self'd, so each row's border
  // runs unbroken from the label across to the value. The shared leading keeps
  // the two halves the same height, which is what makes the line continuous.
  const listCls = "grid grid-cols-[1fr_auto]";
  const labelCls =
    "border-b border-neutral-400 py-1.5 pr-4 text-left text-xs leading-5 " +
    "text-neutral-500";
  const valueCls =
    "border-b border-neutral-400 py-1.5 text-right text-sm leading-5 " +
    "font-medium text-neutral-900 tabular-nums";
  // #endregion

  return (
    <Card>
      <div className={contentCls}>
        <h3 className={dayCls}>
          {formatDayLabel(wellness.dailyWellnessDate)}
        </h3>

        <dl className={listCls}>
          {rows.map((row) => (
            <Fragment key={row.label}>
              <dt className={labelCls}>{row.label}</dt>
              <dd className={valueCls}>{row.value}</dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </Card>
  );
}
