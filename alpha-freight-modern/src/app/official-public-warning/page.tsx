import OfficialPublicWarningDocument from "@/components/marketing/OfficialPublicWarningDocument";

export default function OfficialPublicWarningPage() {
  return (
    <main
      id="official-public-warning"
      className="min-h-[100svh] w-full bg-[#0a0a0a] px-4 py-8 text-white selection:bg-red-600 selection:text-white sm:px-6 sm:py-10 md:px-8 md:py-12"
    >
      <div className="mx-auto w-full max-w-5xl">
        <OfficialPublicWarningDocument />
      </div>
    </main>
  );
}