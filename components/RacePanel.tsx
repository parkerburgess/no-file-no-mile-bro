import RaceRow from "@/components/RaceRow";
import type { RaceRowDto } from "@/dto";

type Props = {
  races: RaceRowDto[];
  today: string;
};

/**
 * Upcoming races ascending, so the next commitment is at the top and the rest
 * read forward in time. Races already run follow, most recent first — they are
 * history, and history is read backwards.
 */
function raceOrder(races: RaceRowDto[], today: string): RaceRowDto[] {
  const upcoming = races
    .filter((race) => race.dateKey >= today)
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey));

  const past = races
    .filter((race) => race.dateKey < today)
    .sort((left, right) => right.dateKey.localeCompare(left.dateKey));

  return [...upcoming, ...past];
}

export default function RacePanel({ races, today }: Props) {
  const ordered = raceOrder(races, today);

  // #region Tailwind utility consts
  const emptyCls =
    "rounded-lg border border-dashed border-neutral-300 p-6 text-sm " +
    "text-neutral-500";
  // #endregion

  if (ordered.length === 0) {
    return <p className={emptyCls}>No races are being tracked yet.</p>;
  }

  return (
    <>
      {ordered.map((race) => (
        <RaceRow key={race.id} race={race} />
      ))}
    </>
  );
}
