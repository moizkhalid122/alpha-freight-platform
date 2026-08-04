import { EmployeePortalLoader } from "@/components/employee/EmployeePortalLoader";

export default function EmployeePanelLoading() {
  return (
    <EmployeePortalLoader
      title="Loading your workspace…"
      subtitle="Fetching tasks, leads, and dashboard data."
    />
  );
}
