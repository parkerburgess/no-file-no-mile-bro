// DTOs are the only contract components know about. They are plain,
// serializable shapes (strings / numbers / booleans / null) so any source can
// hydrate them and they survive the server -> client boundary. Display values
// arrive already formatted; a null means "absent" and the component decides
// how absent reads.

export interface ActivityCardDto {
  id: string;
  sortKey: string;  // ISO timestamp the activity started
  dayLabel: string; // "Tue, Sep 23"
  sportName: string;
  duration: string;
  distance: string | null;
  /** "Pace" or "Speed", by sport — the label for `pace`. */
  paceLabel: string;
  /** "9:45 /mi" or "16.2 mph"; null with no distance to divide by. */
  pace: string | null;
  averageHeartRate: string | null;
  maxHeartRate: string | null;
}

/**
 * Prefill values for one recorded activity in the edit form. Every field is
 * the string an input expects, with "" for an empty value. Duration is in
 * minutes and distance in meters, matching the form's labels. The sport is
 * its name, because that is the value the sport select uses.
 */
export interface ActivityFormDto {
  id: string;
  startedAt: string; // "yyyy-MM-ddTHH:mm" (UTC), also the sort key
  sportName: string;
  durationMinutes: string;
  distanceMeters: string;
  averageHeartRate: string;
  maxHeartRate: string;
  notes: string;
}
