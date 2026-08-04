"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronDown, CreditCard, Loader2 } from "lucide-react";
import {
  carrierOnboardingCountryOptions,
  findCountryOption,
  getCountryFlagSrc,
} from "@/lib/country-options";
import { supabase } from "@/lib/supabase";
import { mergeCarrierExtras, readCarrierExtras } from "@/lib/profile-extras";

type SetupStep = 1 | 2;

type BankFormState = {
  accountHolderName: string;
  bankName: string;
  bankCountry: string;
  sortCode: string;
  accountNumber: string;
  confirmAccountNumber: string;
  accountType: "personal" | "corporate";
};

const initialFormState: BankFormState = {
  accountHolderName: "",
  bankName: "",
  bankCountry: "",
  sortCode: "",
  accountNumber: "",
  confirmAccountNumber: "",
  accountType: "personal",
};
const payoutMethodOptions = [
  {
    value: "Bank",
    title: "Bank",
  },
];

export default function CarrierPayoutSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("Bank");
  const [form, setForm] = useState<BankFormState>(initialFormState);
  const [error, setError] = useState("");
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const [isMethodMenuOpen, setIsMethodMenuOpen] = useState(false);

  useEffect(() => {
    async function hydrateExistingSetup() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const extras = readCarrierExtras(user.id);
      const matchedCountry = findCountryOption(extras.bankCountry);
      setSelectedMethod(extras.payoutMethod || "Bank");
      setForm({
        accountHolderName: extras.bankAccountHolderName || "",
        bankName: extras.bankName || "",
        bankCountry: matchedCountry?.value || "",
        sortCode: extras.bankSortCode || "",
        accountNumber: extras.bankAccountNumber || "",
        confirmAccountNumber: extras.bankAccountNumber || "",
        accountType:
          extras.bankAccountType?.toLowerCase() === "corporate" ? "corporate" : "personal",
      });
      setLoading(false);
    }

    void hydrateExistingSetup();
  }, [router]);

  const stepTitle = useMemo(() => {
    if (step === 1) return "Setup payout preferences";
    return "Enter payout account details";
  }, [step]);

  const stepDescription = useMemo(() => {
    if (step === 1) {
      return "Choose the payout country and method first, then continue to bank account details.";
    }

    return "Add the bank account details that should receive your carrier payouts.";
  }, [step]);

  const updateField = <K extends keyof BankFormState>(key: K, value: BankFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const selectedCountryOption = useMemo(
    () => findCountryOption(form.bankCountry),
    [form.bankCountry]
  );

  const handleContinue = () => {
    if (!form.bankCountry.trim()) {
      setError("Please select your payout country first.");
      return;
    }

    if (!selectedMethod.trim()) {
      setError("Please select a payout method first.");
      return;
    }

    setStep(2);
    setError("");
  };

  const handleSave = async () => {
    if (
      !form.accountHolderName.trim() ||
      !form.bankName.trim() ||
      !form.bankCountry.trim() ||
      !form.sortCode.trim() ||
      !form.accountNumber.trim() ||
      !form.confirmAccountNumber.trim()
    ) {
      setError("Please complete all bank payout fields first.");
      return;
    }

    if (form.accountNumber.trim() !== form.confirmAccountNumber.trim()) {
      setError("Account number and confirm account number must match.");
      return;
    }

    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      mergeCarrierExtras(user.id, {
        payoutMethod: selectedMethod,
        preferredPaymentMethod: "Bank Transfer",
        payoutSetupComplete: true,
        bankAccountHolderName: form.accountHolderName.trim(),
        bankName: form.bankName.trim(),
        bankCountry: selectedCountryOption?.label ?? form.bankCountry.trim(),
        bankSortCode: form.sortCode.trim(),
        bankAccountNumber: form.accountNumber.trim(),
        bankAccountType: form.accountType,
      });

      router.push("/carrier/wallet/payout-setup/completed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6] px-4 py-6 text-slate-900 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col">
        <div className="relative flex items-center justify-center py-5">
          <div className="flex items-center gap-10">
            {[1, 2].map((item) => (
              <div key={item} className="flex items-center gap-10">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                    item <= step ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {item < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : item}
                </div>
                {item < 2 ? <div className="h-[2px] w-24 rounded-full bg-slate-200" /> : null}
              </div>
            ))}
          </div>

          <Link
            href="/carrier/wallet"
            className="absolute right-0 inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>

        <div className="flex flex-1 items-start justify-center pt-12 pb-8 sm:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl"
          >
            <div className="space-y-3 text-center">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-[38px]">
                {step === 1 ? "Enter payout information" : "Add bank recipient details"}
              </h1>
              <p className="mx-auto max-w-xl text-sm font-medium text-slate-500">
                {stepDescription}
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-slate-400" />
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Loading payout setup...
                </p>
              </div>
            ) : (
              <>
                {step === 1 ? (
                  <div className="mx-auto mt-8 w-full max-w-xl rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
                    <div className="space-y-5">
                      <label className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          Recipient Location
                        </span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCountryMenuOpen((current) => !current);
                              setIsMethodMenuOpen(false);
                            }}
                            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-900 outline-none transition hover:bg-white"
                          >
                            <span className="flex items-center gap-3">
                              {selectedCountryOption ? (
                                <>
                                  <Image
                                    src={getCountryFlagSrc(selectedCountryOption.value)}
                                    alt={selectedCountryOption.label}
                                    width={20}
                                    height={20}
                                    className="h-5 w-5 rounded-full object-cover"
                                  />
                                  <span>{selectedCountryOption.label}</span>
                                </>
                              ) : (
                                <span className="text-slate-500">Choose a country and currency</span>
                              )}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 text-slate-500 transition-transform ${
                                isCountryMenuOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isCountryMenuOpen ? (
                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                              <div className="max-h-72 overflow-y-auto py-2">
                                {carrierOnboardingCountryOptions.map((country) => (
                                  <button
                                    key={country.value}
                                    type="button"
                                    onClick={() => {
                                      updateField("bankCountry", country.value);
                                      setIsCountryMenuOpen(false);
                                    }}
                                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                                      selectedCountryOption?.value === country.value ? "bg-emerald-50/70" : ""
                                    }`}
                                  >
                                    <Image
                                      src={getCountryFlagSrc(country.value)}
                                      alt={country.label}
                                      width={20}
                                      height={20}
                                      className="h-5 w-5 rounded-full object-cover"
                                    />
                                    <span className="text-sm font-semibold text-slate-900">{country.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </label>

                      <label className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          Payout Method
                        </span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setIsMethodMenuOpen((current) => !current);
                              setIsCountryMenuOpen(false);
                            }}
                            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-900 outline-none transition hover:bg-white"
                          >
                            <span className={selectedMethod ? "text-slate-900" : "text-slate-500"}>
                              {selectedMethod || "Select payout method"}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 text-slate-500 transition-transform ${
                                isMethodMenuOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isMethodMenuOpen ? (
                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                              <div className="py-2">
                                {payoutMethodOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                      setSelectedMethod(option.value);
                                      setError("");
                                      setIsMethodMenuOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50 ${
                                      selectedMethod === option.value ? "bg-emerald-50/70" : ""
                                    }`}
                                  >
                                    <span className="text-sm font-semibold text-slate-900">{option.title}</span>
                                    {selectedMethod === option.value ? (
                                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                                    ) : null}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto mt-8 w-full max-w-[760px] rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
                    <div className="space-y-5">
                      <label className="space-y-2">
                        <span className="px-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          Account Holder Name
                        </span>
                        <input
                          value={form.accountHolderName}
                          onChange={(event) => updateField("accountHolderName", event.target.value)}
                          className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300"
                          placeholder="Swift Haulage Ltd"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="px-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          Sort Code (6 digits)
                        </span>
                        <input
                          value={form.sortCode}
                          onChange={(event) => updateField("sortCode", event.target.value)}
                          className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300"
                          placeholder="12-34-56"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="px-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          Account Number (8 digits)
                        </span>
                        <input
                          value={form.accountNumber}
                          onChange={(event) => updateField("accountNumber", event.target.value)}
                          className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300"
                          placeholder="12345678"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="px-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          Confirm Account Number
                        </span>
                        <input
                          value={form.confirmAccountNumber}
                          onChange={(event) => updateField("confirmAccountNumber", event.target.value)}
                          className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300"
                          placeholder="12345678"
                        />
                      </label>

                      <div className="space-y-2">
                        <span className="px-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          Account Type
                        </span>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => updateField("accountType", "personal")}
                            className={`inline-flex items-center justify-center rounded-[18px] border px-4 py-3 text-sm font-bold transition ${
                              form.accountType === "personal"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            Personal
                          </button>
                          <button
                            type="button"
                            onClick={() => updateField("accountType", "corporate")}
                            className={`inline-flex items-center justify-center rounded-[18px] border px-4 py-3 text-sm font-bold transition ${
                              form.accountType === "corporate"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            Corporate
                          </button>
                        </div>
                      </div>

                      <label className="space-y-2">
                        <span className="px-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          Bank Name
                        </span>
                        <input
                          value={form.bankName}
                          onChange={(event) => updateField("bankName", event.target.value)}
                          className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300"
                          placeholder="Barclays"
                        />
                      </label>

                    </div>
                  </div>
                )}

                {error ? (
                  <div className="mx-auto mt-4 w-full max-w-[760px] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="mx-auto mt-5 flex w-full max-w-[760px] flex-col-reverse items-center justify-center gap-3 sm:flex-row">
                  {step === 2 ? (
                    <Link
                      href="/carrier/wallet"
                      className="inline-flex min-w-[170px] items-center justify-center rounded-full border border-emerald-200 bg-white px-8 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Cancel
                    </Link>
                  ) : (
                    <Link
                      href="/carrier/wallet"
                      className="inline-flex min-w-[140px] items-center justify-center rounded-full border border-emerald-200 bg-white px-8 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Back
                    </Link>
                  )}

                  {step === 1 ? (
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="inline-flex min-w-[190px] items-center justify-center rounded-full bg-emerald-700 px-8 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-emerald-800"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={saving}
                      className="inline-flex min-w-[280px] items-center justify-center gap-2 rounded-full bg-emerald-700 px-8 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Add Recipient
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
