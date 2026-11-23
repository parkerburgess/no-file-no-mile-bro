import { NextResponse } from "next/server";
import { resolveAthleteAccess } from "@/lib/auth";
import { forbidden, serverError } from "@/lib/api-response";
import { pullGarminActivities } from "@/lib/garmin/activities";

/**
 * POST pulls Garmin activities newer than the latest one stored.
 * POST ?full=true searches all of Garmin's history instead — for after a new
 * activity type mapping is added. Already-stored ids are skipped either way.
 */
export async function POST(request: Request) {
  const access = await resolveAthleteAccess();
  if (access.status === "denied") {
    return forbidden("You do not have access to this application.");
  }

  const fullHistory =
    new URL(request.url).searchParams.get("full") === "true";

  try {
    const result = await pullGarminActivities(
      access.athlete.athleteId,
      fullHistory
    );
    return NextResponse.json(result);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error.";
    return serverError(`Garmin pull failed: ${reason}`);
  }
}
