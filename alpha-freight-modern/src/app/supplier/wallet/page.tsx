"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { calculateSupplierTotal } from "@/lib/load-commission";
import { useMarketCurrency } from "@/hooks/useMarketCurrency";
import {
  getSupplierPaymentOrdersForUser,
  migrateLocalPaymentsToSupabase,
  type SupplierPaymentRecord,
} from "@/lib/supplier-payments";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Loader2,
  CreditCard,
} from "lucide-react";

type LoadRow = {
  id: string;
  price: number | string | null;
  status: string | null;
  payment_state?: string | null;
  created_at: string | null;
};

export default function SupplierWallet() {
  const market = useMarketCurrency("supplier");
  const [loading, setLoading] = useState(true);
  const [totalSpend, setTotalSpend] = useState(0);
  const [monthlySpend, setMonthlySpend] = useState(0);
  const [pendingInvoices, setPendingInvoices] = useState(0);
  const [paymentOrders, setPaymentOrders] = useState<SupplierPaymentRecord[]>([]);

  useEffect(() => {
    async function loadWallet() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setTotalSpend(0);
          setMonthlySpend(0);
          setPendingInvoices(0);
          setPaymentOrders([]);
          return;
        }

        await migrateLocalPaymentsToSupabase(user.id);

        const [{ data: loads }, orders] = await Promise.all([
          supabase.from("loads").select("id, price, status, payment_state, created_at").eq("supplier_id", user.id),
          getSupplierPaymentOrdersForUser(user.id),
        ]);

        const typedLoads = (loads ?? []) as LoadRow[];
        const spend = typedLoads.reduce(
          (sum, load) => sum + calculateSupplierTotal(Number(load.price) || 0, market.currency).totalPayable,
          0
        );

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthSpend = typedLoads
          .filter((load) => {
            const created = load.created_at ? new Date(load.created_at) : null;
            return created && created >= monthStart;
          })
          .reduce(
            (sum, load) =>
              sum + calculateSupplierTotal(Number(load.price) || 0, market.currency).totalPayable,
            0
          );

        const pending = orders
          .filter((order) => order.paymentState === "pending")
          .reduce((sum, order) => sum + (Number(order.amount) || 0), 0);

        setTotalSpend(spend);
        setMonthlySpend(monthSpend);
        setPendingInvoices(pending);
        setPaymentOrders(orders.slice(0, 5));
      } catch (error) {
        console.error("Error loading supplier wallet:", error);
      } finally {
        setLoading(false);
      }
    }

    void loadWallet();
  }, [market.currency]);

  const currencyLabel = useMemo(() => `${market.currency} (${market.market.symbol})`, [market]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-[1600px] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-10 p-4 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-black uppercase tracking-tighter text-slate-900">Financial Overview</h1>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              Billing & payments · {currencyLabel}
            </p>
          </div>
        </div>
        <Link
          href="/supplier/pay-later"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <CreditCard className="h-4 w-4" />
          Manage payments
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white shadow-xl md:col-span-2"
        >
          <div className="absolute right-0 top-0 p-8 opacity-10">
            <Wallet size={160} />
          </div>
          <div className="relative z-10">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-100">Lifetime freight spend</p>
            <h2 className="mb-8 text-5xl font-black tracking-tighter">{market.formatMoney(totalSpend)}</h2>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/supplier/post-load"
                className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
              >
                Post new load
              </Link>
              <Link
                href="/supplier/earnings"
                className="flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/30 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500/40"
              >
                <History className="h-4 w-4" />
                View analytics
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-black text-green-600">THIS MONTH</span>
            </div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly spending</p>
            <p className="text-2xl font-black text-slate-900">{market.formatMoney(monthlySpend)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ArrowDownLeft className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-600">PENDING</span>
            </div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending invoices</p>
            <p className="text-2xl font-black text-slate-900">{market.formatMoney(pendingInvoices)}</p>
          </motion.div>
        </div>
      </div>

      {paymentOrders.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">Recent payment activity</h3>
          <div className="divide-y divide-slate-100">
            {paymentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{order.title || "Freight payment"}</p>
                  <p className="text-[11px] capitalize text-slate-500">
                    {order.paymentRoute.replace("-", " ")} · {order.paymentState}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900">{market.formatMoney(Number(order.amount) || 0)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
