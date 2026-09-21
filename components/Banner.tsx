"use client";

import { useRouter } from "next/navigation";
import { UserMenu, useTheme } from "@parkerburgess/wandering-parker-ui";

type Props = {
  userName: string;
};

export default function Banner({ userName }: Props) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  // #region Tailwind utility consts
  const headerCls =
    "w-full flex-shrink-0 sticky top-0 z-10 bg-surface border-b " +
    "border-neutral-200 grid grid-cols-2 items-center px-8 py-6";
  const brandCls =
    "text-xl font-semibold text-neutral-900 justify-self-start cursor-pointer";
  const rightColCls = "justify-self-end";
  // #endregion

  function handleBrandClick() {
    router.push("/");
  }

  function handleToggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <header className={headerCls}>
      <button type="button" onClick={handleBrandClick} className={brandCls}>
        no file, no mile
      </button>

      <div className={rightColCls}>
        <UserMenu
          userName={userName}
          theme={resolvedTheme}
          onToggleTheme={handleToggleTheme}
        />
      </div>
    </header>
  );
}
