"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import type { AirRole } from "@/lib/air-portal";
import AirPageShell from "@/components/air/AirPageShell";
import { submitWebsiteInquiry } from "@/lib/submit-website-inquiry";

export default function AirSupportPage({ role }: { role: AirRole }) {
  const backHref = role === "carrier" ? "/air/forwarder/dashboard" : "/air/shipper/dashboard";
  const sourcePage = role === "carrier" ? "/air/forwarder/support" : "/air/shipper/support";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      await submitWebsiteInquiry({
        inquiryType: "air_support",
        sourcePage,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || `Air ${role} support`,
        message: message.trim(),
        metadata: { airRole: role },
      });

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setStatus({
        type: "success",
        message: "Support request sent. Our team will reply by email shortly.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to send your request. Please email support@alphafreightuk.com.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AirPageShell
      title="Support"
      description="Get help with AWBs, bookings, billing, or your account."
      backHref={backHref}
    >
      <form onSubmit={submit} className="max-w-xl space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Full name</label>
          <input
            className="air-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">Email</label>
          <input
            className="air-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>
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

        {status ? (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              status.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
            }`}
          >
            {status.message}
          </p>
        ) : null}

        <button type="submit" disabled={submitting} className="air-btn-primary max-w-xs inline-flex items-center gap-2">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Contact support"
          )}
        </button>
      </form>
    </AirPageShell>
  );
}
