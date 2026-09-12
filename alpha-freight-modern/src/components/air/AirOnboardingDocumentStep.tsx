"use client";

import { useMemo, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import type { AirRole } from "@/lib/air-portal";
import { getAirDocuments, type AirDocumentDefinition } from "@/lib/air-account-verification";
import { uploadVerificationDocument } from "@/lib/verification-upload";

type AirOnboardingDocumentStepProps = {
  role: AirRole;
  userId: string;
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  onError: (message: string | null) => void;
};

export default function AirOnboardingDocumentStep({
  role,
  userId,
  values,
  onChange,
  onError,
}: AirOnboardingDocumentStepProps) {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const documents = useMemo<AirDocumentDefinition[]>(() => getAirDocuments(role), [role]);

  const handleUpload = async (doc: AirDocumentDefinition, file: File | null) => {
    if (!file) return;
    onError(null);
    setUploadingKey(doc.key);

    try {
      const url = await uploadVerificationDocument(
        userId,
        role === "carrier" ? "carrier" : "supplier",
        doc.key,
        file
      );
      onChange({ ...values, [doc.key]: url });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unable to upload document.");
    } finally {
      setUploadingKey(null);
    }
  };

  return (
    <div className="space-y-4 text-left">
      {documents.map((doc) => {
        const uploaded = Boolean(values[doc.key]);
        return (
          <div key={doc.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {doc.label}
                  {doc.required ? <span className="text-rose-500"> *</span> : null}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">PDF, JPG, or PNG up to 8MB</p>
              </div>
              {uploaded ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Uploaded
                </span>
              ) : null}
            </div>

            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50/40">
              {uploadingKey === doc.key ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4" />
                  {uploaded ? "Replace file" : "Upload document"}
                </>
              )}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                disabled={uploadingKey !== null}
                onChange={(e) => void handleUpload(doc, e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        );
      })}
    </div>
  );
}
