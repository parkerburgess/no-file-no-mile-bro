import { redirect } from "next/navigation";
import { legacyTabHref } from "@/lib/nav";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * "/" has no view of its own. It sends a bare visit to the default view and
 * a legacy "/?tab=races" link to "/races", so old bookmarks keep working.
 */
export default async function HomePage({ searchParams }: Props) {
  const { tab } = await searchParams;
  redirect(legacyTabHref(tab));
}
