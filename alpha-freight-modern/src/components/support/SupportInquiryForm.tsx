"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { submitWebsiteInquiry } from "@/lib/submit-website-inquiry";
import type { InquiryType } from "@/lib/inquiry-content";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
const labelClass = "text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500";

type SupportInquiryFormProps = {
  inquiryType: InquiryType;
  sourcePage: string;
  title?: string;
  description?: string;
  showPhone?: boolean;
  subjectPlaceholder?: string;
  messagePlaceholder?: string;
  submitLabel?: string;
  className?: string;
  metadata?: Record<string, unknown>;
  defaultSubject?: string;
};

export default function SupportInquiryForm({
  inquiryType,
  sourcePage,
  title = "Contact support",
  description = "Send us a message and our team will reply as soon as possible.",
  showPhone = false,
  subjectPlaceholder = "Brief subject",
  messagePlaceholder = "How can we help?",
  submitLabel = "Send message",
  className = "",
  metadata,
  defaultSubject = "",
}: SupportInquiryFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      await submitWebsiteInquiry({
        inquiryType,
        sourcePage,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: subject.trim() || undefined,
        message: message.trim(),
        metadata,
      });

      setName("");
      setEmail("");
      setPhone("");
      setSubject(defaultSubject);
      setMessage("");
      setStatus({
        type: "success",
        message: "Message sent. Our team will get back to you shortly.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to send your message. Please try again or email support@alphafreightuk.com.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={`rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8 ${className}`}>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${inquiryType}-name`} className={labelClass}>
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id={`${inquiryType}-name`}
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (status) setStatus(null);
              }}
              className={inputClass}
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor={`${inquiryType}-email`} className={labelClass}>
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id={`${inquiryType}-email`}
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status) setStatus(null);
              }}
              className={inputClass}
              placeholder="you@company.com"
            />
          </div>
        </div>

        {showPhone ? (
          <div>
            <label htmlFor={`${inquiryType}-phone`} className={labelClass}>
              Phone
            </label>
            <input
              id={`${inquiryType}-phone`}
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (status) setStatus(null);
              }}
              className={inputClass}
              placeholder="+44 ..."
            />
          </div>
        ) : null}

        <div>
          <label htmlFor={`${inquiryType}-subject`} className={labelClass}>
            Subject
          </label>
          <input
            id={`${inquiryType}-subject`}
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (status) setStatus(null);
            }}
            className={inputClass}
            placeholder={subjectPlaceholder}
          />
        </div>

        <div>
          <label htmlFor={`${inquiryType}-message`} className={labelClass}>
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id={`${inquiryType}-message`}
            required
            rows={5}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (status) setStatus(null);
            }}
            className={`${inputClass} resize-y`}
            placeholder={messagePlaceholder}
          />
        </div>

        {status ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {status.message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {submitLabel}
            </>
          )}
        </button>
      </form>
    </section>
  );
}
