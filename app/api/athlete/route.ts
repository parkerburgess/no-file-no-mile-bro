import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";
import { resolveAthleteAccess } from "@/lib/auth";
import { badRequest, forbidden } from "@/lib/api-response";
import type { CompleteProfileInput } from "@/lib/dal";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function readCompleteProfileInput(body: unknown): CompleteProfileInput | null {
  if (body === null || typeof body !== "object") {
    return null;
  }

  const { birthDate, timeZoneId, distanceUnitId } = body as Record<string, unknown>;

  const hasValidBirthDate =
    typeof birthDate === "string" && ISO_DATE_PATTERN.test(birthDate);
  const hasValidTimeZone = typeof timeZoneId === "string" && timeZoneId.trim() !== "";
  const hasValidDistanceUnit =
    typeof distanceUnitId === "number" && Number.isInteger(distanceUnitId);

  if (!hasValidBirthDate || !hasValidTimeZone || !hasValidDistanceUnit) {
    return null;
  }

  return { birthDate, timeZoneId, distanceUnitId };
}

export async function GET() {
  const access = await resolveAthleteAccess();
  if (access.status === "denied") {
    return forbidden("You do not have access to this application.");
  }

  return NextResponse.json(access.athlete);
}

export async function PATCH(request: Request) {
  const access = await resolveAthleteAccess();
  if (access.status === "denied") {
    return forbidden("You do not have access to this application.");
  }

  const input = readCompleteProfileInput(await request.json());
  if (input === null) {
    return badRequest(
      "birthDate (YYYY-MM-DD), timeZoneId and distanceUnitId are required."
    );
  }

  const athlete = await dal.athlete.completeProfile(access.athlete.athleteId, input);
  return NextResponse.json(athlete);
}
