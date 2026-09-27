import { notFound } from "next/navigation";
import { BandPage } from "@/components/band-page";
import { toPublicTenant, getRequestTenant } from "@/lib/tenants";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tenant = await getRequestTenant();
  if (!tenant) notFound();
  return <BandPage tenant={toPublicTenant(tenant)} />;
}
