"use client";

import Link from "next/link";
import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Building2,
  Check,
  Info,
  MapPin,
  Plus,
  Save,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { mergeCarrierExtras } from "@/lib/profile-extras";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type AddCarrierForm = {
  companyName: string;
  registrationNo: string;
  logoUrl: string | null;
  description: string;
  servicesOffered: string[];
  fleetSize: string;
  vehicleTypes: string[];
  weightCapacity: string;
  serviceAreas: string[];
  specializations: string[];
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  country: string;
  insuranceCertificateUrl: string | null;
  operatorLicenseUrl: string | null;
  vehicleRegistrationUrl: string | null;
  backgroundCheckUrl: string | null;
  verificationStatus: "Pending" | "Verified" | "Rejected";
  verificationNotes: string;
};

const SERVICE_OPTIONS = ["FTL", "LTL", "Refrigerated", "Flatbed", "Express", "Dedicated Fleet"];
const VEHICLE_TYPE_OPTIONS = ["Curtain-sider", "Refrigerated", "Flatbed", "Box Truck", "Tanker", "Tail Lift"];
const SERVICE_AREA_OPTIONS = ["London", "Manchester", "Birmingham", "Leeds", "Liverpool", "Glasgow"];
const SPECIALIZATION_OPTIONS = ["Construction", "Retail", "Food", "Pharmaceuticals", "Automotive", "General Freight"];
const COUNTRY_OPTIONS = ["United Kingdom", "Ireland", "Germany", "France", "Netherlands"];
const VERIFICATION_STATUS_OPTIONS = ["Pending", "Verified", "Rejected"] as const;

