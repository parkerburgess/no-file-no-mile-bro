import PlaceholderPanel from "@/components/PlaceholderPanel";

export default function PlanningPage() {
  return (
    <PlaceholderPanel
      headline="Planning is not built yet"
      detail={
        "This is where a plan gets created — generated from a template " +
        "or assembled by hand — and where an existing plan is opened and " +
        "edited week by week. It waits on lib/dal/plan."
      }
    />
  );
}
