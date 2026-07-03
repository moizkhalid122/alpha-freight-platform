"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Copy,
  Gift,
  Loader2,
  Mail,
  Share2,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import {
  buildCarrierReferralSignupLink,
  CARRIER_REFERRAL_BASE_REWARD,
  CARRIER_REFERRAL_MILESTONE_LOADS,
  fetchCarrierReferralDashboard,
  type CarrierReferralRow,
  type CarrierReferralStats,
} from "@/lib/carrier-referrals";

type TierKey = "member" | "silver" | "gold" | "platinum";

const CARD =
  "rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-md";

const TIERS: Record<
  TierKey,
  { label: string; minReferrals: number; reward: string; iconBg: string; iconColor: string }
> = {
  member: {
    label: "Member",
    minReferrals: 0,
    reward: `£${CARRIER_REFERRAL_BASE_REWARD} per qualified referral`,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  silver: {
    label: "Silver",
    minReferrals: 3,
    reward: "£65 per referral + priority support",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-700",
  },
  gold: {
    label: "Gold",
    minReferrals: 8,
    reward: "£80 per referral + reduced platform fees",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  platinum: {
    label: "Platinum",
    minReferrals: 15,
    reward: "£100 per referral + dedicated account manager",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
};

function formatMoney(value: number) {
  return `£${value.toLocaleString("en-GB")}`;
}

function resolveTier(totalReferrals: number): TierKey {
  if (totalReferrals >= TIERS.platinum.minReferrals) return "platinum";
  if (totalReferrals >= TIERS.gold.minReferrals) return "gold";
  if (totalReferrals >= TIERS.silver.minReferrals) return "silver";
  return "member";
}

function nextTierProgress(totalReferrals: number) {
  const current = resolveTier(totalReferrals);
  const order: TierKey[] = ["member", "silver", "gold", "platinum"];
  const idx = order.indexOf(current);
  const next = order[idx + 1];
  if (!next) {
    return { current, next: null as TierKey | null, remaining: 0, progress: 100 };
  }
  const currentMin = TIERS[current].minReferrals;
  const nextMin = TIERS[next].minReferrals;
  const span = nextMin - currentMin;
  const done = totalReferrals - currentMin;
  return {
    current,
    next,
    remaining: nextMin - totalReferrals,
    progress: Math.min(100, Math.round((done / span) * 100)),
  };
}

export default function CarrierReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [carrierName, setCarrierName] = useState("Partner");
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState<CarrierReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    pendingReferrals: 0,
    totalEarned: 0,
    pendingRewards: 0,
  });
  const [referralList, setReferralList] = useState<CarrierReferralRow[]>([]);

  const referralLink = useMemo(() => {
    if (!referralCode) return "";
    return buildCarrierReferralSignupLink(referralCode);
  }, [referralCode]);

  const tierProgress = useMemo(() => nextTierProgress(stats.totalReferrals), [stats.totalReferrals]);

  useEffect(() => {
    const loadReferralData = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const dashboard = await fetchCarrierReferralDashboard(user.id);
          setReferralCode(dashboard.referralCode);
          setCarrierName(dashboard.carrierName);
          setStats(dashboard.stats);
          setReferralList(dashboard.referrals);
        }
      } catch (error) {
        console.error("[carrier-referrals]", error);
      } finally {
        setLoading(false);
      }
    };

    void loadReferralData();
  }, []);

  const copyCode = async () => {
    if (!referralCode) return;
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareInvite = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      await navigator.share({
        title: "Join Alpha Freight",
        text: `${carrierName} invited you to join Alpha Freight as a carrier.`,
        url: referralLink,
      });
      return;
    }
    await copyLink();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <div className="rounded-md bg-blue-600 p-1.5">
                <Gift className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Referral program
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Invite & earn</h1>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Refer fellow carriers and earn credits when they complete {CARRIER_REFERRAL_MILESTONE_LOADS} loads,{" "}
              {carrierName}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void shareInvite()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
          >
            Invite now
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total referrals", value: String(stats.totalReferrals), sub: `${stats.pendingReferrals} pending` },
            { label: "Active carriers", value: String(stats.activeReferrals), sub: "Currently hauling" },
            { label: "Total earned", value: formatMoney(stats.totalEarned), sub: "Lifetime credits" },
            { label: "Pending rewards", value: formatMoney(stats.pendingRewards), sub: "After milestone" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`${CARD} px-4 py-3`}
            >
              <p className="text-[11px] text-slate-500">{stat.label}</p>
              <p className="mt-0.5 text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{stat.sub}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`relative overflow-hidden ${CARD}`}
        >
          <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-blue-500 to-indigo-500" />
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-50/80 blur-2xl" />

          <div className="relative p-5 pl-6 sm:p-6 sm:pl-7">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Your invitation</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
              Share Alpha Freight, get {formatMoney(CARRIER_REFERRAL_BASE_REWARD)} credit
            </h2>
            <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-slate-500">
              When a referred carrier completes their first {CARRIER_REFERRAL_MILESTONE_LOADS} loads,{" "}
              {formatMoney(CARRIER_REFERRAL_BASE_REWARD)} is added to your wallet.
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Referral code</p>
                    <p className="mt-0.5 truncate font-mono text-[15px] font-semibold tracking-wider text-slate-900">
                      {referralCode || "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyCode()}
                    className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                    aria-label="Copy referral code"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void shareInvite()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-slate-800"
                >
                  Share invite
                  <Share2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  <p className="truncate text-[12px] text-slate-500">{referralLink}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  {copiedLink ? "Copied" : "Copy link"}
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={`${CARD} p-5 sm:p-6`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Your tier</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{TIERS[tierProgress.current].label}</p>
            </div>
            <div className={`rounded-lg p-2 ${TIERS[tierProgress.current].iconBg}`}>
              <Sparkles className={`h-4 w-4 ${TIERS[tierProgress.current].iconColor}`} />
            </div>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{TIERS[tierProgress.current].reward}</p>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Progress to next tier</span>
              <span className="font-medium text-slate-700">
                {tierProgress.next
                  ? `${tierProgress.remaining} more for ${TIERS[tierProgress.next].label}`
                  : "Max tier reached"}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tierProgress.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {(["silver", "gold", "platinum"] as TierKey[]).map((key) => {
              const unlocked = stats.totalReferrals >= TIERS[key].minReferrals;
              return (
                <div
                  key={key}
                  className={`rounded-lg border px-2.5 py-2 text-center ${
                    unlocked ? "border-blue-100 bg-blue-50/50" : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  <p className="text-[10px] font-semibold text-slate-700">{TIERS[key].label}</p>
                  <p className="text-[10px] text-slate-400">{TIERS[key].minReferrals}+</p>
                </div>
              );
            })}
          </div>
        </motion.section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className={`${CARD} p-5 sm:p-6`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Network</p>
              <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">Referral history</h3>
            </div>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {referralList.length} total
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {referralList.length === 0 ? (
              <div className="py-10 text-center">
                <Truck className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <p className="text-[13px] font-semibold text-slate-900">No referrals yet</p>
                <p className="mx-auto mt-1 max-w-sm text-[12px] text-slate-500">
                  Share your link and referred carriers will appear here once they sign up.
                </p>
              </div>
            ) : (
              referralList.map((referral, index) => (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 + index * 0.03 }}
                  className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[12px] font-bold text-slate-600">
                    {referral.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-[13px] font-semibold text-slate-900">{referral.name}</p>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          referral.status === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : referral.status === "Pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {referral.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Joined {referral.date} · {referral.loads} loads
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-slate-900">
                      {referral.earned > 0 ? formatMoney(referral.earned) : "—"}
                    </p>
                    <p className="text-[10px] text-slate-400">Earned</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.section>

        <div className="space-y-4">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`${CARD} p-5 sm:p-6`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">How it works</p>
            <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">Three simple steps</h3>

            <div className="mt-4 space-y-3.5">
              {[
                { step: "1", title: "Share your code", desc: "Send your referral code or link to another carrier." },
                { step: "2", title: "They join Alpha", desc: "Your referral completes onboarding and starts hauling loads." },
                {
                  step: "3",
                  title: "You get rewarded",
                  desc: `Credits are released after their ${CARRIER_REFERRAL_MILESTONE_LOADS}-load milestone.`,
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/40 px-3.5 py-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className={`${CARD} p-5 sm:p-6`}
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-md bg-blue-50 p-1.5">
                <Users className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Member perks</p>
            </div>
            <ul className="space-y-2.5">
              {[
                "Instant wallet credits on milestone completion",
                "Higher rewards as you unlock new tiers",
                "Priority support for Gold & Platinum members",
                "Better load visibility for your referred fleet partners",
              ].map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-[12px] text-slate-600">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {benefit}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void shareInvite()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Send invitation
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </motion.section>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${CARD} p-5 sm:p-6`}
      >
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Reward tiers</p>
            <h3 className="mt-0.5 text-[15px] font-bold text-slate-900">Unlock higher rewards</h3>
          </div>
          <p className="text-[12px] text-slate-500">More referrals = better per-referral credits</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.entries(TIERS) as [TierKey, (typeof TIERS)[TierKey]][]).map(([key, tier]) => {
            const unlocked = stats.totalReferrals >= tier.minReferrals;
            const isCurrent = tierProgress.current === key;
            return (
              <div
                key={key}
                className={`relative rounded-xl border p-4 transition ${
                  isCurrent
                    ? "border-blue-200 bg-blue-50/30 shadow-sm ring-1 ring-blue-100"
                    : unlocked
                      ? "border-slate-200 bg-white"
                      : "border-slate-100 bg-slate-50/40"
                }`}
              >
                {isCurrent ? (
                  <span className="absolute right-3 top-3 rounded-md bg-blue-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    Current
                  </span>
                ) : null}
                <div className={`mb-3 inline-flex rounded-lg p-2 ${tier.iconBg}`}>
                  <TrendingUp className={`h-4 w-4 ${tier.iconColor}`} />
                </div>
                <p className="text-[14px] font-bold text-slate-900">{tier.label}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{tier.minReferrals}+ referrals</p>
                <p className="mt-2.5 text-[12px] leading-relaxed text-slate-600">{tier.reward}</p>
                <p className="mt-3 flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  {unlocked ? "Unlocked" : "Locked"}
                  <ChevronRight className="h-3 w-3" />
                </p>
              </div>
            );
          })}
        </div>
      </motion.section>

      <AnimatePresence>
        {(copied || copiedLink) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[12px] font-semibold text-emerald-700 shadow-lg"
          >
            {copied ? "Referral code copied" : "Invitation link copied"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
