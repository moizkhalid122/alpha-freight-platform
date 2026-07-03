"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import NothingLottie from "@/components/ui/NothingLottie";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Star,
  UserPlus,
  Users,
  X,
} from "lucide-react";

const OVERLAY_CLASS =
  "fixed inset-0 z-[200] min-h-[100dvh] w-screen bg-slate-900/45 backdrop-blur-[6px]";

const STATUS_FILTERS = ["all", "active", "inactive"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

type DriverRecord = {
  id: string;
  full_name: string;
  status: string;
  rating: number;
  completed_loads: number;
  phone: string;
  email: string;
  license_number: string;
  experience_years: string;
  operating_region: string;
  avatar_url: string | null;
};

const initialDriverForm = {
  fullName: "",
  email: "",
  phone: "",
  licenseNumber: "",
  experienceYears: "",
  operatingRegion: "",
  status: "active",
};

const labelStyle = "mb-1.5 block text-[12px] font-medium text-slate-600";
const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-900 outline-none transition focus:border-slate-300";

const normalizeDriver = (driver: Record<string, unknown>): DriverRecord => {
  const details = (driver.role_details as Record<string, unknown>) || {};
  return {
    id: String(driver.id),
    full_name: String(driver.full_name || "Unnamed driver"),
    status: String(details.status || "active"),
    rating: Number(details.rating) || 0,
    completed_loads: Number(details.completed_loads) || 0,
    phone: String(details.phone || "Not provided"),
    email: String(details.email || "Not provided"),
    license_number: String(details.license_number || "Pending"),
    experience_years: String(details.experience_years || "0"),
    operating_region: String(details.operating_region || "Not assigned"),
    avatar_url: driver.avatar_url ? String(driver.avatar_url) : null,
  };
};

const formatStatusChip = (status?: string) => {
  const value = (status || "inactive").toLowerCase();
  if (value === "active") return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  return "bg-slate-50 text-slate-600 border border-slate-100";
};

const formatStatusLabel = (status?: string) => {
  const value = (status || "inactive").toLowerCase();
  return value === "active" ? "Active" : "Inactive";
};

export default function DriverPanelPage() {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [driverForm, setDriverForm] = useState(initialDriverForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    window.setTimeout(() => setFeedback(null), 2600);
  };

  const closeModal = (force = false) => {
    if (submitting && !force) return;
    setIsModalOpen(false);
    setDriverForm(initialDriverForm);
  };

  useEffect(() => {
    if (!isModalOpen && !selectedDriverId) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen, selectedDriverId]);

  useEffect(() => {
    async function fetchDrivers() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.from("profiles").select("*").eq("role", "driver");

        if (error) throw error;

        const carrierDrivers = (data || [])
          .filter(
            (item: Record<string, unknown>) =>
              (item.role_details as Record<string, unknown> | undefined)?.carrier_id === user.id
          )
          .map((item) => normalizeDriver(item as Record<string, unknown>));

        setDrivers(carrierDrivers);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchDrivers();
  }, []);

  const fleetStats = useMemo(() => {
    const active = drivers.filter((driver) => driver.status === "active").length;
    const totalLoads = drivers.reduce((sum, driver) => sum + driver.completed_loads, 0);
    const ratedDrivers = drivers.filter((driver) => driver.rating > 0);
    const avgRating =
      ratedDrivers.length > 0
        ? (ratedDrivers.reduce((sum, driver) => sum + driver.rating, 0) / ratedDrivers.length).toFixed(
            1
          )
        : "—";

    return {
      total: drivers.length,
      active,
      avgRating,
      totalLoads,
    };
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const matchesSearch = [driver.full_name, driver.phone, driver.email, driver.operating_region]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && driver.status === "active") ||
        (statusFilter === "inactive" && driver.status !== "active");

      return matchesSearch && matchesStatus;
    });
  }, [drivers, searchQuery, statusFilter]);

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === selectedDriverId) || null,
    [drivers, selectedDriverId]
  );

  const handleAddDriver = async () => {
    if (
      !driverForm.fullName.trim() ||
      !driverForm.email.trim() ||
      !driverForm.phone.trim() ||
      !driverForm.licenseNumber.trim() ||
      !driverForm.experienceYears.trim() ||
      !driverForm.operatingRegion.trim()
    ) {
      showFeedback("error", "Please complete all driver details before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const driverId = crypto.randomUUID();
      const payload = {
        id: driverId,
        full_name: driverForm.fullName.trim(),
        role: "driver",
        created_at: new Date().toISOString(),
        role_details: {
          carrier_id: user.id,
          phone: driverForm.phone.trim(),
          email: driverForm.email.trim(),
          license_number: driverForm.licenseNumber.trim(),
          experience_years: driverForm.experienceYears.trim(),
          operating_region: driverForm.operatingRegion.trim(),
          status: driverForm.status,
          rating: 0,
          completed_loads: 0,
        },
      };

      const { data, error } = await supabase.from("profiles").insert([payload]).select("*").single();

      if (error) throw error;

      setDrivers((prev) => [normalizeDriver(data as Record<string, unknown>), ...prev]);
      closeModal(true);
      showFeedback("success", "Driver added successfully.");
    } catch (error) {
      console.error("Error adding driver:", error);
      showFeedback("error", "Driver could not be added. Please check table permissions.");
    } finally {
      setSubmitting(false);
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
              onClick={() => closeModal()}
              className={OVERLAY_CLASS}
            />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 16 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/60"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Add driver</h2>
                      <p className="mt-0.5 text-[12px] text-slate-500">
                        Register a driver for your carrier team
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => closeModal()}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelStyle}>Full name *</label>
                      <input
                        value={driverForm.fullName}
                        onChange={(event) =>
                          setDriverForm((prev) => ({ ...prev, fullName: event.target.value }))
                        }
                        placeholder="Daniel Carter"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>Email *</label>
                      <input
                        type="email"
                        value={driverForm.email}
                        onChange={(event) =>
                          setDriverForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                        placeholder="driver@email.com"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>Phone *</label>
                      <input
                        value={driverForm.phone}
                        onChange={(event) =>
                          setDriverForm((prev) => ({ ...prev, phone: event.target.value }))
                        }
                        placeholder="+44 7700 900111"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>License number *</label>
                      <input
                        value={driverForm.licenseNumber}
                        onChange={(event) =>
                          setDriverForm((prev) => ({
                            ...prev,
                            licenseNumber: event.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="UK-HGV-778812"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>Experience *</label>
                      <input
                        value={driverForm.experienceYears}
                        onChange={(event) =>
                          setDriverForm((prev) => ({
                            ...prev,
                            experienceYears: event.target.value,
                          }))
                        }
                        placeholder="5 years"
                        className={inputClass}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelStyle}>Operating region *</label>
                      <input
                        value={driverForm.operatingRegion}
                        onChange={(event) =>
                          setDriverForm((prev) => ({
                            ...prev,
                            operatingRegion: event.target.value,
                          }))
                        }
                        placeholder="London, Midlands, Manchester"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="shrink-0 border-t border-slate-100 px-5 py-4 sm:px-6">
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => closeModal()}
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAddDriver()}
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                      {submitting ? "Adding…" : "Add driver"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDriver ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDriverId(null)}
              className={OVERLAY_CLASS}
            />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 16 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto flex max-h-[min(92vh,680px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/60"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="relative shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200/60">
                          {selectedDriver.avatar_url ? (
                            <img
                              src={selectedDriver.avatar_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                            selectedDriver.status === "active" ? "bg-emerald-500" : "bg-amber-400"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${formatStatusChip(
                            selectedDriver.status
                          )}`}
                        >
                          {formatStatusLabel(selectedDriver.status)}
                        </span>
                        <h2 className="mt-1.5 truncate text-lg font-bold text-slate-900">
                          {selectedDriver.full_name}
                        </h2>
                        <p className="mt-0.5 flex items-center gap-1 text-[13px] text-slate-500">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {selectedDriver.rating > 0 ? selectedDriver.rating : "No rating yet"} ·{" "}
                          {selectedDriver.completed_loads} loads completed
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedDriverId(null)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                  <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/60">
                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
                    <div className="space-y-2 p-4 pl-5">
                      {[
                        { label: "Email", value: selectedDriver.email, icon: Mail },
                        { label: "Phone", value: selectedDriver.phone, icon: Phone },
                        { label: "License", value: selectedDriver.license_number, icon: ShieldCheck },
                        { label: "Experience", value: selectedDriver.experience_years, icon: Award },
                        { label: "Region", value: selectedDriver.operating_region, icon: MapPin },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-3 rounded-lg bg-slate-50/80 px-3 py-2.5"
                        >
                          <item.icon className="h-4 w-4 shrink-0 text-slate-400" />
                          <div className="min-w-0">
                            <p className="text-[11px] text-slate-500">{item.label}</p>
                            <p className="truncate text-[13px] font-semibold text-slate-900">
                              {item.value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 border-t border-slate-100 px-5 py-4 sm:px-6">
                  <div className="flex gap-2">
                    {selectedDriver.phone !== "Not provided" ? (
                      <a
                        href={`tel:${selectedDriver.phone}`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </a>
                    ) : null}
                    {selectedDriver.email !== "Not provided" ? (
                      <a
                        href={`mailto:${selectedDriver.email}`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </a>
                    ) : null}
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
                <Users className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Workforce
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Driver panel</h1>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Manage your delivery team, contact details, and performance
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, phone, region…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[12px] text-slate-900 outline-none transition focus:border-slate-300 sm:w-56"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Add driver
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total drivers", value: fleetStats.total, icon: Users, tone: "text-slate-600" },
            { label: "Active", value: fleetStats.active, icon: CheckCircle2, tone: "text-emerald-600" },
            { label: "Avg rating", value: fleetStats.avgRating, icon: Star, tone: "text-amber-600" },
            {
              label: "Loads completed",
              value: fleetStats.totalLoads,
              icon: Award,
              tone: "text-violet-600",
            },
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
              {filter === "all" ? "All drivers" : filter}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="rounded-xl bg-slate-50/80 py-16 text-center">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-slate-400" />
                <p className="text-[13px] text-slate-500">Loading drivers…</p>
              </div>
            ) : filteredDrivers.length > 0 ? (
              filteredDrivers.map((driver, index) => (
                <motion.button
                  key={driver.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedDriverId(driver.id)}
                  className="group relative w-full overflow-hidden rounded-xl bg-white text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/60 transition hover:ring-slate-300/80"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-slate-300" />
                  <div className="grid gap-4 p-4 pl-5 lg:grid-cols-[minmax(0,1.2fr)_auto_auto] lg:items-center">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="relative shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200/60 transition group-hover:bg-slate-900 group-hover:text-white">
                          {driver.avatar_url ? (
                            <img
                              src={driver.avatar_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Users className="h-4 w-4" />
                          )}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                            driver.status === "active" ? "bg-emerald-500" : "bg-amber-400"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15px] font-bold text-slate-900">{driver.full_name}</h3>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${formatStatusChip(
                              driver.status
                            )}`}
                          >
                            {formatStatusLabel(driver.status)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-slate-500">
                          {driver.license_number} · {driver.operating_region}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {driver.rating > 0 ? driver.rating : "No rating"} ·{" "}
                          {driver.completed_loads} loads · {driver.experience_years} experience
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:min-w-[280px]">
                      {[
                        { label: "Phone", value: driver.phone },
                        { label: "Email", value: driver.email },
                        { label: "Region", value: driver.operating_region },
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
                <h3 className="mt-2 text-[15px] font-semibold text-slate-900">No drivers yet</h3>
                <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">
                  Add your first driver to build your delivery team and assign them to vehicles.
                </p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add first driver
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
