"use client";

import { useMemo, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import {
  getCarrierDocuments,
  getSupplierDocuments,
  type DocumentDefinition,
  type MarketplaceRole,
} from "@/lib/account-verification";
import { uploadVerificationDocument } from "@/lib/verification-upload";

type OnboardingDocumentStepProps = {
  role: MarketplaceRole;
  accountType: string;
  userId: string;
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  onError: (message: string | null) => void;
};

export default function OnboardingDocumentStep({
  role,
  accountType,
  userId,
  values,
  onChange,
  onError,
}: OnboardingDocumentStepProps) {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const documents = useMemo<DocumentDefinition[]>(
    () => (role === "carrier" ? getCarrierDocuments(accountType) : getSupplierDocuments()),
    [role, accountType],
  );

  const handleUpload = async (doc: DocumentDefinition, file: File | null) => {
    if (!file) return;
    onError(null);
    setUploadingKey(doc.key);

    try {
      const url = await uploadVerificationDocument(userId, role, doc.key, file);
      onChange({ ...values, [doc.key]: url });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unable to upload document.");
    } finally {
      setUploadingKey(null);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 text-left">
      {documents.map((doc) => {
        const uploaded = Boolean(values[doc.key]);
        return (
          <div
            key={doc.key}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {doc.label}
                  {doc.required ? <span className="text-rose-500"> *</span> : null}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  PDF, JPG, or PNG up to 8MB
                </p>
              </div>
              {uploaded ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Uploaded
                </span>
              ) : null}
            </div>

            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white">
              {uploadingKey === doc.key ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4" />
                  {uploaded ? "Replace file" : "Choose file"}
                </>
              )}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                className="hidden"
                disabled={Boolean(uploadingKey)}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  void handleUpload(doc, file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>
        );
      })}
    </div>
  );
}

export function validateOnboardingDocuments(
  role: MarketplaceRole,
  accountType: string,
  values: Record<string, string>,
) {
  const documents = role === "carrier" ? getCarrierDocuments(accountType) : getSupplierDocuments();
  const missing = documents.filter((doc) => doc.required && !values[doc.key]?.trim()).map((doc) => doc.label);
  return missing;
}

export function mapDocumentUrlsToExtras(
  role: MarketplaceRole,
  accountType: string,
  values: Record<string, string>,
) {
  const documents = role === "carrier" ? getCarrierDocuments(accountType) : getSupplierDocuments();
  const mapped: Record<string, string> = {};

  documents.forEach((doc) => {
    const url = values[doc.key];
    if (url) mapped[doc.urlField as string] = url;
  });

  return mapped;
}
