import { Suspense } from "react";
import ActivityPanelBody from "@/components/ActivityPanelBody";
import PullDataButton from "@/components/PullDataButton";
import PullingSpinner from "@/components/PullingSpinner";
import type { ActivityPanelDataDto } from "@/dto";

type Props = {
  data: Promise<ActivityPanelDataDto>;
};

/**
 * The header renders at once; the body waits behind a spinner while the page
 * pulls from Garmin, then streams in.
 *
 * Laid out like the wp-ui Panel (title row, then an independently scrolling
 * body) rather than using it, because Panel takes only a title string and
 * this header also carries the pull button.
 */
export default function ActivityPanel({ data }: Props) {
  // #region Tailwind utility consts
  const panelCls = "grid grid-rows-[auto_1fr] min-h-0 h-full gap-3";
  const headerCls = "grid grid-cols-[1fr_auto] items-center gap-3";
  const titleCls =
    "text-sm font-semibold uppercase tracking-wide text-neutral-500";
  const bodyCls = "grid content-start gap-3 min-h-0 overflow-y-auto pr-1";
  // #endregion

  return (
    <section className={panelCls}>
      <header className={headerCls}>
        <h2 className={titleCls}>Activities</h2>
        <PullDataButton label="Pull activities from Garmin" />
      </header>

      <div className={bodyCls}>
        <Suspense
          fallback={<PullingSpinner label="Pulling activities from Garmin..." />}
        >
          <ActivityPanelBody data={data} />
        </Suspense>
      </div>
    </section>
  );
}
