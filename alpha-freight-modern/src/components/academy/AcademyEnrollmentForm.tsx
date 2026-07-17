"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Mail, Phone, User } from "lucide-react";

type AcademyEnrollmentFormProps = {
  enrollmentType: "course" | "bundle";
  courseId?: string;
  courseTitle: string;
  submitLabel?: string;
};

export default function AcademyEnrollmentForm({
  enrollmentType,
  courseId,
  courseTitle,
  submitLabel = "Submit enrollment",
}: AcademyEnrollmentFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/academy/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentType,
          courseId,
          courseTitle,
          name,
          email,
          phone,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to submit enrollment.");
      }

      setSubmitted(true);
      setName("");
      setEmail("");
      setPhone("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit enrollment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-black/30 focus:border-black";
  const labelClass = "text-[10px] font-bold uppercase tracking-[0.18em] text-black/35";

  if (submitted) {
    return (
      <div className="rounded-[1.5rem] border border-black/10 bg-white p-6 space-y-4">
        <CheckCircle2 className="h-8 w-8 text-black" />
        <h3 className="text-xl font-medium tracking-tight">Enrollment request received</h3>
        <p className="text-sm leading-relaxed text-black/50">
          Thanks for enrolling with Alpha Freight Academy. Our team will contact you shortly with course confirmation and next steps.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className={`mb-2 flex items-center gap-2 ${labelClass}`}>
          <User className="h-3.5 w-3.5" />
          Full name
        </span>
        <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your full name" />
      </label>

      <label className="block">
        <span className={`mb-2 flex items-center gap-2 ${labelClass}`}>
          <Mail className="h-3.5 w-3.5" />
          Email
        </span>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@company.com" />
      </label>

      <label className="block">
        <span className={`mb-2 flex items-center gap-2 ${labelClass}`}>
          <Phone className="h-3.5 w-3.5" />
          Phone
        </span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+44 ..." />
      </label>

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-black px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white hover:bg-[#BFFF07] hover:text-black transition-colors disabled:opacity-60"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </span>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
