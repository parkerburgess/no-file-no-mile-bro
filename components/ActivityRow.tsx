import { Badge } from "@parkerburgess/wandering-parker-ui";
import type {
  ActivityTimelineItemDto,
  CompletedActivityRowDto,
  PlannedWorkoutRowDto,
} from "@/dto";

type Props = {
  item: ActivityTimelineItemDto;
};

const EMPTY_VALUE = "—";

function valueOrDash(value: string | null): string {
  if (value === null) {
    return EMPTY_VALUE;
  }
  return value;
}

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

function CompletedRow({ activity }: { activity: CompletedActivityRowDto }) {
  // #region Tailwind utility consts
  const rowCls =
    "grid grid-cols-[7rem_1fr_auto] items-center gap-4 rounded-lg " +
    "border border-neutral-200 border-l-4 border-l-primary-600 bg-card p-4";
  const whenCls = "grid gap-0.5";
  const dayCls = "text-sm font-medium text-neutral-900";
  const timeCls = "text-xs text-neutral-500";
  const identityCls = "grid gap-1.5";
  const titleCls = "text-sm font-semibold text-neutral-900";
  const subtitleCls = "text-xs text-neutral-500";
  const tagsCls = "flex flex-wrap gap-1.5";
  const metricsCls = "grid grid-flow-col auto-cols-max gap-5";
  // #endregion

  return (
    <article className={rowCls}>
      <div className={whenCls}>
        <span className={dayCls}>{activity.dayLabel}</span>
        <span className={timeCls}>{activity.timeLabel}</span>
      </div>

      <div className={identityCls}>
        <span className={titleCls}>{activity.sportName}</span>
        {/* The name the source gave it, which is the only thing distinguishing
            one afternoon run from the next. Absent on a hand-entered row. */}
        {activity.name !== null && (
          <span className={subtitleCls}>{activity.name}</span>
        )}
        <span className={tagsCls}>
          {activity.overCeilingDuration !== null && (
            <Badge color="warning">
              {activity.overCeilingDuration} over ceiling
            </Badge>
          )}
        </span>
      </div>

      <div className={metricsCls}>
        <Metric label="Time" value={activity.duration} />
        <Metric label="Distance" value={valueOrDash(activity.distance)} />
        <Metric
          label="Avg HR"
          value={valueOrDash(activity.averageHeartRate)}
        />
      </div>
    </article>
  );
}

function PlannedRow({ workout }: { workout: PlannedWorkoutRowDto }) {
  const race = workout.race;

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
        <span className={dayCls}>{workout.dayLabel}</span>
        <span className={race === null ? kindCls : raceKindCls}>
          {race === null ? "Planned" : "Race"}
        </span>
      </div>

      <div className={identityCls}>
        {race === null ? (
          <span className={titleCls}>{workout.sportLabel}</span>
        ) : (
          <>
            <span className={raceTitleCls}>{race.name}</span>
            <span className={subtitleCls}>{workout.sportLabel}</span>
          </>
        )}
        <span className={tagsCls}>
          {race === null ? (
            <Badge color="neutral">{workout.workoutTypeName}</Badge>
          ) : (
            <Badge color="primary">{race.priorityLabel}</Badge>
          )}
          {workout.isSkipped && <Badge color="danger">Skipped</Badge>}
        </span>
      </div>

      <div className={metricsCls}>
        <Metric label="Target" value={valueOrDash(workout.targetDuration)} />
        <Metric
          label="Distance"
          value={valueOrDash(workout.targetDistance)}
        />
        <Metric
          label="HR cap"
          value={valueOrDash(workout.heartRateCeiling)}
        />
      </div>
    </article>
  );
}

export default function ActivityRow({ item }: Props) {
  if (item.kind === "activity") {
    return <CompletedRow activity={item} />;
  }

  return <PlannedRow workout={item} />;
}
