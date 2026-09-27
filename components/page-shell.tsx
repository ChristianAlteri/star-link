import type { ReactNode } from "react";
import Link from "next/link";
import { youtubeBannerEmbed } from "@/lib/youtube";

export function PageShell({
  name,
  bannerUrl,
  children,
}: {
  name: string;
  bannerUrl?: string;
  children: ReactNode;
}) {
  const embed = bannerUrl ? youtubeBannerEmbed(bannerUrl) : null;

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-xl items-center px-4 py-3 sm:px-6">
          <Link href="/" className="truncate text-base font-semibold tracking-tight text-neutral-950">
            {name}
          </Link>
        </div>
      </header>

      {embed ? (
        <div className="relative h-52 overflow-hidden bg-neutral-900 sm:h-72">
          <iframe
            className="pointer-events-none absolute left-1/2 top-1/2 aspect-video w-[180%] min-w-full -translate-x-1/2 -translate-y-1/2 scale-125"
            src={embed}
            title=""
            tabIndex={-1}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-xl space-y-8 px-4 pb-28 pt-10 sm:px-6">{children}</main>
    </div>
  );
}
