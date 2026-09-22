"use client";

import { useState } from "react";
import { Badge } from "@parkerburgess/wandering-parker-ui";
import type { TrackedRace } from "@/lib/sample-data";
import {
  formatDayLabel,
  formatDistance,
  formatDuration,
} from "@/lib/format";

type Props = {
  race: TrackedRace;
  metersPerUnit: number;
  unitAbbreviation: string;
};

/**
 * Notes are clamped to two lines. Whether a given string actually overflows
 * two lines depends on the rendered column width, which is not knowable
 * without measuring, so this approximates it: below this length the note
 * certainly fits and the expander would be a control that does nothing.
 */
const CLAMPED_NOTE_LENGTH = 120;

/**
 * A race that is in the plan is a commitment, so it reads solid. One that is
 * merely on the shortlist is provisional, so it reads as an outline — the
 * same language the timeline uses for completed work versus planned work.
 */
function rowCls(isInPlan: boolean): string {
  const baseCls =
    "grid grid-cols-[7rem_1fr_auto] items-start gap-4 rounded-lg p-4";

  if (isInPlan) {
    return (
      `${baseCls} border border-neutral-200 border-l-4 ` +
      "border-l-primary-600 bg-card"
    );
  }

  return (
    `${baseCls} border border-dashed border-neutral-300 border-l-4 ` +
    "border-l-neutral-300 bg-subtle"
  );
}

function switchTrackCls(isInPlan: boolean): string {
  const baseCls =
    "relative h-6 w-11 rounded-full transition-colors cursor-pointer";

  if (isInPlan) {
    return `${baseCls} bg-primary-600`;
  }

  return `${baseCls} bg-neutral-300`;
}

function switchKnobCls(isInPlan: boolean): string {
  const baseCls =
    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-card " +
    "transition-transform";

  if (isInPlan) {
    return `${baseCls} translate-x-5`;
  }

  return baseCls;
}

function notesCls(isExpanded: boolean): string {
  const baseCls = "text-xs leading-relaxed text-neutral-600";

  if (isExpanded) {
    return baseCls;
  }

  return `${baseCls} line-clamp-2`;
}

export default function RaceRow({
  race,
  metersPerUnit,
  unitAbbreviation,
}: Props) {
  const [isInPlan, setIsInPlan] = useState(race.isInPlan);
  const [areNotesExpanded, setAreNotesExpanded] = useState(false);

  // The toggle is local-only until lib/dal/plan exists: there is no
  // trainingplan_race row to write and no active TrainingPlan to write it
  // against. It changes what you see, not what is stored.
  function handleToggleInPlan() {
    setIsInPlan(!isInPlan);
  }

  function handleToggleNotes() {
    setAreNotesExpanded(!areNotesExpanded);
  }

  const hasExpandableNotes =
    race.notes !== null && race.notes.length > CLAMPED_NOTE_LENGTH;

  // #region Tailwind utility consts
  const whenCls = "grid gap-0.5";
  const dayCls = "text-sm font-medium text-neutral-900";
  const yearCls =
    "text-xs font-semibold uppercase tracking-wide text-primary-700";
  const identityCls = "grid gap-1.5";
  const titleCls = "text-sm font-semibold text-neutral-900";
  const subtitleCls = "text-xs text-neutral-500";
  const tagsCls = "flex flex-wrap gap-1.5";
  const linkCls =
    "text-xs font-medium text-primary-700 underline underline-offset-2 " +
    "hover:text-primary-800 cursor-pointer justify-self-start";
  const notesToggleCls =
    "text-xs font-medium text-neutral-500 hover:text-neutral-800 " +
    "cursor-pointer justify-self-start";
  const toggleCls = "grid justify-items-end gap-1.5";
  const toggleLabelCls = "text-xs text-neutral-500";
  // #endregion

  return (
    <article className={rowCls(isInPlan)}>
      <div className={whenCls}>
        <span className={dayCls}>{formatDayLabel(race.raceDate)}</span>
        <span className={yearCls}>{race.raceDate.slice(0, 4)}</span>
      </div>

      <div className={identityCls}>
        <span className={titleCls}>{race.name}</span>

        <span className={subtitleCls}>
          {race.sportName} ·{" "}
          {formatDistance(race.distanceMeters, metersPerUnit, unitAbbreviation)}
          {race.location !== null && ` · ${race.location}`}
        </span>

        <span className={tagsCls}>
          <Badge color="primary">
            {race.priorityCode} · {race.priorityName}
          </Badge>
          {race.actualDurationSeconds !== null && (
            <Badge color="neutral">
              Finished {formatDuration(race.actualDurationSeconds)}
            </Badge>
          )}
          {race.actualDurationSeconds === null &&
            race.goalDurationSeconds !== null && (
              <Badge color="neutral">
                Goal {formatDuration(race.goalDurationSeconds)}
              </Badge>
            )}
        </span>

        {race.notes !== null && (
          <p className={notesCls(areNotesExpanded)}>{race.notes}</p>
        )}

        {hasExpandableNotes && (
          <button
            type="button"
            onClick={handleToggleNotes}
            className={notesToggleCls}
          >
            {areNotesExpanded ? "Show less" : "Show more"}
          </button>
        )}

        {race.url !== null && (
          <a
            href={race.url}
            target="_blank"
            rel="noopener noreferrer"
            className={linkCls}
          >
            Race site ↗
          </a>
        )}
      </div>

      <div className={toggleCls}>
        <span className={toggleLabelCls}>In plan</span>
        <button
          type="button"
          role="switch"
          aria-checked={isInPlan}
          aria-label={`Include ${race.name} in the training plan`}
          onClick={handleToggleInPlan}
          className={switchTrackCls(isInPlan)}
        >
          <span className={switchKnobCls(isInPlan)} />
        </button>
      </div>
    </article>
  );
}
