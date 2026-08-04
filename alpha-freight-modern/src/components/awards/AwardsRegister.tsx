"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { AWARDS_EVENT, COMPANY_TYPES, NOMINATION_CATEGORIES, type CompanyType } from "@/lib/awards-content";

type NominationCategory = (typeof NOMINATION_CATEGORIES)[number];
import { BlackGlassPanel, MagneticButton, ScrollReveal, SectionShell } from "./awards-shared";

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_mvxwoue";
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_21isokf";
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "f5bWSTVw5Z8mVVwTu";

const inputClass =
  "mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#3B82F6]/50 focus:ring-2 focus:ring-[#3B82F6]/10";

const STEPS = ["Details", "Category", "Message"] as const;

export function AwardsRegister() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<{
    companyName: string;
    email: string;
    phone: string;
    companyType: CompanyType;
    nominationCategory: NominationCategory;
    message: string;
  }>({
    companyName: "",
    email: "",
    phone: "",
    companyType: "Carrier" as CompanyType,
    nominationCategory: NOMINATION_CATEGORIES[0],
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.companyName.trim() || !form.email.trim()) {
      setError("Please complete required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            customer_name: form.companyName.trim(),
            customer_email: form.email.trim(),
            pickup_location: `Awards — ${form.companyType} · ${form.nominationCategory}`,
            delivery_location: AWARDS_EVENT.title,
            additional_requirements: form.message.trim() || "Register interest",
            from_name: form.companyName.trim(),
            from_email: form.email.trim(),
            reply_to: form.email.trim(),
            to_name: "Alpha Freight Awards",
            to_email: "support@alphafreightuk.com",
          },
        }),
      });
      if (!res.ok) throw new Error("fail");
      setSubmitted(true);
    } catch {
      setError("Unable to send. Please email support@alphafreightuk.com");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionShell
      id="register"
      eyebrow="Register interest"
      title="Join the UK's most prestigious logistics awards"
      subtitle="Nominate your company, register as a sponsor, or request ceremony details."
      centered
    >
      <ScrollReveal>
        <BlackGlassPanel className="mx-auto max-w-2xl p-8 sm:p-10">
          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-10 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-[#3B82F6]" />
              <p className="mt-5 text-2xl font-semibold text-white">Thank you — you&apos;re registered.</p>
              <p className="mt-3 text-sm text-white/50">Our team will contact you with next steps.</p>
            </motion.div>
          ) : (
            <>
              <div className="mb-8 flex justify-center gap-2">
                {STEPS.map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        i <= step ? "bg-[#3B82F6] text-white" : "border border-white/15 text-white/40"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className={`hidden text-xs font-semibold uppercase tracking-[0.12em] sm:inline ${i <= step ? "text-white" : "text-white/35"}`}>
                      {label}
                    </span>
                    {i < STEPS.length - 1 ? <span className="mx-1 hidden h-px w-6 bg-white/15 sm:block" /> : null}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {step === 0 ? (
                    <motion.div
                      key="step0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label htmlFor="awards-company" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                            Company name *
                          </label>
                          <input
                            id="awards-company"
                            required
                            value={form.companyName}
                            onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                            className={inputClass}
                            placeholder="Your company Ltd"
                          />
                        </div>
                        <div>
                          <label htmlFor="awards-email" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                            Email *
                          </label>
                          <input
                            id="awards-email"
                            required
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                            className={inputClass}
                            placeholder="you@company.co.uk"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="awards-phone" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                          Phone
                        </label>
                        <input
                          id="awards-phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                          className={inputClass}
                          placeholder="+44 7700 900000"
                        />
                      </div>
                    </motion.div>
                  ) : null}

                  {step === 1 ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5"
                    >
                      <div>
                        <label htmlFor="awards-type" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                          Company type
                        </label>
                        <select
                          id="awards-type"
                          value={form.companyType}
                          onChange={(e) => setForm((p) => ({ ...p, companyType: e.target.value as CompanyType }))}
                          className={inputClass}
                        >
                          {COMPANY_TYPES.map((t) => (
                            <option key={t} value={t} className="bg-[#0a0a0a]">
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="awards-category" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                          Nomination category
                        </label>
                        <select
                          id="awards-category"
                          value={form.nominationCategory}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              nominationCategory: e.target.value as NominationCategory,
                            }))
                          }
                          className={inputClass}
                        >
                          {NOMINATION_CATEGORIES.map((c) => (
                            <option key={c} value={c} className="bg-[#0a0a0a]">
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  ) : null}

                  {step === 2 ? (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <label htmlFor="awards-message" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                        Message
                      </label>
                      <textarea
                        id="awards-message"
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                        className={`${inputClass} resize-none`}
                        placeholder="Tell us why your company deserves recognition…"
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

                <div className="mt-8 flex gap-3">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s - 1)}
                      className="h-12 flex-1 rounded-full border border-white/15 text-sm font-semibold text-white hover:bg-white/[0.06]"
                    >
                      Back
                    </button>
                  ) : null}
                  {step < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s + 1)}
                      className="h-12 flex-1 rounded-full bg-[#3B82F6] text-sm font-semibold text-white hover:bg-[#2563EB]"
                    >
                      Continue
                    </button>
                  ) : (
                    <MagneticButton
                      type="submit"
                      disabled={submitting}
                      className="h-12 flex-1 bg-[#3B82F6] text-sm text-white hover:bg-[#2563EB]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          Submit registration
                          <Send className="h-5 w-5" />
                        </>
                      )}
                    </MagneticButton>
                  )}
                </div>
              </form>
            </>
          )}
        </BlackGlassPanel>
      </ScrollReveal>
    </SectionShell>
  );
}
