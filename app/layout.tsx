import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header, ThemeProvider } from "@parkerburgess/wandering-parker-ui";
import type { ContactConfig } from "@parkerburgess/wandering-parker-ui";
import { requireAthlete } from "@/lib/auth";
import { TRAINING_NAV_ITEMS } from "@/lib/nav";
import { getUserEmail } from "@parkerburgess/wandering-parker-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "no file, no mile",
  description: "Training plans, workouts and activity tracking",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Gates every page: resolves the athlete, enforces the AppAccess grant, and
  // auto-provisions on first sign-in. Cached per request, so a page calling
  // requireAthlete() again costs nothing.
  const athlete = await requireAthlete();

  const contact: ContactConfig = {
    endpoint: `${process.env.AUTH_SERVICE_URL ?? "http://localhost:3001"}/api/contact`,
    sourceApp: "No File No Mile",
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    userEmail: (await getUserEmail()) ?? undefined,
  };

  // #region Tailwind utility consts
  const htmlCls = `${geistSans.variable} ${geistMono.variable} h-full antialiased`;
  // h-full, not min-h-full: the columns scroll independently, so the page
  // itself must be pinned to the viewport rather than growing with content.
  const bodyCls = "h-full grid grid-rows-[auto_minmax(0,1fr)]";
  // #endregion

  return (
    <html lang="en" suppressHydrationWarning className={htmlCls}>
      <body className={bodyCls}>
        <ThemeProvider>
          <Header
            userName={athlete.displayName}
            brandText="No File No Mile"
            navItems={TRAINING_NAV_ITEMS}
            contact={contact}
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
