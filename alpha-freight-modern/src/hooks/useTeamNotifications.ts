"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  useEmployeeCommissions,
  useEmployeeLeads,
  useEmployeeLeave,
  useEmployeeTasks,
} from "@/hooks/useEmployeeData";
import {
  buildTeamNotifications,
  filterUnreadTeamNotifications,
  markTeamNotificationsSeen,
  type TeamNotification,
} from "@/lib/team-notifications";

export function useTeamNotifications() {
  const { rows: tasks, loading: tasksLoading } = useEmployeeTasks();
  const { rows: leads, loading: leadsLoading } = useEmployeeLeads();
  const { rows: commissions, loading: commissionsLoading } = useEmployeeCommissions();
  const { rows: leaveRequests, loading: leaveLoading } = useEmployeeLeave();
  const [seenVersion, setSeenVersion] = useState(0);

  const loading = tasksLoading || leadsLoading || commissionsLoading || leaveLoading;

  const notifications = useMemo(
    () =>
      buildTeamNotifications({
        tasks,
        leads,
        commissions,
        leaveRequests,
      }),
    [tasks, leads, commissions, leaveRequests]
  );

  const unread = useMemo(() => {
    void seenVersion;
    return filterUnreadTeamNotifications(notifications);
  }, [notifications, seenVersion]);

  const markAllRead = useCallback(() => {
    markTeamNotificationsSeen(notifications.map((n) => n.id));
    setSeenVersion((v) => v + 1);
  }, [notifications]);

  const markRead = useCallback((ids: string[]) => {
    markTeamNotificationsSeen(ids);
    setSeenVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "af_team_notif_seen") setSeenVersion((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return {
    notifications,
    unread,
    unreadCount: unread.length,
    loading,
    markAllRead,
    markRead,
  };
}

export type { TeamNotification };
