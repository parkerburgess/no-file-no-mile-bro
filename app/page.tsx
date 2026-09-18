import { requireAthlete } from "@/lib/auth";
import { dal } from "@/lib/dal";

export default async function HomePage() {
  const athlete = await requireAthlete();
  const lookups = await dal.lookups.getAll();
  const navSports = lookups.sports.filter((sport) => sport.showInNav);

  // #region Tailwind utility consts
  const mainCls = "px-8 py-12 grid gap-8 justify-items-start";
  const headingCls = "text-2xl font-semibold text-neutral-900";
  const bodyCls = "text-base text-neutral-600 max-w-prose";
  const noticeCls =
    "rounded-lg border border-caution-400 bg-caution-50 px-6 py-4 " +
    "text-sm text-neutral-800 max-w-prose";
  const listCls = "grid gap-2 text-sm text-neutral-600";
  const labelCls = "text-sm font-medium text-neutral-500";
  // #endregion

  return (
    <main className={mainCls}>
      <h1 className={headingCls}>Training</h1>

      <p className={bodyCls}>
        No surfaces are built yet. This page exists to prove the shared sign-on
        resolved a real athlete and that the schema is reachable.
      </p>

      {!athlete.isProfileComplete && (
        <p className={noticeCls}>
          Your profile is not complete. Birth date is still a placeholder, so the
          MAF heart rate ceiling cannot be calculated yet.
        </p>
      )}

      <div className={listCls}>
        <span className={labelCls}>Signed in as</span>
        <span>
          {athlete.displayName} ({athlete.email})
        </span>

        <span className={labelCls}>Auth user id</span>
        <span>{athlete.userId ?? "(unlinked)"}</span>

        <span className={labelCls}>Athlete id</span>
        <span>{athlete.athleteId}</span>

        <span className={labelCls}>Sports in nav</span>
        <span>{navSports.map((sport) => sport.name).join(", ")}</span>
      </div>
    </main>
  );
}
