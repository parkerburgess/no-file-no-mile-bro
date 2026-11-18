export interface RaceRowDto {
  id: string;
  dateKey: string;   // sortable, "yyyy-MM-dd"
  dayLabel: string;  // "Sat, Nov 14"
  yearLabel: string; // "2026"
  name: string;
  sportName: string;
  distance: string;  // "3.11 mi"
  location: string | null;
  priorityLabel: string; // "B · Tune-up"
  finishedDuration: string | null;
  goalDuration: string | null;
  notes: string | null;
  url: string | null;
  isInPlan: boolean;
}
