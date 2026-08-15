import { marketingSeo } from "@/lib/marketing-seo";
import RoleProcessPage from "@/components/marketing/RoleProcessPage";
import { carrierProcessContent } from "@/lib/role-process-content";

export const metadata = marketingSeo.carrierInformation;

export default function CarrierInformationPage() {
  return <RoleProcessPage content={carrierProcessContent} />;
}
