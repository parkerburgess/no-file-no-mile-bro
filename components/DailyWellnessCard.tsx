import { Fragment } from "react";
import { Card } from "@parkerburgess/wandering-parker-ui";
import type { DailyWellness } from "@/lib/sample-data";
import { formatDayLabel, formatDuration, formatWeight } from "@/lib/format";

type Props = {
  wellness: DailyWellness;
  useImperial: boolean;
};

function numberOrDash(value: number | null, suffix: string = ""): string {
  if (value === null) {
    return "—";
  }
  return `${value}${suffix}`;
}

export default function DailyWellnessCard({ wellness, useImperial }: Props) {
  const rows = [
    {
      label: "Resting HR",
      value: numberOrDash(wellness.restingHeartRate),
    },
    {
      label: "HRV",
      value: numberOrDash(wellness.heartRateVariabilityMs, " ms"),
    },
    {
      label: "Sleep",
      value:
        wellness.sleepDurationSeconds === null
          ? "—"
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
          ? "—"
          : formatWeight(wellness.bodyWeightKilograms, useImperial),
    },
    {
      label: "Energy",
      value: numberOrDash(wellness.energyRating, "/10"),
    },
    {
      label: "Soreness",
      value: numberOrDash(wellness.sorenessRating, "/10"),
    },
    {
      label: "Mood",
      value: numberOrDash(wellness.moodRating, "/10"),
    },
  ];

  // #region Tailwind utility consts
  const contentCls = "grid gap-4";
  const headerCls = "grid grid-cols-[1fr_auto] items-baseline gap-2";
  const dayCls = "text-sm font-semibold text-neutral-900";
  const sourceCls = "text-xs text-neutral-400";
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
        <header className={headerCls}>
          <h3 className={dayCls}>{formatDayLabel(wellness.recordedOn)}</h3>
          {wellness.isGarminSourced && <span className={sourceCls}>Garmin</span>}
        </header>

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
