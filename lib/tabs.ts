/**
 * The middle column's tab set. The active tab lives in the URL rather than in
 * client state so that a refresh, a back button and a pasted link all land on
 * the same view, and so each tab's panel can stay a server component that
 * reads only the data it needs.
 */

export type TabId =
  | "activities"
  | "races"
  | "planning"
  | "analysis"
  | "goals";

export type TabDefinition = {
  id: TabId;
  label: string;
};

export const TAB_DEFINITIONS: TabDefinition[] = [
  { id: "activities", label: "Activities" },
  { id: "races", label: "Races" },
  { id: "planning", label: "Planning" },
  { id: "analysis", label: "Analysis" },
  { id: "goals", label: "Goals" },
];

export const DEFAULT_TAB_ID: TabId = "activities";

function isTabId(value: string): value is TabId {
  return TAB_DEFINITIONS.some((tab) => tab.id === value);
}

/**
 * A search param arrives as a string, a repeated string, or nothing at all.
 * Anything unrecognised falls back to the default tab rather than rendering an
 * empty column, so a hand-edited URL cannot produce a broken page.
 */
export function parseTabId(value: string | string[] | undefined): TabId {
  if (value === undefined) {
    return DEFAULT_TAB_ID;
  }

  const candidate = Array.isArray(value) ? value[0] : value;

  if (candidate !== undefined && isTabId(candidate)) {
    return candidate;
  }

  return DEFAULT_TAB_ID;
}

export function tabHref(tabId: TabId): string {
  return `/?tab=${tabId}`;
}
