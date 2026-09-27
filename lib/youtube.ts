/** Pull the 11-character id out of a watch, share, shorts, or embed URL. */
export function youtubeId(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    else if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "m.youtube.com") {
      if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")) {
        id = url.pathname.split("/")[2] ?? "";
      } else {
        id = url.searchParams.get("v") ?? "";
      }
    }
    return /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Seconds from `t` or `start`. Accepts `14`, `14s`, `1m14s`, `1h2m3s`. */
export function youtubeStartSeconds(raw: string): number {
  try {
    const url = new URL(raw.trim());
    const value = url.searchParams.get("t") ?? url.searchParams.get("start");
    if (!value) return 0;
    if (/^\d+$/.test(value)) return Number(value);
    const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i.exec(value);
    if (!match || match[0] !== value) return 0;
    return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
  } catch {
    return 0;
  }
}

/** Muted, looping embed used as a short banner. */
export function youtubeBannerEmbed(raw: string): string | null {
  const id = youtubeId(raw);
  if (!id) return null;
  const start = youtubeStartSeconds(raw);
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: id,
    controls: "0",
    modestbranding: "1",
    playsinline: "1",
    rel: "0",
    iv_load_policy: "3",
  });
  if (start > 0) params.set("start", String(start));
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}
