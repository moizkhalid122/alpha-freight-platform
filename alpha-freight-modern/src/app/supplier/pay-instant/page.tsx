"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleHelp,
  CreditCard,
  Lock,
  Loader2,
} from "lucide-react";
import PayInstantStripeCheckout from "@/components/payments/PayInstantStripeCheckout";
import CountrySelectField from "@/components/payments/CountrySelectField";
import BillingAddressField from "@/components/payments/BillingAddressField";
import { supabase } from "@/lib/supabase";
import { isLiveCardCheckoutEnabled } from "@/lib/render-payments";
import {
  getSupplierPaymentOrdersForUser,
  markSupplierPaymentPaid,
  migrateLocalPaymentsToSupabase,
  moveSupplierPaymentToPayLater,
  resolveSupplierPaymentState,
  type SupplierPaymentRecord,
} from "@/lib/supplier-payments";
import PaymentSuccessOverlay from "@/components/payments/PaymentSuccessOverlay";

type LoadRow = {
  id: string;
  origin: string | null;
  destination: string | null;
  price: number | string | null;
  status: string | null;
  pickup_date: string | null;
  equipment: string | null;
  created_at: string | null;
};

type InstantOrder = SupplierPaymentRecord & {
  loadStatus: string;
  pickupDate: string;
};

