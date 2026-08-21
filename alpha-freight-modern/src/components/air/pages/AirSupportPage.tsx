"use client";

import { FormEvent, useState } from "react";
import type { AirRole } from "@/lib/air-portal";
import AirPageShell from "@/components/air/AirPageShell";

export default function AirSupportPage({ role }: { role: AirRole }) {
  const backHref = role === "carrier" ? "/air/forwarder/dashboard" : "/air/shipper/dashboard";
  const [sent, setSent] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const mailto = `mailto:support@alphafreightuk.com?subject=${encodeURIComponent(`Air ${role}: ${subject}`)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailto;
    setSent(true);
  };

  return (
    <AirPageShell
      title="Support"
      description="Get help with AWBs, bookings, billing, or your account."
      backHref={backHref}
    >
      <form onSubmit={submit} className="max-w-xl space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Subject</label>
          <input
            className="air-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. AWB tracking issue"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Message</label>
          <textarea
            className="air-input min-h-[120px] resize-y"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue…"
            required
          />
        </div>
        <button type="submit" className="air-btn-primary max-w-xs">
          {sent ? "Opening email…" : "Contact support"}
        </button>
      </form>
    </AirPageShell>
  );
}
