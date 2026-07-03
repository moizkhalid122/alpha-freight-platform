"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import NothingLottie from "@/components/ui/NothingLottie";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileCheck,
  FileText,
  Fuel,
  Gauge,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Truck,
  UserPlus,
  Wrench,
  X,
} from "lucide-react";

type VehicleRow = {
  id: string;
  name: string | null;
  status: string | null;
  carrier_id: string;
  profile?: VehicleProfile | null;
  created_at?: string | null;
  source?: "supabase" | "local";
};

type VehicleDocumentKey =
  | "registrationCertificate"
  | "insuranceCertificate"
  | "motCertificate"
  | "inspectionReport";

type VehicleDocumentFiles = Record<VehicleDocumentKey, File | null>;

type VehicleFormValues = {
  registrationNumber: string;
  vehicleType: string;
  make: string;
  model: string;
  year: string;
  color: string;
  weightCapacityKg: string;
  lengthMeters: string;
  fuelType: string;
  transmission: string;
  currentMileage: string;
  lastServiceDate: string;
  nextServiceDue: string;
  vehicleStatus: string;
  gpsTrackerId: string;
  companyDescription: string;
  serviceAreas: string;
  specializations: string;
  insuranceExpiryDate: string;
  motExpiryDate: string;
  driverName: string;
  driverLicenseNo: string;
  driverPhone: string;
  driverEmail: string;
  assignedDate: string;
};

type VehicleFormErrors = Partial<Record<keyof VehicleFormValues | VehicleDocumentKey, string>>;

type VehicleProfile = VehicleFormValues & {
  savedAt: string;
  documentNames: Partial<Record<VehicleDocumentKey, string>>;
  documentUrls: Partial<Record<VehicleDocumentKey, string>>;
  verificationStatus?: string;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  requestedInfoAt?: string;
};

const OVERLAY_CLASS =
  "fixed inset-0 z-[200] min-h-[100dvh] w-screen bg-slate-900/45 backdrop-blur-[6px]";

const FORM_STEPS = [
  { id: 1 as const, label: "Details", description: "Registration & specs" },
  { id: 2 as const, label: "Compliance", description: "Insurance & MOT" },
  { id: 3 as const, label: "Driver", description: "Optional assignment" },
];
type FormStep = (typeof FORM_STEPS)[number]["id"];

const STATUS_FILTERS = ["all", "active", "pending", "maintenance"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const VEHICLE_TYPE_OPTIONS = [
  "Curtain-sider",
  "Refrigerated",
  "Flatbed",
  "Box Van",
  "Low Loader",
  "Tanker",
];

const FUEL_TYPE_OPTIONS = ["Diesel", "Electric", "Hybrid"];
const TRANSMISSION_OPTIONS = ["Manual", "Automatic"];
const VEHICLE_STATUS_OPTIONS = ["Active", "Inactive", "Under Maintenance"];

const initialVehicleForm: VehicleFormValues = {
  registrationNumber: "",
  vehicleType: "Curtain-sider",
  make: "",
  model: "",
  year: "",
  color: "",
  weightCapacityKg: "",
  lengthMeters: "",
  fuelType: "Diesel",
  transmission: "Manual",
  currentMileage: "",
  lastServiceDate: "",
  nextServiceDue: "",
  vehicleStatus: "Active",
  gpsTrackerId: "",
  companyDescription: "",
  serviceAreas: "",
  specializations: "",
  insuranceExpiryDate: "",
  motExpiryDate: "",
  driverName: "",
  driverLicenseNo: "",
  driverPhone: "",
  driverEmail: "",
  assignedDate: "",
};

const initialDocumentFiles: VehicleDocumentFiles = {
  registrationCertificate: null,
  insuranceCertificate: null,
  motCertificate: null,
  inspectionReport: null,
};

const documentFieldMeta: Array<{
  key: VehicleDocumentKey;
  label: string;
  required: boolean;
}> = [
  { key: "registrationCertificate", label: "Registration Certificate", required: true },
  { key: "insuranceCertificate", label: "Insurance Certificate", required: true },
  { key: "motCertificate", label: "MOT Certificate", required: true },
  { key: "inspectionReport", label: "Vehicle Inspection Report", required: false },
];

const getLocalVehiclesKey = (userId: string) => `alpha-local-vehicles:${userId}`;

const readLocalVehicles = (userId: string): VehicleRow[] => {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(getLocalVehiclesKey(userId));
    return rawValue ? (JSON.parse(rawValue) as VehicleRow[]) : [];
  } catch {
    return [];
  }
};

const writeLocalVehicles = (userId: string, vehicles: VehicleRow[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getLocalVehiclesKey(userId), JSON.stringify(vehicles));
};

const upsertLocalVehicle = (userId: string, vehicle: VehicleRow) => {
  const currentVehicles = readLocalVehicles(userId);
  writeLocalVehicles(userId, mergeVehicleRows([vehicle], currentVehicles));
};

const mergeVehicleRows = (databaseVehicles: VehicleRow[], localVehicles: VehicleRow[]) => {
  const merged = new Map<string, VehicleRow>();

  [...localVehicles, ...databaseVehicles].forEach((vehicle) => {
    merged.set(vehicle.id, vehicle);
  });

  return Array.from(merged.values());
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error) {
    const record = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((part) => typeof part === "string" && part.trim())
      .map(String);
    if (parts.length > 0) return parts.join(" — ");
  }
  return "Unknown error";
};

const buildVehicleProfile = (
  vehicleForm: VehicleFormValues,
  existingProfile: VehicleProfile | null | undefined,
  documentNames: Partial<Record<VehicleDocumentKey, string>>,
  documentUrls: Partial<Record<VehicleDocumentKey, string>>
): VehicleProfile => ({
  ...vehicleForm,
  savedAt: new Date().toISOString(),
  documentNames,
  documentUrls,
  verificationStatus: existingProfile?.verificationStatus || "pending",
  verificationNotes: existingProfile?.verificationNotes,
  verifiedBy: existingProfile?.verifiedBy,
  verifiedAt: existingProfile?.verifiedAt,
  rejectionReason: existingProfile?.rejectionReason,
  requestedInfoAt: existingProfile?.requestedInfoAt,
});

const buildVehicleInsertPayload = (
  userId: string,
  vehicleForm: VehicleFormValues,
  nextVehicleStatus: string,
  profile: VehicleProfile
) => ({
  carrier_id: userId,
  name: vehicleForm.registrationNumber.trim(),
  status: nextVehicleStatus,
  profile,
});

const buildVehicleUpdatePayload = (
  vehicleForm: VehicleFormValues,
  nextVehicleStatus: string,
  profile: VehicleProfile
) => ({
  name: vehicleForm.registrationNumber.trim(),
  status: nextVehicleStatus,
  profile,
});

const createLocalVehicle = (
  userId: string,
  vehicleForm: VehicleFormValues,
  nextVehicleStatus: string
): VehicleRow => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `local-${Date.now()}`,
  carrier_id: userId,
  name: vehicleForm.registrationNumber.trim(),
  status: nextVehicleStatus,
  source: "local",
});

