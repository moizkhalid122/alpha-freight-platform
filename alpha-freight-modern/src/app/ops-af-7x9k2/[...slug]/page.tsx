import AdminSectionPage from "@/components/admin/AdminSectionPage";

function titleFromSlug(slug: string[]) {
  return slug
    .join(" / ")
    .split(/[-_/]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" · ");
}

export default async function AdminDynamicPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const key = slug.join("/");

  return (
    <AdminSectionPage
      eyebrow="Admin Section"
      title={titleFromSlug(slug)}
      description="This route is reserved for a future release. Placeholder metrics have been removed — use the sidebar for pages with live Supabase data."
      metrics={[]}
      highlights={[
        "Carriers, suppliers, loads, employees, referrals, and feedback use live database data.",
        "This page will be wired when the workflow is ready.",
      ]}
      relatedLinks={[
        { label: "Overview", href: "/ops-af-7x9k2" },
        { label: "Carriers", href: "/ops-af-7x9k2/carriers" },
        { label: "Suppliers", href: "/ops-af-7x9k2/suppliers" },
        { label: "Loads", href: "/ops-af-7x9k2/loads" },
        { label: "Quick stats", href: "/ops-af-7x9k2/quick-stats" },
      ]}
    />
  );
}
