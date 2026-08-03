"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useDropzone } from "react-dropzone";
import Select from "react-select";
import toast from "react-hot-toast";
import {
  Bell,
  Building2,
  CircleDollarSign,
  CloudUpload,
  CreditCard,
  Globe2,
  Loader2,
  Mail,
  Phone,
  Save,
  Settings2,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PLATFORM_SETTINGS,
  LOCAL_LOGO_KEY,
  LOCAL_SAVED_AT_KEY,
  loadPlatformSettings,
  mergePlatformSettings,
  savePlatformSettings,
  type PlatformSettings,
} from "@/lib/platform-settings";

const settingsSchema = z.object({
  companyName: z.string().min(2, "Company name is required."),
  supportEmail: z.email("Enter a valid support email."),
  supportPhone: z.string().min(6, "Enter a support phone number."),
  companyAddress: z.string().min(4, "Company address is required."),
  websiteUrl: z.string().url("Enter a valid website URL.").or(z.literal("")),
  commissionRate: z.coerce.number().min(1).max(100),
  minCommissionGbp: z.coerce.number().min(0),
  currency: z.string().min(1),
  verificationMode: z.string().min(1),
  autoApproveSuppliers: z.boolean(),
  requirePodVerification: z.boolean(),
  payoutSchedule: z.string().min(1),
  defaultPaymentTerms: z.string().min(1),
  emailAlerts: z.boolean(),
  smsAlerts: z.boolean(),
  bidAlerts: z.boolean(),
  apiBaseUrl: z.string().url("Enter a valid API URL."),
  stripeMode: z.string().min(1),
});

type SettingsValues = PlatformSettings;
type SettingsFormInput = z.input<typeof settingsSchema>;
type SettingsTab = "company" | "commission" | "verification" | "payments" | "notifications" | "api";

const CARD_CLASS =
  "rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60";
const SECTION_LABEL = "text-[11px] font-semibold text-slate-500";
const SECTION_TITLE = "text-xl font-bold text-slate-900";

const DEFAULT_VALUES = DEFAULT_PLATFORM_SETTINGS;

const verificationOptions = [
  { value: "manual", label: "Manual verification" },
  { value: "hybrid", label: "Hybrid review" },
  { value: "automatic", label: "Automatic rules" },
];

const payoutOptions = [
  { value: "daily", label: "Daily payout cycle" },
  { value: "weekly", label: "Weekly payout cycle" },
  { value: "twice-weekly", label: "Twice weekly cycle" },
];

const paymentTermsOptions = [
  { value: "instant", label: "Instant settlement" },
  { value: "net-7", label: "Net 7 days" },
  { value: "net-14", label: "Net 14 days" },
  { value: "net-30", label: "Net 30 days" },
];

const currencyOptions = [
  { value: "GBP", label: "GBP (£)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD ($)" },
];

const stripeModeOptions = [
  { value: "test", label: "Test mode" },
  { value: "live", label: "Live mode" },
];

const TAB_OPTIONS: Array<{ id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "commission", label: "Commission", icon: CircleDollarSign },
  { id: "verification", label: "Verification", icon: ShieldCheck },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "api", label: "API", icon: Webhook },
];

function readStoredSettings(): Partial<SettingsValues> {
  return {};
}

function writeStoredSettings(_values: SettingsValues) {
  // Settings persist in Supabase via savePlatformSettings().
}

