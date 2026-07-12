import type { PostLoadFormData } from "@/lib/supplier-post-load";

let pendingDraft: Partial<PostLoadFormData> | null = null;

export function setSupplierPostLoadDraft(draft: Partial<PostLoadFormData>) {
  pendingDraft = draft;
}

export function peekSupplierPostLoadDraft() {
  return pendingDraft;
}

export function consumeSupplierPostLoadDraft() {
  const draft = pendingDraft;
  pendingDraft = null;
  return draft;
}
