"use client";

import { useEffect, useState } from "react";
import { fbqSingle, initPixel } from "@/lib/fbq";
import type { PublicTenant } from "@/lib/tenant-schema";
import { MetaPixel } from "./meta-pixel";
import { PageShell } from "./page-shell";
import { PlatformIcon } from "./platform-icon";

const CONSENT_KEY = "sl-consent";

type Consent = "unknown" | "unset" | "accepted" | "declined";

export function BandPage({ tenant }: { tenant: PublicTenant }) {
  const [consent, setConsent] = useState<Consent>("unknown");
  const [email, setEmail] = useState("");
  const [leadState, setLeadState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const pixelId = tenant.pixelId;

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted" || stored === "declined") setConsent(stored);
    else setConsent("unset");
  }, []);

  function choose(next: "accepted" | "declined") {
    localStorage.setItem(CONSENT_KEY, next);
    setConsent(next);
    if (next === "accepted" && pixelId) initPixel(pixelId);
  }

  function onLinkClick(event: React.MouseEvent<HTMLAnchorElement>, link: PublicTenant["links"][number]) {
    if (consent !== "accepted" || !pixelId) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const eventId = crypto.randomUUID();
    initPixel(pixelId);
    fbqSingle(
      pixelId,
      "ViewContent",
      {
        content_name: link.label,
        content_ids: [link.id],
        content_type: "music_link",
        content_category: link.platform,
      },
      eventId
    );
    window.location.assign(`/out/${link.id}?eid=${eventId}&track=1`);
  }

  async function onLead(event: React.FormEvent) {
    event.preventDefault();
    if (leadState === "saving") return;
    setLeadState("saving");
    const eventId = crypto.randomUUID();
    const track = consent === "accepted" && Boolean(pixelId);
    if (track) {
      initPixel(pixelId);
      fbqSingle(
        pixelId,
        "Lead",
        { content_name: tenant.lead.heading, content_category: "mailing_list" },
        eventId
      );
    }
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, eventId, track }),
    });
    setLeadState(res.ok ? "done" : "error");
  }

  return (
    <PageShell name={tenant.name} tagline={tenant.tagline} bannerUrl={tenant.bannerUrl}>
      {consent === "accepted" && pixelId ? <MetaPixel pixelId={pixelId} /> : null}

      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">{tenant.name}</h1>
        {tenant.tagline ? <p className="mx-auto max-w-xl text-sm text-neutral-600">{tenant.tagline}</p> : null}
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 space-y-1 border-b border-neutral-100 pb-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500">{tenant.name}</p>
          <h2 className="text-base font-semibold tracking-tight text-neutral-950">Listen and follow</h2>
        </div>
        <ul className="space-y-2">
          {tenant.links.map((link) => (
            <li key={link.id}>
              <a
                href={`/out/${link.id}`}
                onClick={(event) => onLinkClick(event, link)}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm font-medium text-neutral-950 outline-none transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                <PlatformIcon platform={link.platform} />
                <span className="flex-1">{link.label}</span>
                <span aria-hidden className="text-neutral-400">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {tenant.lead.enabled ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 space-y-1 border-b border-neutral-100 pb-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500">Mailing list</p>
            <h2 className="text-base font-semibold tracking-tight text-neutral-950">{tenant.lead.heading}</h2>
          </div>
          {leadState === "done" ? (
            <p className="text-sm text-neutral-600">You&apos;re on the list.</p>
          ) : (
            <form onSubmit={onLead} className="space-y-3">
              <label htmlFor="email" className="text-sm font-medium text-neutral-900">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-900"
              />
              {leadState === "error" ? <p className="text-xs text-red-600">Couldn&apos;t save that. Try again.</p> : null}
              <button
                type="submit"
                disabled={leadState === "saving"}
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-neutral-950 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                {leadState === "saving" ? "Saving…" : tenant.lead.button}
              </button>
            </form>
          )}
        </section>
      ) : null}

      {pixelId && consent === "unset" ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white px-4 py-4">
          <div className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-600">We use Meta to see which links get opened.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => choose("declined")}
                className="inline-flex h-9 items-center rounded-full border border-neutral-200 px-3 text-xs text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="inline-flex h-9 items-center rounded-full bg-neutral-950 px-3 text-xs font-medium text-white hover:bg-neutral-800"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
