import { GARMIN_API_BASE_URL } from "@/lib/config";

/**
 * The Garmin Personal API's auth and request plumbing, shared by every pull.
 * Server-only: it reads GARMIN_API_KEY.
 */

const TOKEN_PATH =
  "/personalapitoken-service/personal-api/personal-api-key/token";

function readApiKey(): string {
  const apiKey = process.env.GARMIN_API_KEY;
  if (apiKey === undefined || apiKey.trim() === "") {
    throw new Error("GARMIN_API_KEY is not set.");
  }
  return apiKey.trim();
}

/**
 * Exchanges the personal API key for a bearer token. The response body is
 * the token itself, not JSON. Tokens last 24 hours and cannot be refreshed,
 * so each pull asks for a new one rather than caching it.
 */
export async function fetchAccessToken(): Promise<string> {
  const response = await fetch(`${GARMIN_API_BASE_URL}${TOKEN_PATH}`, {
    method: "POST",
    headers: {
      Accept: "*/*",
      Authorization: `ApiKey ${readApiKey()}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Garmin token request returned ${response.status}. The personal API ` +
        "key may have expired."
    );
  }

  return (await response.text()).trim();
}

/**
 * GETs one Garmin endpoint as JSON. The cast is the caller's declared shape:
 * Garmin publishes no schema, so each caller types only the fields it reads.
 */
export async function garminGet<TResponse>(
  accessToken: string,
  path: string,
  query: URLSearchParams | null
): Promise<TResponse> {
  const queryString = query === null ? "" : `?${query.toString()}`;
  const response = await fetch(`${GARMIN_API_BASE_URL}${path}${queryString}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Garmin ${path} returned ${response.status}.`);
  }

  return (await response.json()) as TResponse;
}
