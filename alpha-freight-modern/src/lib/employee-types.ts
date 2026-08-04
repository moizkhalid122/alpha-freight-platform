export type EmployeeStatus = "active" | "on_leave" | "inactive";

export type EmployeeProfile = {
  id: string;
  employee_code: string | null;
  department: string | null;
  job_title: string | null;
  status: EmployeeStatus;
  hire_date: string | null;
  commission_rate: number;
  phone: string | null;
  full_name?: string | null;
  email?: string | null;
};

export type EmployeeTask = {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_at: string;
  task_source?: "daily" | "admin" | "personal";
  assigned_by?: string | null;
  assigned_by_name?: string | null;
  target_count?: number | null;
};

export type LeadSource =
  | "cold_call"
  | "website"
  | "referral"
  | "linkedin"
  | "admin_assigned"
  | "other";

export type LeadActivity = {
  id: string;
  lead_id: string;
  activity_type: "call" | "email" | "note" | "followup" | "status" | "won" | "import";
  summary: string;
  created_at: string;
};

export type EmployeeLead = {
  id: string;
  employee_id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  lead_type?: "carrier" | "supplier" | null;
  status:
    | "new"
    | "contacted"
    | "interested"
    | "meeting_booked"
    | "negotiation"
    | "won"
    | "lost"
    | "qualified";
  value_gbp: number | null;
  notes: string | null;
  next_follow_up?: string | null;
  lead_source?: LeadSource | null;
  region?: string | null;
  linkedin_url?: string | null;
  last_activity_at?: string | null;
  assigned_by?: string | null;
  assigned_by_name?: string | null;
  created_at: string;
};

export type EmployeeCall = {
  id: string;
  employee_id: string;
  lead_id: string | null;
  direction: "inbound" | "outbound";
  duration_minutes: number | null;
  outcome: string | null;
  notes: string | null;
  called_at: string;
  company_name?: string | null;
  contact_phone?: string | null;
  call_type?: "carrier" | "supplier" | "general" | "outbound_sales" | null;
};

export type EmployeeCommission = {
  id: string;
  employee_id: string;
  amount_gbp: number;
  status: "pending" | "approved" | "paid";
  period_month: string | null;
  notes: string | null;
  created_at: string;
  lead_id?: string | null;
  deal_value_gbp?: number | null;
  company_name?: string | null;
};

export type DocumentCategory =
  | "policy"
  | "contract"
  | "training"
  | "sales"
  | "compliance"
  | "hr"
  | "personal"
  | "other";

export type EmployeeDocument = {
  id: string;
  employee_id: string | null;
  title: string;
  category: string;
  file_url: string | null;
  created_at: string;
  description?: string | null;
  file_name?: string | null;
  file_size_kb?: number | null;
  is_required?: boolean;
};

export type EmployeeTraining = {
  id: string;
  employee_id: string;
  module_title: string;
  status: "not_started" | "in_progress" | "completed";
  progress_pct: number;
  due_date: string | null;
  completed_at: string | null;
};

export type EmployeeLeaveRequest = {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};
