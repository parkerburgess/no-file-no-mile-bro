import type { SkippedStravaActivity, StravaMigrationResult } from "@/lib/dal";
import type { PullStravaResultDto, SkippedStravaActivityDto } from "@/dto";

function toSkippedStravaActivityDto(
  skipped: SkippedStravaActivity
): SkippedStravaActivityDto {
  return {
    activityId: String(skipped.activityId),
    stravaType: skipped.stravaType,
  };
}

export function toPullStravaResultDto(
  activitiesSaved: number,
  zonesSaved: number,
  migration: StravaMigrationResult
): PullStravaResultDto {
  return {
    activitiesSaved,
    zonesSaved,
    activitiesMigrated: migration.migrated,
    activitiesSkipped: migration.skipped.map(toSkippedStravaActivityDto),
  };
}
