"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, Send, Star } from "lucide-react";

import {
  feedbackTypes,
  feedbackUserRoles,
  type FeedbackType,
  type FeedbackUserRole,
} from "@/lib/feedback-content";

const SUPPORT_EMAIL = "support@alphafreightuk.com";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#a8d900] focus:bg-white focus:ring-2 focus:ring-[#BFFF07]/25";
const labelClass = "text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500";
const sectionClass = "rounded-2xl border border-slate-100 bg-slate-50/40 p-5 sm:p-6";
const sectionTitleClass = "text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400";

type FeedbackFormProps = {
  defaultRole?: FeedbackUserRole;
  pageUrl?: string;
};

export default function FeedbackForm({ defaultRole = "visitor", pageUrl }: FeedbackFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userRole, setUserRole] = useState<FeedbackUserRole>(defaultRole);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [rating, setRating] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [resolvedPageUrl, setResolvedPageUrl] = useState(pageUrl ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverStar, setHoverStar] = useState<number | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setUserRole(defaultRole);
  }, [defaultRole]);

  useEffect(() => {
    if (!pageUrl && typeof window !== "undefined") {
      setResolvedPageUrl(window.location.href);
    }
  }, [pageUrl]);

  const clearStatus = () => {
    if (status) setStatus(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    if (!rating) {
      setStatus({ type: "error", message: "Please select a star rating before submitting." });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          userRole,
          feedbackType,
          rating,
          subject,
          message,
          pageUrl: resolvedPageUrl,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to submit feedback.");
      }

      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
      setRating(null);
      setStatus({
        type: "success",
        message: "Thank you! Your feedback has been received. We review every submission within 2 business days.",
      });
    } catch (submitError) {
      setStatus({
        type: "error",
        message:
          submitError instanceof Error
            ? submitError.message
            : "We could not submit your feedback. Please try again or email us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStar = hoverStar ?? rating ?? 0;

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className={sectionClass}>
        <p className={sectionTitleClass}>About you</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="feedback-name" className={labelClass}>
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="feedback-name"
            type="text"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearStatus();
            }}
            placeholder="John Doe"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="feedback-email" className={labelClass}>
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            id="feedback-email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearStatus();
            }}
            placeholder="john@example.com"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="feedback-phone" className={labelClass}>
            Phone number <span className="normal-case tracking-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="feedback-phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearStatus();
            }}
            placeholder="+44 7782 294718"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="feedback-role" className={labelClass}>
            I am a
          </label>
          <select
            id="feedback-role"
            value={userRole}
            onChange={(e) => {
              setUserRole(e.target.value as FeedbackUserRole);
              clearStatus();
            }}
            className={inputClass}
          >
            {feedbackUserRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
        </div>
      </div>

      <div className={sectionClass}>
        <p className={sectionTitleClass}>Your experience</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="feedback-type" className={labelClass}>
            Feedback type
          </label>
          <select
            id="feedback-type"
            value={feedbackType}
            onChange={(e) => {
              setFeedbackType(e.target.value as FeedbackType);
              clearStatus();
            }}
            className={inputClass}
          >
            {feedbackTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="feedback-subject" className={labelClass}>
            Subject
          </label>
          <input
            id="feedback-subject"
            type="text"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              clearStatus();
            }}
            placeholder="Brief summary (optional)"
            className={inputClass}
          />
        </div>
        </div>

        <div className="mt-5">
        <label className={labelClass}>
          Overall rating <span className="text-red-500">*</span>
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => {
            const filled = value <= activeStar;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setRating(value);
                  clearStatus();
                }}
                onMouseEnter={() => setHoverStar(value)}
                onMouseLeave={() => setHoverStar(null)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                  filled
                    ? "border-[#BFFF07] bg-[#BFFF07] text-black"
                    : "border-slate-200 bg-white text-slate-300 hover:border-slate-300"
                }`}
                aria-label={`Rate ${value} out of 5`}
              >
                <Star className={`h-4 w-4 ${filled ? "fill-current" : ""}`} />
              </button>
            );
          })}
          <span className="ml-1 text-xs text-slate-400">
            {activeStar ? `${activeStar} out of 5` : "Required"}
          </span>
        </div>
        </div>
      </div>

      <div className={sectionClass}>
        <p className={sectionTitleClass}>Your message</p>
        <div className="mt-4">
        <label htmlFor="feedback-message" className={labelClass}>
          Your feedback <span className="normal-case tracking-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="feedback-message"
          rows={6}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            clearStatus();
          }}
          placeholder="Tell us what worked, what did not, or what we should build next... (optional)"
          className={`${inputClass} resize-y`}
        />
        </div>
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
          {status.type === "error" ? (
            <p className="mt-2">
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Product Feedback")}`}
                className="font-medium underline"
              >
                Email support instead
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#BFFF07] text-[14px] font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit feedback
          </>
        )}
      </button>

      <p className="text-[12px] leading-5 text-slate-400">
        By submitting this form, you agree to our{" "}
        <Link href="/privacy-policy" className="text-slate-500 underline hover:text-slate-700">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms-of-service" className="text-slate-500 underline hover:text-slate-700">
          Terms of Service
        </Link>
        .
      </p>
    </form>
  );
}
