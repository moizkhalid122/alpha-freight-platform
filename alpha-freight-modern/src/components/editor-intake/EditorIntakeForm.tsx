"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Upload } from "lucide-react";
import { uploadEditorIntakeFile, saveEditorIntakeSubmission } from "@/lib/editor-intake-upload";
import { compressIntakeImage } from "@/lib/intake-image-compress";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";
const labelClass = "text-[12px] font-semibold text-slate-700";

const editorRoles = [
  { value: "content_editor", label: "Content Editor" },
  { value: "video_editor", label: "Video Editor" },
  { value: "social_media_editor", label: "Social Media Editor" },
  { value: "graphic_designer", label: "Graphic Designer" },
  { value: "other", label: "Other" },
];

function normalizeLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

function FilePicker({
  label,
  hint,
  accept,
  file,
  onChange,
}: {
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center transition hover:border-slate-300 hover:bg-white"
    >
      <Upload className="mb-2 h-5 w-5 text-slate-400" />
      <span className="text-sm font-bold text-slate-800">
        {label}
        <span className="text-red-500"> *</span>
      </span>
      <span className="mt-1 text-xs text-slate-500">{hint}</span>
      {file ? <span className="mt-2 text-xs font-semibold text-emerald-600">{file.name}</span> : null}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export default function EditorIntakeForm({ onSuccess }: { onSuccess?: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [editorRole, setEditorRole] = useState("video_editor");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tools, setTools] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [startDate, setStartDate] = useState("");
  const [equipment, setEquipment] = useState("");
  const [about, setAbout] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSubmitStage("Preparing files…");

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setError("Name, email, and phone are required.");
      setSubmitting(false);
      setSubmitStage(null);
      return;
    }

    if (!gender) {
      setError("Please select gender.");
      setSubmitting(false);
      setSubmitStage(null);
      return;
    }

    const portfolio = normalizeLink(portfolioUrl);
    if (!portfolio) {
      setError("Portfolio link is required.");
      setSubmitting(false);
      setSubmitStage(null);
      return;
    }

    if (!photoFile) {
      setError("Profile photo is required.");
      setSubmitting(false);
      setSubmitStage(null);
      return;
    }
    if (!idFile) {
      setError("ID document is required.");
      setSubmitting(false);
      setSubmitStage(null);
      return;
    }

    try {
      setSubmitStage("Preparing files…");
      const preparedPhoto = await compressIntakeImage(photoFile);
      const submissionId = crypto.randomUUID();

      setSubmitStage("Uploading files…");
      const [photoUpload, idUpload] = await Promise.all([
        uploadEditorIntakeFile(submissionId, "photo", preparedPhoto),
        uploadEditorIntakeFile(submissionId, "id", idFile),
      ]);

      setSubmitStage("Saving…");
      await saveEditorIntakeSubmission({
        submissionId,
        fullName: fullName.trim(),
        gender,
        email: email.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        city: city.trim(),
        country: country.trim(),
        address: address.trim(),
        editorRole,
        portfolioUrl: portfolio,
        linkedinUrl: normalizeLink(linkedinUrl),
        instagramUrl: instagramUrl.trim(),
        tools: tools.trim(),
        experienceYears: experienceYears.trim(),
        startDate,
        equipment: equipment.trim(),
        about: about.trim(),
        photoUpload,
        idUpload,
      });

      onSuccess?.();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit the form. Please try again.");
    } finally {
      setSubmitting(false);
      setSubmitStage(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Personal details</h2>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 sm:mx-0">
            {photoPreview ? (
              <Image src={photoPreview} alt="Preview" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] font-semibold text-slate-400">Photo</div>
            )}
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FilePicker
                label="Profile photo"
                hint="JPG or PNG, max 8MB"
                accept="image/jpeg,image/png,image/webp,image/*"
                file={photoFile}
                onChange={setPhotoFile}
              />
            </div>
            <div className="sm:col-span-2">
              <FilePicker
                label="ID document"
                hint="Passport or driving licence — JPG, PNG, or PDF"
                accept="image/jpeg,image/png,image/webp,application/pdf,image/*,.pdf"
                file={idFile}
                onChange={setIdFile}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Your full name" />
          </Field>
          <Field label="Gender" required>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
          <Field label="Email" required>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@email.com" />
          </Field>
          <Field label="Phone" required>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+44 7700 900000" />
          </Field>
          <Field label="WhatsApp (if different)">
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputClass} placeholder="+44 7700 900000" />
          </Field>
          <Field label="City">
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="London" />
          </Field>
          <Field label="Country">
            <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} placeholder="United Kingdom" />
          </Field>
        </div>
        <Field label="Home address">
          <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="Full address" />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Editor profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role" required>
            <select value={editorRole} onChange={(e) => setEditorRole(e.target.value)} className={inputClass}>
              {editorRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Years of experience">
            <input value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className={inputClass} placeholder="e.g. 3" />
          </Field>
          <Field label="Preferred start date">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Portfolio / work samples link" required>
          <input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className={inputClass} placeholder="drive.google.com/... or full URL" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="LinkedIn">
            <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className={inputClass} placeholder="linkedin.com/in/..." />
          </Field>
          <Field label="Instagram / social">
            <input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className={inputClass} placeholder="@username or full URL" />
          </Field>
        </div>
        <Field label="Tools & software you use">
          <input value={tools} onChange={(e) => setTools(e.target.value)} className={inputClass} placeholder="Premiere Pro, After Effects, Canva, CapCut…" />
        </Field>
        <Field label="Equipment you work with">
          <input value={equipment} onChange={(e) => setEquipment(e.target.value)} className={inputClass} placeholder="Laptop, camera, microphone…" />
        </Field>
        <Field label="About you / notes">
          <textarea rows={4} value={about} onChange={(e) => setAbout(e.target.value)} className={inputClass} placeholder="Brief intro, types of content you edit…" />
        </Field>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 sm:w-auto"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {submitStage || "Submitting…"}
          </>
        ) : (
          "Submit details"
        )}
      </button>
    </form>
  );
}
