export interface SkippedStravaActivityDto {
  activityId: string;
  stravaType: string;
}

/** The body POST /api/strava/pull returns on success. */
export interface PullStravaResultDto {
  activitiesSaved: number;
  zonesSaved: number;
  activitiesMigrated: number;
  activitiesSkipped: SkippedStravaActivityDto[];
}
