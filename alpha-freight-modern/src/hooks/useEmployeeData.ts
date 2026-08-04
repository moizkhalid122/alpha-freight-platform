"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  EmployeeCall,
  EmployeeCommission,
  EmployeeDocument,
  EmployeeLead,
  EmployeeLeaveRequest,
  EmployeeTask,
  EmployeeTraining,
} from "@/lib/employee-types";

export function useEmployeeUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
  }, []);

  return userId;
}

async function fetchOwnRows<T extends { employee_id?: string }>(
  table: string,
  userId: string,
  order: { column: string; ascending?: boolean } = { column: "created_at", ascending: false }
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("employee_id", userId)
    .order(order.column, { ascending: order.ascending ?? false });

  if (error) {
    console.error(`Failed to load ${table}:`, error.message);
    return [];
  }

  return (data ?? []) as T[];
}

export function useEmployeeTasks() {
  const userId = useEmployeeUserId();
  const [rows, setRows] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchOwnRows<EmployeeTask>("employee_tasks", userId);
    setRows(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { rows, loading, userId, refetch, setRows };
}

export function useEmployeeLeads() {
  const userId = useEmployeeUserId();
  const [rows, setRows] = useState<EmployeeLead[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchOwnRows<EmployeeLead>("employee_leads", userId);
    setRows(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { rows, loading, userId, refetch, setRows };
}

export function useEmployeeCalls() {
  const userId = useEmployeeUserId();
  const [rows, setRows] = useState<EmployeeCall[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchOwnRows<EmployeeCall>("employee_calls", userId, {
      column: "called_at",
      ascending: false,
    });
    setRows(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { rows, loading, userId, refetch, setRows };
}

export function useEmployeeCommissions() {
  const userId = useEmployeeUserId();
  const [rows, setRows] = useState<EmployeeCommission[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchOwnRows<EmployeeCommission>("employee_commissions", userId);
    setRows(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { rows, loading, userId, refetch, setRows };
}

export function useEmployeeDocuments() {
  const userId = useEmployeeUserId();
  const [rows, setRows] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("employee_documents")
      .select("*")
      .or(`employee_id.eq.${userId},employee_id.is.null`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load employee_documents:", error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as EmployeeDocument[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { rows, loading, userId, refetch, setRows };
}

export function useEmployeeTraining() {
  const userId = useEmployeeUserId();
  const [rows, setRows] = useState<EmployeeTraining[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchOwnRows<EmployeeTraining>("employee_training", userId);
    setRows(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { rows, loading, userId, refetch };
}

export function useEmployeeLeave() {
  const userId = useEmployeeUserId();
  const [rows, setRows] = useState<EmployeeLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchOwnRows<EmployeeLeaveRequest>("employee_leave_requests", userId);
    setRows(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { rows, loading, userId, refetch };
}

export function useEmployeeProfile() {
  const userId = useEmployeeUserId();
  const [profile, setProfile] = useState<{
    full_name: string | null;
    email: string | null;
    department: string | null;
    job_title: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    Promise.all([
      supabase.auth.getUser(),
      supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
      supabase.from("employee_profiles").select("department, job_title").eq("id", userId).maybeSingle(),
    ]).then(([auth, p, e]) => {
      const user = auth.data.user;
      const meta = user?.user_metadata ?? {};
      setProfile({
        full_name:
          p.data?.full_name ??
          (typeof meta.full_name === "string" ? meta.full_name : null) ??
          null,
        email: user?.email ?? null,
        department: e.data?.department ?? null,
        job_title: e.data?.job_title ?? (typeof meta.position === "string" ? meta.position : "Team Member"),
      });
      setLoading(false);
    });
  }, [userId]);

  return { profile, loading, userId };
}
