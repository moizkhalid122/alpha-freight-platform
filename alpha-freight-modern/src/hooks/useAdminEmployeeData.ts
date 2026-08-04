"use client";

import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/admin-data-client";
import type { EmployeeProfile } from "@/lib/employee-types";

export type AdminTeamStats = {
  leads: Array<{ employee_id: string; status: string; value_gbp: number | null }>;
  calls: Array<{ employee_id: string; duration_minutes: number | null; called_at: string }>;
  commissions: Array<{ employee_id: string; amount_gbp: number; status: string }>;
  tasks: Array<{ employee_id: string; status: string }>;
};

export function useAdminEmployees() {
  const query = useQuery({
    queryKey: ["admin", "employees"],
    queryFn: () => adminFetch<{ employees: EmployeeProfile[] }>("/api/admin/employees"),
    staleTime: 60_000,
  });

  return {
    employees: query.data?.employees ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    refetch: query.refetch,
  };
}

export function useAdminTable<T>(table: string, orderCol = "created_at") {
  const query = useQuery({
    queryKey: ["admin", "employee-rows", table, orderCol],
    queryFn: () =>
      adminFetch<{ rows: T[] }>(
        `/api/admin/employee-rows?table=${encodeURIComponent(table)}&order=${encodeURIComponent(orderCol)}`
      ),
    staleTime: 60_000,
  });

  return {
    rows: query.data?.rows ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    refetch: query.refetch,
  };
}

export function useAdminTeamStats() {
  const query = useQuery({
    queryKey: ["admin", "employee-stats"],
    queryFn: () => adminFetch<AdminTeamStats>("/api/admin/employee-stats"),
    staleTime: 60_000,
  });

  return {
    stats: {
      leads: query.data?.leads ?? [],
      calls: query.data?.calls ?? [],
      commissions: query.data?.commissions ?? [],
      tasks: query.data?.tasks ?? [],
    },
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    refetch: query.refetch,
  };
}

export type AdminEmployeeOnboardingRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  employee_code: string | null;
  job_title: string | null;
  department: string | null;
  phone: string | null;
  address: string | null;
  profile_photo_url: string | null;
  cv_url: string | null;
  id_document_url: string | null;
  onboarding_completed: boolean;
  accepted_nda_at: string | null;
  accepted_employment_at: string | null;
  accepted_commission_at: string | null;
  updated_at: string | null;
};

export function useAdminEmployeeOnboarding() {
  const query = useQuery({
    queryKey: ["admin", "employee-onboarding"],
    queryFn: () =>
      adminFetch<{ onboarding: AdminEmployeeOnboardingRow[] }>("/api/admin/employee-onboarding"),
    staleTime: 60_000,
  });

  return {
    onboarding: query.data?.onboarding ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    refetch: query.refetch,
  };
}
