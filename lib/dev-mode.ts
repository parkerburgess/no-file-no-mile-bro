/**
 * True when DISABLE_AUTH=true outside production — the local development
 * bypass. Lives on its own so both lib/auth.ts and lib/dal can read it without
 * the DAL importing auth (which already imports the DAL).
 */
export function isDevBypass(): boolean {
  return (
    process.env.DISABLE_AUTH === "true" &&
    process.env.NODE_ENV !== "production"
  );
}
