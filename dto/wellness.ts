export interface WellnessCardDto {
  id: string;
  dateKey: string;  // sortable, "yyyy-MM-dd"
  dayLabel: string; // "Tue, Sep 23"
  restingHeartRate: string | null;
  sleep: string | null;  // "7h 30m"
  sleepScore: string | null;
  weight: string | null; // "172.4 lb" or "78.2 kg", per the athlete's unit
  health: string | null;
}

/**
 * Prefill values for one recorded day in the edit form. Every field is the
 * string an input expects, with "" for an empty value. Sleep is in minutes
 * and weight in kilograms, matching the form's labels.
 */
export interface WellnessFormDto {
  id: string;
  date: string; // "yyyy-MM-dd", also the sort key
  restingHeartRate: string;
  sleepMinutes: string;
  sleepScore: string;
  bodyWeightKilograms: string;
  health: string;
  notes: string;
}
