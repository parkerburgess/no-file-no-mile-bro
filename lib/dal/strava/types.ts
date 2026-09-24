/**
 * Raw Strava staging rows. These mirror training.StravaRawActivity and
 * training.StravaRawZoneData, whose columns deliberately keep Strava's
 * snake_case. The types here use the app's camelCase, and sql.ts is the one
 * place the two naming schemes meet.
 */

export type StravaRawActivityInput = {
  athleteId: number;
  stravaAthleteId: number;
  activityId: number;
  name: string;
  distance: number;
  elapsedTime: number;
  type: string;
  startDateLocal: string;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
};

export type StravaRawZoneInput = {
  activityId: number;
  score: number | null;
  zone1Time: number;
  zone2Time: number;
  zone3Time: number;
  zone4Time: number;
  zone5Time: number;
};

export interface IStravaAccess {
  /**
   * Writes activity rows. Re-pulling the same activity updates its row rather
   * than adding a second, so the button is safe to press twice. Returns the
   * number of rows written.
   */
  saveActivities(activities: StravaRawActivityInput[]): Promise<number>;

  /**
   * The most recently started activities already in the table, newest first.
   * Zone requests are restricted to these, so the activity rows must be saved
   * before this is called.
   */
  getRecentActivityIds(limit: number): Promise<number[]>;

  /**
   * Writes zone rows. Each carries a foreign key to
   * StravaRawActivity.activity_id, so the activities must already be saved.
   */
  saveZones(zones: StravaRawZoneInput[]): Promise<number>;
}
