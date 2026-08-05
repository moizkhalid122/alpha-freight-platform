"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getCarrierProfileCompletion,
  getSupplierProfileCompletion,
} from "@/lib/profile-completion";
import {
  mergeCarrierExtras,
  mergeSupplierExtras,
  persistProfileExtras,
  resolveCarrierExtras,
  resolveSupplierExtras,
} from "@/lib/profile-extras";
import { carrierOnboardingCountryOptions } from "@/lib/country-options";
import { getCountryName, getCurrencyForCountry } from "@/lib/market-currency";
import type { CarrierProfileExtras, SupplierProfileExtras } from "@/lib/profile-extras-types";

type CompleteProfileRole = "carrier" | "supplier";

type CarrierFormState = {
  companyName: string;
  address: string;
  postcode: string;
  registrationNo: string;
  insuranceExpiry: string;
  operatingRegion: string;
  primaryVehicle: string;
  operatorId: string;
  nationalId: string;
};

type SupplierFormState = {
  companyName: string;
  address: string;
  registrationNo: string;
  taxId: string;
  industry: string;
  commodity: string;
};

const INPUT =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100";
const LABEL = "mb-1.5 block text-[12px] font-semibold text-slate-700";

const PROFILE_COMPLETE_THRESHOLD = 85;

export default function CompleteProfileWorkspace({ role }: { role: CompleteProfileRole }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [countryCode, setCountryCode] = useState("GB");
  const [accountType, setAccountType] = useState("company");
  const [percent, setPercent] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);

  const [carrierForm, setCarrierForm] = useState<CarrierFormState>({
    companyName: "",
    address: "",
    postcode: "",
    registrationNo: "",
    insuranceExpiry: "",
    operatingRegion: "",
    primaryVehicle: "",
    operatorId: "",
    nationalId: "",
  });

  const [supplierForm, setSupplierForm] = useState<SupplierFormState>({
    companyName: "",
    address: "",
    registrationNo: "",
    taxId: "",
    industry: "",
    commodity: "",
  });

  const dashboardHref = role === "carrier" ? "/carrier/dashboard" : "/supplier/dashboard";
  const profileHref = role === "carrier" ? "/carrier/profile" : "/supplier/profile";

  useEffect(() => {
    let active = true;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace(role === "carrier" ? "/auth/carrier-signup" : "/auth/supplier-signup");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_extras, full_name, company_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      const extras =
        role === "carrier"
          ? resolveCarrierExtras(user.id, profile?.profile_extras)
          : resolveSupplierExtras(user.id, profile?.profile_extras);

      const completion =
        role === "carrier"
          ? getCarrierProfileCompletion(extras as CarrierProfileExtras)
          : getSupplierProfileCompletion(extras as SupplierProfileExtras);

      setUserId(user.id);
      setPercent(completion.percent);
      setMissing(completion.missing);

      setCountryCode(extras.countryCode || "GB");

      if (role === "carrier") {
        const carrierExtras = extras as CarrierProfileExtras;
        setAccountType(carrierExtras.accountType || "company");
        setCarrierForm({
          companyName:
            carrierExtras.companyName ||
            profile?.company_name ||
            profile?.full_name ||
            "",
          address: carrierExtras.address || carrierExtras.addressLine1 || "",
          postcode: carrierExtras.postcode || "",
          registrationNo: carrierExtras.registrationNo || "",
          insuranceExpiry: carrierExtras.insuranceExpiry || "",
          operatingRegion:
            typeof carrierExtras.operatingRegion === "string"
              ? carrierExtras.operatingRegion
              : Array.isArray(carrierExtras.operatingRegion)
                ? carrierExtras.operatingRegion.join(", ")
                : "",
          primaryVehicle: carrierExtras.primaryVehicle || "",
          operatorId: carrierExtras.operatorId || "",
          nationalId: carrierExtras.nationalId || "",
        });
      } else {
        const supplierExtras = extras as SupplierProfileExtras;
        setSupplierForm({
          companyName:
            supplierExtras.companyName ||
            profile?.company_name ||
            profile?.full_name ||
            "",
          address: supplierExtras.address || "",
          registrationNo: supplierExtras.registrationNo || "",
          taxId: supplierExtras.taxId || "",
          industry: supplierExtras.industry || "",
          commodity: supplierExtras.commodity || "",
        });
      }

      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [role, router]);

  const isIndividualCarrier = role === "carrier" && accountType === "individual";

  const canSubmit = useMemo(() => {
    if (role === "carrier") {
      if (isIndividualCarrier) {
        return Boolean(
          carrierForm.primaryVehicle.trim() &&
            (carrierForm.operatorId.trim() || carrierForm.nationalId.trim()) &&
            carrierForm.address.trim() &&
            carrierForm.operatingRegion.trim()
        );
      }
      return Boolean(
        carrierForm.companyName.trim() &&
          carrierForm.address.trim() &&
          carrierForm.registrationNo.trim() &&
          carrierForm.operatingRegion.trim()
      );
    }

    return Boolean(
      supplierForm.companyName.trim() &&
        supplierForm.address.trim() &&
        (supplierForm.registrationNo.trim() || supplierForm.taxId.trim())
    );
  }, [role, isIndividualCarrier, carrierForm, supplierForm]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId || !canSubmit) return;

    setSaving(true);
    setError(null);

    try {
      let mergedExtras: CarrierProfileExtras | SupplierProfileExtras;

      if (role === "carrier") {
        mergedExtras = mergeCarrierExtras(userId, {
          countryCode,
          countryName: getCountryName(countryCode),
          currency: getCurrencyForCountry(countryCode),
          companyName: isIndividualCarrier ? carrierForm.companyName.trim() || null : carrierForm.companyName.trim(),
          address: carrierForm.address.trim(),
          addressLine1: carrierForm.address.trim(),
          postcode: carrierForm.postcode.trim() || null,
          registrationNo: carrierForm.registrationNo.trim() || null,
          insuranceExpiry: carrierForm.insuranceExpiry || null,
          operatingRegion: carrierForm.operatingRegion.trim(),
          primaryVehicle: carrierForm.primaryVehicle.trim() || null,
          operatorId: carrierForm.operatorId.trim() || null,
          nationalId: carrierForm.nationalId.trim() || null,
        });

        const profileUpdate: Record<string, string | null> = isIndividualCarrier
          ? { full_name: carrierForm.companyName.trim() || null }
          : { company_name: carrierForm.companyName.trim() || null };

        await supabase.from("profiles").update(profileUpdate).eq("id", userId);
      } else {
        mergedExtras = mergeSupplierExtras(userId, {
          countryCode,
          countryName: getCountryName(countryCode),
          currency: getCurrencyForCountry(countryCode),
          companyName: supplierForm.companyName.trim(),
          address: supplierForm.address.trim(),
          registrationNo: supplierForm.registrationNo.trim() || null,
          taxId: supplierForm.taxId.trim() || null,
          industry: supplierForm.industry.trim() || null,
          commodity: supplierForm.commodity.trim() || null,
        });

        await supabase
          .from("profiles")
          .update({ company_name: supplierForm.companyName.trim() || null })
          .eq("id", userId);
      }

      await persistProfileExtras(userId, mergedExtras as Record<string, unknown>);

      const completion =
        role === "carrier"
          ? getCarrierProfileCompletion(mergedExtras as CarrierProfileExtras)
          : getSupplierProfileCompletion(mergedExtras as SupplierProfileExtras);

      setPercent(completion.percent);
      setMissing(completion.missing);

      if (completion.percent >= PROFILE_COMPLETE_THRESHOLD) {
        window.dispatchEvent(new CustomEvent("alpha-profile-updated"));
        window.location.assign(dashboardHref);
        return;
      }

      setSaved(true);
      window.setTimeout(() => {
        router.push(dashboardHref);
        router.refresh();
      }, 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href={dashboardHref}
        className="mb-6 inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Profile setup
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Complete your profile</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
          Add the remaining details so Alpha Freight can verify your account and match you with the
          right loads.
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-[13px]">
          <span className="font-semibold text-slate-900">Progress</span>
          <span className="font-bold text-slate-900">{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-900 transition-all duration-500"
            style={{ width: `${Math.max(percent, 8)}%` }}
          />
        </div>
        {missing.length > 0 ? (
          <p className="mt-3 text-[12px] text-slate-500">
            Still needed: {missing.join(", ")}
          </p>
        ) : null}
      </div>

      {saved ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-[14px] font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Profile saved. Redirecting to dashboard…
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-[15px] font-bold text-slate-900">
              {role === "carrier"
                ? isIndividualCarrier
                  ? "Driver verification"
                  : "Business verification"
                : "Business & billing details"}
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">
              These details help our team review your account faster.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={LABEL}>Country / region</label>
                <select
                  className={INPUT}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  {carrierOnboardingCountryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Dashboard prices and loads use {getCurrencyForCountry(countryCode)} for this country.
                </p>
              </div>

              {role === "carrier" ? (
                <>
                  <div className={isIndividualCarrier ? "sm:col-span-2" : "sm:col-span-2"}>
                    <label className={LABEL}>
                      {isIndividualCarrier ? "Full name" : "Company name"}
                    </label>
                    <input
                      className={INPUT}
                      value={carrierForm.companyName}
                      onChange={(e) =>
                        setCarrierForm((prev) => ({ ...prev, companyName: e.target.value }))
                      }
                      placeholder={isIndividualCarrier ? "John Doe" : "Alpha Logistics Ltd"}
                      required
                    />
                  </div>

                  {isIndividualCarrier ? (
                    <>
                      <div>
                        <label className={LABEL}>Primary vehicle</label>
                        <input
                          className={INPUT}
                          value={carrierForm.primaryVehicle}
                          onChange={(e) =>
                            setCarrierForm((prev) => ({ ...prev, primaryVehicle: e.target.value }))
                          }
                          placeholder="Curtain-sider, Reefer…"
                          required
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Driver licence no.</label>
                        <input
                          className={INPUT}
                          value={carrierForm.operatorId}
                          onChange={(e) =>
                            setCarrierForm((prev) => ({ ...prev, operatorId: e.target.value }))
                          }
                          placeholder="Licence number"
                        />
                      </div>
                      <div>
                        <label className={LABEL}>National ID / passport</label>
                        <input
                          className={INPUT}
                          value={carrierForm.nationalId}
                          onChange={(e) =>
                            setCarrierForm((prev) => ({ ...prev, nationalId: e.target.value }))
                          }
                          placeholder="ID or passport number"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className={LABEL}>Company registration no.</label>
                        <input
                          className={INPUT}
                          value={carrierForm.registrationNo}
                          onChange={(e) =>
                            setCarrierForm((prev) => ({ ...prev, registrationNo: e.target.value }))
                          }
                          placeholder="Registration number"
                          required
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Insurance expiry</label>
                        <input
                          type="date"
                          className={INPUT}
                          value={carrierForm.insuranceExpiry}
                          onChange={(e) =>
                            setCarrierForm((prev) => ({ ...prev, insuranceExpiry: e.target.value }))
                          }
                        />
                      </div>
                    </>
                  )}

                  <div className="sm:col-span-2">
                    <label className={LABEL}>Business address</label>
                    <input
                      className={INPUT}
                      value={carrierForm.address}
                      onChange={(e) =>
                        setCarrierForm((prev) => ({ ...prev, address: e.target.value }))
                      }
                      placeholder="Street, city"
                      required
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Postcode</label>
                    <input
                      className={INPUT}
                      value={carrierForm.postcode}
                      onChange={(e) =>
                        setCarrierForm((prev) => ({ ...prev, postcode: e.target.value }))
                      }
                      placeholder="Postcode"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Operating region</label>
                    <input
                      className={INPUT}
                      value={carrierForm.operatingRegion}
                      onChange={(e) =>
                        setCarrierForm((prev) => ({ ...prev, operatingRegion: e.target.value }))
                      }
                      placeholder="London, Manchester, Birmingham"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Business name</label>
                    <input
                      className={INPUT}
                      value={supplierForm.companyName}
                      onChange={(e) =>
                        setSupplierForm((prev) => ({ ...prev, companyName: e.target.value }))
                      }
                      placeholder="Retail Hub Ltd"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Billing address</label>
                    <input
                      className={INPUT}
                      value={supplierForm.address}
                      onChange={(e) =>
                        setSupplierForm((prev) => ({ ...prev, address: e.target.value }))
                      }
                      placeholder="Street, city"
                      required
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Company registration no.</label>
                    <input
                      className={INPUT}
                      value={supplierForm.registrationNo}
                      onChange={(e) =>
                        setSupplierForm((prev) => ({ ...prev, registrationNo: e.target.value }))
                      }
                      placeholder="Registration number"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>VAT / tax ID</label>
                    <input
                      className={INPUT}
                      value={supplierForm.taxId}
                      onChange={(e) =>
                        setSupplierForm((prev) => ({ ...prev, taxId: e.target.value }))
                      }
                      placeholder="Tax reference"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Industry</label>
                    <input
                      className={INPUT}
                      value={supplierForm.industry}
                      onChange={(e) =>
                        setSupplierForm((prev) => ({ ...prev, industry: e.target.value }))
                      }
                      placeholder="Retail, manufacturing…"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Primary commodity</label>
                    <input
                      className={INPUT}
                      value={supplierForm.commodity}
                      onChange={(e) =>
                        setSupplierForm((prev) => ({ ...prev, commodity: e.target.value }))
                      }
                      placeholder="Consumer goods, pallets…"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href={profileHref} className="text-[13px] font-medium text-slate-500 hover:text-slate-800">
              View full profile page
            </Link>
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save & continue
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
