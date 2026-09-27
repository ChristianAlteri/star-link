import "server-only";

import { createHash } from "crypto";

const GRAPH_API_VERSION = "v21.0";

export type CapiUserData = {
  email?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
};

export type CapiCustomData = {
  contentIds?: string[];
  contentType?: string;
  contentCategory?: string;
  contentName?: string;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hashIfPresent(value: string | undefined) {
  if (!value?.trim()) return undefined;
  return sha256(value.trim().toLowerCase());
}

/**
 * One event to Meta's Conversions API.
 * Logs failures and never throws — a tracking miss must not break the redirect.
 */
export async function sendMetaCAPIEvent(params: {
  pixelId: string;
  accessToken: string;
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  userData: CapiUserData;
  customData?: CapiCustomData;
  testEventCode?: string;
}): Promise<void> {
  if (!params.pixelId || !params.accessToken) return;

  try {
    const userData: Record<string, string> = {};
    const email = hashIfPresent(params.userData.email);
    if (email) userData.em = email;
    if (params.userData.clientIpAddress) userData.client_ip_address = params.userData.clientIpAddress;
    if (params.userData.clientUserAgent) userData.client_user_agent = params.userData.clientUserAgent;
    if (params.userData.fbc) userData.fbc = params.userData.fbc;
    if (params.userData.fbp) userData.fbp = params.userData.fbp;

    const event: Record<string, unknown> = {
      event_name: params.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: params.eventId,
      action_source: "website",
      user_data: userData,
    };

    if (params.eventSourceUrl) event.event_source_url = params.eventSourceUrl;

    if (params.customData) {
      const custom: Record<string, unknown> = {};
      if (params.customData.contentIds?.length) {
        custom.content_ids = params.customData.contentIds;
        custom.content_type = params.customData.contentType ?? "music_link";
      }
      if (params.customData.contentCategory) custom.content_category = params.customData.contentCategory;
      if (params.customData.contentName) custom.content_name = params.customData.contentName;
      if (Object.keys(custom).length > 0) event.custom_data = custom;
    }

    const body: Record<string, unknown> = {
      data: [event],
      access_token: params.accessToken,
    };
    if (params.testEventCode) body.test_event_code = params.testEventCode;

    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${params.pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[META_CAPI] ${params.eventName} failed (${res.status}): ${text}`);
      return;
    }

    const result = (await res.json()) as { events_received?: number };
    console.log(
      `[META_CAPI] ${params.eventName} sent — event_id=${params.eventId}, events_received=${result.events_received ?? "?"}`
    );
  } catch (err) {
    console.error(`[META_CAPI] ${params.eventName} error:`, err);
  }
}
