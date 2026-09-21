import { Panel } from "@parkerburgess/wandering-parker-ui";

export default function FriendsPanel() {
  // #region Tailwind utility consts
  const emptyCls =
    "rounded-lg border border-dashed border-neutral-300 p-4 text-sm " +
    "text-neutral-500";
  // #endregion

  return (
    <Panel title="Friends">
      <p className={emptyCls}>
        Nothing here yet. Friends are not modeled in the schema.
      </p>
    </Panel>
  );
}
