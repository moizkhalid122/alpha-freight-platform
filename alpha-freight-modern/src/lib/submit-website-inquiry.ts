import type { WebsiteInquiryPayload } from "@/lib/inquiry-content";

export async function submitWebsiteInquiry(payload: WebsiteInquiryPayload) {
  const response = await fetch("/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Unable to send your message right now.");
  }

  return data;
}
