import { marketingSeo } from "@/lib/marketing-seo";
import RoleProcessPage from "@/components/marketing/RoleProcessPage";
import { supplierProcessContent } from "@/lib/role-process-content";

export const metadata = marketingSeo.supplierInformation;

export default function SupplierInformationPage() {
  return <RoleProcessPage content={supplierProcessContent} />;
}
