import { Suspense } from "react";
import { Panel } from "@parkerburgess/wandering-parker-ui";
import PullingSpinner from "@/components/PullingSpinner";
import WellnessPanelBody from "@/components/WellnessPanelBody";
import type { WellnessPanelDataDto } from "@/dto";

type Props = {
  data: Promise<WellnessPanelDataDto>;
};

/**
 * The title renders at once; the body waits behind a spinner while the
 * layout pulls from Garmin, then streams in.
 */
export default function WellnessPanel({ data }: Props) {
  return (
    <Panel title="Daily">
      <Suspense
        fallback={<PullingSpinner label="Pulling wellness from Garmin..." />}
      >
        <WellnessPanelBody data={data} />
      </Suspense>
    </Panel>
  );
}