function formatMoney(value: number) {
  return `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPickupDate(value: string) {
  if (!value || value === "Schedule pending") return "To be scheduled";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatLabel(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatRoute(origin: string, destination: string) {
  return `${formatLabel(origin)} → ${formatLabel(destination)}`;
}

function SupplierPayInstantPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedLoadId = searchParams.get("load");

  const [supplierId, setSupplierId] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [activeOrder, setActiveOrder] = useState<InstantOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [country, setCountry] = useState("GB");
  const [addressLine, setAddressLine] = useState("");
  const [postcode, setPostcode] = useState("");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const fetchCheckoutOrder = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/auth/login?redirect=/supplier/post-load");
      return;
    }

    if (!selectedLoadId) {
      router.replace("/supplier/post-load");
      return;
    }

    setSupplierId(user.id);
    setUserEmail(user.email || "");

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (profile?.full_name) {
      setUserName(profile.full_name);
      setCardName((current) => current || profile.full_name);
    }

    await migrateLocalPaymentsToSupabase(user.id);

    const remoteOrders = await getSupplierPaymentOrdersForUser(user.id);
    const paymentOrder = remoteOrders.find((item) => item.loadId === selectedLoadId);

    const { data: load } = await supabase
      .from("loads")
      .select("id, origin, destination, price, status, pickup_date, equipment, created_at, payment_state, payment_route")
      .eq("id", selectedLoadId)
      .eq("supplier_id", user.id)
      .single();

    if (!load) {
      router.replace("/supplier/post-load");
      return;
    }

    const loadRow = load as LoadRow & { payment_state?: string | null; payment_route?: string | null };
    const merged: InstantOrder = {
      loadId: loadRow.id,
      supplierId: user.id,
      paymentRoute: (paymentOrder?.paymentRoute || loadRow.payment_route || "pay-now") as "pay-now" | "pay-later",
      paymentState: resolveSupplierPaymentState(loadRow.payment_state, paymentOrder?.paymentState),
      amount: loadRow.price ? Number(loadRow.price) : Number(paymentOrder?.amount || 0),
      currency: paymentOrder?.currency || "gbp",
      title: paymentOrder?.title || `${loadRow.origin || "Origin"} → ${loadRow.destination || "Destination"}`,
      origin: loadRow.origin || paymentOrder?.origin || "",
      destination: loadRow.destination || paymentOrder?.destination || "",
      equipment: loadRow.equipment || paymentOrder?.equipment || "General freight",
      createdAt: loadRow.created_at || paymentOrder?.createdAt || new Date().toISOString(),
      dueLabel: paymentOrder?.dueLabel || "Due today",
      paymentMethod: paymentOrder?.paymentMethod || "card",
      loadStatus: loadRow.status || "pending-payment",
      pickupDate: loadRow.pickup_date || "Schedule pending",
      cardBrand: paymentOrder?.cardBrand,
      cardLast4: paymentOrder?.cardLast4,
      paidAt: paymentOrder?.paidAt,
    };

    setActiveOrder(merged);
    setLoading(false);
  };

  useEffect(() => {
    void fetchCheckoutOrder();
  }, [selectedLoadId]);

  const cardNumberDigits = cardNumber.replace(/\s/g, "");
  const cardBrand = useMemo(() => {
    if (/^4/.test(cardNumberDigits)) return "VISA";
    if (/^5[1-5]/.test(cardNumberDigits)) return "MASTERCARD";
    if (/^3[47]/.test(cardNumberDigits)) return "AMEX";
    return "";
  }, [cardNumberDigits]);

  const initials = useMemo(() => {
    const source = userName || activeOrder?.title || "AF";
    return source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }, [userName, activeOrder?.title]);

  const formatCardNumber = (value: string) =>
    value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const handlePayNow = async () => {
    if (!activeOrder || !supplierId) return;

    if (paymentMethod === "paypal") {
      setFlashMessage("PayPal checkout is coming soon. Please use card for now.");
      return;
    }

    if (isLiveCardCheckoutEnabled()) {
      return;
    }

    if (
      !cardName.trim() ||
      cardNumber.replace(/\s/g, "").length < 13 ||
      expiry.trim().length < 5 ||
      cvv.trim().length < 3
    ) {
      setFlashMessage("Please complete all card details.");
      return;
    }

    setIsProcessing(true);
    setFlashMessage(null);

    const brandLabel =
      cardBrand === "VISA" ? "Visa" : cardBrand === "MASTERCARD" ? "Mastercard" : cardBrand || "Card";
    const cardLast4 = cardNumber.replace(/\s/g, "").slice(-4);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setFlashMessage("Please sign in again to complete payment.");
        return;
      }

      const devResponse = await fetch("/api/stripe/confirm-dev-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          loadId: activeOrder.loadId,
          cardBrand: brandLabel,
          cardLast4,
        }),
      });

      const devPayload = await devResponse.json();

      if (!devResponse.ok) {
        setFlashMessage(
          devPayload.error ||
            "Live payments are unavailable. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable Render checkout."
        );
        return;
      }

      await markSupplierPaymentPaid({
        supplierId,
        loadId: activeOrder.loadId,
        cardBrand: brandLabel,
        cardLast4,
      });

      setFlashMessage("Payment completed successfully.");
      setCardNumber("");
      setExpiry("");
      setCvv("");
      setPaymentCompleted(true);
      setShowSuccessOverlay(true);
      await fetchCheckoutOrder();
    } catch (error) {
      console.error("Payment error:", error);
      setFlashMessage(error instanceof Error ? error.message : "Something went wrong while processing payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripeSuccess = async () => {
    setPaymentCompleted(true);
    setShowSuccessOverlay(true);
    await fetchCheckoutOrder();
  };

  const handleExitCheckout = async (destination: "pay-later" | "my-posts" = "pay-later") => {
    if (
      !paymentCompleted &&
      activeOrder?.paymentState !== "paid" &&
      supplierId &&
      activeOrder?.loadId
    ) {
      await moveSupplierPaymentToPayLater({
        supplierId,
        loadId: activeOrder.loadId,
      });
    }

    if (destination === "pay-later" && activeOrder?.loadId) {
      router.push(`/supplier/pay-later?highlight=${activeOrder.loadId}`);
      return;
    }

    router.push("/supplier/my-posts");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!activeOrder) {
    return null;
  }

  const isPaid = activeOrder.paymentState === "paid";
  const amount = Number(activeOrder.amount || 0);
  const pickupLabel = formatPickupDate(activeOrder.pickupDate);
  const routeLabel = formatRoute(activeOrder.origin, activeOrder.destination);

  const inputClass =
    "w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-500";
  const labelClass = "text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500";

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PaymentSuccessOverlay
        open={showSuccessOverlay}
        amountLabel={formatMoney(amount)}
        onClose={() => setShowSuccessOverlay(false)}
      />
      <header className="border-b border-slate-100 px-6 py-3.5">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <Link href="/supplier/my-posts" className="ml-3 flex items-center gap-2.5 sm:ml-5">
            <Image src="/logo.png" alt="Alpha Freight" width={24} height={24} className="object-contain" />
            <span className="text-[15px] font-semibold text-slate-800">Alpha Freight</span>
          </Link>
          <button
            type="button"
            onClick={() => void handleExitCheckout("pay-later")}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-53px)] max-w-[1200px] flex-col lg:flex-row">
        {/* Payment details — left-aligned under Alpha Freight header */}
        <div className="flex flex-1 flex-col px-6 py-7 lg:py-10">
          <div className="w-full max-w-[460px]">
            <h1 className="text-[26px] font-semibold tracking-tight text-slate-900">Payment details</h1>
            <p className="mt-1.5 text-[14px] text-slate-500">Secure checkout for your posted load.</p>

            {flashMessage && (
              <div
                className={`mt-5 rounded-md px-4 py-2.5 text-[13px] font-medium ${
                  isPaid || flashMessage.includes("successfully")
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                {flashMessage}
              </div>
            )}

            <div className="mt-6">
              <p className={labelClass}>Payment method</p>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex h-11 items-center justify-center gap-2 rounded-md border text-[14px] font-medium transition ${
                    paymentMethod === "card"
                      ? "border-slate-900 bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("paypal")}
                  className={`flex h-11 items-center justify-center rounded-md border px-3 transition ${
                    paymentMethod === "paypal"
                      ? "border-slate-900 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <Image
                    src="/pay pal .png"
                    alt="PayPal"
                    width={88}
                    height={24}
                    className="h-6 w-auto object-contain"
                  />
                </button>
              </div>
            </div>

            {paymentMethod === "card" && isLiveCardCheckoutEnabled() && (
              <>
                <p className="mt-6 text-[13px] leading-6 text-slate-500">
                  You will pay <span className="font-semibold text-slate-800">{formatMoney(amount)}</span> for this
                  load. Payment secures your shipment on the marketplace.
                </p>
                <p className="mt-2 text-[12px] leading-5 text-slate-400">
                  By completing payment, you agree to Alpha Freight&apos;s{" "}
                  <Link href="/terms-of-service" className="text-slate-500 underline hover:text-slate-700">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy-policy" className="text-slate-500 underline hover:text-slate-700">
                    Privacy Policy
                  </Link>
                  .
                </p>
                <PayInstantStripeCheckout
                  supplierId={supplierId}
                  loadId={activeOrder.loadId}
                  loadTitle={activeOrder.title}
                  amount={amount}
                  userEmail={userEmail}
                  cardName={cardName}
                  onCardNameChange={setCardName}
                  country={country}
                  onCountryChange={setCountry}
                  addressLine={addressLine}
                  onAddressLineChange={setAddressLine}
                  postcode={postcode}
                  onPostcodeChange={setPostcode}
                  isPaid={isPaid}
                  inputClass={inputClass}
                  labelClass={labelClass}
                  formatMoney={formatMoney}
                  onFlashMessage={setFlashMessage}
                  onSuccess={handleStripeSuccess}
                />
              </>
            )}

            {paymentMethod === "card" && !isLiveCardCheckoutEnabled() && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className={labelClass}>Name on card</label>
                  <input
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Full name"
                    disabled={isPaid}
                    className={`mt-2 ${inputClass}`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Card details</label>
                  <div className="mt-2 overflow-hidden rounded-md border border-slate-200 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100">
                    <div className="relative flex items-center border-b border-slate-200">
                      <input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="1234 1234 1234 1234"
                        disabled={isPaid}
                        className="w-full px-3.5 py-2.5 text-[14px] outline-none disabled:bg-slate-50"
                      />
                      {cardBrand === "VISA" && (
                        <Image
                          src="/visa.png"
                          alt="Visa"
                          width={56}
                          height={36}
                          quality={100}
                          sizes="28px"
                          className="pointer-events-none absolute right-3 h-4 w-auto object-contain"
                        />
                      )}
                      {cardBrand === "MASTERCARD" && (
                        <Image
                          src="/master card .png"
                          alt="Mastercard"
                          width={56}
                          height={36}
                          quality={100}
                          sizes="28px"
                          className="pointer-events-none absolute right-3 h-4 w-auto object-contain"
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-2">
                      <input
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        placeholder="MM / YY"
                        disabled={isPaid}
                        className="border-r border-slate-200 px-3.5 py-2.5 text-[14px] outline-none disabled:bg-slate-50"
                      />
                      <input
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="CVC"
                        disabled={isPaid}
                        className="px-3.5 py-2.5 text-[14px] outline-none disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                <CountrySelectField value={country} onChange={setCountry} disabled={isPaid} />

                <BillingAddressField
                  addressLine={addressLine}
                  onAddressLineChange={setAddressLine}
                  postcode={postcode}
                  onPostcodeChange={setPostcode}
                  disabled={isPaid}
                  labelClass={labelClass}
                />
              </div>
            )}

            {paymentMethod === "paypal" && (
              <div className="mt-6 rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                <p className="text-[13px] font-medium text-slate-600">
                  PayPal checkout is coming soon. Switch to card to complete this payment.
                </p>
              </div>
            )}

            {paymentMethod !== "card" || !isLiveCardCheckoutEnabled() ? (
              <>
            <p className="mt-6 text-[13px] leading-6 text-slate-500">
              You will pay <span className="font-semibold text-slate-800">{formatMoney(amount)}</span> for this load.
              Payment secures your shipment on the marketplace.
            </p>

            <p className="mt-2 text-[12px] leading-5 text-slate-400">
              By completing payment, you agree to Alpha Freight&apos;s{" "}
              <Link href="/terms-of-service" className="text-slate-500 underline hover:text-slate-700">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="text-slate-500 underline hover:text-slate-700">
                Privacy Policy
              </Link>
              .
            </p>

            <button
              type="button"
              onClick={handlePayNow}
              disabled={isProcessing || isPaid || paymentMethod === "card" && isLiveCardCheckoutEnabled()}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#6d28d9] text-[14px] font-semibold text-white transition hover:bg-[#5b21b6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPaid ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Payment completed
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Pay {formatMoney(amount)}
                </>
              )}
            </button>
              </>
            ) : null}

            <div className="mt-6 flex items-center gap-4 text-[13px] text-slate-400">
              <Link href="/supplier/support" className="inline-flex items-center gap-1.5 hover:text-slate-600">
                <CircleHelp className="h-4 w-4" />
                Help Center
              </Link>
              <span>GBP</span>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <aside className="border-t border-slate-100 bg-[#f6f6f6] px-6 py-7 sm:px-8 lg:w-[440px] lg:shrink-0 lg:border-l lg:border-t-0 lg:px-10 lg:py-10">
          <div className="lg:sticky lg:top-8">
            <h2 className="text-[18px] font-semibold text-slate-900">Order summary</h2>

            <div className="mt-5 flex items-start gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[13px] font-bold text-white">
                {initials || "AF"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-snug text-slate-900">{activeOrder.title}</p>
                <p className="mt-1 text-[13px] text-slate-500">{formatLabel(activeOrder.equipment)}</p>
                <p className="mt-2 text-[15px] font-semibold text-slate-900">{formatMoney(amount)}</p>
                {!isPaid && (
                  <p className="mt-1.5 text-[12px] font-medium text-emerald-600">Payment required to activate</p>
                )}
              </div>
            </div>

            <dl className="mt-5 space-y-3.5 text-[14px]">
              <div className="flex items-start justify-between gap-4">
                <dt className="shrink-0 text-slate-500">Route</dt>
                <dd className="text-right font-medium leading-snug text-slate-800">{routeLabel}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Pickup</dt>
                <dd className="font-medium text-slate-800">{pickupLabel}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[12px] font-medium capitalize text-blue-700">
                    {activeOrder.loadStatus}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="mt-5 space-y-3 border-t border-slate-200/80 pt-5">
              <div className="flex justify-between text-[14px] text-slate-500">
                <span>Subtotal</span>
                <span className="font-medium text-slate-800">{formatMoney(amount)}</span>
              </div>
              <div className="flex justify-between text-[15px] font-semibold text-slate-900">
                <span>Total due today</span>
                <span>{isPaid ? formatMoney(0) : formatMoney(amount)}</span>
              </div>
              {isPaid && activeOrder.paidAt && (
                <p className="text-[12px] text-slate-400">
                  Paid on {new Date(activeOrder.paidAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                </p>
              )}
            </div>

            <div className="mt-8 flex items-center gap-2 text-[12px] text-slate-400">
              <Image src="/logo.png" alt="" width={18} height={18} className="object-contain opacity-70" />
              <span>{isLiveCardCheckoutEnabled() ? "Secured by Stripe via Alpha Freight" : "Secured by Alpha Freight"}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function SupplierPayInstantPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SupplierPayInstantPageContent />
    </Suspense>
  );
}
