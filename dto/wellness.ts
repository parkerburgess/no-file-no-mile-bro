export interface WellnessCardDto {
  id: string;
  dateKey: string;  // sortable, "yyyy-MM-dd"
  dayLabel: string; // "Tue, Sep 23"
  steps: string | null;    // "8,412"
  stepGoal: string | null; // "10,000", set by Garmin
  restingHeartRate: string | null;
  maxHeartRate: string | null;
  sleepScore: string | null;
  sleep: string | null;  // "7:30" (h:mm)
  weight: string | null; // "172.4 lb" or "78.2 kg", per the athlete's unit
}

/**
 * Prefill values for one recorded day in the edit form. Every field is the
 * string an input expects, with "" for an empty value. Sleep is in minutes
 * and weight in kilograms, matching the form's labels. Step goal is absent:
 * Garmin sets it, so the form has no field for it.
 */
export interface WellnessFormDto {
  id: string;
  date: string; // "yyyy-MM-dd", also the sort key
  steps: string;
  restingHeartRate: string;
  maxHeartRate: string;
  sleepMinutes: string;
  sleepScore: string;
  bodyWeightKilograms: string;
}

/**
 * Everything the wellness panel's body renders, resolved after the Garmin
 * pull on layout load. `pullError` is set when the pull failed; the days
 * already stored are still returned and shown under it.
 */
export interface WellnessPanelDataDto {
  days: WellnessCardDto[];
  formDays: WellnessFormDto[];
  pullError: string | null;
}
