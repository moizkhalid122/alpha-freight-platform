"use client";

import Image from "next/image";
import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import VideoOverlay from "@/components/VideoOverlay";
import { 
  ChevronRight, 
  ChevronLeft, 
  Truck, 
  Building2, 
  Package, 
  Globe,
  ArrowRight,
  PartyPopper,
  Shield,
  BarChart,
  Search,
  User,
  Clock,
  Gift
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { recordCarrierReferralFromSignup, validateCarrierReferralCode } from "@/lib/carrier-referrals";
import { recordSupplierReferralFromSignup, validateSupplierReferralCode } from "@/lib/supplier-referrals";
import { carrierOnboardingCountryOptions } from "@/lib/country-options";
import { getCurrencyForCountry, getCountryName } from "@/lib/market-currency";
import { cn } from "@/lib/utils";
import {
  CarrierProfileExtras,
  SupplierProfileExtras,
  readCarrierExtras,
  readSupplierExtras,
  writeCarrierExtrasAsync,
  writeSupplierExtrasAsync,
} from "@/lib/profile-extras";

interface QuestionOption {
  label: string;
  value: string;
  sub: string;
}

interface QuestionField {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  required?: boolean;
}

interface Question {
  id: string;
  question: string;
  description: string;
  type?: "form";
  fields?: QuestionField[];
  options?: QuestionOption[];
  icon: React.ReactNode;
}

type CompaniesHouseAddress = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  locality?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

type CompaniesHouseSuggestion = {
  companyName: string;
  companyNumber: string;
  companyStatus: string | null;
  addressSnippet: string | null;
  address: CompaniesHouseAddress | null;
};

type CompaniesHouseProfile = {
  companyName: string;
  companyNumber: string;
  companyStatus: string | null;
  address: CompaniesHouseAddress | null;
};

const COMPANIES_HOUSE_SUPPORTED_COUNTRY = "GB";

const formatCompaniesHouseAddress = (address?: CompaniesHouseAddress | null) => {
  const parts = [
    address?.addressLine1,
    address?.addressLine2,
    address?.locality,
    address?.region,
    address?.postalCode,
    address?.country,
  ]
    .map((value) => value?.trim())
    .filter(Boolean) as string[];

  return Array.from(new Set(parts)).join(", ");
};

const countryOptions: QuestionOption[] = carrierOnboardingCountryOptions;

const accountTypeQuestion: Question = {
  id: "account_type",
  question: "How will you use Alpha Freight?",
  description: "Select your account type to customize your experience.",
  options: [
    { label: "Individual", value: "individual", sub: "Owner-operator or single driver" },
    { label: "Company", value: "company", sub: "Fleet owner or logistics business" }
  ],
  icon: <User className="w-5 h-5" />
};

const getCarrierQuestions = (accountType: string, countryCode?: string): Question[] => [
  accountTypeQuestion,
  {
    id: "country",
    question: "Select your country",
    description: "We will set your currency, load region, and dashboard prices automatically.",
    options: countryOptions,
    icon: <Globe className="w-5 h-5" />,
  },
  {
    id: "contact_info",
    question: accountType === "individual" ? "Your contact details" : "Company contact",
    description: "Just the essentials — name, phone, and city.",
    type: "form",
    fields: [
      {
        id: accountType === "individual" ? "full_name" : "contact_person",
        label: accountType === "individual" ? "Full name" : "Contact person",
        type: "text",
        placeholder: accountType === "individual" ? "John Doe" : "John Smith",
      },
      {
        id: "phone",
        label: "Phone number",
        type: "tel",
        placeholder: countryCode === "PK" ? "+92 300 1234567" : "+44 7123 456789",
      },
      {
        id: "city",
        label: "City",
        type: "text",
        placeholder: countryCode === "PK" ? "Karachi" : "Manchester",
      },
    ],
    icon: accountType === "individual" ? <User className="w-5 h-5" /> : <Building2 className="w-5 h-5" />,
  },
  accountType === "individual"
    ? {
        id: "quick_profile",
        question: "What do you drive?",
        description: "One last step. Add licence, insurance, and fleet details later from your profile.",
        type: "form",
        fields: [
          {
            id: "primary_vehicle",
            label: "Primary vehicle",
            type: "text",
            placeholder: "Curtain-sider, Reefer, Box truck…",
          },
        ],
        icon: <Truck className="w-5 h-5" />,
      }
    : countryCode === COMPANIES_HOUSE_SUPPORTED_COUNTRY
      ? {
          id: "company_lookup",
          question: "Find your registered company",
          description: "Search Companies House — verification documents can be added later.",
          type: "form",
          fields: [
            { id: "company_name", label: "Company name", type: "text", placeholder: "Alpha Logistics Ltd" },
          ],
          icon: <Search className="w-5 h-5" />,
        }
      : {
          id: "quick_profile",
          question: "Your business name",
          description: "One last step. Full verification can be completed later from your profile.",
          type: "form",
          fields: [
            {
              id: "company_name",
              label: "Company / business name",
              type: "text",
              placeholder: "Alpha Logistics",
            },
          ],
          icon: <Building2 className="w-5 h-5" />,
        },
].filter(Boolean) as Question[];

const getSupplierQuestions = (accountType: string, countryCode?: string): Question[] => [
  accountTypeQuestion,
  {
    id: "country",
    question: "Select your country",
    description: "We will set your currency, load region, and dashboard prices automatically.",
    options: countryOptions,
    icon: <Globe className="w-5 h-5" />,
  },
  {
    id: "contact_info",
    question: accountType === "individual" ? "Your contact details" : "Company contact",
    description: "Just the essentials — name, phone, and city.",
    type: "form",
    fields: [
      {
        id: accountType === "individual" ? "full_name" : "contact_person",
        label: accountType === "individual" ? "Full name" : "Contact person",
        type: "text",
        placeholder: accountType === "individual" ? "John Doe" : "Sarah Khan",
      },
      { id: "phone", label: "Phone number", type: "tel", placeholder: countryCode === "PK" ? "+92 300 1234567" : "+44 7123 456789" },
      { id: "city", label: "City", type: "text", placeholder: countryCode === "PK" ? "Lahore" : "London" },
    ],
    icon: accountType === "individual" ? <User className="w-5 h-5" /> : <Building2 className="w-5 h-5" />,
  },
  accountType === "individual"
    ? {
        id: "quick_profile",
        question: "Trading name",
        description: "One last step. Billing and tax details can be added later from your profile.",
        type: "form",
        fields: [
          { id: "company_name", label: "Trading / business name", type: "text", placeholder: "Retail Hub" },
        ],
        icon: <Building2 className="w-5 h-5" />,
      }
    : countryCode === COMPANIES_HOUSE_SUPPORTED_COUNTRY
      ? {
          id: "company_lookup",
          question: "Find your registered company",
          description: "Search Companies House — billing details can be added later from your profile.",
          type: "form",
          fields: [
            { id: "company_name", label: "Company name", type: "text", placeholder: "Retail Hub Ltd" },
          ],
          icon: <Search className="w-5 h-5" />,
        }
      : {
          id: "quick_profile",
          question: "Business name",
          description: "One last step. Verification can be completed later from your profile.",
          type: "form",
          fields: [
            { id: "company_name", label: "Company name", type: "text", placeholder: "Retail Hub Ltd" },
          ],
          icon: <Building2 className="w-5 h-5" />,
        },
].filter(Boolean) as Question[];

const writeOnboardingExtras = async (
  role: string,
  userId: string,
  userEmail: string | null,
  accountType: string,
  answers: Record<string, any>
) => {
  if (typeof window === "undefined") return;

  if (role === "carrier") {
    const existing = readCarrierExtras(userId);
    const contactInfo = answers.contact_info ?? {};
    const businessInfo = answers.business_info ?? {};
    const quickProfile = answers.quick_profile ?? {};
    const countryCode = answers.country ?? existing.countryCode ?? "GB";
    const nextValue: CarrierProfileExtras = {
      ...existing,
      accountType,
      email: userEmail ?? existing.email ?? null,
      countryCode,
      countryName: getCountryName(countryCode),
      currency: getCurrencyForCountry(countryCode),
      phone: contactInfo.phone ?? existing.phone ?? null,
      city: contactInfo.city ?? existing.city ?? null,
      contactPerson:
        accountType === "company"
          ? contactInfo.contact_person ?? existing.contactPerson ?? null
          : contactInfo.full_name ?? existing.contactPerson ?? null,
      companyName:
        accountType === "company"
          ? businessInfo.company_name ?? quickProfile.company_name ?? existing.companyName ?? null
          : contactInfo.full_name ?? existing.companyName ?? null,
      address: businessInfo.business_address ?? existing.address ?? null,
      registrationNo: businessInfo.registration_no ?? existing.registrationNo ?? null,
      primaryVehicle:
        accountType === "individual"
          ? quickProfile.primary_vehicle ?? existing.primaryVehicle ?? null
          : existing.primaryVehicle ?? null,
    };
    await writeCarrierExtrasAsync(userId, nextValue);
    return;
  }

  const existing = readSupplierExtras(userId);
  const contactInfo = answers.contact_info ?? {};
  const businessInfo = answers.business_info ?? {};
  const quickProfile = answers.quick_profile ?? {};
  const countryCode = answers.country ?? existing.countryCode ?? "GB";
  const nextValue: SupplierProfileExtras = {
    ...existing,
    accountType,
    email: userEmail ?? existing.email ?? null,
    countryCode,
    countryName: getCountryName(countryCode),
    currency: getCurrencyForCountry(countryCode),
    phone: contactInfo.phone ?? existing.phone ?? null,
    city: contactInfo.city ?? existing.city ?? null,
    contactPerson:
      accountType === "company"
        ? contactInfo.contact_person ?? existing.contactPerson ?? null
        : contactInfo.full_name ?? existing.contactPerson ?? null,
    companyName:
      quickProfile.company_name ??
      businessInfo.company_name ??
      (accountType === "individual" ? contactInfo.full_name ?? existing.companyName ?? null : existing.companyName ?? null),
    address: businessInfo.billing_address ?? existing.address ?? null,
    registrationNo: businessInfo.registration_no ?? existing.registrationNo ?? null,
  };
  await writeSupplierExtrasAsync(userId, nextValue);
};

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") || "carrier";
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [companySuggestions, setCompanySuggestions] = useState<CompaniesHouseSuggestion[]>([]);
  const [isCompanySearchLoading, setIsCompanySearchLoading] = useState(false);
  const [companySearchError, setCompanySearchError] = useState<string | null>(null);
  const [referralValidation, setReferralValidation] = useState<{
    status: "idle" | "checking" | "valid" | "invalid";
    referrerName?: string | null;
  }>({ status: "idle" });

  useEffect(() => {
    const refFromUrl = (searchParams.get("ref") || "").trim().toUpperCase();
    if (!refFromUrl) return;

    setAnswers((prev) => ({
      ...prev,
      referral_code: {
        ...(prev.referral_code ?? {}),
        referral_code: refFromUrl,
      },
    }));
  }, [searchParams]);

  // Always show 6 steps by default
  const getQuestions = () => {
    const accountType = answers.account_type || "company"; // Default to company structure for step count
    const countryCode = answers.country;
    return role === "supplier"
      ? getSupplierQuestions(accountType, countryCode)
      : getCarrierQuestions(accountType, countryCode);
  };

  const questions = getQuestions();
  const currentQuestion = questions[currentStep];
  const currentQuestionId = currentQuestion.id;
  const accountType = answers.account_type || "company";
  const companyAddressFieldId = role === "supplier" ? "billing_address" : "business_address";
  const isCompanyLookupStep =
    currentQuestion.type === "form" &&
    currentQuestionId === "company_lookup" &&
    accountType === "company";
  const isCompanyLookupEnabled = answers.country === COMPANIES_HOUSE_SUPPORTED_COUNTRY;

  useEffect(() => {
    if (currentQuestion.type === "form") {
      setFormValues((answers[currentQuestionId] as Record<string, string> | undefined) ?? {});
    } else {
      setFormValues({});
    }
    setCompanySuggestions([]);
    setIsCompanySearchLoading(false);
    setCompanySearchError(null);
    if (currentQuestionId !== "referral_code") {
      setReferralValidation({ status: "idle" });
    }
  }, [answers, currentQuestion.type, currentQuestionId]);

  useEffect(() => {
    if (!isCompanyLookupStep || !isCompanyLookupEnabled) {
      setCompanySuggestions([]);
      setIsCompanySearchLoading(false);
      setCompanySearchError(null);
      return;
    }

    const query = formValues.company_name?.trim() ?? "";

    if (query.length < 2) {
      setCompanySuggestions([]);
      setIsCompanySearchLoading(false);
      setCompanySearchError(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsCompanySearchLoading(true);
        setCompanySearchError(null);

        const response = await fetch(
          `/api/companies-house/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        const payload = (await response.json()) as {
          items?: CompaniesHouseSuggestion[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Unable to search companies.");
        }

        setCompanySuggestions(payload.items ?? []);
      } catch (error) {
        if (controller.signal.aborted) return;

        setCompanySuggestions([]);
        setCompanySearchError(
          error instanceof Error ? error.message : "Unable to search companies."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsCompanySearchLoading(false);
        }
      }
    }, 260);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [formValues.company_name, isCompanyLookupEnabled, isCompanyLookupStep]);

  const updateFormValue = (fieldId: string, value: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldId]: value,
    }));
  };

  const handleCompanySelect = async (suggestion: CompaniesHouseSuggestion) => {
    const suggestionAddress =
      formatCompaniesHouseAddress(suggestion.address) || suggestion.addressSnippet || "";
    let nextBusinessInfo: Record<string, string> = {
      ...(answers.business_info ?? {}),
      company_name: suggestion.companyName,
      registration_no: suggestion.companyNumber,
      [companyAddressFieldId]: suggestionAddress,
    };

    try {
      setCompanySearchError(null);
      const response = await fetch(
        `/api/companies-house/company/${encodeURIComponent(suggestion.companyNumber)}`
      );
      const payload = (await response.json()) as CompaniesHouseProfile & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to fetch company details.");
      }

      const fullAddress = formatCompaniesHouseAddress(payload.address);

      nextBusinessInfo = {
        ...nextBusinessInfo,
        company_name: payload.companyName || nextBusinessInfo.company_name || suggestion.companyName,
        registration_no:
          payload.companyNumber || nextBusinessInfo.registration_no || suggestion.companyNumber,
        [companyAddressFieldId]: fullAddress || nextBusinessInfo[companyAddressFieldId] || suggestionAddress,
      };
    } catch (error) {
      setCompanySearchError(
        error instanceof Error ? error.message : "Unable to fetch company details."
      );
    }

    setFormValues({
      company_name: nextBusinessInfo.company_name ?? suggestion.companyName,
    });
    setCompanySuggestions([]);
    setAnswers((currentAnswers) => {
      const mergedAnswers = {
        ...currentAnswers,
        company_lookup: {
          company_name: nextBusinessInfo.company_name ?? suggestion.companyName,
        },
        business_info: nextBusinessInfo,
        contact_info: {
          ...(currentAnswers.contact_info ?? {}),
          city:
            currentAnswers.contact_info?.city ??
            suggestion.address?.locality ??
            "",
        },
      };
      setTimeout(() => {
        if (currentStep >= questions.length - 1) {
          void saveOnboardingData(mergedAnswers);
        } else {
          setCurrentStep((step) => step + 1);
        }
      }, 200);
      return mergedAnswers;
    });
  };

  const handleSelect = (value: string) => {
    setAnswers({ ...answers, [questions[currentStep].id]: value });
    proceed();
  };

  const handleManualCompanyEntry = () => {
    const nextBusinessInfo = {
      ...(answers.business_info ?? {}),
      company_name: formValues.company_name ?? "",
    };

    setAnswers({
      ...answers,
      company_lookup: formValues,
      business_info: nextBusinessInfo,
    });
    proceed();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formElement = e.currentTarget as HTMLFormElement;

    if (!formElement.reportValidity()) {
      return;
    }

    if (currentQuestionId === "referral_code") {
      const code = (formValues.referral_code || "").trim();
      if (code) {
        setReferralValidation({ status: "checking" });
        const result =
          role === "carrier"
            ? await validateCarrierReferralCode(code)
            : await validateSupplierReferralCode(code);

        if (!result.valid) {
          setReferralValidation({ status: "invalid" });
          return;
        }

        setReferralValidation({
          status: "valid",
          referrerName: result.referrerName,
        });
      }
    }

    if (currentQuestionId === "company_lookup" && accountType === "company") {
      const nextBusinessInfo = {
        ...(answers.business_info ?? {}),
        company_name: formValues.company_name ?? "",
      };

      setAnswers({
        ...answers,
        company_lookup: formValues,
        business_info: nextBusinessInfo,
      });
      proceed();
      return;
    }

    setAnswers({ ...answers, [currentQuestionId]: formValues });
    proceed();
  };

  const proceed = () => {
    setTimeout(() => {
      // Use the latest questions list to check if we should move to next step
      const currentQuestions = getQuestions();
      if (currentStep < currentQuestions.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        saveOnboardingData();
      }
    }, 400);
  };

  const saveOnboardingData = async (answersOverride?: Record<string, any>) => {
    setIsSubmitting(true);
    setSaveError(null);
    const payload = answersOverride ?? answers;
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Please sign in again to finish onboarding.");

      const accountType = payload.account_type;
      const contactInfo = payload.contact_info ?? {};
      const businessInfo = payload.business_info ?? {};
      const quickProfile = payload.quick_profile ?? {};
      const fullName =
        accountType === "company"
          ? contactInfo.contact_person ?? null
          : contactInfo.full_name ?? null;

      await writeOnboardingExtras(role, user.id, user.email ?? null, accountType, payload);

      const updatePayload: Record<string, string | null> = {
        full_name: fullName,
        company_name:
          role === "carrier"
            ? accountType === "company"
              ? businessInfo.company_name ?? quickProfile.company_name ?? null
              : null
            : businessInfo.company_name ?? quickProfile.company_name ?? null,
      };

      const { error } = await supabase.from("profiles").update(updatePayload).eq("id", user.id);

      if (error) throw error;

      const referralCode = (searchParams.get("ref") || "").trim().toUpperCase();

      if (referralCode) {
        if (role === "carrier") {
          await recordCarrierReferralFromSignup({
            referredUserId: user.id,
            referralCode,
          });
        } else if (role === "supplier") {
          await recordSupplierReferralFromSignup({
            referredUserId: user.id,
            referralCode,
          });
        }
      }

      setShowSuccess(true);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message || "Unable to save onboarding.")
          : err instanceof Error
            ? err.message
            : "Unable to save onboarding. Please try again.";
      console.error("Error saving onboarding data:", err);
      setSaveError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    setShowVideo(true);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-500/10 selection:text-blue-600 flex flex-col items-center p-6">
      <AnimatePresence mode="wait">
        {!showSuccess ? (
          <motion.div 
            key={currentStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-xl py-20 text-center"
          >
            {/* Step Indicator */}
            <div className="flex flex-col items-center mb-10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">
                Step {currentStep + 1} of {questions.length}
              </span>
              <div className="flex gap-1.5">
                {questions.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      idx === currentStep ? "w-6 bg-slate-900" : "w-1.5 bg-slate-100"
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Question Section */}
            <div className="mb-12">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 leading-tight">
                {questions[currentStep].question}
              </h1>
              {currentQuestionId !== "company_lookup" ? (
                <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
                  {questions[currentStep].description}
                </p>
              ) : null}
            </div>

            {/* Answer Options or Form */}
            {currentQuestion.type === "form" ? (
              <form onSubmit={handleFormSubmit} className="space-y-4 max-w-sm mx-auto text-left">
                {currentQuestion.fields?.map((field: QuestionField) => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{field.label}</label>
                    <div className="relative">
                      <input 
                        type={field.type}
                        name={field.id}
                        required={field.required !== false}
                        value={formValues[field.id] ?? ""}
                        onChange={(e) => updateFormValue(field.id, e.target.value)}
                        onBlur={
                          currentQuestionId === "referral_code" && field.id === "referral_code"
                            ? async (event) => {
                                const code = event.currentTarget.value.trim();
                                if (!code) {
                                  setReferralValidation({ status: "idle" });
                                  return;
                                }
                                setReferralValidation({ status: "checking" });
                                const result =
                                  role === "carrier"
                                    ? await validateCarrierReferralCode(code)
                                    : await validateSupplierReferralCode(code);
                                setReferralValidation({
                                  status: result.valid ? "valid" : "invalid",
                                  referrerName: result.referrerName,
                                });
                              }
                            : undefined
                        }
                        placeholder={field.placeholder}
                        autoComplete={field.id === "company_name" ? "organization" : "off"}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all placeholder:text-slate-300"
                      />

                      {isCompanyLookupStep && field.id === "company_name" ? (
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleManualCompanyEntry}
                              disabled={isSubmitting}
                              className="text-[12px] font-semibold text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-50"
                            >
                              Add Manually
                            </button>
                          </div>

                          {isCompanySearchLoading ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                              Searching Companies House...
                            </div>
                          ) : null}

                          {!isCompanySearchLoading && companySuggestions.length > 0 ? (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                              {companySuggestions.map((company) => (
                                <button
                                  key={`${company.companyNumber}-${company.companyName}`}
                                  type="button"
                                  onClick={() => handleCompanySelect(company)}
                                  className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50"
                                >
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">
                                      {company.companyName}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-slate-500">
                                      {company.addressSnippet || formatCompaniesHouseAddress(company.address) || "Registered office address available after selection"}
                                    </p>
                                  </div>
                                  <span className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                    {company.companyNumber}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : null}

                          {companySearchError ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                              {companySearchError}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                {currentQuestionId === "referral_code" ? (
                  <div className="px-1">
                    {referralValidation.status === "checking" ? (
                      <p className="text-xs font-medium text-slate-500">Checking referral code...</p>
                    ) : null}
                    {referralValidation.status === "valid" ? (
                      <p className="text-xs font-semibold text-emerald-600">
                        Referral linked to {referralValidation.referrerName}
                      </p>
                    ) : null}
                    {referralValidation.status === "invalid" ? (
                      <p className="text-xs font-semibold text-rose-600">
                        Referral code not found. Check the code or continue without one.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {saveError ? (
                  <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {saveError}
                  </p>
                ) : null}

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 hover:bg-slate-800 transition-all mt-6 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Continue"}
                  {!isSubmitting && <ChevronRight className="w-4 h-4" />}
                </button>
              </form>
            ) : (
              <div
                className={cn(
                  "mx-auto space-y-4",
                  questions[currentStep].id === "account_type" ? "max-w-[760px]" : "max-w-sm"
                )}
              >
                {/* Search Bar for Country */}
                {questions[currentStep].id === "country" && (
                  <div className="relative mb-6">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input 
                      type="text"
                      placeholder="Search your country..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all placeholder:text-slate-400"
                    />
                  </div>
                )}

                <div 
                  data-lenis-prevent
                  className={cn(
                    "custom-scrollbar",
                    questions[currentStep].id === "country" ? "h-[400px] overflow-y-auto pr-2 space-y-3" : "",
                    questions[currentStep].id === "account_type" ? "grid gap-5 sm:grid-cols-2 sm:items-stretch" : "space-y-3"
                  )} 
                  style={{ 
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    position: 'relative',
                    zIndex: 10
                  }}
                >
                  {questions[currentStep].options
                    ?.filter(opt => 
                      questions[currentStep].id !== "country" || 
                      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((option: QuestionOption, idx: number) => (
                      <motion.button
                        key={option.value}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * idx }}
                        onClick={() => handleSelect(option.value)}
                        disabled={isSubmitting}
                        className={cn(
                          "w-full group text-left transition-all duration-300",
                          questions[currentStep].id === "account_type"
                            ? [
                                "aspect-square rounded-[30px] border p-5 sm:p-6",
                                answers[questions[currentStep].id] === option.value
                                  ? "border-slate-900 bg-slate-900 text-white shadow-[0_20px_40px_rgba(15,23,42,0.16)]"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800",
                              ]
                            : [
                                "flex items-center justify-between rounded-xl border p-4",
                                answers[questions[currentStep].id] === option.value
                                  ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/5"
                                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50 text-slate-800",
                              ],
                          isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                        )}
                      >
                        {questions[currentStep].id === "account_type" ? (
                          <div className="flex h-full flex-col">
                            <div className="relative mb-5 h-[52%] w-full overflow-hidden">
                              <Image
                                src={option.value === "individual" ? "/Individual.png" : "/Company (2).png"}
                                alt={option.label}
                                fill
                                sizes="(max-width: 640px) 100vw, 360px"
                                className="object-contain p-3"
                                priority
                              />
                            </div>

                            <div className="flex flex-1 items-end justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-[22px] font-black tracking-tight leading-none sm:text-[24px]">
                                  {option.label}
                                </h3>
                                <p
                                  className={cn(
                                    "mt-2.5 max-w-[190px] text-[13px] leading-6",
                                    answers[questions[currentStep].id] === option.value
                                      ? "text-slate-300"
                                      : "text-slate-500"
                                  )}
                                >
                                  {option.sub}
                                </p>
                              </div>

                              <div
                                className={cn(
                                  "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border transition-all",
                                  answers[questions[currentStep].id] === option.value
                                    ? "border-white/15 bg-white/10 text-white"
                                    : "border-slate-200 bg-white text-slate-400 group-hover:border-slate-300 group-hover:text-slate-900"
                                )}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            {questions[currentStep].id === "country" && (
                              <div className="w-8 h-8 relative rounded-full overflow-hidden border border-slate-100 flex-shrink-0 shadow-sm">
                                <Image 
                                  src={`/${option.value}.svg`}
                                  alt={option.label}
                                  fill
                                  className="object-cover scale-[1.2]"
                                />
                              </div>
                            )}
                            <div>
                              <h3 className="text-sm font-bold mb-0.5">{option.label}</h3>
                              <p className={`text-[11px] font-medium ${
                                answers[questions[currentStep].id] === option.value ? "text-slate-400" : "text-slate-500"
                              }`}>
                                {option.sub}
                              </p>
                            </div>
                          </div>
                        )}

                        {questions[currentStep].id !== "account_type" ? (
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-500 ${
                            answers[questions[currentStep].id] === option.value
                              ? "bg-white/10 text-white"
                              : "bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white"
                          }`}>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        ) : null}
                      </motion.button>
                    ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-10 flex justify-center">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex items-center gap-2 text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-all group"
                >
                  <div className="w-6 h-6 rounded-full border border-slate-100 flex items-center justify-center group-hover:border-slate-900 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </div>
                  GO BACK
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="success-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-screen flex flex-col items-center justify-center bg-white p-6 relative overflow-hidden"
          >
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full z-0">
              <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-[#FFD666]/5 rounded-full blur-[80px]" />
              <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 max-w-sm w-full text-center">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 12 }}
                transition={{ type: "spring", damping: 15, stiffness: 120 }}
                className="w-16 h-16 bg-[#FFD666] rounded-xl flex items-center justify-center text-slate-900 mx-auto mb-6 shadow-lg shadow-yellow-500/10"
              >
                <PartyPopper className="w-8 h-8" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3 leading-tight">
                  You're all <span className="italic font-serif font-light text-slate-400">set!</span>
                </h2>
                <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                  Welcome to Alpha Freight. Your personalized experience is ready.
                </p>

                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleComplete}
                  className="px-8 py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2.5 mx-auto hover:bg-slate-800 transition-all"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-10"
              >
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                  Alpha Freight Premium
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <VideoOverlay
        isOpen={showVideo}
        onClose={() => setShowVideo(false)}
        targetPath={role === "supplier" ? "/supplier/dashboard" : "/carrier/dashboard"}
      />
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-50 border-t-slate-900 rounded-full animate-spin" />
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