const persistVehicleToSupabase = async ({
  isEditing,
  editingVehicleId,
  userId,
  vehicleForm,
  nextVehicleStatus,
  profile,
}: {
  isEditing: boolean;
  editingVehicleId: string | null;
  userId: string;
  vehicleForm: VehicleFormValues;
  nextVehicleStatus: string;
  profile: VehicleProfile;
}) => {
  if (isEditing && editingVehicleId) {
    const payload = buildVehicleUpdatePayload(vehicleForm, nextVehicleStatus, profile);
    const { data, error } = await supabase
      .from("vehicles")
      .update(payload)
      .eq("id", editingVehicleId)
      .select("*")
      .single();

    if (!error) {
      return { vehicle: { ...(data as VehicleRow), source: "supabase" as const }, usedFallback: false };
    }

    const { data: basicData, error: basicError } = await supabase
      .from("vehicles")
      .update({
        name: payload.name,
        status: payload.status,
      })
      .eq("id", editingVehicleId)
      .select("*")
      .single();

    if (!basicError) {
      return {
        vehicle: { ...(basicData as VehicleRow), source: "supabase" as const },
        usedFallback: false,
      };
    }

    console.warn("Vehicle update fallback:", getErrorMessage(basicError));
    return { vehicle: null, usedFallback: true, error: basicError };
  }

  const payload = buildVehicleInsertPayload(userId, vehicleForm, nextVehicleStatus, profile);
  const { data, error } = await supabase.from("vehicles").insert(payload).select("*").single();

  if (!error) {
    return { vehicle: { ...(data as VehicleRow), source: "supabase" as const }, usedFallback: false };
  }

  const { data: basicData, error: basicError } = await supabase
    .from("vehicles")
    .insert({
      carrier_id: userId,
      name: payload.name,
      status: payload.status,
    })
    .select("*")
    .single();

  if (!basicError) {
    return {
      vehicle: { ...(basicData as VehicleRow), source: "supabase" as const },
      usedFallback: false,
    };
  }

  console.warn("Vehicle insert fallback:", getErrorMessage(basicError));
  return { vehicle: null, usedFallback: true, error: basicError };
};

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });

