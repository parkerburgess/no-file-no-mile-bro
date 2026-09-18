import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";
import { resolveAthleteAccess } from "@/lib/auth";
import { forbidden } from "@/lib/api-response";

export async function GET() {
  const access = await resolveAthleteAccess();
  if (access.status === "denied") {
    return forbidden("You do not have access to this application.");
  }

  const lookups = await dal.lookups.getAll();
  return NextResponse.json(lookups);
}
