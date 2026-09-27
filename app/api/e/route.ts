import { NextResponse } from "next/server";
import { z } from "zod";
import { isEventId } from "@/lib/event-id";
import { sendMetaCAPIEvent } from "@/lib/meta-capi";
import { attributionFromRequest, sameOrigin } from "@/lib/request-meta";
import { getRequestTenant, trackingReady } from "@/lib/tenants";

const bodySchema = z.object({
  eventId: z.string().refine(isEventId),
  eventName: z.literal("PageView"),
  eventSourceUrl: z.string().url().max(500).optional(),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });

  const tenant = await getRequestTenant();
  if (!tenant) return NextResponse.json({ ok: false }, { status: 404 });
  if (!trackingReady(tenant)) return NextResponse.json({ ok: true, skipped: true });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const attribution = attributionFromRequest(req, parsed.data.eventSourceUrl);
  await sendMetaCAPIEvent({
    pixelId: tenant.meta.pixelId,
    accessToken: tenant.meta.capiAccessToken,
    eventName: "PageView",
    eventId: parsed.data.eventId,
    eventSourceUrl: attribution.eventSourceUrl,
    testEventCode: tenant.meta.testEventCode || undefined,
    userData: attribution,
  });

  return NextResponse.json({ ok: true });
}
