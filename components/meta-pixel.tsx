"use client";

import { useEffect, useRef } from "react";
import { fbqSingle, initPixel } from "@/lib/fbq";

export function MetaPixel({ pixelId }: { pixelId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (!pixelId || fired.current) return;
    fired.current = true;
    const eventId = crypto.randomUUID();
    initPixel(pixelId);
    fbqSingle(pixelId, "PageView", {}, eventId);
    const payload = JSON.stringify({
      eventId,
      eventName: "PageView",
      eventSourceUrl: window.location.href,
    });
    navigator.sendBeacon("/api/e", new Blob([payload], { type: "application/json" }));
  }, [pixelId]);

  return null;
}
