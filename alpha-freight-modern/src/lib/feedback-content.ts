export const feedbackUserRoles = [
  { value: "carrier", label: "Carrier" },
  { value: "supplier", label: "Supplier" },
  { value: "visitor", label: "Website visitor" },
  { value: "other", label: "Other" },
] as const;

export const feedbackTypes = [
  { value: "general", label: "General feedback" },
  { value: "bug", label: "Bug / something broken" },
  { value: "feature", label: "Feature request" },
  { value: "praise", label: "Compliment" },
  { value: "complaint", label: "Complaint" },
] as const;

export type FeedbackUserRole = (typeof feedbackUserRoles)[number]["value"];
export type FeedbackType = (typeof feedbackTypes)[number]["value"];
export type FeedbackStatus = "new" | "reviewed" | "resolved";

export type FeedbackRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  user_role: FeedbackUserRole;
  feedback_type: FeedbackType;
  rating: number | null;
  subject: string | null;
  message: string;
  page_url: string | null;
  status: FeedbackStatus;
  admin_notes: string | null;
  created_at: string;
};

export function getFeedbackTypeLabel(value: string) {
  return feedbackTypes.find((item) => item.value === value)?.label ?? value;
}

export function getFeedbackRoleLabel(value: string) {
  return feedbackUserRoles.find((item) => item.value === value)?.label ?? value;
}
