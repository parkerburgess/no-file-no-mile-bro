/**
 * True when DISABLE_AUTH=true outside production — the local development
 * bypass. Lives on its own so lib/auth.ts can read it without importing
 * anything that imports auth.
 */
export function isDevBypass(): boolean {
  return (
    process.env.DISABLE_AUTH === "true" &&
    process.env.NODE_ENV !== "production"
  );
}
