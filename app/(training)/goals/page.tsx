import PlaceholderPanel from "@/components/PlaceholderPanel";

export default function GoalsPage() {
  return (
    <PlaceholderPanel
      headline="Goals are not modeled yet"
      detail={
        "There is no goal table in the schema — this page is a " +
        "placeholder for one. Races already carry a goal time, so " +
        "whatever lands here has to be something a race is not."
      }
    />
  );
}
