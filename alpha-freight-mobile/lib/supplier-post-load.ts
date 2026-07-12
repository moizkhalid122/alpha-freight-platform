import { upsertSupplierPaymentOrder } from "@/lib/supplier-payments";
import { supabase } from "@/lib/supabase";

export type PostLoadUrgency = "normal" | "urgent" | "same-day";
export type PostLoadPaymentRoute = "pay-now" | "pay-later";

export type PostLoadFormData = {
  title: string;
  urgency: PostLoadUrgency;
  origin: string;
  destination: string;
  pickupDate: string;
  pickupTime: string;
  deliveryDate: string;
  deliveryTime: string;
  cargoType: string;
  weight: string;
  volume: string;
  value: string;
  equipment: string;
  description: string;
  tailLift: boolean;
  refrigerated: boolean;
  adrCertified: boolean;
  whiteGlove: boolean;
  minBudget: string;
  maxBudget: string;
  agreementAccepted: boolean;
};

export const DEFAULT_POST_LOAD_FORM: PostLoadFormData = {
  title: "",
  urgency: "normal",
  origin: "",
  destination: "",
  pickupDate: "",
  pickupTime: "09:00",
  deliveryDate: "",
  deliveryTime: "",
  cargoType: "",
  weight: "",
  volume: "",
  value: "",
  equipment: "curtainside",
  description: "",
  tailLift: false,
  refrigerated: false,
  adrCertified: false,
  whiteGlove: false,
  minBudget: "",
  maxBudget: "",
  agreementAccepted: false,
};

export const URGENCY_OPTIONS: { value: PostLoadUrgency; label: string; hint: string }[] = [
  { value: "normal", label: "Standard", hint: "Best value" },
  { value: "urgent", label: "Urgent", hint: "+10% estimate" },
  { value: "same-day", label: "Same day", hint: "+25% estimate" },
];

export const EQUIPMENT_OPTIONS = [
  { value: "van", label: "Van" },
  { value: "small-truck", label: "Small truck (3.5T)" },
  { value: "medium-truck", label: "Medium truck (7.5T)" },
  { value: "large-truck", label: "Large truck (18T)" },
  { value: "artic", label: "Artic (44T)" },
  { value: "flatbed", label: "Flatbed" },
  { value: "curtainside", label: "Curtainside" },
];

export const REQUIREMENT_OPTIONS = [
  { key: "tailLift" as const, label: "Tail lift", icon: "arrow-up-circle-outline" as const },
  { key: "refrigerated" as const, label: "Refrigerated", icon: "snow-outline" as const },
  { key: "adrCertified" as const, label: "ADR certified", icon: "shield-checkmark-outline" as const },
  { key: "whiteGlove" as const, label: "White glove", icon: "star-outline" as const },
];

export function estimatePostLoadPrice(params: {
  weight: string;
  urgency: PostLoadUrgency;
  distanceMeters?: number | null;
}) {
  const weight = parseFloat(params.weight) || 0;
  const base = 150;
  const distanceKm = params.distanceMeters ? params.distanceMeters / 1000 : 0;
  const distanceFactor = distanceKm * 0.85;
  const weightFactor = weight * 0.05;
  const urgencyFactor =
    params.urgency === "urgent" ? 1.1 : params.urgency === "same-day" ? 1.25 : 1;
  return Math.round((base + weightFactor + distanceFactor) * urgencyFactor);
}

export function buildLoadNotes(form: PostLoadFormData) {
  const parts: string[] = [];
  if (form.description.trim()) parts.push(form.description.trim());
  const requirements = REQUIREMENT_OPTIONS.filter((item) => form[item.key])
    .map((item) => item.label)
    .join(", ");
  if (requirements) parts.push(`Requirements: ${requirements}`);
  if (form.volume.trim()) parts.push(`Volume: ${form.volume.trim()}`);
  if (form.value.trim()) parts.push(`Cargo value: £${form.value.trim()}`);
  return parts.join("\n");
}

export function formatPostLoadDateInput(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (!digits.length) return "";

  const year = digits.slice(0, 4);
  if (digits.length <= 4) return year;

  const rest = digits.slice(4);
  let month = "";
  let dayDigits = "";

  const firstMonth = parseInt(rest[0] ?? "0", 10);
  if (firstMonth > 1) {
    month = `0${firstMonth}`;
    dayDigits = rest.slice(1);
  } else if (rest.length === 1) {
    month = rest[0];
  } else {
    month = rest.slice(0, 2);
    const monthNum = parseInt(month, 10);
    if (monthNum > 12) month = "12";
    else if (monthNum === 0) month = "01";
    dayDigits = rest.slice(2);
  }

  if (!dayDigits.length) return `${year}-${month}`;

  let day = "";
  if (dayDigits.length === 1) {
    const firstDay = parseInt(dayDigits[0], 10);
    day = firstDay > 3 ? `0${firstDay}` : dayDigits[0];
  } else {
    day = dayDigits.slice(0, 2);
    const dayNum = parseInt(day, 10);
    if (dayNum > 31) day = "31";
    else if (dayNum === 0) day = "01";
  }

  return `${year}-${month}-${day}`;
}

