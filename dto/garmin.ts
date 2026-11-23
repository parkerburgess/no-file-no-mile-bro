/** What one Garmin pull did, for the pull button to report. */
export interface PullGarminResultDto {
  /** Activities Garmin returned for the searched date range. */
  fetched: number;
  inserted: number;
  /** Returned again by the overlap day, already in training.Activity. */
  alreadyStored: number;
  /** Garmin type keys with no sport mapping; those activities were skipped. */
  skippedTypes: string[];
}
