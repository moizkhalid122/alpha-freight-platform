"use client";

import { useEffect, useState } from "react";
import { Bell, X, ChevronRight } from "lucide-react";
import type { ProactiveAlert } from "@/lib/copilot/notifications";
import { supabase } from "@/lib/supabase";

interface ProactiveAlertsBarProps {
  assistantType: "carrier" | "supplier";
  onAction?: (action: string) => void;
}

export default function ProactiveAlertsBar({ assistantType, onAction }: ProactiveAlertsBarProps) {
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch(`/api/chat/notifications?assistantType=${assistantType}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal,
        });
        const data = await res.json();
        setAlerts(data.alerts || []);
      } catch {
        // Non-blocking — alerts load in background
      } finally {
        clearTimeout(timeoutId);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [assistantType]);

  const active = alerts.filter((a) => !dismissed.has(a.id));
  if (!visible || !active.length) return null;

  const top = active[0];

  return (
    <div className="mx-4 mb-3 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-900">{top.title}</p>
        <p className="mt-0.5 text-xs text-amber-800">{top.message}</p>
        {top.action && onAction && (
          <button
            type="button"
            onClick={() => onAction(top.action!)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900"
          >
            Ask AI <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => { setDismissed((s) => new Set(s).add(top.id)); if (active.length <= 1) setVisible(false); }}
        className="shrink-0 rounded p-1 text-amber-600 hover:bg-amber-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
