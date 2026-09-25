"use client";

import { useState } from "react";

/**
 * The right column, collapsed to a rail by default and expanded on click. It
 * mirrors wp-ui Panel's row contract (`auto` + `1fr`, height-bounded parent)
 * rather than using Panel itself: the header has to carry a toggle, and Panel
 * has no slot for one.
 *
 * The choice deliberately does not persist. Collapsed is the default on every
 * load, so there is no stored state to read and nothing to hydrate around.
 */
function Chevron({ isExpanded }: { isExpanded: boolean }) {
  // #region Tailwind utility consts
  const iconCls = "h-4 w-4";
  // #endregion

  return (
    <svg
      className={iconCls}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={isExpanded ? "M6 3l5 5-5 5" : "M10 3L5 8l5 5"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FriendsPanel() {
  const [isExpanded, setIsExpanded] = useState(false);

  // #region Tailwind utility consts
  const railBtnCls =
    "grid h-full w-10 content-start justify-items-center gap-2 rounded-lg " +
    "border border-neutral-200 bg-card py-4 text-neutral-500 " +
    "cursor-pointer transition-colors hover:border-neutral-300 " +
    "hover:text-neutral-800";
  const railLabelCls =
    "text-xs font-semibold uppercase tracking-wide [writing-mode:vertical-rl]";
  const panelCls = "grid grid-rows-[auto_1fr] min-h-0 h-full gap-3";
  const headerBtnCls =
    "grid grid-cols-[1fr_auto] items-center gap-2 text-left " +
    "text-neutral-500 cursor-pointer transition-colors " +
    "hover:text-neutral-800";
  const titleCls = "text-sm font-semibold uppercase tracking-wide";
  const bodyCls = "grid content-start gap-3 min-h-0 overflow-y-auto pr-1";
  const emptyCls =
    "rounded-lg border border-dashed border-neutral-300 p-4 text-sm " +
    "text-neutral-500";
  // #endregion

  function handleToggle() {
    setIsExpanded(!isExpanded);
  }

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={false}
        aria-label="Expand the friends panel"
        className={railBtnCls}
      >
        <Chevron isExpanded={false} />
        <span className={railLabelCls}>Friends</span>
      </button>
    );
  }

  return (
    <section className={panelCls}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={true}
        className={headerBtnCls}
      >
        <span className={titleCls}>Friends</span>
        <Chevron isExpanded={true} />
      </button>

      <div className={bodyCls}>
        <p className={emptyCls}>
          Nothing here yet. Friends are not modeled in the schema.
        </p>
      </div>
    </section>
  );
}
