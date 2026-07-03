"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";

const SUPPORT_EMAIL = "support@alphafreightuk.com";
const PHONE = "+44 7782 294718";
const PHONE_HREF = "tel:+447782294718";
const WHATSAPP_URL = "https://whatsapp.com/channel/0029VbC2bIL4dTnE8v0leE3s";
const MAP_EMBED_URL =
  "https://maps.google.com/maps?q=124+City+Road,+London+EC1V+2NX,+United+Kingdom&output=embed";

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_mvxwoue";
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_21isokf";
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "f5bWSTVw5Z8mVVwTu";

const subjectOptions = [
  { value: "general", label: "General Inquiry" },
  { value: "supplier", label: "Supplier Registration" },
  { value: "carrier", label: "Carrier Registration" },
  { value: "support", label: "Technical Support" },
  { value: "quote", label: "Request Quote" },
  { value: "partnership", label: "Partnership Inquiry" },
  { value: "other", label: "Other" },
];

const socialLinks = [
  {
    label: "YouTube",
    href: "https://www.youtube.com/@ALPHAFREIGHTSOLUTIONS",
    className: "bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50",
    logo: "/youtube logo.png",
  },
  {
    label: "WhatsApp",
    href: WHATSAPP_URL,
    className: "bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50",
    logo: "/whatsapp.png",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/alpha-freight-solutions-4aa8a43a6",
    className: "bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50",
    logo: "/linkendin .png",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/alphafreight.uk?igsh=a3pzcW41eGtyNjR6",
    className: "bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50",
    logo: "/insta.png",
  },
];

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
const labelClass = "text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500";
const contactIconClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700";

type FormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

async function sendViaEmailJs(form: FormState) {
  const subjectLabel =
    subjectOptions.find((option) => option.value === form.subject)?.label || form.subject;

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        customer_name: form.name,
        customer_email: form.email,
        pickup_location: subjectLabel,
        delivery_location: form.phone || "Not provided",
        additional_requirements: form.message,
        from_name: form.name,
        from_email: form.email,
        reply_to: form.email,
        to_name: "Alpha Freight Support",
        to_email: SUPPORT_EMAIL,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to send message.");
  }
}

function openMailtoFallback(form: FormState) {
  const subjectLabel =
    subjectOptions.find((option) => option.value === form.subject)?.label || "General Inquiry";
  const subject = encodeURIComponent(`Contact Form: ${subjectLabel}`);
  const body = encodeURIComponent(
    `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone || "Not provided"}\n\n${form.message}`,
  );
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(
    null,
  );

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (status) setStatus(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const hasEmailJs =
      Boolean(EMAILJS_SERVICE_ID) &&
      Boolean(EMAILJS_TEMPLATE_ID) &&
      Boolean(EMAILJS_PUBLIC_KEY) &&
      !EMAILJS_PUBLIC_KEY.startsWith("YOUR_");

    try {
      if (hasEmailJs) {
        await Promise.race([
          sendViaEmailJs(form),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Request timed out.")), 15000);
          }),
        ]);
        setForm(initialForm);
        setStatus({
          type: "success",
          message: "Thank you! Your message has been sent. We will get back to you within 24 hours.",
        });
      } else {
        openMailtoFallback(form);
        setForm(initialForm);
        setStatus({
          type: "info",
          message:
            "We opened your email client to send your message. If it did not open, please email support@alphafreightuk.com directly.",
        });
      }
    } catch {
      setStatus({
        type: "error",
        message: "We could not send your message. Please try again or email us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
          <section className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600">
              Get in touch
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Contact Us</h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">
              We&apos;re here to help. Reach our team for platform support, sales enquiries, carrier
              onboarding, or partnership questions.
            </p>
          </section>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Send us a message</h2>
                  <p className="text-sm text-slate-500">We typically reply within 24 hours.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className={labelClass}>
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="John Doe"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="john@example.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelClass}>
                      Phone number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="+44 7782 294718"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className={labelClass}>
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="subject"
                      required
                      value={form.subject}
                      onChange={(e) => updateField("subject", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select a subject</option>
                      {subjectOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className={labelClass}>
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={form.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    placeholder="Tell us how we can help you..."
                    className={`${inputClass} resize-y`}
                  />
                </div>

                {status ? (
                  <div
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      status.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : status.type === "error"
                          ? "border-red-200 bg-red-50 text-red-800"
                          : "border-sky-200 bg-sky-50 text-sky-800"
                    }`}
                  >
                    {status.message}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-[14px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send message
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
            </section>

            <aside className="space-y-6">
              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">Contact information</h2>

                <div className="mt-6 space-y-5">
                  <div className="flex gap-4 border-b border-slate-100 pb-5">
                    <div className={contactIconClass}>
                      <Phone className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Phone</p>
                      <a href={PHONE_HREF} className="mt-1 block text-sm text-slate-700 hover:text-slate-900 hover:underline">
                        {PHONE}
                      </a>
                      <p className="mt-1 text-xs text-slate-500">Available 24/7</p>
                    </div>
                  </div>

                  <div className="flex gap-4 border-b border-slate-100 pb-5">
                    <div className={contactIconClass}>
                      <Mail className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Email</p>
                      <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="mt-1 block text-sm text-slate-700 hover:text-slate-900 hover:underline"
                      >
                        {SUPPORT_EMAIL}
                      </a>
                      <p className="mt-1 text-xs text-slate-500">We reply within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex gap-4 border-b border-slate-100 pb-5">
                    <div className={contactIconClass}>
                      <MapPin className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Address</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        124 City Road
                        <br />
                        London EC1V 2NX
                        <br />
                        United Kingdom
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className={contactIconClass}>
                      <MessageSquare className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">WhatsApp</p>
                      <a
                        href={WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        Chat now
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6">
                  <p className="text-sm font-semibold text-slate-900">Follow us</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {socialLinks.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={social.label}
                        className={`inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold uppercase tracking-wide text-white transition ${social.className}`}
                      >
                        <Image
                          src={social.logo}
                          alt={`${social.label} logo`}
                          width={28}
                          height={28}
                          className="h-7 w-7 object-contain"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 text-sm text-slate-600 shadow-[0_12px_40px_rgba(15,23,42,0.04)]">
                <div className="flex items-start gap-3">
                  <div className={contactIconClass}>
                    <Clock className="h-[18px] w-[18px]" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Office hours</p>
                    <p className="mt-2 leading-6">
                      Monday – Friday: 9:00 AM – 6:00 PM GMT
                      <br />
                      Saturday: 10:00 AM – 4:00 PM GMT
                      <br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
                <Link
                  href="/support"
                  className="mt-4 inline-block text-sm font-medium text-slate-700 hover:text-slate-900 hover:underline"
                >
                  Visit Help Center →
                </Link>
              </div>
            </aside>
          </div>

          <section className="mt-8 rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-8">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Find us on the map</h2>
            <p className="mt-2 text-sm text-slate-500">Alpha Freight Solutions Limited — London office</p>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <iframe
                title="Alpha Freight office location"
                src={MAP_EMBED_URL}
                className="h-[400px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
