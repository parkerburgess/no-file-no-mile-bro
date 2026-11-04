"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@parkerburgess/wandering-parker-ui";
import type { SkippedStravaActivity } from "@/lib/dal";

type PullResponse = {
  activitiesSaved: number;
  zonesSaved: number;
  activitiesMigrated: number;
  activitiesSkipped: SkippedStravaActivity[];
};

type ErrorResponse = {
  error: string;
};

export default function PullStravaAction() {
  const router = useRouter();
  const [isPulling, setIsPulling] = useState(false);
  const [pullMessage, setPullMessage] = useState("");

  // #region Tailwind utility consts
  const rowCls = "flex items-center gap-3";
  const pullBtnCls = "cursor-pointer disabled:cursor-not-allowed";
  const pullMessageCls = "text-sm text-neutral-600";
  // #endregion

  /* A pull can stage nothing new and still promote a raw row an earlier pull
     left behind, so the migrated count decides "nothing happened", not the
     saved count on its own. */
  function describeResult(result: PullResponse): string {
    if (result.activitiesSaved === 0 && result.activitiesMigrated === 0) {
      return "No new activities";
    }

    const summary =
      `Saved ${result.activitiesSaved} new activities and ` +
      `${result.zonesSaved} zone records, migrated ` +
      `${result.activitiesMigrated}`;

    if (result.activitiesSkipped.length === 0) {
      return summary;
    }

    return (
      `${summary} (${result.activitiesSkipped.length} skipped — ` +
      `unrecognised Strava type)`
    );
  }

  async function handlePullStrava() {
    setIsPulling(true);
    setPullMessage("Pulling from Strava...");

    try {
      const response = await fetch("/api/strava/pull", { method: "POST" });

      if (!response.ok) {
        const failure = (await response.json()) as ErrorResponse;
        setPullMessage(failure.error);
        return;
      }

      const result = (await response.json()) as PullResponse;
      setPullMessage(describeResult(result));

      /* The pull migrates what it stages into training.Activity, so the
         activity timeline the server rendered is now stale. Re-running the
         server render is what brings the new rows down. */
      router.refresh();
    } catch {
      setPullMessage("Could not reach the server.");
    } finally {
      setIsPulling(false);
    }
  }

  return (
    <div className={rowCls}>
      <Button
        variant="secondary"
        onClick={handlePullStrava}
        disabled={isPulling}
        className={pullBtnCls}
      >
        {isPulling ? "Pulling..." : "Pull Strava"}
      </Button>

      {pullMessage !== "" && <span className={pullMessageCls}>{pullMessage}</span>}
    </div>
  );
}