const initialFormState: AddCarrierForm = {
  companyName: "",
  registrationNo: "",
  logoUrl: null,
  description: "",
  servicesOffered: ["FTL", "LTL", "Refrigerated"],
  fleetSize: "",
  vehicleTypes: ["Curtain-sider", "Refrigerated"],
  weightCapacity: "",
  serviceAreas: ["London", "Manchester", "Birmingham"],
  specializations: [],
  contactPerson: "",
  email: "",
  phone: "",
  website: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postcode: "",
  country: "United Kingdom",
  insuranceCertificateUrl: null,
  operatorLicenseUrl: null,
  vehicleRegistrationUrl: null,
  backgroundCheckUrl: null,
  verificationStatus: "Pending",
  verificationNotes: "",
};

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Selected file could not be processed."));
    reader.readAsDataURL(file);
  });
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-200 focus:bg-white"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-200 focus:bg-white"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[] | string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-200 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function MultiSelectChips({
  label,
  options,
  values,
  onToggle,
}: {
  label: string;
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition-all",
                active
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              )}
            >
              {active ? <Check className="h-3.5 w-3.5" /> : null}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UploadTile({
  label,
  required,
  value,
  onUpload,
}: {
  label: string;
  required?: boolean;
  value: string | null;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
            {label} {required ? "*" : ""}
          </p>
          <p className="mt-2 text-sm font-bold text-slate-900">
            {value ? "File attached" : "Choose PDF or image"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100"
        >
          <Upload className="h-4 w-4" />
          {value ? "Replace" : "Choose File"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={onUpload}
      />
    </div>
  );
}

export default function AdminAddCarrierPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<AddCarrierForm>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);

  const updateField = <K extends keyof AddCarrierForm>(key: K, value: AddCarrierForm[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayValue = (
    key: "servicesOffered" | "vehicleTypes" | "serviceAreas" | "specializations",
    value: string
  ) => {
    setFormState((prev) => {
      const nextValues = prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value];
      return { ...prev, [key]: nextValues };
    });
  };

  const handleFileUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    field:
      | "logoUrl"
      | "insuranceCertificateUrl"
      | "operatorLicenseUrl"
      | "vehicleRegistrationUrl"
      | "backgroundCheckUrl"
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const value = file.type.startsWith("image/")
        ? await readFileAsDataUrl(file)
        : `uploaded:${file.name}`;
      updateField(field, value as AddCarrierForm[typeof field]);
      toast.success(`${file.name} attached successfully.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to attach selected file.");
    }
  };

  const validateRequired = () => {
    const missingMessage =
      !formState.companyName.trim() ? "Company Name is required." :
      !formState.registrationNo.trim() ? "Company Registration No. is required." :
      formState.servicesOffered.length === 0 ? "Select at least one service." :
      !formState.fleetSize.trim() ? "Fleet Size is required." :
      formState.vehicleTypes.length === 0 ? "Select at least one vehicle type." :
      !formState.weightCapacity.trim() ? "Weight Capacity is required." :
      formState.serviceAreas.length === 0 ? "Select at least one service area." :
      !formState.contactPerson.trim() ? "Contact Person is required." :
      !formState.email.trim() ? "Email is required." :
      !formState.phone.trim() ? "Phone is required." :
      !formState.addressLine1.trim() ? "Address Line 1 is required." :
      !formState.city.trim() ? "City is required." :
      !formState.postcode.trim() ? "Postcode is required." :
      !formState.country.trim() ? "Country is required." :
      !formState.insuranceCertificateUrl ? "Insurance Certificate is required." :
      !formState.operatorLicenseUrl ? "Operator's License is required." :
      !formState.vehicleRegistrationUrl ? "Vehicle Registration is required." :
      !formState.backgroundCheckUrl ? "Background Check is required." :
      null;

    if (missingMessage) {
      toast.error(missingMessage);
      return false;
    }

    return true;
  };

  const saveCarrier = async (mode: "list" | "another") => {
    if (!validateRequired()) return;

    try {
      setIsSaving(true);

      const carrierId = crypto.randomUUID();
      const profilePayload = {
        id: carrierId,
        role: "carrier",
        full_name: formState.contactPerson.trim(),
        company_name: formState.companyName.trim(),
        fleet_size: formState.fleetSize.trim(),
        status: formState.verificationStatus === "Verified" ? "active" : "pending",
        verification_status: formState.verificationStatus.toLowerCase(),
        is_approved:
          formState.verificationStatus === "Verified"
            ? true
            : formState.verificationStatus === "Rejected"
              ? false
              : null,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").insert(profilePayload);
      if (error) throw error;

      mergeCarrierExtras(carrierId, {
        accountType: "company",
        companyName: formState.companyName,
        registrationNo: formState.registrationNo,
        companyType: "Limited Company",
        description: formState.description,
        servicesOffered: formState.servicesOffered,
        fleetSize: formState.fleetSize,
        vehicleTypes: formState.vehicleTypes,
        maxCapacityKg: `${formState.weightCapacity} kg`,
        operatingRegion: formState.serviceAreas,
        specializations: formState.specializations,
        logoUrl: formState.logoUrl,
        contactPerson: formState.contactPerson,
        email: formState.email,
        phone: formState.phone,
        website: formState.website,
        addressLine1: formState.addressLine1,
        addressLine2: formState.addressLine2,
        address: [formState.addressLine1, formState.addressLine2, formState.city, formState.postcode, formState.country]
          .filter(Boolean)
          .join(", "),
        city: formState.city,
        postcode: formState.postcode,
        countryName: formState.country,
        countryCode: formState.country === "United Kingdom" ? "GB" : formState.country,
        verificationStatus: formState.verificationStatus,
        verificationNotes: formState.verificationNotes,
        insuranceCertificateUrl: formState.insuranceCertificateUrl,
        operatorLicenseUrl: formState.operatorLicenseUrl,
        vehicleRegistrationUrl: formState.vehicleRegistrationUrl,
        backgroundCheckUrl: formState.backgroundCheckUrl,
        accountStatus: formState.verificationStatus === "Rejected" ? "Suspended" : "Active",
        verifiedBy: formState.verificationStatus === "Verified" ? "Admin - Khalid" : null,
        verifiedDate: formState.verificationStatus === "Verified" ? new Date().toLocaleDateString("en-GB") : null,
      });

      toast.success(mode === "another" ? "Carrier saved. You can add another one now." : "Carrier saved successfully.");

      if (mode === "another") {
        setFormState(initialFormState);
        return;
      }

      router.push("/admin/carriers");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save carrier.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1660px] space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(191,255,7,0.14),_transparent_40%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-100 text-slate-700 shadow-sm">
                {formState.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formState.logoUrl} alt="Carrier logo" className="h-full w-full rounded-[28px] object-cover" />
                ) : (
                  <Plus className="h-9 w-9" />
                )}
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Add Carrier</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Add Carrier</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  Create a new carrier record with business details, contact information, and verification documents from one admin form.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/admin/carriers">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={() => router.push("/admin/carriers")}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => void saveCarrier("list")} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Carrier"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Business Information</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Company details, registration, and fleet setup</h2>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <InputField label="Company Name *" value={formState.companyName} onChange={(value) => updateField("companyName", value)} required />
              <InputField label="Company Registration No. *" value={formState.registrationNo} onChange={(value) => updateField("registrationNo", value)} required />
              <InputField label="Fleet Size *" value={formState.fleetSize} onChange={(value) => updateField("fleetSize", value)} type="number" required />
              <InputField label="Weight Capacity *" value={formState.weightCapacity} onChange={(value) => updateField("weightCapacity", value)} type="number" required />
              <div className="lg:col-span-2">
                <TextAreaField label="Company Description" value={formState.description} onChange={(value) => updateField("description", value)} rows={5} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <UploadTile label="Company Logo" value={formState.logoUrl} onUpload={(event) => void handleFileUpload(event, "logoUrl")} />
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 space-y-5">
              <MultiSelectChips label="Services Offered *" options={SERVICE_OPTIONS} values={formState.servicesOffered} onToggle={(value) => toggleArrayValue("servicesOffered", value)} />
              <MultiSelectChips label="Vehicle Types *" options={VEHICLE_TYPE_OPTIONS} values={formState.vehicleTypes} onToggle={(value) => toggleArrayValue("vehicleTypes", value)} />
              <MultiSelectChips label="Service Areas *" options={SERVICE_AREA_OPTIONS} values={formState.serviceAreas} onToggle={(value) => toggleArrayValue("serviceAreas", value)} />
              <MultiSelectChips label="Specializations" options={SPECIALIZATION_OPTIONS} values={formState.specializations} onToggle={(value) => toggleArrayValue("specializations", value)} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Contact and Location</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Address, contact person, email, and phone details</h2>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <InputField label="Contact Person *" value={formState.contactPerson} onChange={(value) => updateField("contactPerson", value)} required />
              <InputField label="Email *" value={formState.email} onChange={(value) => updateField("email", value)} type="email" required />
              <InputField label="Phone *" value={formState.phone} onChange={(value) => updateField("phone", value)} type="tel" required />
              <InputField label="Website" value={formState.website} onChange={(value) => updateField("website", value)} type="url" />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <InputField label="Address Line 1 *" value={formState.addressLine1} onChange={(value) => updateField("addressLine1", value)} required />
              <InputField label="Address Line 2" value={formState.addressLine2} onChange={(value) => updateField("addressLine2", value)} />
              <InputField label="City *" value={formState.city} onChange={(value) => updateField("city", value)} required />
              <InputField label="Postcode *" value={formState.postcode} onChange={(value) => updateField("postcode", value)} required />
              <div className="md:col-span-2">
                <SelectField label="Country *" value={formState.country} options={COUNTRY_OPTIONS} onChange={(value) => updateField("country", value)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Verification and Documents</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Documents, insurance, and approval state</h2>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <UploadTile label="Insurance Certificate" required value={formState.insuranceCertificateUrl} onUpload={(event) => void handleFileUpload(event, "insuranceCertificateUrl")} />
            <UploadTile label="Operator's License" required value={formState.operatorLicenseUrl} onUpload={(event) => void handleFileUpload(event, "operatorLicenseUrl")} />
            <UploadTile label="Vehicle Registration" required value={formState.vehicleRegistrationUrl} onUpload={(event) => void handleFileUpload(event, "vehicleRegistrationUrl")} />
            <UploadTile label="Background Check" required value={formState.backgroundCheckUrl} onUpload={(event) => void handleFileUpload(event, "backgroundCheckUrl")} />
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-4">
              <SelectField label="Verification Status *" value={formState.verificationStatus} options={VERIFICATION_STATUS_OPTIONS} onChange={(value) => updateField("verificationStatus", value as AddCarrierForm["verificationStatus"])} />
              <TextAreaField label="Verification Notes" value={formState.verificationNotes} onChange={(value) => updateField("verificationNotes", value)} rows={6} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight text-slate-950">Save this carrier now or continue adding more records</p>
              <p className="mt-1 text-sm text-slate-500">
                `Save Carrier` returns to the carriers list. `Save & Add Another` keeps you on this page with a clean form.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void saveCarrier("list")} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Carrier"}
            </Button>
            <Button variant="secondary" onClick={() => void saveCarrier("another")} disabled={isSaving}>
              <Plus className="mr-2 h-4 w-4" />
              Save & Add Another
            </Button>
            <Button variant="secondary" onClick={() => router.push("/admin/carriers")} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
