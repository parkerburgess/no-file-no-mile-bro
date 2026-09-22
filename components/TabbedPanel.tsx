import Link from "next/link";
import { TAB_DEFINITIONS, tabHref } from "@/lib/tabs";
import type { TabId } from "@/lib/tabs";

type Props = {
  activeTabId: TabId;
  children: React.ReactNode;
};

/**
 * The middle column's shell. It replaces wp-ui's Panel rather than nesting
 * inside it: the tab strip takes the place of the panel title, so the column
 * keeps Panel's `auto` + `1fr` row contract and its body goes on scrolling
 * independently of the two side columns.
 *
 * These are links, not a WAI-ARIA tablist. A tablist promises arrow-key
 * roving focus over panels that are already in the document; these navigate
 * and re-render the server. `aria-current` describes what actually happens.
 */
function tabLinkCls(isActive: boolean): string {
  const baseCls =
    "-mb-px border-b-2 px-4 py-2 text-sm font-medium cursor-pointer " +
    "transition-colors";

  if (isActive) {
    return `${baseCls} border-primary-600 text-neutral-900`;
  }

  return (
    `${baseCls} border-transparent text-neutral-500 ` +
    "hover:border-neutral-300 hover:text-neutral-800"
  );
}

export default function TabbedPanel({ activeTabId, children }: Props) {
  // #region Tailwind utility consts
  const panelCls = "grid grid-rows-[auto_1fr] min-h-0 h-full gap-3";
  const tabStripCls =
    "grid grid-flow-col auto-cols-max justify-start gap-1 " +
    "border-b border-neutral-200";
  const bodyCls = "grid content-start gap-3 min-h-0 overflow-y-auto pr-1";
  // #endregion

  return (
    <section id="wp-tabbed-panel" className={panelCls}>
      <nav className={tabStripCls} aria-label="Training views">
        {TAB_DEFINITIONS.map((tab) => (
          <Link
            key={tab.id}
            href={tabHref(tab.id)}
            aria-current={tab.id === activeTabId ? "page" : undefined}
            className={tabLinkCls(tab.id === activeTabId)}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className={bodyCls}>{children}</div>
    </section>
  );
}
