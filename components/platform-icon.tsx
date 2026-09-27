import type { TenantLink } from "@/lib/tenant-schema";

type Platform = TenantLink["platform"];

function Glyph({ platform }: { platform: Platform }) {
  const common = { viewBox: "0 0 24 24", className: "h-5 w-5", "aria-hidden": true as const };
  switch (platform) {
    case "spotify":
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 1.5C6.21 1.5 1.5 6.21 1.5 12S6.21 22.5 12 22.5 22.5 17.79 22.5 12 17.79 1.5 12 1.5zm4.58 14.9a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 0 1-.33-1.46c4.56-1.04 8.47-.6 11.66 1.34a.75.75 0 0 1 .25 1.03zm1.42-3.16a.94.94 0 0 1-1.29.31c-3.23-1.99-8.15-2.56-11.97-1.4a.94.94 0 0 1-.54-1.8c4.37-1.32 9.8-.68 13.49 1.6a.94.94 0 0 1 .31 1.29zm.12-3.29C14.9 7.7 8.7 7.48 5.2 8.54a1.12 1.12 0 1 1-.65-2.15c4.05-1.22 10.7-.98 14.9 1.62a1.12 1.12 0 0 1-1.13 1.94z" />
        </svg>
      );
    case "apple_music":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V6l10-2v12" />
          <circle cx="6.5" cy="18" r="2.5" fill="currentColor" stroke="none" />
          <circle cx="16.5" cy="16" r="2.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} fill="currentColor">
          <path d="M23.5 6.2a3 3 0 0 0-2.12-2.14C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.38.46A3 3 0 0 0 .5 6.2 31.8 31.8 0 0 0 0 12a31.8 31.8 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.14c1.88.46 9.38.46 9.38.46s7.5 0 9.38-.46a3 3 0 0 0 2.12-2.14A31.8 31.8 0 0 0 24 12a31.8 31.8 0 0 0-.5-5.8zM9.75 15.57V8.43L15.84 12l-6.09 3.57z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common} fill="currentColor">
          <path d="M14.2 3h2.05a4.7 4.7 0 0 0 3.55 3.4v2.12a6.8 6.8 0 0 1-3.55-1.02v6.72a5.55 5.55 0 1 1-5.55-5.55c.22 0 .43.02.64.05v2.2a3.38 3.38 0 1 0 2.36 3.22V3z" />
        </svg>
      );
    default:
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M10 13a5 5 0 0 0 7.07.07l1.42-1.42a5 5 0 0 0-7.07-7.07L10.5 5.5" />
          <path d="M14 11a5 5 0 0 0-7.07-.07L5.5 12.35a5 5 0 0 0 7.07 7.07l.92-.92" />
        </svg>
      );
  }
}

const tile: Record<Platform, string> = {
  spotify: "bg-[#1DB954] text-white",
  apple_music: "bg-[#FA243C] text-white",
  youtube: "bg-[#FF0033] text-white",
  instagram: "bg-[linear-gradient(135deg,#f9ce34,#ee2a7b_55%,#6228d7)] text-white",
  tiktok: "bg-neutral-950 text-white",
  bandcamp: "bg-[#1DA0C3] text-white",
  website: "bg-neutral-800 text-white",
  other: "bg-neutral-800 text-white",
};

export function PlatformIcon({ platform }: { platform: Platform }) {
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tile[platform]}`}>
      <Glyph platform={platform} />
    </span>
  );
}
