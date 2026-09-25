"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, UserMenu, useTheme } from "@parkerburgess/wandering-parker-ui";
import type { SkippedStravaActivity } from "@/lib/dal";

type Props = {
  userName: string;
};

type PullResponse = {
  activitiesSaved: number;
  zonesSaved: number;
  activitiesMigrated: number;
  activitiesSkipped: SkippedStravaActivity[];
};

type ErrorResponse = {
  error: string;
};

export default function Banner({ userName }: Props) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [isPulling, setIsPulling] = useState(false);
  const [pullMessage, setPullMessage] = useState("");

  // #region Tailwind utility consts
  const headerCls =
    "w-full flex-shrink-0 sticky top-0 z-10 bg-surface border-b " +
    "border-neutral-200 grid grid-cols-[1fr_auto_1fr] items-center " +
    "h-20 px-8";
  const leftColCls = "justify-self-start grid gap-1 justify-items-start";
  const pullBtnCls = "cursor-pointer disabled:cursor-not-allowed";
  const pullMessageCls = "text-sm text-neutral-600";
  const bannerImgCls =
    "justify-self-center h-full w-auto max-h-full object-contain " +
    "cursor-pointer";
  const rightColCls = "justify-self-end";
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

  function handleBrandClick() {
    router.push("/");
  }

  function handleToggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
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
    } catch {
      setPullMessage("Could not reach the server.");
    } finally {
      setIsPulling(false);
    }
  }

  return (
    <header className={headerCls}>
      <div className={leftColCls}>
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

      <Image
        src="/Banner.jpg"
        alt="no file, no mile"
        width={476}
        height={80}
        className={bannerImgCls}
        onClick={handleBrandClick}
        priority
      />

      <div className={rightColCls}>
        <UserMenu
          userName={userName}
          theme={resolvedTheme}
          onToggleTheme={handleToggleTheme}
        />
      </div>
    </header>
  );
}
