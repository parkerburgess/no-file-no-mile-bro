import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  // Must match the domain/path the cookie was set with (see
  // wandering-parker's app/api/auth/login/route.ts) or this clears a
  // different, host-only cookie and leaves the real session cookie in place.
  (await cookies()).delete({
    name: "auth_token",
    path: "/",
    domain: process.env.NODE_ENV === "production" ? ".wanderingparker.com" : undefined,
  });
  return NextResponse.json({ ok: true });
}
