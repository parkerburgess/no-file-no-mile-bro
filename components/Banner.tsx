"use client";

import Image from "next/image";
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
    "border-neutral-200 grid grid-cols-[1fr_auto_1fr] items-center " +
    "h-20 px-8";
  const leftColCls = "justify-self-start";
  const bannerImgCls =
    "justify-self-center h-full w-auto max-h-full object-contain " +
    "cursor-pointer";
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
      <div className={leftColCls} />

      <Image
        src="/Banner.jpg"
        alt="no file, no mile"
        width={476}
        height={80}
        className={bannerImgCls}
        onClick={handleBrandClick}
        priority
      />

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
