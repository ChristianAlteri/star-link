type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const inited = new Set<string>();

export function ensureFbq() {
  if (typeof window === "undefined" || window.fbq) return;

  const fbq = function (this: Fbq, ...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
    else fbq.queue.push(args);
  } as Fbq;

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}

export function initPixel(pixelId: string) {
  if (!pixelId) return;
  ensureFbq();
  if (inited.has(pixelId) || !window.fbq) return;
  window.fbq("init", pixelId);
  inited.add(pixelId);
}

/** trackSingle so a future second pixel on the page cannot receive this event. */
export function fbqSingle(
  pixelId: string,
  event: "PageView" | "ViewContent" | "Lead",
  params: Record<string, unknown>,
  eventID: string
) {
  if (!pixelId || typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("trackSingle", pixelId, event, params, { eventID });
}
