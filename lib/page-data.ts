import { cache } from "react";
import { requireAthlete } from "@/lib/auth";
import { dal } from "@/lib/dal";
import type { Lookups } from "@/lib/dal/lookups/types";
import { toUnitDisplay } from "@/lib/hydrate/units";
import type { UnitDisplay } from "@/lib/hydrate/units";

/**
 * Reads that both the (training) layout and its pages need. Each is cached
 * per request, so a layout and a page asking for the same thing in one render
 * share a single query.
 */
export const getLookups = cache(async (): Promise<Lookups> => {
  return dal.lookups.getAll();
});

export const getAthleteUnits = cache(async (): Promise<UnitDisplay> => {
  const athlete = await requireAthlete();
  const lookups = await getLookups();

  // The FK guarantees a match; the fallback only satisfies the type.
  const distanceUnit =
    lookups.distanceUnits.find((unit) => unit.id === athlete.distanceUnitId) ??
    lookups.distanceUnits[0];

  return toUnitDisplay(distanceUnit);
});