const isFutureDate = (value: string) => {
  if (!isValidDate(value)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(value);
  selectedDate.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};

const normalizeRegistrationNumber = (value: string) =>
  value.toUpperCase().replace(/\s+/g, " ").trim();

const isValidDate = (value: string) => {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const validateVehicleStep = (
  step: FormStep,
  values: VehicleFormValues,
  documents: VehicleDocumentFiles,
  existingProfile?: VehicleProfile | null
): VehicleFormErrors => {
  const errors: VehicleFormErrors = {};
  const currentYear = new Date().getFullYear();

  if (step === 1) {
    if (!values.registrationNumber.trim() || values.registrationNumber.replace(/\s/g, "").length < 2) {
      errors.registrationNumber = "Registration number is required";
    }
    if (!values.vehicleType) errors.vehicleType = "Select a vehicle type";
    if (!values.make.trim()) errors.make = "Make is required";
    if (!values.model.trim()) errors.model = "Model is required";
    if (values.year) {
      const parsedYear = Number(values.year);
      if (Number.isNaN(parsedYear) || parsedYear < 1990 || parsedYear > currentYear + 1) {
        errors.year = `Enter a year between 1990 and ${currentYear + 1}`;
      }
    }
    if (!values.weightCapacityKg || Number(values.weightCapacityKg) <= 0) {
      errors.weightCapacityKg = "Weight capacity is required";
    }
    if (values.lengthMeters && Number(values.lengthMeters) <= 0) {
      errors.lengthMeters = "Enter a valid length";
    }
    if (values.currentMileage && Number(values.currentMileage) < 0) {
      errors.currentMileage = "Mileage cannot be negative";
    }
    if (
      values.lastServiceDate &&
      values.nextServiceDue &&
      new Date(values.nextServiceDue) < new Date(values.lastServiceDate)
    ) {
      errors.nextServiceDue = "Next service must be after last service";
    }
    return errors;
  }

  if (step === 2) {
    if (!isValidDate(values.insuranceExpiryDate)) {
      errors.insuranceExpiryDate = "Insurance expiry date is required";
    }
    if (!isValidDate(values.motExpiryDate)) {
      errors.motExpiryDate = "MOT expiry date is required";
    }
    return errors;
  }

  if (values.driverEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.driverEmail)) {
    errors.driverEmail = "Enter a valid driver email";
  }

  return errors;
};

const validateVehicleForm = (
  values: VehicleFormValues,
  documents: VehicleDocumentFiles,
  existingProfile?: VehicleProfile | null
): VehicleFormErrors => {
  return {
    ...validateVehicleStep(1, values, documents, existingProfile),
    ...validateVehicleStep(2, values, documents, existingProfile),
    ...validateVehicleStep(3, values, documents, existingProfile),
  };
};

const formatVehicleStatusChip = (status?: string | null) => {
  const value = (status || "inactive").toLowerCase();
  if (value.includes("verified")) return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  if (value.includes("reject")) return "bg-red-50 text-red-700 border border-red-100";
  if (value.includes("need")) return "bg-amber-50 text-amber-700 border border-amber-100";
  if (value.includes("review") || value.includes("pending")) {
    return "bg-sky-50 text-sky-700 border border-sky-100";
  }
  if (value.includes("active")) return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  if (value.includes("maint")) return "bg-amber-50 text-amber-700 border border-amber-100";
  return "bg-slate-50 text-slate-500 border border-slate-100";
};

const getVehicleDisplayStatus = (
  operationalStatus?: string | null,
  verificationStatus?: string | null
) => {
  const verificationValue = (verificationStatus || "").trim().toLowerCase();

  if (verificationValue === "verified") {
    return operationalStatus || "Active";
  }

  if (verificationValue === "rejected") {
    return "Rejected";
  }

  if (verificationValue === "needs_info") {
    return "Needs Info";
  }

  return "Pending Review";
};

const getVerificationMeta = (status?: string | null) => {
  const value = (status || "").trim().toLowerCase();

  if (value === "verified") {
    return {
      label: "Verified",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (value === "rejected") {
    return {
      label: "Rejected",
      className: "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (value === "needs_info") {
    return {
      label: "Needs Info",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Pending Review",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  };
};

const formatInfoDate = (value?: string | null) => {
  if (!value) return "Not available";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const labelStyle = "mb-1.5 block text-[11px] font-semibold text-slate-500";

const inputBaseClass =
  "h-10 w-full rounded-lg border bg-white px-3 text-[13px] font-medium text-slate-900 outline-none transition focus:ring-2 focus:ring-slate-900/10";

const fieldClass = (hasError: boolean) =>
  `${inputBaseClass} ${hasError ? "border-rose-300 focus:border-rose-400" : "border-slate-200 focus:border-slate-300"}`;

const errorText = (message?: string) =>
  message ? <p className="mt-1 text-[11px] font-medium text-rose-600">{message}</p> : null;

const FormGroup = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <p className="text-[13px] font-semibold text-slate-900">{title}</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
  </div>
);

const DetailSection = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) => (
  <section className="relative overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/60">
    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
    <div className="p-4 pl-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-500" />
        <h3 className="text-[14px] font-bold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  </section>
);

const DetailField = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="rounded-lg bg-slate-50/80 px-3 py-2.5">
    <p className="text-[11px] text-slate-500">{label}</p>
    <p className="mt-0.5 text-[13px] font-semibold text-slate-900">
      {value || "Not provided"}
    </p>
  </div>
);

const detailGridClass = "grid gap-2 sm:grid-cols-2 lg:grid-cols-3";

export default function MyVehiclesPage() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleFormValues>(initialVehicleForm);
  const [documentFiles, setDocumentFiles] = useState<VehicleDocumentFiles>(initialDocumentFiles);
  const [formErrors, setFormErrors] = useState<VehicleFormErrors>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [vehicleProfiles, setVehicleProfiles] = useState<Record<string, VehicleProfile>>({});
  const [submitMode, setSubmitMode] = useState<"save" | "save_and_add" | null>(null);
  const [formStep, setFormStep] = useState<FormStep>(1);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    window.setTimeout(() => setFeedback(null), 2600);
  };

  const resetVehicleModal = () => {
    setVehicleForm(initialVehicleForm);
    setDocumentFiles(initialDocumentFiles);
    setFormErrors({});
    setEditingVehicleId(null);
    setFormStep(1);
  };

  const openVehicleModal = () => {
    resetVehicleModal();
    setIsModalOpen(true);
  };

  const closeVehicleModal = (force = false) => {
    if (submitMode && !force) return;
    setIsModalOpen(false);
    resetVehicleModal();
  };

  useEffect(() => {
    try {
      const storedProfiles = window.localStorage.getItem("alpha-vehicle-profiles");
      if (storedProfiles) {
        setVehicleProfiles(JSON.parse(storedProfiles) as Record<string, VehicleProfile>);
      }
    } catch (error) {
      console.error("Error restoring vehicle profiles:", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("alpha-vehicle-profiles", JSON.stringify(vehicleProfiles));
    } catch (error) {
      console.error("Error saving vehicle profiles:", error);
    }
  }, [vehicleProfiles]);

  useEffect(() => {
    if (!isModalOpen && !selectedVehicleId) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen, selectedVehicleId]);

  useEffect(() => {
    async function fetchVehicles() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const localVehicles = readLocalVehicles(user.id);

        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .eq("carrier_id", user.id);

        if (error) throw error;

        const databaseVehicles = ((data || []) as VehicleRow[]).map((vehicle) => ({
          ...vehicle,
          source: "supabase" as const,
        }));

        const profilesFromDatabase = databaseVehicles.reduce<Record<string, VehicleProfile>>(
          (accumulator, vehicle) => {
            if (vehicle.profile && typeof vehicle.profile === "object") {
              accumulator[vehicle.id] = vehicle.profile;
            }
            return accumulator;
          },
          {}
        );

        if (Object.keys(profilesFromDatabase).length > 0) {
          setVehicleProfiles((current) => ({ ...current, ...profilesFromDatabase }));
        }

        setVehicles(mergeVehicleRows(databaseVehicles, localVehicles));
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            setVehicles(readLocalVehicles(user.id));
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    }

    void fetchVehicles();
  }, []);

  const normalizedVehicles = useMemo(
    () =>
      vehicles.map((vehicle) => {
        const profile = vehicleProfiles[vehicle.id];
        const vehicleType = profile?.vehicleType || "Vehicle";
        const makeModel = [profile?.make, profile?.model].filter(Boolean).join(" ");
        const serviceAreas = profile?.serviceAreas || "Not provided";
        const status = profile?.vehicleStatus || vehicle.status || "Inactive";
        const verificationStatus = profile?.verificationStatus || "pending";
        const displayStatus = getVehicleDisplayStatus(status, verificationStatus);

        return {
          ...vehicle,
          displayName: profile?.registrationNumber || vehicle.name || "Fleet Unit",
          displayId: vehicle.id.slice(0, 8).toUpperCase(),
          vehicleType,
          makeModel: makeModel || "Vehicle details pending",
          region: serviceAreas,
          weightCapacity: profile?.weightCapacityKg
            ? `${Number(profile.weightCapacityKg).toLocaleString()} kg`
            : "Not specified",
          transmission: profile?.transmission || "Not set",
          fuelType: profile?.fuelType || "Not set",
          motExpiryDate: profile?.motExpiryDate || "Pending",
          insuranceExpiryDate: profile?.insuranceExpiryDate || "Pending",
          driverName: profile?.driverName || "Unassigned",
          documentCount: Object.values(profile?.documentNames || {}).filter(Boolean).length,
          status,
          displayStatus,
          verificationStatus,
          verificationNotes: profile?.verificationNotes || "",
          verifiedBy: profile?.verifiedBy || "",
          verifiedAt: profile?.verifiedAt || "",
          rejectionReason: profile?.rejectionReason || "",
          requestedInfoAt: profile?.requestedInfoAt || "",
        };
      }),
    [vehicleProfiles, vehicles]
  );

  const fleetStats = useMemo(() => {
    const active = normalizedVehicles.filter((v) =>
      (v.displayStatus || "").toLowerCase().includes("active")
    ).length;
    const pending = normalizedVehicles.filter((v) =>
      ["pending", "review", "needs"].some((token) =>
        (v.displayStatus || "").toLowerCase().includes(token)
      )
    ).length;
    const verified = normalizedVehicles.filter(
      (v) => (v.verificationStatus || "").toLowerCase() === "verified"
    ).length;

    return {
      total: normalizedVehicles.length,
      active,
      pending,
      verified,
    };
  }, [normalizedVehicles]);

  const filteredVehicles = useMemo(
    () =>
      normalizedVehicles.filter((vehicle) => {
        const matchesSearch = [
          vehicle.displayName,
          vehicle.vehicleType,
          vehicle.makeModel,
          vehicle.region,
          vehicle.driverName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        const statusValue = `${vehicle.displayStatus} ${vehicle.status}`.toLowerCase();
        if (statusFilter === "all") return true;
        if (statusFilter === "active") return statusValue.includes("active");
        if (statusFilter === "pending") {
          return ["pending", "review", "needs"].some((token) => statusValue.includes(token));
        }
        if (statusFilter === "maintenance") return statusValue.includes("maint");
        return true;
      }),
    [normalizedVehicles, searchQuery, statusFilter]
  );

  const selectedVehicle = useMemo(
    () => normalizedVehicles.find((vehicle) => vehicle.id === selectedVehicleId) || null,
    [normalizedVehicles, selectedVehicleId]
  );

  const selectedVehicleProfile = selectedVehicleId ? vehicleProfiles[selectedVehicleId] : null;

  const selectedVehicleDetail = useMemo<VehicleProfile | null>(() => {
    if (!selectedVehicle) return null;

    if (selectedVehicleProfile) {
      return selectedVehicleProfile;
    }

    const makeModelParts = selectedVehicle.makeModel
      ? selectedVehicle.makeModel.split(" ")
      : [];

    return {
      ...initialVehicleForm,
      registrationNumber: selectedVehicle.displayName || selectedVehicle.name || "",
      vehicleType: selectedVehicle.vehicleType || initialVehicleForm.vehicleType,
      make: makeModelParts[0] || "",
      model: makeModelParts.slice(1).join(" ") || "",
      weightCapacityKg:
        selectedVehicle.weightCapacity && selectedVehicle.weightCapacity !== "Not specified"
          ? selectedVehicle.weightCapacity.replace(/[^0-9.]/g, "")
          : "",
      fuelType:
        selectedVehicle.fuelType && selectedVehicle.fuelType !== "Not set"
          ? selectedVehicle.fuelType
          : initialVehicleForm.fuelType,
      transmission:
        selectedVehicle.transmission && selectedVehicle.transmission !== "Not set"
          ? selectedVehicle.transmission
          : initialVehicleForm.transmission,
      vehicleStatus: selectedVehicle.status || initialVehicleForm.vehicleStatus,
      serviceAreas:
        selectedVehicle.region && selectedVehicle.region !== "Not provided"
          ? selectedVehicle.region
          : "",
      motExpiryDate:
        selectedVehicle.motExpiryDate && selectedVehicle.motExpiryDate !== "Pending"
          ? selectedVehicle.motExpiryDate
          : "",
      insuranceExpiryDate:
        selectedVehicle.insuranceExpiryDate && selectedVehicle.insuranceExpiryDate !== "Pending"
          ? selectedVehicle.insuranceExpiryDate
          : "",
      driverName:
        selectedVehicle.driverName && selectedVehicle.driverName !== "Unassigned"
          ? selectedVehicle.driverName
          : "",
      savedAt: new Date().toISOString(),
      documentNames: {},
      documentUrls: {},
    };
  }, [selectedVehicle, selectedVehicleProfile]);

  const updateField = <K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) => {
    setVehicleForm((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [key]: undefined }));
  };

  const updateDocument = (key: VehicleDocumentKey, file: File | null) => {
    setDocumentFiles((current) => ({ ...current, [key]: file }));
    setFormErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validateCurrentStep = (step: FormStep) => {
    const existingProfile = editingVehicleId ? vehicleProfiles[editingVehicleId] : null;
    const errors = validateVehicleStep(step, vehicleForm, documentFiles, existingProfile);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goToNextStep = () => {
    if (!validateCurrentStep(formStep)) {
      showFeedback("error", "Please fix the highlighted fields before continuing.");
      return;
    }
    setFormStep((current) => Math.min(3, current + 1) as FormStep);
  };

  const goToPreviousStep = () => {
    setFormErrors({});
    setFormStep((current) => Math.max(1, current - 1) as FormStep);
  };

  const jumpToStep = (step: FormStep) => {
    if (step < formStep || editingVehicleId) {
      setFormErrors({});
      setFormStep(step);
      return;
    }
    if (formStep === 1 && step > 1 && !validateCurrentStep(1)) {
      showFeedback("error", "Complete vehicle details before moving on.");
      return;
    }
    if (formStep === 2 && step > 2 && !validateCurrentStep(2)) {
      showFeedback("error", "Complete compliance dates before moving on.");
      return;
    }
    setFormStep(step);
  };

  const openVehicleDetail = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
  };

  const openEditVehicleModal = (vehicleId: string) => {
    const profile = vehicleProfiles[vehicleId];
    if (!profile) {
      showFeedback("error", "Vehicle details are not available for editing yet.");
      return;
    }

    setVehicleForm({
      registrationNumber: profile.registrationNumber || "",
      vehicleType: profile.vehicleType || initialVehicleForm.vehicleType,
      make: profile.make || "",
      model: profile.model || "",
      year: profile.year || "",
      color: profile.color || "",
      weightCapacityKg: profile.weightCapacityKg || "",
      lengthMeters: profile.lengthMeters || "",
      fuelType: profile.fuelType || initialVehicleForm.fuelType,
      transmission: profile.transmission || initialVehicleForm.transmission,
      currentMileage: profile.currentMileage || "",
      lastServiceDate: profile.lastServiceDate || "",
      nextServiceDue: profile.nextServiceDue || "",
      vehicleStatus: profile.vehicleStatus || initialVehicleForm.vehicleStatus,
      gpsTrackerId: profile.gpsTrackerId || "",
      companyDescription: profile.companyDescription || "",
      serviceAreas: profile.serviceAreas || "",
      specializations: profile.specializations || "",
      insuranceExpiryDate: profile.insuranceExpiryDate || "",
      motExpiryDate: profile.motExpiryDate || "",
      driverName: profile.driverName || "",
      driverLicenseNo: profile.driverLicenseNo || "",
      driverPhone: profile.driverPhone || "",
      driverEmail: profile.driverEmail || "",
      assignedDate: profile.assignedDate || "",
    });
    setDocumentFiles(initialDocumentFiles);
    setFormErrors({});
    setEditingVehicleId(vehicleId);
    setFormStep(1);
    setSelectedVehicleId(null);
    setIsModalOpen(true);
  };

  const openStoredDocument = (documentUrl?: string, documentName?: string) => {
    if (!documentUrl) {
      showFeedback("error", "This document is not available yet.");
      return;
    }

    const popup = window.open(documentUrl, "_blank", "noopener,noreferrer");

    if (!popup) {
      showFeedback("error", `Unable to open ${documentName || "document"} right now.`);
    }
  };

  const handleRegisterVehicle = async (mode: "save" | "save_and_add") => {
    const existingProfile = editingVehicleId ? vehicleProfiles[editingVehicleId] : null;
    const isEditing = Boolean(editingVehicleId);

    const errors = validateVehicleForm(vehicleForm, documentFiles, existingProfile);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0];
      if (["insuranceExpiryDate", "motExpiryDate"].includes(firstErrorKey)) {
        setFormStep(2);
      } else if (firstErrorKey === "driverEmail") {
        setFormStep(3);
      } else {
        setFormStep(1);
      }
      showFeedback("error", "Please complete the required fields highlighted in the form.");
      return;
    }

    try {
      setSubmitMode(mode);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      const documentEntries = await Promise.all(
        Object.entries(documentFiles).map(async ([key, file]) => {
          if (!file) {
            return [
              key,
              {
                name: existingProfile?.documentNames?.[key as VehicleDocumentKey] || "",
                url: existingProfile?.documentUrls?.[key as VehicleDocumentKey] || "",
              },
            ] as const;
          }

          return [
            key,
            {
              name: file.name,
              url: await toDataUrl(file),
            },
          ] as const;
        })
      );

      const documentNames = Object.fromEntries(documentEntries.map(([key, value]) => [key, value.name]));
      const documentUrls = Object.fromEntries(documentEntries.map(([key, value]) => [key, value.url]));

      const nextProfile = buildVehicleProfile(
        vehicleForm,
        existingProfile,
        documentNames,
        documentUrls
      );

      const nextVehicleStatus = vehicleForm.vehicleStatus.toLowerCase().replace(/\s+/g, "-");
      let savedVehicle: VehicleRow | null = null;
      let usedDatabaseFallback = false;

      if (isEditing) {
        const currentVehicle = vehicles.find((vehicle) => vehicle.id === editingVehicleId);

        if (!currentVehicle) {
          throw new Error("Vehicle record could not be found.");
        }

        if (currentVehicle.source === "supabase") {
          const result = await persistVehicleToSupabase({
            isEditing: true,
            editingVehicleId,
            userId: user.id,
            vehicleForm,
            nextVehicleStatus,
            profile: nextProfile,
          });

          if (result.vehicle) {
            savedVehicle = result.vehicle;
          } else {
            usedDatabaseFallback = true;
            savedVehicle = {
              ...currentVehicle,
              name: vehicleForm.registrationNumber.trim(),
              status: nextVehicleStatus,
              profile: nextProfile,
              source: "local",
            };
            upsertLocalVehicle(user.id, savedVehicle);
          }
        } else {
          savedVehicle = {
            ...currentVehicle,
            name: vehicleForm.registrationNumber.trim(),
            status: nextVehicleStatus,
            profile: nextProfile,
            source: "local",
          };
          upsertLocalVehicle(user.id, savedVehicle);
        }
      } else {
        const result = await persistVehicleToSupabase({
          isEditing: false,
          editingVehicleId: null,
          userId: user.id,
          vehicleForm,
          nextVehicleStatus,
          profile: nextProfile,
        });

        if (result.vehicle) {
          savedVehicle = result.vehicle;
        } else {
          usedDatabaseFallback = true;
          const localFallbackVehicles = readLocalVehicles(user.id);
          savedVehicle = {
            ...createLocalVehicle(user.id, vehicleForm, nextVehicleStatus),
            profile: nextProfile,
          };
          writeLocalVehicles(user.id, [savedVehicle, ...localFallbackVehicles]);
        }
      }

      if (!savedVehicle) {
        throw new Error("Vehicle could not be saved.");
      }

      setVehicles((current) => {
        const withoutSaved = current.filter((vehicle) => vehicle.id !== savedVehicle!.id);
        return mergeVehicleRows([savedVehicle!], withoutSaved);
      });
      setVehicleProfiles((current) => ({
        ...current,
        [String(savedVehicle.id)]: nextProfile,
      }));

      const successMessage = isEditing
        ? usedDatabaseFallback
          ? "Vehicle updated on this device. Run carrier-vehicles-setup.sql in Supabase to sync to the cloud."
          : "Vehicle updated successfully."
        : mode === "save_and_add"
          ? usedDatabaseFallback
            ? "Vehicle saved on this device. Run carrier-vehicles-setup.sql in Supabase to sync to the cloud."
            : "Vehicle saved. You can add another vehicle now."
          : usedDatabaseFallback
            ? "Vehicle saved on this device. Run carrier-vehicles-setup.sql in Supabase to sync to the cloud."
            : "Vehicle added successfully.";

      if (!isEditing && mode === "save_and_add") {
        resetVehicleModal();
        showFeedback("success", successMessage);
      } else {
        closeVehicleModal(true);
        showFeedback("success", successMessage);
      }
    } catch (error) {
      console.error("Error registering vehicle:", error);
      showFeedback(
        "error",
        `${isEditing ? "Vehicle could not be updated right now." : "Vehicle could not be added right now."} ${getErrorMessage(error)}`
      );
    } finally {
      setSubmitMode(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
      <AnimatePresence>
        {feedback ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`fixed left-1/2 top-24 z-[140] -translate-x-1/2 rounded-xl px-4 py-2.5 shadow-lg ${
              feedback.type === "success"
                ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border border-rose-100 bg-rose-50 text-rose-700"
            }`}
          >
            <div className="flex items-center gap-2 text-[13px] font-medium">
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{feedback.text}</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => closeVehicleModal()}
              className={OVERLAY_CLASS}
            />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 16 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto flex max-h-[min(92vh,820px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/60"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {editingVehicleId ? "Edit vehicle" : "Add vehicle"}
                      </h2>
                      <p className="mt-0.5 text-[12px] text-slate-500">
                        Step {formStep} of 3 — {FORM_STEPS[formStep - 1].label}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => closeVehicleModal()}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-3 flex gap-1 rounded-lg bg-slate-100/80 p-1">
                    {FORM_STEPS.map((step) => {
                      const isActive = formStep === step.id;
                      const isDone = formStep > step.id;
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => jumpToStep(step.id)}
                          className={`flex-1 rounded-md px-3 py-2 text-center text-[11px] font-semibold transition ${
                            isActive
                              ? "bg-white text-slate-900 shadow-sm"
                              : isDone
                                ? "text-emerald-700"
                                : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {step.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                  <div className="space-y-6">
                    {formStep === 1 ? (
                    <>
                    <FormGroup title="Registration & identity">
                        <div>
                          <label className={labelStyle}>Registration number *</label>
                          <input
                            value={vehicleForm.registrationNumber}
                            onChange={(event) =>
                              updateField(
                                "registrationNumber",
                                normalizeRegistrationNumber(event.target.value)
                              )
                            }
                            placeholder="AB12 CDE"
                            className={fieldClass(Boolean(formErrors.registrationNumber))}
                          />
                          {errorText(formErrors.registrationNumber)}
                        </div>

                        <div>
                          <label className={labelStyle}>Vehicle Type *</label>
                          <select
                            value={vehicleForm.vehicleType}
                            onChange={(event) => updateField("vehicleType", event.target.value)}
                            className={fieldClass(Boolean(formErrors.vehicleType))}
                          >
                            {VEHICLE_TYPE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          {errorText(formErrors.vehicleType)}
                        </div>

                        <div>
                          <label className={labelStyle}>Make *</label>
                          <input
                            value={vehicleForm.make}
                            onChange={(event) => updateField("make", event.target.value)}
                            placeholder="Mercedes-Benz"
                            className={fieldClass(Boolean(formErrors.make))}
                          />
                          {errorText(formErrors.make)}
                        </div>

                        <div>
                          <label className={labelStyle}>Model *</label>
                          <input
                            value={vehicleForm.model}
                            onChange={(event) => updateField("model", event.target.value)}
                            placeholder="Actros"
                            className={fieldClass(Boolean(formErrors.model))}
                          />
                          {errorText(formErrors.model)}
                        </div>

                        <div>
                          <label className={labelStyle}>Year</label>
                          <input
                            type="number"
                            value={vehicleForm.year}
                            onChange={(event) => updateField("year", event.target.value)}
                            placeholder="2020"
                            className={fieldClass(Boolean(formErrors.year))}
                          />
                          {errorText(formErrors.year)}
                        </div>

                        <div>
                          <label className={labelStyle}>Color</label>
                          <input
                            value={vehicleForm.color}
                            onChange={(event) => updateField("color", event.target.value)}
                            placeholder="White"
                            className={fieldClass(Boolean(formErrors.color))}
                          />
                          {errorText(formErrors.color)}
                        </div>
                    </FormGroup>

                    <FormGroup title="Specifications">
                        <div>
                          <label className={labelStyle}>Weight capacity (kg) *</label>
                          <input
                            type="number"
                            value={vehicleForm.weightCapacityKg}
                            onChange={(event) => updateField("weightCapacityKg", event.target.value)}
                            placeholder="18000"
                            className={fieldClass(Boolean(formErrors.weightCapacityKg))}
                          />
                          {errorText(formErrors.weightCapacityKg)}
                        </div>

                        <div>
                          <label className={labelStyle}>Length (m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={vehicleForm.lengthMeters}
                            onChange={(event) => updateField("lengthMeters", event.target.value)}
                            placeholder="13.6"
                            className={fieldClass(Boolean(formErrors.lengthMeters))}
                          />
                          {errorText(formErrors.lengthMeters)}
                        </div>

                        <div>
                          <label className={labelStyle}>Fuel Type *</label>
                          <select
                            value={vehicleForm.fuelType}
                            onChange={(event) => updateField("fuelType", event.target.value)}
                            className={fieldClass(Boolean(formErrors.fuelType))}
                          >
                            {FUEL_TYPE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={labelStyle}>Transmission *</label>
                          <select
                            value={vehicleForm.transmission}
                            onChange={(event) => updateField("transmission", event.target.value)}
                            className={fieldClass(Boolean(formErrors.transmission))}
                          >
                            {TRANSMISSION_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className={labelStyle}>Vehicle status</label>
                          <select
                            value={vehicleForm.vehicleStatus}
                            onChange={(event) => updateField("vehicleStatus", event.target.value)}
                            className={fieldClass(Boolean(formErrors.vehicleStatus))}
                          >
                            {VEHICLE_STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          {errorText(formErrors.vehicleStatus)}
                        </div>
                    </FormGroup>

                    <FormGroup title="Service & coverage">
                        <div>
                          <label className={labelStyle}>Current mileage</label>
                          <input
                            type="number"
                            value={vehicleForm.currentMileage}
                            onChange={(event) => updateField("currentMileage", event.target.value)}
                            placeholder="120000"
                            className={fieldClass(Boolean(formErrors.currentMileage))}
                          />
                          {errorText(formErrors.currentMileage)}
                        </div>

                        <div>
                          <label className={labelStyle}>Last service date</label>
                          <input
                            type="date"
                            value={vehicleForm.lastServiceDate}
                            onChange={(event) => updateField("lastServiceDate", event.target.value)}
                            className={fieldClass(Boolean(formErrors.lastServiceDate))}
                          />
                          {errorText(formErrors.lastServiceDate)}
                        </div>

                        <div>
                          <label className={labelStyle}>Next service due</label>
                          <input
                            type="date"
                            value={vehicleForm.nextServiceDue}
                            onChange={(event) => updateField("nextServiceDue", event.target.value)}
                            className={fieldClass(Boolean(formErrors.nextServiceDue))}
                          />
                          {errorText(formErrors.nextServiceDue)}
                        </div>

                        <div>
                          <label className={labelStyle}>GPS tracker ID</label>
                          <input
                            value={vehicleForm.gpsTrackerId}
                            onChange={(event) => updateField("gpsTrackerId", event.target.value)}
                            placeholder="GPS-12345"
                            className={fieldClass(Boolean(formErrors.gpsTrackerId))}
                          />
                          {errorText(formErrors.gpsTrackerId)}
                        </div>

                        <div className="sm:col-span-2">
                          <label className={labelStyle}>Service areas</label>
                          <input
                            value={vehicleForm.serviceAreas}
                            onChange={(event) => updateField("serviceAreas", event.target.value)}
                            placeholder="London, Manchester, Birmingham"
                            className={fieldClass(Boolean(formErrors.serviceAreas))}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className={labelStyle}>Specializations</label>
                          <input
                            value={vehicleForm.specializations}
                            onChange={(event) => updateField("specializations", event.target.value)}
                            placeholder="Construction, Retail, Food"
                            className={fieldClass(Boolean(formErrors.specializations))}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className={labelStyle}>Description</label>
                          <textarea
                            value={vehicleForm.companyDescription}
                            onChange={(event) =>
                              updateField("companyDescription", event.target.value)
                            }
                            placeholder="Temperature-controlled transport, ADR certified, etc."
                            rows={3}
                            className={`${fieldClass(Boolean(formErrors.companyDescription))} min-h-[88px] resize-none py-2.5`}
                          />
                        </div>
                    </FormGroup>
                    </>
                    ) : null}

                    {formStep === 2 ? (
                    <>
                    <FormGroup title="Expiry dates">
                        <div>
                          <label className={labelStyle}>Insurance expiry *</label>
                          <input
                            type="date"
                            value={vehicleForm.insuranceExpiryDate}
                            onChange={(event) =>
                              updateField("insuranceExpiryDate", event.target.value)
                            }
                            className={fieldClass(Boolean(formErrors.insuranceExpiryDate))}
                          />
                          {errorText(formErrors.insuranceExpiryDate)}
                          {vehicleForm.insuranceExpiryDate &&
                          !isFutureDate(vehicleForm.insuranceExpiryDate) ? (
                            <p className="mt-1.5 text-[11px] text-amber-600">
                              Insurance appears expired — you can still save and update later.
                            </p>
                          ) : null}
                        </div>

                        <div>
                          <label className={labelStyle}>MOT expiry *</label>
                          <input
                            type="date"
                            value={vehicleForm.motExpiryDate}
                            onChange={(event) => updateField("motExpiryDate", event.target.value)}
                            className={fieldClass(Boolean(formErrors.motExpiryDate))}
                          />
                          {errorText(formErrors.motExpiryDate)}
                          {vehicleForm.motExpiryDate && !isFutureDate(vehicleForm.motExpiryDate) ? (
                            <p className="mt-1.5 text-[11px] text-amber-600">
                              MOT appears expired — you can still save and update later.
                            </p>
                          ) : null}
                        </div>
                    </FormGroup>

                    <FormGroup title="Documents (optional)">
                        {documentFieldMeta.map((documentField) => (
                          <div key={documentField.key}>
                            <label className={labelStyle}>
                              {documentField.label}
                              {documentField.required ? "" : " (optional)"}
                            </label>
                            <label
                              className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-3 py-3 ${
                                formErrors[documentField.key]
                                  ? "border-rose-300 bg-rose-50/50"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-[12px] font-semibold text-slate-900">
                                  {documentFiles[documentField.key]?.name ||
                                    (editingVehicleId
                                      ? vehicleProfiles[editingVehicleId]?.documentNames?.[
                                          documentField.key
                                        ] || "Choose file"
                                      : "Choose file")}
                                </p>
                                <p className="text-[10px] text-slate-500">PDF, JPG, or PNG</p>
                              </div>
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                className="hidden"
                                onChange={(event) =>
                                  updateDocument(
                                    documentField.key,
                                    event.target.files?.[0] || null
                                  )
                                }
                              />
                            </label>
                            {errorText(formErrors[documentField.key])}
                          </div>
                        ))}
                    </FormGroup>
                    </>
                    ) : null}

                    {formStep === 3 ? (
                    <FormGroup title="Driver assignment (optional)">
                        <div>
                          <label className={labelStyle}>Driver name</label>
                          <input
                            value={vehicleForm.driverName}
                            onChange={(event) => updateField("driverName", event.target.value)}
                            placeholder="John Smith"
                            className={fieldClass(Boolean(formErrors.driverName))}
                          />
                          {errorText(formErrors.driverName)}
                        </div>

                        <div>
                          <label className={labelStyle}>License number</label>
                          <input
                            value={vehicleForm.driverLicenseNo}
                            onChange={(event) =>
                              updateField("driverLicenseNo", event.target.value)
                            }
                            placeholder="DL-123456"
                            className={fieldClass(Boolean(formErrors.driverLicenseNo))}
                          />
                          {errorText(formErrors.driverLicenseNo)}
                        </div>

                        <div>
                          <label className={labelStyle}>Driver phone</label>
                          <input
                            value={vehicleForm.driverPhone}
                            onChange={(event) => updateField("driverPhone", event.target.value)}
                            placeholder="+44 161 987 6543"
                            className={fieldClass(Boolean(formErrors.driverPhone))}
                          />
                          {errorText(formErrors.driverPhone)}
                        </div>

                        <div>
                          <label className={labelStyle}>Driver email</label>
                          <input
                            type="email"
                            value={vehicleForm.driverEmail}
                            onChange={(event) => updateField("driverEmail", event.target.value)}
                            placeholder="john@email.com"
                            className={fieldClass(Boolean(formErrors.driverEmail))}
                          />
                          {errorText(formErrors.driverEmail)}
                        </div>

                        <div>
                          <label className={labelStyle}>Assigned date</label>
                          <input
                            type="date"
                            value={vehicleForm.assignedDate}
                            onChange={(event) => updateField("assignedDate", event.target.value)}
                            className={fieldClass(Boolean(formErrors.assignedDate))}
                          />
                          {errorText(formErrors.assignedDate)}
                        </div>
                    </FormGroup>
                    ) : null}
                  </div>
                </div>

                <div className="shrink-0 border-t border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={() => closeVehicleModal()}
                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Cancel
                      </button>

                      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        {formStep > 1 ? (
                          <button
                            type="button"
                            onClick={goToPreviousStep}
                            className="rounded-lg border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Back
                          </button>
                        ) : null}

                        {formStep < 3 ? (
                          <>
                            <button
                              type="button"
                              onClick={goToNextStep}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800"
                            >
                              Continue
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                            {editingVehicleId ? (
                              <button
                                type="button"
                                onClick={() => void handleRegisterVehicle("save")}
                                disabled={submitMode !== null}
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                              >
                                {submitMode === "save" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : null}
                                Update now
                              </button>
                            ) : null}
                          </>
                        ) : (
                          <>
                            {!editingVehicleId ? (
                              <button
                                type="button"
                                onClick={() => void handleRegisterVehicle("save_and_add")}
                                disabled={submitMode !== null}
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                              >
                                {submitMode === "save_and_add" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Plus className="h-3.5 w-3.5" />
                                )}
                                Save & add another
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => void handleRegisterVehicle("save")}
                              disabled={submitMode !== null}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                            >
                              {submitMode === "save" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ShieldCheck className="h-3.5 w-3.5" />
                              )}
                              {editingVehicleId ? "Update vehicle" : "Save vehicle"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                </div>
              </motion.div>
            </div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedVehicle && selectedVehicleDetail ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVehicleId(null)}
              className={OVERLAY_CLASS}
            />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 16 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto flex max-h-[min(92vh,820px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/60"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${formatVehicleStatusChip(
                            selectedVehicle.displayStatus
                          )}`}
                        >
                          {selectedVehicle.displayStatus}
                        </span>
                        {getVerificationMeta(selectedVehicleDetail.verificationStatus).label !==
                        selectedVehicle.displayStatus ? (
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                              getVerificationMeta(selectedVehicleDetail.verificationStatus).className
                            }`}
                          >
                            {getVerificationMeta(selectedVehicleDetail.verificationStatus).label}
                          </span>
                        ) : null}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {selectedVehicleDetail.registrationNumber || selectedVehicle.displayName}
                      </h2>
                      <p className="mt-0.5 text-[13px] text-slate-500">
                        {[selectedVehicleDetail.make, selectedVehicleDetail.model]
                          .filter(Boolean)
                          .join(" ") || selectedVehicle.makeModel}{" "}
                        · {selectedVehicleDetail.vehicleType}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedVehicleId(null)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      {
                        label: "Weight",
                        value: selectedVehicleDetail.weightCapacityKg
                          ? `${Number(selectedVehicleDetail.weightCapacityKg).toLocaleString()} kg`
                          : "—",
                        icon: Gauge,
                      },
                      {
                        label: "MOT expiry",
                        value: selectedVehicleDetail.motExpiryDate || "—",
                        icon: CalendarDays,
                      },
                      {
                        label: "Insurance",
                        value: selectedVehicleDetail.insuranceExpiryDate || "—",
                        icon: Shield,
                      },
                      {
                        label: "Driver",
                        value: selectedVehicleDetail.driverName || "Unassigned",
                        icon: UserPlus,
                      },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-slate-50/80 px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <item.icon className="h-3 w-3 text-slate-400" />
                          <p className="text-[10px] text-slate-500">{item.label}</p>
                        </div>
                        <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-900">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                  <div className="space-y-4">
                    <DetailSection title="Vehicle specifications" icon={Truck}>
                      <div className={detailGridClass}>
                        <DetailField label="Registration" value={selectedVehicleDetail.registrationNumber} />
                        <DetailField label="Vehicle type" value={selectedVehicleDetail.vehicleType} />
                        <DetailField label="Make" value={selectedVehicleDetail.make} />
                        <DetailField label="Model" value={selectedVehicleDetail.model} />
                        <DetailField label="Year" value={selectedVehicleDetail.year} />
                        <DetailField label="Color" value={selectedVehicleDetail.color} />
                        <DetailField
                          label="Weight capacity"
                          value={
                            selectedVehicleDetail.weightCapacityKg
                              ? `${Number(selectedVehicleDetail.weightCapacityKg).toLocaleString()} kg`
                              : undefined
                          }
                        />
                        <DetailField
                          label="Length"
                          value={
                            selectedVehicleDetail.lengthMeters
                              ? `${selectedVehicleDetail.lengthMeters} m`
                              : undefined
                          }
                        />
                        <DetailField label="Fuel type" value={selectedVehicleDetail.fuelType} />
                        <DetailField label="Transmission" value={selectedVehicleDetail.transmission} />
                        <DetailField
                          label="Current mileage"
                          value={
                            selectedVehicleDetail.currentMileage
                              ? `${Number(selectedVehicleDetail.currentMileage).toLocaleString()} km`
                              : undefined
                          }
                        />
                        <DetailField label="Vehicle status" value={selectedVehicleDetail.vehicleStatus} />
                        <DetailField label="GPS tracker" value={selectedVehicleDetail.gpsTrackerId} />
                        <DetailField label="Last service" value={selectedVehicleDetail.lastServiceDate} />
                        <DetailField label="Next service due" value={selectedVehicleDetail.nextServiceDue} />
                      </div>
                      <div className={`mt-2 ${detailGridClass}`}>
                        <DetailField label="Service areas" value={selectedVehicleDetail.serviceAreas} />
                        <DetailField label="Specializations" value={selectedVehicleDetail.specializations} />
                      </div>
                      {selectedVehicleDetail.companyDescription ? (
                        <div className="mt-2 rounded-lg bg-slate-50/80 px-3 py-2.5">
                          <p className="text-[11px] text-slate-500">Description</p>
                          <p className="mt-0.5 text-[13px] leading-relaxed text-slate-700">
                            {selectedVehicleDetail.companyDescription}
                          </p>
                        </div>
                      ) : null}
                    </DetailSection>

                    <DetailSection title="Compliance & documents" icon={FileCheck}>
                      <div className="mb-2 grid gap-2 sm:grid-cols-2">
                        <DetailField
                          label="Insurance expiry"
                          value={selectedVehicleDetail.insuranceExpiryDate}
                        />
                        <DetailField label="MOT expiry" value={selectedVehicleDetail.motExpiryDate} />
                      </div>
                      <div className="space-y-2">
                        {documentFieldMeta.map((documentField) => {
                          const documentName =
                            selectedVehicleDetail.documentNames?.[documentField.key] || "";
                          const documentUrl =
                            selectedVehicleDetail.documentUrls?.[documentField.key] || "";

                          return (
                            <div
                              key={documentField.key}
                              className="flex items-center justify-between gap-3 rounded-lg bg-slate-50/80 px-3 py-2.5"
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200/60">
                                  <FileText className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] text-slate-500">{documentField.label}</p>
                                  <p className="truncate text-[13px] font-semibold text-slate-900">
                                    {documentName || "Not uploaded"}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  openStoredDocument(documentUrl, documentField.label)
                                }
                                disabled={!documentUrl}
                                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                View
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </DetailSection>

                    <DetailSection title="Admin verification" icon={ShieldCheck}>
                      <div className={detailGridClass}>
                        <div className="rounded-lg bg-slate-50/80 px-3 py-2.5">
                          <p className="text-[11px] text-slate-500">Verification status</p>
                          <span
                            className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                              getVerificationMeta(selectedVehicleDetail.verificationStatus).className
                            }`}
                          >
                            {getVerificationMeta(selectedVehicleDetail.verificationStatus).label}
                          </span>
                        </div>
                        <DetailField
                          label="Verified by"
                          value={selectedVehicleDetail.verifiedBy || "Awaiting admin review"}
                        />
                        <DetailField
                          label="Verified at"
                          value={formatInfoDate(selectedVehicleDetail.verifiedAt)}
                        />
                        <DetailField
                          label="Info requested"
                          value={formatInfoDate(selectedVehicleDetail.requestedInfoAt)}
                        />
                      </div>
                      {(selectedVehicleDetail.verificationNotes ||
                        selectedVehicleDetail.rejectionReason) && (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {selectedVehicleDetail.verificationNotes ? (
                            <div className="rounded-lg bg-slate-50/80 px-3 py-2.5">
                              <p className="text-[11px] text-slate-500">Admin notes</p>
                              <p className="mt-0.5 text-[13px] leading-relaxed text-slate-700">
                                {selectedVehicleDetail.verificationNotes}
                              </p>
                            </div>
                          ) : null}
                          {selectedVehicleDetail.rejectionReason ? (
                            <div className="rounded-lg bg-rose-50/80 px-3 py-2.5">
                              <p className="text-[11px] text-rose-600">Rejection reason</p>
                              <p className="mt-0.5 text-[13px] leading-relaxed text-rose-800">
                                {selectedVehicleDetail.rejectionReason}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </DetailSection>

                    <DetailSection title="Driver assignment" icon={UserPlus}>
                      <div className={detailGridClass}>
                        <DetailField label="Driver name" value={selectedVehicleDetail.driverName} />
                        <DetailField label="License number" value={selectedVehicleDetail.driverLicenseNo} />
                        <DetailField label="Assigned date" value={selectedVehicleDetail.assignedDate} />
                        <DetailField
                          label="Phone"
                          value={
                            selectedVehicleDetail.driverPhone ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {selectedVehicleDetail.driverPhone}
                              </span>
                            ) : undefined
                          }
                        />
                        <DetailField
                          label="Email"
                          value={
                            selectedVehicleDetail.driverEmail ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Mail className="h-3 w-3 text-slate-400" />
                                {selectedVehicleDetail.driverEmail}
                              </span>
                            ) : undefined
                          }
                        />
                      </div>
                    </DetailSection>
                  </div>
                </div>

                <div className="shrink-0 border-t border-slate-100 px-5 py-4 sm:px-6">
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedVehicleId(null)}
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditVehicleModal(selectedVehicle.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit vehicle
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        ) : null}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <div className="rounded-md bg-slate-900 p-1.5">
                <Truck className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Fleet & tools
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">My vehicles</h1>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Fleet registry, compliance documents, and driver assignments
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search registration, type, driver…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[12px] text-slate-900 outline-none transition focus:border-slate-300 sm:w-56"
              />
            </div>
            <button
              type="button"
              onClick={openVehicleModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Add vehicle
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total units", value: fleetStats.total, icon: Truck, tone: "text-slate-600" },
            { label: "Active", value: fleetStats.active, icon: CheckCircle2, tone: "text-emerald-600" },
            { label: "Pending review", value: fleetStats.pending, icon: Shield, tone: "text-amber-600" },
            { label: "Verified", value: fleetStats.verified, icon: ShieldCheck, tone: "text-violet-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-slate-50/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-3.5 w-3.5 ${stat.tone}`} />
                <p className="text-[11px] text-slate-500">{stat.label}</p>
              </div>
              <p className="mt-1 text-xl font-bold text-slate-900">{loading ? "…" : stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100/80 p-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`rounded-md px-3.5 py-1.5 text-[11px] font-semibold capitalize transition ${
                statusFilter === filter
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {filter === "all" ? "All vehicles" : filter}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="rounded-xl bg-slate-50/80 py-16 text-center">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-slate-400" />
                <p className="text-[13px] text-slate-500">Loading fleet…</p>
              </div>
            ) : filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehicle, index) => (
                <motion.button
                  key={vehicle.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => openVehicleDetail(vehicle.id)}
                  className="group relative w-full overflow-hidden rounded-xl bg-white text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60 transition hover:ring-slate-300/80"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
                  <div className="grid gap-4 p-4 pl-5 lg:grid-cols-[minmax(0,1.2fr)_auto_auto] lg:items-center">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15px] font-bold text-slate-900">{vehicle.displayName}</h3>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${formatVehicleStatusChip(
                              vehicle.displayStatus
                            )}`}
                          >
                            {vehicle.displayStatus}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-slate-500">
                          {vehicle.vehicleType} · {vehicle.makeModel}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {vehicle.weightCapacity} · {vehicle.region} · Driver: {vehicle.driverName}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:min-w-[280px]">
                      {[
                        { label: "MOT", value: vehicle.motExpiryDate },
                        { label: "Docs", value: `${vehicle.documentCount} uploaded` },
                        { label: "Fuel", value: vehicle.fuelType },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg bg-slate-50/80 px-2.5 py-2">
                          <p className="text-[10px] text-slate-500">{item.label}</p>
                          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-900">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <ChevronRight className="hidden h-4 w-4 text-slate-400 group-hover:text-slate-700 lg:block" />
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="py-12 text-center">
                <NothingLottie className="mx-auto h-48 w-48" />
                <h3 className="mt-2 text-[15px] font-semibold text-slate-900">No vehicles yet</h3>
                <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">
                  Add your first vehicle to track compliance, service dates, and driver assignments.
                </p>
                <button
                  type="button"
                  onClick={openVehicleModal}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add first vehicle
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
