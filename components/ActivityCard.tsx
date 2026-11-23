import { Badge, Card } from "@parkerburgess/wandering-parker-ui";
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

/** A metric on the activity card: small label above its value. */
function CardMetric({ label, value }: { label: string; value: string }) {
  // #region Tailwind utility consts
  const metricCls = "grid gap-0.5";
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

/**
 * A completed activity as a card, matching DailyWellnessCard: the sport and
 * date as the header, then the effort (duration, distance, pace) and the heart
 * rate (average, max) as two rows on a shared three-column grid.
 */
function CompletedCard({ activity }: { activity: CompletedActivityRowDto }) {
  // #region Tailwind utility consts
  const contentCls = "grid gap-4";
  const headerCls = "grid grid-cols-[1fr_auto] items-start gap-4";
  const identityCls = "grid gap-0.5";
  const titleCls = "text-sm font-semibold text-neutral-900";
  const dayCls = "text-xs text-neutral-500";
  // Both metric rows share the grid, so HR avg and max sit under duration
  // and distance; the row divider is a border on the second row's cells.
  const metricsCls = "grid grid-cols-3 gap-x-4";
  const effortRowCls = "col-span-3 grid grid-cols-subgrid pb-3";
  const heartRateRowCls =
    "col-span-3 grid grid-cols-subgrid border-t border-neutral-400 pt-3";
  // #endregion

  return (
    <Card>
      <article className={contentCls}>
        <header className={headerCls}>
          <div className={identityCls}>
            <h3 className={titleCls}>{activity.sportName}</h3>
            <span className={dayCls}>{activity.dayLabel}</span>
          </div>
        </header>

        <div className={metricsCls}>
          <div className={effortRowCls}>
            <CardMetric label="Duration" value={activity.duration} />
            <CardMetric
              label="Distance"
              value={valueOrDash(activity.distance)}
            />
            <CardMetric
              label={activity.paceLabel}
              value={valueOrDash(activity.pace)}
            />
          </div>
          <div className={heartRateRowCls}>
            <CardMetric
              label="HR avg"
              value={valueOrDash(activity.averageHeartRate)}
            />
            <CardMetric
              label="HR max"
              value={valueOrDash(activity.maxHeartRate)}
            />
          </div>
        </div>
      </article>
    </Card>
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

export default function ActivityCard({ item }: Props) {
  if (item.kind === "activity") {
    return <CompletedCard activity={item} />;
  }

  return <PlannedRow workout={item} />;
}
