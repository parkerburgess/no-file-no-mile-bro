type Props = {
  label: string;
};

/** A panel's loading state while the page pulls from Garmin. */
export default function PullingSpinner({ label }: Props) {
  // #region Tailwind utility consts
  const wrapperCls = "grid justify-items-center gap-3 p-8";
  const spinnerCls =
    "size-8 animate-spin rounded-full border-4 border-neutral-300 " +
    "border-t-primary-600";
  const labelCls = "text-sm text-neutral-500";
  // #endregion

  return (
    <div className={wrapperCls} role="status" aria-live="polite">
      <div className={spinnerCls} aria-hidden="true" />
      <p className={labelCls}>{label}</p>
    </div>
  );
}
