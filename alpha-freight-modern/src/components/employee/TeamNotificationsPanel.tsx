"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CircleDollarSign,
  ClipboardList,
  Loader2,
  Target,
  Umbrella,
} from "lucide-react";

import { useTeamNotifications, type TeamNotification } from "@/hooks/useTeamNotifications";
import { employeeRoute } from "@/lib/employee-path";
import { cn } from "@/lib/utils";

function NotificationIcon({ kind }: { kind: TeamNotification["kind"] }) {
  const className = "h-4 w-4";
  switch (kind) {
    case "lead":
      return <Target className={className} />;
    case "task":
      return <ClipboardList className={className} />;
    case "commission":
      return <CircleDollarSign className={className} />;
    case "leave":
      return <Umbrella className={className} />;
    default:
      return <Bell className={className} />;
  }
}

function toneStyles(tone: TeamNotification["tone"]) {
  switch (tone) {
    case "urgent":
      return "bg-red-50 text-red-600";
    case "success":
      return "bg-emerald-50 text-emerald-600";
    default:
      return "bg-blue-50 text-blue-600";
  }
}

type TeamNotificationsPanelProps = {
  open: boolean;
  onClose: () => void;
};

function TeamNotificationsPanel({ open, onClose }: TeamNotificationsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, loading, markAllRead, markRead } = useTeamNotifications();

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,360px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Notifications</p>
          <p className="text-xs text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {notifications.length > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Mark all read
          </button>
        ) : null}
      </div>

      <div className="max-h-[min(60vh,420px)] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">No notifications yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Follow-ups, tasks, and commission updates will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => {
                    markRead([item.id]);
                    onClose();
                  }}
                  className="flex gap-3 px-4 py-3 transition hover:bg-slate-50"
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      toneStyles(item.tone)
                    )}
                  >
                    <NotificationIcon kind={item.kind} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{item.message}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3">
        <Link
          href={employeeRoute("/settings")}
          onClick={onClose}
          className="text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          Notification preferences →
        </Link>
      </div>
    </div>
  );
}

export default function TeamNotificationBell() {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useTeamNotifications();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-xl border border-gray-100 bg-white p-2.5 text-gray-600 transition hover:bg-gray-50"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        ) : null}
      </button>
      <TeamNotificationsPanel open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
