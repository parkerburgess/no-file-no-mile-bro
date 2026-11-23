import { requireAthlete } from "@/lib/auth";
import { dal } from "@/lib/dal";
import { getAthleteUnits, getLookups } from "@/lib/page-data";
import {
  toActivityCardDto,
  toActivityFormDto,
} from "@/lib/hydrate/activities";
import ActivityPanel from "@/components/ActivityPanel";

export default async function ActivitiesPage() {
  const athlete = await requireAthlete();
  const units = await getAthleteUnits();
  const lookups = await getLookups();
  const activities = await dal.activity.listActivities(athlete.athleteId);

  const cards = activities.map((activity) =>
    toActivityCardDto(activity, units)
  );
  // Already in display order: the lookup query sorts sports by SortOrder.
  const sportOptions = lookups.sports.map((sport) => sport.name);

  return (
    <ActivityPanel
      activities={cards}
      formActivities={activities.map(toActivityFormDto)}
      sportOptions={sportOptions}
    />
  );
}
