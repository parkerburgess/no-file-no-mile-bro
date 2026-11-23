import { getAthleteUnits } from "@/lib/page-data";
import { sampleRaces } from "@/lib/sample-data";
import { toRaceRowDto } from "@/lib/hydrate/races";
import RacePanel from "@/components/RacePanel";

export default async function RacesPage() {
  const units = await getAthleteUnits();

  // Ordering races into upcoming and past is a server-side decision, so this
  // never reaches the client and cannot disagree with a client clock.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <RacePanel
      races={sampleRaces.map((race) => toRaceRowDto(race, units))}
      today={today}
    />
  );
}
