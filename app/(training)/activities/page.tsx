import { requireAthlete } from "@/lib/auth";
import { dal } from "@/lib/dal";
import { getAthleteUnits, getLookups } from "@/lib/page-data";
import { pullGarminActivities } from "@/lib/garmin/activities";
import {
  toActivityCardDto,
  toActivityFormDto,
} from "@/lib/hydrate/activities";
import type { ActivityPanelDataDto } from "@/dto";
import ActivityPanel from "@/components/ActivityPanel";

/**
 * A failed pull must not take the page down: the activities already stored
 * are still worth showing, so the failure comes back as a message instead.
 */
async function pullGarminOrError(athleteId: number): Promise<string | null> {
  try {
    await pullGarminActivities(athleteId, false);
    return null;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error.";
    return `Garmin pull failed: ${reason}`;
  }
}

/**
 * Pulls new Garmin activities, then reads and hydrates everything stored.
 * The read waits for the pull so the cards include what it just added.
 */
async function loadActivityPanelData(
  athleteId: number
): Promise<ActivityPanelDataDto> {
  const pullError = await pullGarminOrError(athleteId);

  const units = await getAthleteUnits();
  const lookups = await getLookups();
  const activities = await dal.activity.listActivities(athleteId);

  return {
    activities: activities.map((activity) =>
      toActivityCardDto(activity, units)
    ),
    formActivities: activities.map(toActivityFormDto),
    // Already in display order: the lookup query sorts sports by SortOrder.
    sportOptions: lookups.sports.map((sport) => sport.name),
    pullError,
  };
}

/**
 * Not awaited on purpose: the page renders the panel at once, and the panel
 * streams its body in when the pull and the read have finished.
 */
export default async function ActivitiesPage() {
  const athlete = await requireAthlete();

  return <ActivityPanel data={loadActivityPanelData(athlete.athleteId)} />;
}
