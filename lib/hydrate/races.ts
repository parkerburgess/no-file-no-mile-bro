import type { TrackedRace } from "@/lib/sample-data";
import type { RaceRowDto } from "@/dto";
import { formatDayLabel } from "@/lib/format";
import {
  formatDistanceForUnit,
  formatDurationOrNull,
} from "@/lib/hydrate/units";
import type { UnitDisplay } from "@/lib/hydrate/units";

export function toRaceRowDto(race: TrackedRace, units: UnitDisplay): RaceRowDto {
  return {
    id: String(race.id),
    dateKey: race.raceDate,
    dayLabel: formatDayLabel(race.raceDate),
    yearLabel: race.raceDate.slice(0, 4),
    name: race.name,
    sportName: race.sportName,
    distance: formatDistanceForUnit(race.distanceMeters, units),
    location: race.location,
    priorityLabel: `${race.priorityCode} · ${race.priorityName}`,
    finishedDuration: formatDurationOrNull(race.actualDurationSeconds),
    goalDuration: formatDurationOrNull(race.goalDurationSeconds),
    notes: race.notes,
    url: race.url,
    isInPlan: race.isInPlan,
  };
}
