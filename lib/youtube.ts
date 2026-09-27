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

/** Muted, looping embed used as a short banner. */
export function youtubeBannerEmbed(raw: string): string | null {
  const id = youtubeId(raw);
  if (!id) return null;
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
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}
