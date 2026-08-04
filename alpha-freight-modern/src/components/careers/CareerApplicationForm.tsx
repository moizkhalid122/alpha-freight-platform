"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, Send } from "lucide-react";

const SUPPORT_EMAIL = "support@alphafreightuk.com";
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_mvxwoue";
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_21isokf";
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "f5bWSTVw5Z8mVVwTu";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormState = {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  coverLetter: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  linkedin: "",
  portfolio: "",
  coverLetter: "",
};

type CareerApplicationFormProps = {
  roleTitle: string;
  roleSlug: string;
};

async function saveApplicationToApi(form: FormState, roleTitle: string, roleSlug: string) {
  const response = await fetch("/api/careers/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roleSlug,
      roleTitle,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      linkedin: form.linkedin.trim(),
      portfolio: form.portfolio.trim(),
      coverLetter: form.coverLetter.trim(),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Unable to save application.");
  }
}

async function sendApplicationViaEmailJs(form: FormState, roleTitle: string) {
  const applicationDetails = [
    `Role: ${roleTitle}`,
    `Phone: ${form.phone.trim() || "Not provided"}`,
    `LinkedIn: ${form.linkedin.trim() || "Not provided"}`,
    `Portfolio: ${form.portfolio.trim() || "Not provided"}`,
    "",
    form.coverLetter.trim(),
  ].join("\n");

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        pickup_location: `Career Application: ${roleTitle}`,
        delivery_location: form.phone.trim() || "Not provided",
        additional_requirements: applicationDetails,
        from_name: form.name.trim(),
        from_email: form.email.trim(),
        reply_to: form.email.trim(),
        to_name: "Alpha Freight Careers",
        to_email: SUPPORT_EMAIL,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "Unable to send application email.");
  }
}

function openMailtoFallback(form: FormState, roleTitle: string) {
  const subject = encodeURIComponent(`Career Application: ${roleTitle}`);
  const body = encodeURIComponent(
    [
      `Role: ${roleTitle}`,
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      `Phone: ${form.phone.trim() || "Not provided"}`,
      `LinkedIn: ${form.linkedin.trim() || "Not provided"}`,
      `Portfolio: ${form.portfolio.trim() || "Not provided"}`,
      "",
      form.coverLetter.trim(),
    ].join("\n"),
  );
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

export default function CareerApplicationForm({ roleTitle, roleSlug }: CareerApplicationFormProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(
    null,
  );

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (status) setStatus(null);
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Please enter your full name.";
    }

    if (!EMAIL_PATTERN.test(form.email.trim())) {
      return "Please enter a valid email address (example: you@company.com).";
    }

    if (form.coverLetter.trim().length < 20) {
      return "Please write a short cover letter (at least 20 characters).";
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const validationError = validateForm();
    if (validationError) {
      setStatus({ type: "error", message: validationError });
      setIsSubmitting(false);
      return;
    }

    const hasEmailJs =
      Boolean(EMAILJS_SERVICE_ID) &&
      Boolean(EMAILJS_TEMPLATE_ID) &&
      Boolean(EMAILJS_PUBLIC_KEY) &&
      !EMAILJS_PUBLIC_KEY.startsWith("YOUR_");

    try {
      try {
        await saveApplicationToApi(form, roleTitle, roleSlug);
        setForm(initialForm);
        setStatus({
          type: "success",
          message: "Application submitted successfully. Our team will review your profile within 5 working days.",
        });
        return;
      } catch (apiError) {
        console.warn("[career-application] API save failed:", apiError);
      }

      if (hasEmailJs) {
        await Promise.race([
          sendApplicationViaEmailJs(form, roleTitle),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Request timed out.")), 15000);
          }),
        ]);
        setForm(initialForm);
        setStatus({
          type: "success",
          message: "Application sent. Our team will review your profile and respond within 5 working days.",
        });
        return;
      }

      openMailtoFallback(form, roleTitle);
      setForm(initialForm);
      setStatus({
        type: "info",
        message:
          "We opened your email app as a backup. If it did not open, email support@alphafreightuk.com with your application details.",
      });
    } catch (emailError) {
      console.warn("[career-application] EmailJS failed:", emailError);
      openMailtoFallback(form, roleTitle);
      setForm(initialForm);
      setStatus({
        type: "info",
        message:
          "We opened your email app as a backup. If it did not open, email support@alphafreightuk.com with your application details.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-black/30 focus:border-black";
  const labelClass = "text-[10px] font-bold uppercase tracking-[0.18em] text-black/35";

  return (
    <div id="apply" className="scroll-mt-28 rounded-[2rem] border border-black/10 bg-[#f7f7f4] p-7 md:p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">Application</p>
      <h2 className="mt-3 text-2xl font-medium tracking-tight">Apply for this role</h2>
      <p className="mt-3 text-sm leading-relaxed text-black/50">
        Submit your details for <span className="font-medium text-black">{roleTitle}</span>. We review every application carefully.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input type="hidden" name="role" value={roleSlug} />

        <label className="block">
          <span className={labelClass}>Full name</span>
          <input
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className={`mt-2 ${inputClass}`}
            placeholder="Your full name"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className={`mt-2 ${inputClass}`}
              placeholder="you@company.com"
            />
          </label>

          <label className="block">
            <span className={labelClass}>Phone</span>
            <input
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className={`mt-2 ${inputClass}`}
              placeholder="+44 ..."
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>LinkedIn</span>
            <input
              value={form.linkedin}
              onChange={(event) => updateField("linkedin", event.target.value)}
              className={`mt-2 ${inputClass}`}
              placeholder="linkedin.com/in/..."
            />
          </label>

          <label className="block">
            <span className={labelClass}>Portfolio / GitHub</span>
            <input
              value={form.portfolio}
              onChange={(event) => updateField("portfolio", event.target.value)}
              className={`mt-2 ${inputClass}`}
              placeholder="Portfolio or GitHub URL"
            />
          </label>
        </div>

        <label className="block">
          <span className={labelClass}>Cover letter</span>
          <textarea
            required
            minLength={20}
            rows={5}
            value={form.coverLetter}
            onChange={(event) => updateField("coverLetter", event.target.value)}
            className={`mt-2 resize-y ${inputClass}`}
            placeholder="Tell us why you are a strong fit for this role..."
          />
        </label>

        {status ? (
          <p
            className={`rounded-2xl px-4 py-3 text-sm ${
              status.type === "success"
                ? "bg-[#BFFF07]/20 text-black"
                : status.type === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-black/5 text-black/60"
            }`}
          >
            {status.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#BFFF07] hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Submit application
              <Send className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-[11px] leading-relaxed text-black/40">
        Prefer email?{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:text-black">
          {SUPPORT_EMAIL}
        </a>
        {" · "}
        <Link href="/contact" className="underline hover:text-black">
          Contact page
        </Link>
      </p>
    </div>
  );
}
