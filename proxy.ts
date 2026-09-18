import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

const WANDERING_PARKER_URL = process.env.WANDERING_PARKER_URL ?? "http://localhost:3000";

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.AUTH_SERVICE_URL ?? "http://localhost:3001"}/api/auth/jwks`)
);

/**
 * Authentication only. Authorization — whether this user is granted the app in
 * dbo.AppAccess — is enforced in lib/auth.ts instead, because Next's own proxy
 * guidance is not to rely on shared modules or globals here, and the SQL
 * connection pool is exactly that.
 */
export async function proxy(request: NextRequest) {
  if (process.env.DISABLE_AUTH === "true" && process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  const returnUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const loginUrl = new URL("/login", WANDERING_PARKER_URL);
  loginUrl.searchParams.set("return_url", returnUrl);

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, JWKS);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(loginUrl);
    // Must match the domain/path the cookie was set with (see
    // wandering-parker's app/api/auth/login/route.ts) or this clears a
    // different, host-only cookie and leaves the real session cookie in place.
    response.cookies.delete({
      name: "auth_token",
      path: "/",
      domain: process.env.NODE_ENV === "production" ? ".wanderingparker.com" : undefined,
    });
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
