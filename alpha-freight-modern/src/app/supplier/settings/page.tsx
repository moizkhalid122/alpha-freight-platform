"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  Settings,
  Bell,
  Shield,
  Globe,
  ChevronRight,
  Loader2,
  LogOut,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const CARD =
  "rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-md";

type NotificationPrefs = {
  emailUpdates: boolean;
  bidAlerts: boolean;
  weeklyReports: boolean;
};

const SETTINGS_KEY = "supplier-notification-prefs";

const DEFAULT_PREFS: NotificationPrefs = {
  emailUpdates: true,
  bidAlerts: true,
  weeklyReports: false,
};

function readNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function writeNotificationPrefs(prefs: NotificationPrefs) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(prefs));
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-slate-900" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

export default function SupplierSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ next: "", confirm: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) setEmail(user.email);
      } finally {
        setLoading(false);
      }
    };
    load();
    setPrefs(readNotificationPrefs());
  }, []);

  const updatePref = (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    writeNotificationPrefs(next);
    setPrefsSaved(true);
    window.setTimeout(() => setPrefsSaved(false), 2000);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.next.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    try {
      setPasswordSaving(true);
      const { error } = await supabase.auth.updateUser({ password: passwordForm.next });
      if (error) throw error;
      setPasswordForm({ next: "", confirm: "" });
      setPasswordMessage({ type: "success", text: "Password updated successfully." });
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not update password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Sign out failed:", error);
      setSigningOut(false);
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
    <div className="mx-auto max-w-[1280px] space-y-6 p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-1.5 flex items-center gap-2">
          <div className="rounded-md bg-blue-600 p-1.5">
            <Settings className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Account</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-0.5 text-[13px] text-slate-500">Security, notifications, and regional preferences.</p>
      </motion.div>

      {prefsSaved ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Preferences saved
        </div>
      ) : null}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className={`${CARD} overflow-hidden`}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-slate-900">Profile & account</h2>
            <p className="text-[11px] text-slate-500">Company details and public profile</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Email address</p>
              <p className="text-[12px] text-slate-500">{email || "Not available"}</p>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Managed via login</span>
          </div>
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-[13px] font-semibold text-slate-900">Company & profile</p>
              <p className="text-[12px] text-slate-500">Name, banner, phone, and business details</p>
            </div>
            <Link
              href="/supplier/profile"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Edit profile
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className={`${CARD} overflow-hidden`}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-slate-900">Security</h2>
            <p className="text-[11px] text-slate-500">Password and account protection</p>
          </div>
        </div>
        <form onSubmit={handlePasswordUpdate} className="space-y-4 px-5 py-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-[12px] font-semibold text-slate-700">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.next}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, next: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-[12px] font-semibold text-slate-700">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Repeat new password"
              />
            </div>
          </div>
          {passwordMessage ? (
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-semibold ${
                passwordMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {passwordMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {passwordMessage.text}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={passwordSaving || !passwordForm.next}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {passwordSaving ? "Updating…" : "Update password"}
          </button>
        </form>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className={`${CARD} overflow-hidden`}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-slate-900">Notifications</h2>
            <p className="text-[11px] text-slate-500">Choose what you hear about</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            {
              key: "emailUpdates" as const,
              label: "Shipment updates",
              desc: "Email when load status changes",
            },
            {
              key: "bidAlerts" as const,
              label: "New bid alerts",
              desc: "Notify when carriers submit offers",
            },
            {
              key: "weeklyReports" as const,
              label: "Weekly summary",
              desc: "Spend and activity digest every Monday",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
            >
              <div>
                <p className="text-[13px] font-semibold text-slate-900">{item.label}</p>
                <p className="text-[12px] text-slate-500">{item.desc}</p>
              </div>
              <Toggle
                label={item.label}
                checked={prefs[item.key]}
                onChange={(value) => updatePref(item.key, value)}
              />
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${CARD} overflow-hidden`}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-slate-900">Regional</h2>
            <p className="text-[11px] text-slate-500">Fixed for UK marketplace</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { label: "Language", value: "English (United Kingdom)" },
            { label: "Currency", value: "GBP (£)" },
            { label: "Timezone", value: "Europe/London (GMT/BST)" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-4 sm:px-6">
              <div>
                <p className="text-[13px] font-semibold text-slate-900">{row.label}</p>
                <p className="text-[12px] text-slate-500">{row.value}</p>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Default
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className={`${CARD} p-5 sm:p-6`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold text-slate-900">Sign out</p>
            <p className="text-[12px] text-slate-500">End your session on this device</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
          >
            {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Sign out
          </button>
        </div>
      </motion.section>
    </div>
  );
}
