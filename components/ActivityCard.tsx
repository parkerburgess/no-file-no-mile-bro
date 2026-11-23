import { Card } from "@parkerburgess/wandering-parker-ui";
import type { ActivityCardDto } from "@/dto";

type Props = {
  activity: ActivityCardDto;
};

const EMPTY_VALUE = "—";

function valueOrDash(value: string | null): string {
  if (value === null) {
    return EMPTY_VALUE;
  }
  return value;
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
 * A completed activity as a card: the sport and date, the effort (duration,
 * distance, pace) and the heart rate (average, max) as three side-by-side
 * columns. Below md they stack, since three columns of metrics will not fit
 * a phone.
 */
export default function ActivityCard({ activity }: Props) {
  // #region Tailwind utility consts
  const contentCls =
    "grid gap-4 md:grid-cols-[1fr_3fr_2fr] md:items-center md:gap-6";
  const identityCls = "grid gap-0.5";
  const titleCls = "text-sm font-semibold text-neutral-900";
  const dayCls = "text-xs text-neutral-500";
  // The column divider is a left border from md up, a top border when stacked.
  const dividerCls =
    "border-t border-neutral-400 pt-4 md:border-t-0 md:border-l " +
    "md:pt-0 md:pl-6";
  const effortColCls = `grid grid-cols-3 gap-4 ${dividerCls}`;
  const heartRateColCls = `grid grid-cols-2 gap-4 ${dividerCls}`;
  // #endregion

  return (
    <Card>
      <article className={contentCls}>
        <header className={identityCls}>
          <h3 className={titleCls}>{activity.sportName}</h3>
          <span className={dayCls}>{activity.dayLabel}</span>
        </header>

        <div className={effortColCls}>
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

        <div className={heartRateColCls}>
          <CardMetric
            label="HR avg"
            value={valueOrDash(activity.averageHeartRate)}
          />
          <CardMetric
            label="HR max"
            value={valueOrDash(activity.maxHeartRate)}
          />
        </div>
      </article>
    </Card>
  );
}
