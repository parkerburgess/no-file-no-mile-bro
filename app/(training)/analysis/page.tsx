import PlaceholderPanel from "@/components/PlaceholderPanel";

export default function AnalysisPage() {
  return (
    <PlaceholderPanel
      headline="Analysis is not built yet"
      detail={
        "Charts and tables over time: aerobic drift, time under the " +
        "heart rate ceiling, weekly volume against the plan. It waits on " +
        "a charting library, which has not been chosen."
      }
    />
  );
}
