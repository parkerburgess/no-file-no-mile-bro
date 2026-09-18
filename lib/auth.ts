import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decodeJwt } from "jose";
import { getUserId } from "@parkerburgess/wandering-parker-server";
import { dal } from "@/lib/dal";
import type { Athlete } from "@/lib/dal/athlete/types";

const DEV_EMAIL = "dev@localhost";
const DEV_DISPLAY_NAME = "Dev User (Parker)";

const WANDERING_PARKER_URL = process.env.WANDERING_PARKER_URL ?? "http://localhost:3000";

export type AthleteAccess =
  | { status: "granted"; athlete: Athlete }
  | { status: "denied"; userId: string };

function isAuthDisabled(): boolean {
  return process.env.DISABLE_AUTH === "true" && process.env.NODE_ENV !== "production";
}

/**
 * The shared package exposes getUserId and getUserName but not the email, and
 * provisioning needs it to satisfy UQ_Athlete_Email. proxy.ts has already
 * verified the signature and expiry on this request, so a plain decode is safe
 * here — the same reasoning the shared auth helpers rely on.
 */
async function readIdentity(): Promise<{ email: string; displayName: string }> {
  if (isAuthDisabled()) {
    return { email: DEV_EMAIL, displayName: DEV_DISPLAY_NAME };
  }

  const token = (await cookies()).get("auth_token")?.value;
  if (token === undefined) {
    return { email: "", displayName: "" };
  }

  const payload = decodeJwt(token);
  const email = typeof payload.email === "string" ? payload.email : "";
  const name = typeof payload.name === "string" ? payload.name : "";
  return { email, displayName: name };
}

/**
 * Resolves the signed-in user to an athlete, enforcing the dbo.AppAccess grant
 * on the way. Cached per request so a layout and its page do not each pay for
 * the round trip.
 *
 * The grant check is deliberately skipped when auth is disabled, matching the
 * shared dev bypass: local development should not require a real grant row.
 */
export const resolveAthleteAccess = cache(async (): Promise<AthleteAccess> => {
  const userId = await getUserId();

  if (!isAuthDisabled()) {
    const isGranted = await dal.athlete.hasAppGrant(userId);
    if (!isGranted) {
      console.warn(`[auth] user ${userId} has no AppAccess grant for this app.`);
      return { status: "denied", userId };
    }
  }

  const { email, displayName } = await readIdentity();
  const athlete = await dal.athlete.provision({ userId, email, displayName });
  return { status: "granted", athlete };
});

/**
 * For server components. A user who is signed in but not granted this app is
 * sent back to the hub rather than shown an error page — from their side the
 * app simply is not theirs.
 */
export async function requireAthlete(): Promise<Athlete> {
  const access = await resolveAthleteAccess();

  if (access.status === "denied") {
    redirect(WANDERING_PARKER_URL);
  }

  return access.athlete;
}
