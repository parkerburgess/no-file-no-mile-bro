"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  label: string;
};

type ErrorBody = {
  error?: string;
};

const PULL_ROUTE = "/api/garmin/pull";

async function readPullError(response: Response): Promise<string> {
  try {
    const body: ErrorBody = await response.json();
    return body.error ?? `Garmin pull failed (${response.status}).`;
  } catch {
    return `Garmin pull failed (${response.status}).`;
  }
}

/**
 * Pulls Garmin activities on demand. A page load skips its pull once today's
 * wellness is stored, so the button goes through the API route, which always
 * pulls, and then refreshes the page so the cards re-read what was stored.
 * The refresh is a transition, which keeps the current cards on screen
 * instead of dropping back to the panel's spinner; the icon pulses until it
 * finishes.
 *
 * Renders a fragment: the error line takes its own row across the panel
 * header's grid, under the title and the button.
 */
export default function PullDataButton({ label }: Props) {
  const router = useRouter();
  const [isPulling, startPull] = useTransition();
  const [pullError, setPullError] = useState<string | null>(null);

  async function pullAndRefresh() {
    setPullError(null);

    const response = await fetch(PULL_ROUTE, { method: "POST" });
    if (!response.ok) {
      setPullError(await readPullError(response));
      return;
    }

    router.refresh();
  }

  function handlePull() {
    startPull(pullAndRefresh);
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
  const errorCls = "col-span-2 text-sm text-danger-700";
  // #endregion

  return (
    <>
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

      {pullError !== null && <p className={errorCls}>{pullError}</p>}
    </>
  );
}
