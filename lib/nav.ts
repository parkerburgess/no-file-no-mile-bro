import type { SiteNavItem } from "@parkerburgess/wandering-parker-ui";

/**
 * The training views, one route each. They are paths rather than a `?tab=`
 * query because SiteNav marks the current item by pathname alone.
 *
 * `match: "prefix"` keeps an item current on nested routes, so a future
 * "/races/12" still highlights Races.
 */
export const TRAINING_NAV_ITEMS: SiteNavItem[] = [
  { label: "Activities", href: "/activities", match: "prefix" },
  { label: "Races", href: "/races", match: "prefix" },
  { label: "Planning", href: "/planning", match: "prefix" },
  { label: "Analysis", href: "/analysis", match: "prefix" },
  { label: "Goals", href: "/goals", match: "prefix" },
];

export const DEFAULT_TRAINING_HREF = "/activities";

/**
 * Maps a legacy `/?tab=<id>` link to its route. Anything unrecognised falls
 * back to the default view rather than a 404, so an old bookmark always lands
 * somewhere useful.
 */
export function legacyTabHref(tab: string | string[] | undefined): string {
  const candidate = Array.isArray(tab) ? tab[0] : tab;

  if (candidate === undefined) {
    return DEFAULT_TRAINING_HREF;
  }

  const legacyHref = `/${candidate}`;
  const match = TRAINING_NAV_ITEMS.find((item) => item.href === legacyHref);

  if (match === undefined) {
    return DEFAULT_TRAINING_HREF;
  }

  return match.href;
}
