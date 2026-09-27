export function clientIpFromRequest(req: Request): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  return real || undefined;
}

export function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name && rest.length > 0) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return rest.join("=");
      }
    }
  }
  return undefined;
}

export function resolveEventSourceUrl(req: Request, explicit?: string): string | undefined {
  const candidates = [explicit, req.headers.get("referer") || undefined];
  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    try {
      const url = new URL(candidate.trim());
      if (url.protocol !== "https:" && url.protocol !== "http:") continue;
      return url.toString().slice(0, 500);
    } catch {
      continue;
    }
  }
  return undefined;
}

export function attributionFromRequest(req: Request, explicitUrl?: string) {
  return {
    clientIpAddress: clientIpFromRequest(req),
    clientUserAgent: req.headers.get("user-agent") || undefined,
    fbp: readCookie(req.headers.get("cookie"), "_fbp"),
    fbc: readCookie(req.headers.get("cookie"), "_fbc"),
    eventSourceUrl: resolveEventSourceUrl(req, explicitUrl),
  };
}

export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
