import { z } from "zod";

export const PLATFORMS = [
  "spotify",
  "apple_music",
  "youtube",
  "instagram",
  "tiktok",
  "bandcamp",
  "website",
  "other",
] as const;

const linkSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]+$/),
  label: z.string().min(1),
  url: z.string().url(),
  platform: z.enum(PLATFORMS),
});

export const tenantSchema = z.object({
  slug: z.string().min(1),
  hosts: z.array(z.string().min(1)).default([]),
  name: z.string().min(1),
  tagline: z.string().default(""),
  avatarUrl: z.string().default(""),
  bannerUrl: z.string().default(""),
  theme: z.object({
    bg: z.string().min(1),
    fg: z.string().min(1),
    accent: z.string().min(1),
  }),
  privacyUrl: z.string().optional(),
  meta: z
    .object({
      pixelId: z.string().default(""),
      capiAccessToken: z.string().default(""),
      testEventCode: z.string().default(""),
    })
    .default({
      pixelId: "",
      capiAccessToken: "",
      testEventCode: "",
    }),
  links: z.array(linkSchema).min(1),
  lead: z
    .object({
      enabled: z.boolean().default(false),
      heading: z.string().default("Get the next drop"),
      button: z.string().default("Join"),
    })
    .default({
      enabled: false,
      heading: "Get the next drop",
      button: "Join",
    }),
});

export const tenantListSchema = z.array(tenantSchema).min(1);

export type Tenant = z.infer<typeof tenantSchema>;
export type TenantLink = Tenant["links"][number];

export type PublicTenant = {
  slug: string;
  name: string;
  tagline: string;
  avatarUrl: string;
  bannerUrl: string;
  theme: Tenant["theme"];
  pixelId: string;
  links: { id: string; label: string; platform: TenantLink["platform"] }[];
  lead: Tenant["lead"];
};

function hostnameOf(host: string) {
  return host.split(":")[0].trim().toLowerCase();
}

/** One tenant always resolves. Several tenants 404 on an unknown host. */
export function resolveTenant(tenants: Tenant[], hostHeader: string | null): Tenant | null {
  if (tenants.length === 0) return null;
  const host = hostnameOf(hostHeader || "");
  const match = tenants.find((tenant) => tenant.hosts.some((candidate) => hostnameOf(candidate) === host));
  if (match) return match;
  if (tenants.length === 1) return tenants[0];
  return null;
}

export function toPublicTenant(tenant: Tenant): PublicTenant {
  return {
    slug: tenant.slug,
    name: tenant.name,
    tagline: tenant.tagline,
    avatarUrl: tenant.avatarUrl,
    bannerUrl: tenant.bannerUrl,
    theme: tenant.theme,
    pixelId: tenant.meta.pixelId,
    links: tenant.links.map((link) => ({
      id: link.id,
      label: link.label,
      platform: link.platform,
    })),
    lead: tenant.lead,
  };
}
