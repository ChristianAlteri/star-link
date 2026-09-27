import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { getRequestTenant } from "@/lib/tenants";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const tenant = await getRequestTenant();
  if (!tenant) notFound();

  return (
    <PageShell name={tenant.name}>
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">Privacy</h1>
        <p className="mx-auto max-w-xl text-sm text-neutral-600">{tenant.name}</p>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-4 text-sm leading-6 text-neutral-600">
          <p>This page shares {tenant.name}&apos;s links.</p>
          <p>
            If you accept measurement, page views and link taps are sent to Meta from your browser and from this
            server. That includes your IP address, browser, the page URL, and Meta&apos;s cookies when they exist.{" "}
            {tenant.name} uses those events to see which links get opened and to build audiences for ads.
          </p>
          <p>
            If you leave an email, it is stored for {tenant.name}. It is hashed before it is sent to Meta, and it is
            only sent when you have accepted measurement.
          </p>
          <p>If you decline, the links still open. Nothing is sent to Meta.</p>
        </div>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
        >
          Back
        </Link>
      </section>
    </PageShell>
  );
}
