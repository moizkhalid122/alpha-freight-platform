export const inquiryTypes = [
  { value: "support", label: "Support request" },
  { value: "contact", label: "General contact" },
  { value: "quote", label: "Quote request" },
  { value: "partnership", label: "Partnership inquiry" },
  { value: "awards", label: "Awards registration" },
  { value: "air_support", label: "Air freight support" },
  { value: "carrier_support", label: "Carrier support" },
  { value: "supplier_support", label: "Supplier support" },
  { value: "general", label: "General inquiry" },
] as const;

export type InquiryType = (typeof inquiryTypes)[number]["value"];
export type InquiryStatus = "new" | "read" | "replied" | "resolved";

export type InquiryRecord = {
  id: string;
  inquiry_type: InquiryType | string;
  source_page: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  status: InquiryStatus;
  admin_notes: string | null;
  created_at: string;
};

export type WebsiteInquiryPayload = {
  inquiryType: InquiryType | string;
  sourcePage?: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export function getInquiryTypeLabel(value: string) {
  return inquiryTypes.find((item) => item.value === value)?.label ?? value;
}

export function mapContactSubjectToInquiryType(subject: string): InquiryType {
  switch (subject) {
    case "quote":
      return "quote";
    case "support":
      return "support";
    case "partnership":
      return "partnership";
    case "supplier":
    case "carrier":
      return "contact";
    default:
      return "general";
  }
}