function selectStyles() {
  return {
    control: () =>
      "flex min-h-10 items-center rounded-xl bg-slate-50/80 px-3 ring-1 ring-slate-200/60",
    menu: () => "mt-2 rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-200/60",
    option: ({ isFocused }: { isFocused: boolean }) =>
      `cursor-pointer rounded-lg px-3 py-2 text-sm ${isFocused ? "bg-slate-100" : ""}`,
    placeholder: () => "text-sm text-slate-400",
    singleValue: () => "text-sm font-semibold text-slate-900",
  };
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">{children}</label>;
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-xl bg-slate-50/80 px-3 text-sm font-medium text-slate-900 ring-1 ring-slate-200/60 outline-none placeholder:text-slate-400 focus:bg-white focus:ring-slate-300",
        props.className
      )}
    />
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-600">{message}</p>;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-slate-900" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(CARD_CLASS, "relative overflow-hidden p-6")}>
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-slate-700 to-slate-300" />
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-200/60">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className={SECTION_LABEL}>{eyebrow}</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>("company");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const { data: settingsData, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["admin-platform-settings"],
    queryFn: loadPlatformSettings,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<SettingsFormInput, unknown, SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const watched = watch();

  useEffect(() => {
    if (!settingsData) return;

    const originApi =
      typeof window !== "undefined" ? `${window.location.origin}/api` : DEFAULT_VALUES.apiBaseUrl;

    reset(
      mergePlatformSettings({
        ...settingsData.settings,
        apiBaseUrl: settingsData.settings.apiBaseUrl || originApi,
      })
    );

    if (settingsData.updated_at) {
      setLastSaved(format(new Date(settingsData.updated_at), "dd MMM yyyy, hh:mm a"));
    } else {
      const savedAt = window.localStorage.getItem(LOCAL_SAVED_AT_KEY);
      if (savedAt) setLastSaved(savedAt);
    }

    const logoName =
      settingsData.settings.logoFileName ??
      window.localStorage.getItem(LOCAL_LOGO_KEY);
    if (logoName) setUploadedFileName(logoName);
  }, [settingsData, reset]);

  const onDrop = useMemo(
    () => (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setUploadedFileName(file.name);
      window.localStorage.setItem(LOCAL_LOGO_KEY, file.name);
      toast.success("Brand logo saved to settings draft.");
    },
    []
  );

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop,
  });

  const onSubmit: SubmitHandler<SettingsValues> = async (values) => {
    try {
      const payload = {
        ...values,
        logoFileName: uploadedFileName,
      };
      const saved = await savePlatformSettings(payload);
      const savedLabel = saved.updated_at
        ? format(new Date(saved.updated_at), "dd MMM yyyy, hh:mm a")
        : format(new Date(), "dd MMM yyyy, hh:mm a");
      window.localStorage.setItem(LOCAL_SAVED_AT_KEY, savedLabel);
      setLastSaved(savedLabel);
      await queryClient.invalidateQueries({ queryKey: ["admin-platform-settings"] });
      toast.success(`Settings saved to Supabase for ${values.companyName}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save settings.");
    }
  };

  const summaryCards = [
    {
      label: "Commission",
      value: `${watched.commissionRate ?? DEFAULT_VALUES.commissionRate}%`,
      note: `Min ${watched.currency ?? "GBP"} ${watched.minCommissionGbp ?? 0}`,
      icon: CircleDollarSign,
    },
    {
      label: "Verification",
      value:
        verificationOptions.find((option) => option.value === watched.verificationMode)?.label ??
        "Hybrid review",
      note: watched.requirePodVerification ? "POD required" : "POD optional",
      icon: ShieldCheck,
    },
    {
      label: "Payouts",
      value:
        payoutOptions.find((option) => option.value === watched.payoutSchedule)?.label ?? "Weekly",
      note:
        paymentTermsOptions.find((option) => option.value === watched.defaultPaymentTerms)?.label ??
        "Net 7 days",
      icon: CreditCard,
    },
    {
      label: "Alerts",
      value: [
        watched.emailAlerts ? "Email" : null,
        watched.smsAlerts ? "SMS" : null,
        watched.bidAlerts ? "Bids" : null,
      ]
        .filter(Boolean)
        .join(" · ") || "None",
      note: watched.stripeMode === "live" ? "Stripe live" : "Stripe test",
      icon: Bell,
    },
  ];

  if (isSettingsLoading && !settingsData) {
    return (
      <div className={cn(CARD_CLASS, "mx-auto flex max-w-[1400px] items-center justify-center gap-3 px-6 py-16 text-sm text-slate-500")}>
        <Loader2 className="h-5 w-5 animate-spin text-slate-700" />
        Loading platform settings…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <section className={cn(CARD_CLASS, "relative overflow-hidden p-6")}>
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-slate-700 to-slate-300" />
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <p className={SECTION_LABEL}>Platform settings</p>
              <h2 className={SECTION_TITLE}>Configure marketplace operations</h2>
              <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-500">
                Company identity, commission rules, verification flow, payouts, notifications, and API configuration — saved locally until backend wiring is connected.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
              <p className="text-[11px] font-semibold text-slate-500">Settings health</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {lastSaved ? `Saved ${lastSaved}` : "Using defaults — not saved yet"}
              </p>
            </div>
            <Button type="submit" form="admin-settings-form" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save all
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={cn(CARD_CLASS, "relative overflow-hidden p-4")}>
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-slate-700 to-slate-300" />
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-slate-50 p-2 text-slate-700">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-slate-500">{item.label}</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{item.value}</p>
              <p className="mt-1 text-xs text-slate-500">{item.note}</p>
            </div>
          );
        })}
      </section>

      <section className={cn(CARD_CLASS, "overflow-hidden")}>
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 px-4 py-3">
          {TAB_OPTIONS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ring-1 ring-slate-200/60",
                  activeTab === tab.id ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <form id="admin-settings-form" onSubmit={handleSubmit(onSubmit)} className="p-6">
          {activeTab === "company" ? (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <SectionCard
                eyebrow="Company profile"
                title="Business identity"
                description="Public-facing company details used across admin and support surfaces."
                icon={Building2}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>Company name</FieldLabel>
                    <FieldInput {...register("companyName")} />
                    <FieldError message={errors.companyName?.message} />
                  </div>
                  <div>
                    <FieldLabel>Website URL</FieldLabel>
                    <FieldInput {...register("websiteUrl")} placeholder="https://..." />
                    <FieldError message={errors.websiteUrl?.message} />
                  </div>
                  <div>
                    <FieldLabel>Support email</FieldLabel>
                    <FieldInput {...register("supportEmail")} type="email" />
                    <FieldError message={errors.supportEmail?.message} />
                  </div>
                  <div>
                    <FieldLabel>Support phone</FieldLabel>
                    <FieldInput {...register("supportPhone")} />
                    <FieldError message={errors.supportPhone?.message} />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel>Company address</FieldLabel>
                    <FieldInput {...register("companyAddress")} />
                    <FieldError message={errors.companyAddress?.message} />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Brand asset"
                title="Logo upload"
                description="Upload a logo for admin exports and future branded documents."
                icon={CloudUpload}
              >
                <div
                  {...getRootProps()}
                  className={cn(
                    "cursor-pointer rounded-xl border border-dashed px-5 py-8 text-center transition-colors",
                    isDragActive
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-300 bg-slate-50/80 hover:bg-slate-50"
                  )}
                >
                  <input {...getInputProps()} />
                  <CloudUpload className="mx-auto h-8 w-8 text-slate-500" />
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Drop logo here or click to browse
                  </p>
                  <p className="mt-1 text-xs text-slate-500">PNG, SVG, or JPG — one file only</p>
                  {uploadedFileName ? (
                    <p className="mt-4 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200/60">
                      Current draft: {uploadedFileName}
                    </p>
                  ) : null}
                </div>
              </SectionCard>
            </div>
          ) : null}

          {activeTab === "commission" ? (
            <SectionCard
              eyebrow="Commission"
              title="Marketplace fee rules"
              description="Default commission applied to completed marketplace loads."
              icon={CircleDollarSign}
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <FieldLabel>Default commission rate (%)</FieldLabel>
                  <FieldInput type="number" min={1} max={100} {...register("commissionRate")} />
                  <FieldError message={errors.commissionRate?.message} />
                </div>
                <div>
                  <FieldLabel>Minimum commission</FieldLabel>
                  <FieldInput type="number" min={0} step="0.01" {...register("minCommissionGbp")} />
                  <FieldError message={errors.minCommissionGbp?.message} />
                </div>
                <div>
                  <FieldLabel>Default currency</FieldLabel>
                  <Controller
                    control={control}
                    name="currency"
                    render={({ field }) => (
                      <Select
                        options={currencyOptions}
                        value={currencyOptions.find((option) => option.value === field.value) ?? currencyOptions[0]}
                        onChange={(option) => field.onChange(option?.value)}
                        unstyled
                        classNames={selectStyles()}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50/80 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200/60">
                Example: a £1,000 load at {String(watched.commissionRate ?? 12)}% commission =
                <span className="font-semibold text-slate-900">
                  {" "}
                  £{Math.max(((Number(watched.commissionRate) || 12) / 100) * 1000, Number(watched.minCommissionGbp) || 0).toFixed(0)}
                </span>{" "}
                platform fee.
              </div>
            </SectionCard>
          ) : null}

          {activeTab === "verification" ? (
            <SectionCard
              eyebrow="Verification"
              title="Approval workflow"
              description="Control how carriers and suppliers enter the marketplace."
              icon={ShieldCheck}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Verification mode</FieldLabel>
                  <Controller
                    control={control}
                    name="verificationMode"
                    render={({ field }) => (
                      <Select
                        options={verificationOptions}
                        value={
                          verificationOptions.find((option) => option.value === field.value) ??
                          verificationOptions[1]
                        }
                        onChange={(option) => field.onChange(option?.value)}
                        unstyled
                        classNames={selectStyles()}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <Controller
                  control={control}
                  name="autoApproveSuppliers"
                  render={({ field }) => (
                    <ToggleRow
                      label="Auto-approve suppliers"
                      description="Allow supplier accounts to post loads without manual admin review."
                      checked={Boolean(field.value)}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="requirePodVerification"
                  render={({ field }) => (
                    <ToggleRow
                      label="Require POD verification"
                      description="Carriers must pass proof-of-delivery review before payout release."
                      checked={Boolean(field.value)}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </SectionCard>
          ) : null}

          {activeTab === "payments" ? (
            <SectionCard
              eyebrow="Payments"
              title="Payout & settlement"
              description="Default payout cadence and payment terms for marketplace participants."
              icon={CreditCard}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Payout schedule</FieldLabel>
                  <Controller
                    control={control}
                    name="payoutSchedule"
                    render={({ field }) => (
                      <Select
                        options={payoutOptions}
                        value={
                          payoutOptions.find((option) => option.value === field.value) ?? payoutOptions[1]
                        }
                        onChange={(option) => field.onChange(option?.value)}
                        unstyled
                        classNames={selectStyles()}
                      />
                    )}
                  />
                </div>
                <div>
                  <FieldLabel>Default payment terms</FieldLabel>
                  <Controller
                    control={control}
                    name="defaultPaymentTerms"
                    render={({ field }) => (
                      <Select
                        options={paymentTermsOptions}
                        value={
                          paymentTermsOptions.find((option) => option.value === field.value) ??
                          paymentTermsOptions[1]
                        }
                        onChange={(option) => field.onChange(option?.value)}
                        unstyled
                        classNames={selectStyles()}
                      />
                    )}
                  />
                </div>
              </div>
            </SectionCard>
          ) : null}

          {activeTab === "notifications" ? (
            <SectionCard
              eyebrow="Notifications"
              title="Admin alert preferences"
              description="Choose which operational events trigger admin notifications."
              icon={Bell}
            >
              <div className="space-y-3">
                <Controller
                  control={control}
                  name="emailAlerts"
                  render={({ field }) => (
                    <ToggleRow
                      label="Email alerts"
                      description="Verification queue, payment failures, and load exceptions."
                      checked={Boolean(field.value)}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="smsAlerts"
                  render={({ field }) => (
                    <ToggleRow
                      label="SMS alerts"
                      description="Critical shipment delays and high-value load events."
                      checked={Boolean(field.value)}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="bidAlerts"
                  render={({ field }) => (
                    <ToggleRow
                      label="Bid activity alerts"
                      description="Notify when loads receive new carrier bids."
                      checked={Boolean(field.value)}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </SectionCard>
          ) : null}

          {activeTab === "api" ? (
            <SectionCard
              eyebrow="API & integrations"
              title="Developer configuration"
              description="Base URLs and payment gateway mode for connected services."
              icon={Globe2}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>API base URL</FieldLabel>
                  <FieldInput {...register("apiBaseUrl")} />
                  <FieldError message={errors.apiBaseUrl?.message} />
                </div>
                <div>
                  <FieldLabel>Stripe mode</FieldLabel>
                  <Controller
                    control={control}
                    name="stripeMode"
                    render={({ field }) => (
                      <Select
                        options={stripeModeOptions}
                        value={
                          stripeModeOptions.find((option) => option.value === field.value) ??
                          stripeModeOptions[0]
                        }
                        onChange={(option) => field.onChange(option?.value)}
                        unstyled
                        classNames={selectStyles()}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200/60">
                  <Mail className="h-3.5 w-3.5" />
                  Webhooks ready for wiring
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200/60">
                  <Phone className="h-3.5 w-3.5" />
                  Stripe checkout connected
                </span>
              </div>
            </SectionCard>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-200/60">
            <p className="text-sm text-slate-600">
              Changes are stored in browser localStorage until Supabase settings table is connected.
            </p>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save settings
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
