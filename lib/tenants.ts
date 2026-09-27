import "server-only";

import fs from "fs";
import path from "path";
import { headers } from "next/headers";
import { resolveTenant, tenantListSchema, type Tenant } from "@/lib/tenant-schema";

/**
 * Tenant loader. Pages and routes call getRequestTenant() and nothing else.
 * Today: config/tenants.json, replaced wholesale by TENANTS_JSON.
 * One-day database swap: change this file's read path. Keep the Tenant shape.
 * See docs/design.md.
 */

export { toPublicTenant, resolveTenant } from "@/lib/tenant-schema";
export type { PublicTenant, Tenant, TenantLink } from "@/lib/tenant-schema";

function readTokenMap(): Record<string, string> {
  const raw = process.env.CAPI_TOKENS?.trim();
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("CAPI_TOKENS must be a JSON object of slug → token");
  }
  const out: Record<string, string> = {};
  for (const [slug, token] of Object.entries(parsed)) {
    if (typeof token === "string" && token.trim()) out[slug] = token.trim();
  }
  return out;
}

function applySecrets(tenants: Tenant[]): Tenant[] {
  const single = tenants.length === 1;
  const globalPixel = process.env.META_PIXEL_ID?.trim() || "";
  const globalToken = process.env.CAPI_ACCESS_TOKEN?.trim() || "";
  const globalTest = process.env.META_TEST_EVENT_CODE?.trim() || "";
  const tokenMap = readTokenMap();

  return tenants.map((tenant) => ({
    ...tenant,
    meta: {
      pixelId: tenant.meta.pixelId || (single ? globalPixel : ""),
      capiAccessToken: tenant.meta.capiAccessToken || tokenMap[tenant.slug] || (single ? globalToken : ""),
      testEventCode: tenant.meta.testEventCode || (single ? globalTest : ""),
    },
  }));
}

function readConfigText(): string {
  const fromEnv = process.env.TENANTS_JSON?.trim();
  if (fromEnv) return fromEnv;
  const file = path.join(process.cwd(), "config", "tenants.json");
  return fs.readFileSync(file, "utf8");
}

let cached: Tenant[] | null = null;

export function loadTenants(): Tenant[] {
  if (cached && process.env.NODE_ENV === "production") return cached;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readConfigText());
  } catch (err) {
    throw new Error(`Tenant config is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  const tenants = applySecrets(tenantListSchema.parse(parsed));
  cached = tenants;
  return tenants;
}

export async function getRequestTenant(): Promise<Tenant | null> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  return resolveTenant(loadTenants(), host);
}

export function trackingReady(tenant: Tenant) {
  return Boolean(tenant.meta.pixelId && tenant.meta.capiAccessToken);
}