export function formatPostLoadTimeInput(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 4);
  if (!digits.length) return "";

  if (digits.length <= 2) {
    if (digits.length === 2) {
      const hour = parseInt(digits, 10);
      if (hour > 23) return "23";
    }
    return digits;
  }

  const firstHour = parseInt(digits[0], 10);
  let hour = "";
  let minuteDigits = "";

  if (firstHour > 2) {
    hour = `0${firstHour}`;
    minuteDigits = digits.slice(1);
  } else {
    hour = digits.slice(0, 2);
    const hourNum = parseInt(hour, 10);
    if (hourNum > 23) hour = "23";
    minuteDigits = digits.slice(2);
  }

  if (!minuteDigits.length) return hour.length === 2 ? `${hour}:` : hour;

  let minute = "";
  if (minuteDigits.length === 1) {
    const firstMinute = parseInt(minuteDigits[0], 10);
    minute = firstMinute > 5 ? `0${firstMinute}` : minuteDigits[0];
  } else {
    minute = minuteDigits.slice(0, 2);
    const minuteNum = parseInt(minute, 10);
    if (minuteNum > 59) minute = "59";
  }

  return `${hour}:${minute}`;
}

export function isCompletePostLoadDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function isCompletePostLoadTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

export function validatePostLoadStep(step: number, form: PostLoadFormData): string | null {
  if (step === 1) {
    if (!form.origin.trim() || !form.destination.trim()) return "Enter pickup and delivery locations.";
    if (!form.pickupDate.trim()) return "Enter a pickup date (YYYY-MM-DD).";
    if (!isCompletePostLoadDate(form.pickupDate)) return "Enter a valid pickup date (YYYY-MM-DD).";
    if (!form.pickupTime.trim() || !isCompletePostLoadTime(form.pickupTime)) {
      return "Enter a valid pickup time (HH:MM).";
    }
    return null;
  }
  if (step === 2) {
    if (!form.cargoType.trim()) return "Enter cargo type.";
    if (!form.weight.trim() || Number(form.weight) <= 0) return "Enter cargo weight in kg.";
    return null;
  }
  if (step === 3) {
    if (!form.equipment.trim()) return "Select a vehicle type.";
    return null;
  }
  if (step === 4) {
    if (!form.agreementAccepted) return "Accept the terms before posting.";
    return null;
  }
  return null;
}

export async function submitSupplierPostLoad(params: {
  form: PostLoadFormData;
  paymentRoute: PostLoadPaymentRoute;
  suggestedPrice: number;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Please sign in again." };
  }

  const price = params.form.maxBudget
    ? parseFloat(params.form.maxBudget)
    : params.suggestedPrice || 0;

  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false as const, error: "Enter a valid budget or use the suggested rate." };
  }

  const loadTitle =
    params.form.title.trim() ||
    `${params.form.cargoType.trim() || "Freight"} · ${params.form.origin.trim()} → ${params.form.destination.trim()}`;

  const { data, error } = await supabase
    .from("loads")
    .insert([
      {
        status: "pending-payment",
        origin: params.form.origin.trim(),
        destination: params.form.destination.trim(),
        price,
        weight: params.form.weight.trim(),
        equipment: params.form.equipment,
        pickup_date: params.form.pickupDate.trim(),
        delivery_date: params.form.deliveryDate.trim() || null,
        supplier_id: user.id,
        title: loadTitle,
        commodity: params.form.cargoType.trim(),
        notes: buildLoadNotes(params.form),
        payment_route: params.paymentRoute,
        payment_state: "pending",
      },
    ])
    .select()
    .single();

  if (error) {
    const message = error.message?.includes("infinite recursion")
      ? "Database policy error. Contact support or retry shortly."
      : error.message || "Unable to post load.";
    return { ok: false as const, error: message };
  }

  const loadId = String(data.id);

  await upsertSupplierPaymentOrder({
    loadId,
    supplierId: user.id,
    paymentRoute: params.paymentRoute,
    paymentState: "pending",
    amount: price,
    title: loadTitle,
    origin: params.form.origin.trim(),
    destination: params.form.destination.trim(),
    equipment: params.form.equipment,
    createdAt: data.created_at || new Date().toISOString(),
    dueLabel: params.paymentRoute === "pay-later" ? "Due within 7 days" : "Awaiting card payment",
    paymentMethod: "card",
  });

  return { ok: true as const, loadId, paymentRoute: params.paymentRoute };
}

export function formatEquipmentLabel(value: string) {
  return EQUIPMENT_OPTIONS.find((item) => item.value === value)?.label || value;
}
