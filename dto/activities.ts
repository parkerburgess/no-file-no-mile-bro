// DTOs are the only contract components know about. They are plain,
// serializable shapes (strings / numbers / booleans / null) so any source can
// hydrate them and they survive the server -> client boundary. Display values
// arrive already formatted; a null means "absent" and the component decides
// how absent reads.

export interface CompletedActivityRowDto {
  kind: "activity";
  id: string;
  sortKey: string;  // ISO timestamp the activity started
  dayLabel: string; // "Tue, Sep 23"
  sportName: string;
  /** Null when the activity never went over the ceiling or has no zone data. */
  overCeilingDuration: string | null;
  duration: string;
  distance: string | null;
  /** "Pace" or "Speed", by sport — the label for `pace`. */
  paceLabel: string;
  /** "9:45 /mi" or "16.2 mph"; null with no distance to divide by. */
  pace: string | null;
  averageHeartRate: string | null;
  maxHeartRate: string | null;
}

export interface PlannedRaceDto {
  name: string;
  priorityLabel: string; // "B · Tune-up"
}

export interface PlannedWorkoutRowDto {
  kind: "planned";
  id: string;
  sortKey: string;    // "yyyy-MM-dd", the scheduled day
  dayLabel: string;   // "Tue, Sep 23"
  sportLabel: string; // "Run · Road"
  workoutTypeName: string;
  race: PlannedRaceDto | null;
  isSkipped: boolean;
  targetDuration: string | null;
  targetDistance: string | null;
  heartRateCeiling: string | null;
}

export type ActivityTimelineItemDto =
  | CompletedActivityRowDto
  | PlannedWorkoutRowDto;
