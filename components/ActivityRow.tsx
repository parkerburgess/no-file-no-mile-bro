import { Badge } from "@parkerburgess/wandering-parker-ui";
import type {
  CompletedActivity,
  PlannedWorkout,
  TimelineItem,
} from "@/lib/sample-data";
import {
  formatDayLabel,
  formatDistance,
  formatDuration,
  formatTimeOfDay,
} from "@/lib/format";

type Props = {
  item: TimelineItem;
  metersPerUnit: number;
  unitAbbreviation: string;
};

function Metric({ label, value }: { label: string; value: string }) {
  // #region Tailwind utility consts
  const metricCls = "grid gap-0.5 justify-items-end";
  const labelCls = "text-xs text-neutral-500";
  const valueCls = "text-sm font-medium text-neutral-900 tabular-nums";
  // #endregion

  return (
    <div className={metricCls}>
      <span className={labelCls}>{label}</span>
      <span className={valueCls}>{value}</span>
    </div>
  );
}

function CompletedRow({
  activity,
  metersPerUnit,
  unitAbbreviation,
}: {
  activity: CompletedActivity;
  metersPerUnit: number;
  unitAbbreviation: string;
}) {
  const isAboveCeiling =
    activity.secondsAboveMafCeiling !== null &&
    activity.secondsAboveMafCeiling > 0;

  // #region Tailwind utility consts
  const rowCls =
    "grid grid-cols-[7rem_1fr_auto] items-center gap-4 rounded-lg " +
    "border border-neutral-200 border-l-4 border-l-primary-600 bg-card p-4";
  const whenCls = "grid gap-0.5";
  const dayCls = "text-sm font-medium text-neutral-900";
  const timeCls = "text-xs text-neutral-500";
  const identityCls = "grid gap-1.5";
  const titleCls = "text-sm font-semibold text-neutral-900";
  const tagsCls = "flex flex-wrap gap-1.5";
  const metricsCls = "grid grid-flow-col auto-cols-max gap-5";
  // #endregion

  return (
    <article className={rowCls}>
      <div className={whenCls}>
        <span className={dayCls}>{formatDayLabel(activity.startedAt)}</span>
        <span className={timeCls}>{formatTimeOfDay(activity.startedAt)}</span>
      </div>

      <div className={identityCls}>
        <span className={titleCls}>
          {activity.sportName} · {activity.environmentName}
        </span>
        <span className={tagsCls}>
          {!activity.isPlanned && <Badge color="neutral">Unplanned</Badge>}
          {isAboveCeiling && (
            <Badge color="warning">
              {formatDuration(activity.secondsAboveMafCeiling ?? 0)} over MAF
            </Badge>
          )}
        </span>
      </div>

      <div className={metricsCls}>
        <Metric label="Time" value={formatDuration(activity.durationSeconds)} />
        <Metric
          label="Distance"
          value={
            activity.distanceMeters === null
              ? "—"
              : formatDistance(
                  activity.distanceMeters,
                  metersPerUnit,
                  unitAbbreviation
                )
          }
        />
        <Metric
          label="Avg HR"
          value={
            activity.averageHeartRate === null
              ? "—"
              : `${activity.averageHeartRate}`
          }
        />
      </div>
    </article>
  );
}

function PlannedRow({
  workout,
  metersPerUnit,
  unitAbbreviation,
}: {
  workout: PlannedWorkout;
  metersPerUnit: number;
  unitAbbreviation: string;
}) {
  const race = workout.race;
  const sportLabel =
    workout.environmentName === null
      ? workout.sportName
      : `${workout.sportName} · ${workout.environmentName}`;

  // #region Tailwind utility consts
  const baseRowCls =
    "grid grid-cols-[7rem_1fr_auto] items-center gap-4 rounded-lg p-4";
  // A planned session is provisional, so it reads as an outline. A race is a
  // fixed commitment on a date that will not move, so it reads as solid.
  const plannedRowCls =
    `${baseRowCls} border border-dashed border-neutral-300 ` +
    "border-l-4 border-l-neutral-300 bg-subtle";
  const raceRowCls =
    `${baseRowCls} border border-primary-600 border-l-4 ` +
    "border-l-primary-600 bg-card";
  const whenCls = "grid gap-0.5";
  const dayCls = "text-sm font-medium text-neutral-700";
  const kindCls = "text-xs text-neutral-500";
  const raceKindCls =
    "text-xs font-semibold uppercase tracking-wide text-primary-700";
  const identityCls = "grid gap-1.5";
  const titleCls = "text-sm font-semibold text-neutral-700";
  const raceTitleCls = "text-sm font-semibold text-neutral-900";
  const subtitleCls = "text-xs text-neutral-500";
  const tagsCls = "flex flex-wrap gap-1.5";
  const metricsCls = "grid grid-flow-col auto-cols-max gap-5";
  // #endregion

  return (
    <article className={race === null ? plannedRowCls : raceRowCls}>
      <div className={whenCls}>
        <span className={dayCls}>{formatDayLabel(workout.scheduledDate)}</span>
        <span className={race === null ? kindCls : raceKindCls}>
          {race === null ? "Planned" : "Race"}
        </span>
      </div>

      <div className={identityCls}>
        {race === null ? (
          <span className={titleCls}>{sportLabel}</span>
        ) : (
          <>
            <span className={raceTitleCls}>{race.name}</span>
            <span className={subtitleCls}>{sportLabel}</span>
          </>
        )}
        <span className={tagsCls}>
          {race === null ? (
            <Badge color="neutral">{workout.workoutTypeName}</Badge>
          ) : (
            <Badge color="primary">
              {race.priorityCode} · {race.priorityName}
            </Badge>
          )}
          {workout.isSkipped && <Badge color="danger">Skipped</Badge>}
        </span>
      </div>

      <div className={metricsCls}>
        <Metric
          label="Target"
          value={
            workout.targetDurationSeconds === null
              ? "—"
              : formatDuration(workout.targetDurationSeconds)
          }
        />
        <Metric
          label="Distance"
          value={
            workout.targetDistanceMeters === null
              ? "—"
              : formatDistance(
                  workout.targetDistanceMeters,
                  metersPerUnit,
                  unitAbbreviation
                )
          }
        />
        <Metric
          label="HR cap"
          value={
            workout.heartRateCeiling === null
              ? "—"
              : `${workout.heartRateCeiling}`
          }
        />
      </div>
    </article>
  );
}

export default function ActivityRow({
  item,
  metersPerUnit,
  unitAbbreviation,
}: Props) {
  if (item.kind === "activity") {
    return (
      <CompletedRow
        activity={item}
        metersPerUnit={metersPerUnit}
        unitAbbreviation={unitAbbreviation}
      />
    );
  }

  return (
    <PlannedRow
      workout={item}
      metersPerUnit={metersPerUnit}
      unitAbbreviation={unitAbbreviation}
    />
  );
}
