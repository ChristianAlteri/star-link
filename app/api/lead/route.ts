import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isEventId } from "@/lib/event-id";
import { sendMetaCAPIEvent } from "@/lib/meta-capi";
import { attributionFromRequest, sameOrigin } from "@/lib/request-meta";
import { getRequestTenant, trackingReady } from "@/lib/tenants";

const bodySchema = z.object({
  email: z.string().trim().email().max(200),
  eventId: z.string().refine(isEventId),
  track: z.boolean().default(false),
});

async function storeLead(tenantSlug: string, email: string, eventId: string) {
  const dir = path.join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  const line = JSON.stringify({
    at: new Date().toISOString(),
    tenant: tenantSlug,
    email,
    eventId,
  });
  await appendFile(path.join(dir, "leads.jsonl"), `${line}\n`, "utf8");
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });

  const tenant = await getRequestTenant();
  if (!tenant || !tenant.lead.enabled) return NextResponse.json({ ok: false }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await storeLead(tenant.slug, parsed.data.email, parsed.data.eventId);
  } catch (err) {
    console.error("[lead] store failed", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (parsed.data.track && trackingReady(tenant)) {
    const attribution = attributionFromRequest(req);
    await sendMetaCAPIEvent({
      pixelId: tenant.meta.pixelId,
      accessToken: tenant.meta.capiAccessToken,
      eventName: "Lead",
      eventId: parsed.data.eventId,
      eventSourceUrl: attribution.eventSourceUrl,
      testEventCode: tenant.meta.testEventCode || undefined,
      userData: { ...attribution, email: parsed.data.email },
      customData: {
        contentName: tenant.lead.heading,
        contentCategory: "mailing_list",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
