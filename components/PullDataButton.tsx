"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  label: string;
};

/**
 * Pulls from Garmin on demand by re-running the page's server render, which
 * is where the pull lives — so a click runs exactly the pull a page load
 * would, with no second endpoint to keep in step. The refresh is a
 * transition, which keeps the current cards on screen instead of dropping
 * back to the panel's spinner; the icon spins until it finishes.
 */
export default function PullDataButton({ label }: Props) {
  const router = useRouter();
  const [isPulling, startPull] = useTransition();

  function refreshPage() {
    router.refresh();
  }

  function handlePull() {
    startPull(refreshPage);
  }

  function iconCls(): string {
    if (isPulling) {
      return "size-4 animate-pulse";
    }
    return "size-4";
  }

  // #region Tailwind utility consts
  const buttonCls =
    "grid size-8 place-items-center rounded-lg text-neutral-500 " +
    "cursor-pointer hover:bg-neutral-200 hover:text-neutral-900 " +
    "disabled:cursor-not-allowed disabled:opacity-60";
  // #endregion

  return (
    <button
      type="button"
      className={buttonCls}
      onClick={handlePull}
      disabled={isPulling}
      aria-label={label}
      title={label}
    >
      <svg
        className={iconCls()}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    </button>
  );
}
