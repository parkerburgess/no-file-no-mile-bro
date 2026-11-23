import { requireAthlete } from "@/lib/auth";
import { dal } from "@/lib/dal";
import type { CompletedActivity } from "@/lib/dal";
import { getAthleteUnits } from "@/lib/page-data";
import { samplePlannedWorkouts } from "@/lib/sample-data";
import type { ActivityTimelineItemDto } from "@/dto";
import {
  toCompletedActivityRowDto,
  toPlannedWorkoutRowDto,
} from "@/lib/hydrate/activities";
import type { UnitDisplay } from "@/lib/hydrate/units";
import ActivityPanel from "@/components/ActivityPanel";

/**
 * The timeline mixes real activities with placeholder planned workouts from
 * lib/sample-data; both are hydrated to the same row DTO union here.
 */
function toTimelineItems(
  activities: CompletedActivity[],
  units: UnitDisplay
): ActivityTimelineItemDto[] {
  const completed = activities.map((activity) =>
    toCompletedActivityRowDto(activity, units)
  );
  const planned = samplePlannedWorkouts.map((workout) =>
    toPlannedWorkoutRowDto(workout, units)
  );
  return [...completed, ...planned];
}

export default async function ActivitiesPage() {
  const athlete = await requireAthlete();
  const units = await getAthleteUnits();
  const activities = await dal.activity.listActivities(athlete.athleteId);

  return <ActivityPanel items={toTimelineItems(activities, units)} />;
}
