type Props = {
  headline: string;
  detail: string;
};

/**
 * A tab whose surface is designed but not built. It deliberately looks like
 * the empty states elsewhere in the shell rather than like a broken panel, so
 * the difference between "nothing here yet" and "something failed" stays
 * visible.
 */
export default function PlaceholderPanel({ headline, detail }: Props) {
  // #region Tailwind utility consts
  const emptyCls =
    "grid gap-1.5 rounded-lg border border-dashed border-neutral-300 p-6";
  const headlineCls = "text-sm font-semibold text-neutral-700";
  const detailCls = "text-sm leading-relaxed text-neutral-500";
  // #endregion

  return (
    <div className={emptyCls}>
      <p className={headlineCls}>{headline}</p>
      <p className={detailCls}>{detail}</p>
    </div>
  );
}
