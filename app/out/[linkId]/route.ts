import { NextResponse } from "next/server";
import { isEventId } from "@/lib/event-id";
import { sendMetaCAPIEvent } from "@/lib/meta-capi";
import { attributionFromRequest } from "@/lib/request-meta";
import { getRequestTenant, trackingReady } from "@/lib/tenants";
import { withOutboundUtm } from "@/lib/utm";

export async function GET(req: Request, ctx: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await ctx.params;
  const tenant = await getRequestTenant();
  if (!tenant) return new Response("Not found", { status: 404 });

  const link = tenant.links.find((item) => item.id === linkId);
  if (!link) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const track = url.searchParams.get("track") === "1";
  const eid = url.searchParams.get("eid");

  if (track && trackingReady(tenant) && isEventId(eid)) {
    const attribution = attributionFromRequest(req);
    await sendMetaCAPIEvent({
      pixelId: tenant.meta.pixelId,
      accessToken: tenant.meta.capiAccessToken,
      eventName: "ViewContent",
      eventId: eid,
      eventSourceUrl: attribution.eventSourceUrl,
      testEventCode: tenant.meta.testEventCode || undefined,
      userData: attribution,
      customData: {
        contentIds: [link.id],
        contentType: "music_link",
        contentCategory: link.platform,
        contentName: link.label,
      },
    });
  }

  const destination = withOutboundUtm(link.url, {
    source: tenant.slug,
    campaign: link.id,
  });
  return NextResponse.redirect(destination, 302);
}
