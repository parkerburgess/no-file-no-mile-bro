import type { DistanceUnitLookupItem } from "@/lib/dal";
import {
  distanceUnitAbbreviation,
  formatDistance,
  formatDuration,
  speedUnitAbbreviation,
} from "@/lib/format";

// Shared helpers for the hydrators. Hydrators only map, cast and format.
// No sorting, filtering, or other logic.

/**
 * The athlete's unit preference, resolved once per request and handed to
 * every hydrator that formats a distance or a weight.
 */
export type UnitDisplay = {
  metersPerUnit: number;
  distanceAbbreviation: string;
  speedAbbreviation: string;
  useImperial: boolean;
};

export function toUnitDisplay(unit: DistanceUnitLookupItem): UnitDisplay {
  return {
    metersPerUnit: unit.metersPerUnit,
    distanceAbbreviation: distanceUnitAbbreviation(unit.code),
    speedAbbreviation: speedUnitAbbreviation(unit.code),
    useImperial: unit.code === "MILE",
  };
}

export function formatDistanceForUnit(
  meters: number,
  units: UnitDisplay
): string {
  return formatDistance(meters, units.metersPerUnit, units.distanceAbbreviation);
}

export function formatDistanceOrNull(
  meters: number | null,
  units: UnitDisplay
): string | null {
  if (meters === null) {
    return null;
  }
  return formatDistanceForUnit(meters, units);
}

export function formatDurationOrNull(seconds: number | null): string | null {
  if (seconds === null) {
    return null;
  }
  return formatDuration(seconds);
}

export function stringOrNull(value: number | null): string | null {
  if (value === null) {
    return null;
  }
  return String(value);
}
