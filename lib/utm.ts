export function withOutboundUtm(rawUrl: string, opts: { source: string; campaign: string }) {
  const url = new URL(rawUrl);
  if (!url.searchParams.has("utm_source")) url.searchParams.set("utm_source", opts.source);
  if (!url.searchParams.has("utm_medium")) url.searchParams.set("utm_medium", "bio");
  if (!url.searchParams.has("utm_campaign")) url.searchParams.set("utm_campaign", opts.campaign);
  return url.toString();
}
