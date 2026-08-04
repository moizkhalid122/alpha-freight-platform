"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PaymentSuccessLottie from "@/components/payments/PaymentSuccessLottie";
import { markSupplierPaymentPaid } from "@/lib/supplier-payments";

function PayInstantSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirming your payment...");

  useEffect(() => {
    const verify = async () => {
      if (!sessionId) {
        setStatus("error");
        setMessage("Missing Stripe session.");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setStatus("error");
        setMessage("Please sign in again to verify payment.");
        return;
      }

      const response = await fetch("/api/stripe/verify-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error || "Payment verification failed.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && payload.loadId) {
        await markSupplierPaymentPaid({
          supplierId: user.id,
          loadId: String(payload.loadId),
          stripeCheckoutSessionId: sessionId,
        });
      }

      setStatus("success");
      setMessage("Payment completed successfully.");
    };

    void verify();
  }, [sessionId]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center p-8 text-center">
      {status === "loading" ? (
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-600" />
      ) : status === "success" ? (
        <PaymentSuccessLottie className="mb-2 h-44 w-44" />
      ) : (
        <XCircle className="mb-4 h-12 w-12 text-rose-600" />
      )}

      <h1 className="text-2xl font-black tracking-tight text-slate-900">
        {status === "loading" ? "Processing Payment" : status === "success" ? "Payment Confirmed" : "Payment Issue"}
      </h1>
      <p className="mt-3 text-sm font-medium text-slate-500">{message}</p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/supplier/my-posts"
          className="rounded-xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white"
        >
          My Posts
        </Link>
        <Link
          href="/supplier/dashboard"
          className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-700"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function PayInstantSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></div>}>
      <PayInstantSuccessContent />
    </Suspense>
  );
}
