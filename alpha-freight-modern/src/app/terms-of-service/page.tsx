"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const sections = [
  {
    id: "agreement",
    title: "1. Agreement to Terms",
    content: (
      <p>
        By accessing or using Alpha Freight Solutions Limited, you agree to these Terms of Service
        and our{" "}
        <Link href="/privacy-policy" className="text-violet-700 hover:underline">
          Privacy Policy
        </Link>
        . If you do not agree, do not use the platform.
      </p>
    ),
  },
  {
    id: "platform-overview",
    title: "2. Platform Overview",
    content: (
      <div className="space-y-4">
        <p>
          Alpha Freight Solutions Limited is a freight brokerage platform that connects suppliers
          (shippers) with carriers (trucking companies and drivers). We provide tools for load
          posting, matching, communication, and transaction management.
        </p>
        <p>
          Alpha Freight Solutions Limited does not act as a carrier, does not own or operate
          vehicles, and does not take possession of cargo, unless expressly agreed in writing.
        </p>
      </div>
    ),
  },
  {
    id: "eligibility",
    title: "3. Eligibility and Accounts",
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900">3.1 Registration</h3>
          <p className="mt-3">
            You must provide accurate and complete information and keep your account details up to
            date. You are responsible for all activity under your account.
          </p>
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">3.2 Account Types</h3>
          <ul className="mt-3 space-y-2">
            <li>
              <span className="font-semibold text-slate-900">Supplier Accounts:</span> Businesses
              posting freight loads
            </li>
            <li>
              <span className="font-semibold text-slate-900">Carrier Accounts:</span> Carriers, fleet
              owners, and drivers
            </li>
            <li>
              <span className="font-semibold text-slate-900">Internal Accounts:</span> Alpha Freight
              Solutions Limited staff and management
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "user-responsibilities",
    title: "4. User Responsibilities",
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900">4.1 Suppliers</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Provide accurate load details, pickup and delivery information</li>
            <li>Ensure cargo is lawful, safe, and properly packaged</li>
            <li>Pay carriers on time according to the agreed terms</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">4.2 Carriers</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Maintain required licenses, permits, and insurance</li>
            <li>Provide accurate vehicle and driver information</li>
            <li>Transport cargo safely and on schedule</li>
            <li>Comply with all transportation, safety, and customs rules</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "fees-and-payments",
    title: "5. Fees and Payments",
    content: (
      <div className="space-y-4">
        <p>
          We may charge brokerage or platform fees. Fees, commissions, and payment timelines are
          shown during booking and may vary by load type, service level, or region.
        </p>
        <p>
          Payments may be processed by third-party providers. By using the platform, you agree to the
          terms of those providers where applicable.
        </p>
      </div>
    ),
  },
  {
    id: "prohibited-use",
    title: "6. Prohibited Use",
    content: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Posting false, misleading, or unlawful content</li>
        <li>Attempting to bypass the platform or its fees</li>
        <li>Engaging in fraud, abuse, or harassment</li>
        <li>Interfering with platform security or availability</li>
        <li>Uploading malware or harmful content</li>
      </ul>
    ),
  },
  {
    id: "insurance-and-compliance",
    title: "7. Insurance and Compliance",
    content: (
      <div className="space-y-4">
        <p>
          Carriers must maintain adequate insurance for their operations and cargo. Suppliers must
          ensure loads comply with legal and regulatory requirements. Proof of insurance or
          compliance may be required before confirming a booking.
        </p>
        <p>
          Alpha Freight Solutions Limited does not provide cargo insurance unless explicitly stated
          in writing.
        </p>
      </div>
    ),
  },
  {
    id: "intellectual-property",
    title: "8. Intellectual Property",
    content: (
      <p>
        All platform content, trademarks, designs, and software are owned by Alpha Freight Solutions
        Limited or its licensors. You may not copy, modify, distribute, or exploit any content
        without permission.
      </p>
    ),
  },
  {
    id: "disclaimers",
    title: "9. Disclaimers and Limitation of Liability",
    content: (
      <div className="space-y-4">
        <p>
          Alpha Freight Solutions Limited acts as an intermediary and does not guarantee the
          performance of suppliers or carriers. We are not responsible for cargo loss, damage,
          delays, or disputes between parties.
        </p>
        <p>
          Alpha Freight Solutions Limited does not act as a carrier, does not own or operate
          vehicles, and does not take possession of cargo, unless expressly agreed in writing.
        </p>
        <p>
          All transportation services are performed by independent third-party carriers, and any
          claims related to loss, damage, theft, or delay must be pursued directly with the carrier.
        </p>
        <p>
          To the maximum extent allowed by law, our total liability is limited to the platform fees
          paid for the specific transaction at issue.
        </p>
      </div>
    ),
  },
  {
    id: "suspension",
    title: "10. Suspension and Termination",
    content: (
      <p>
        We may suspend or terminate any account that violates these terms, poses a risk, or is
        inactive. You may close your account at any time by contacting support.
      </p>
    ),
  },
  {
    id: "changes",
    title: "11. Changes to Terms",
    content: (
      <p>
        We may update these terms at any time. Significant changes will be notified via the platform
        or email. Continued use means you accept the updated terms.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "12. Governing Law",
    content: (
      <p>
        These terms are governed by the laws of England and Wales. Any disputes will be handled in
        the courts of England and Wales unless otherwise required by law.
      </p>
    ),
  },
  {
    id: "contact",
    title: "13. Contact",
    content: (
      <div className="space-y-4">
        <p>For questions about these Terms, please contact us:</p>
        <ul className="space-y-2">
          <li>
            <span className="font-semibold text-slate-900">Email:</span>{" "}
            <a href="mailto:support@alphafreightuk.com" className="text-violet-700 hover:underline">
              support@alphafreightuk.com
            </a>
          </li>
          <li>
            <span className="font-semibold text-slate-900">Phone:</span>{" "}
            <a href="tel:+447782294718" className="text-violet-700 hover:underline">
              +44 7782 294718
            </a>
          </li>
          <li>
            <span className="font-semibold text-slate-900">Address:</span> 124 City Road, London
            EC1V 2NX, United Kingdom
          </li>
        </ul>
      </div>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[240px_1fr] lg:items-start">
            <aside className="lg:sticky lg:top-28">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600">
                Legal
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
              <p className="mt-3 text-sm text-slate-500">Last updated: January 2026</p>
              <p className="mt-2 text-sm text-slate-500">
                Alpha Freight Solutions Limited operates this platform.
              </p>

              <nav className="mt-8 hidden lg:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  On this page
                </p>
                <ul className="mt-4 space-y-2 border-l border-slate-200 pl-4">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="text-sm text-slate-600 transition hover:text-slate-900"
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-8 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Alpha Freight Solutions Limited</p>
                  <p className="mt-2">Company No. 16860760</p>
                  <Link href="/company-overview" className="mt-3 inline-block text-violet-700 hover:underline">
                    Company overview →
                  </Link>
                </div>
                <Link href="/privacy-policy" className="inline-block text-sm text-violet-700 hover:underline">
                  Privacy Policy →
                </Link>
                <Link href="/cookie-policy" className="inline-block text-sm text-violet-700 hover:underline">
                  Cookie Policy →
                </Link>
              </div>
            </aside>

            <article className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-10">
              <div className="mb-10 border-b border-slate-100 pb-8 lg:hidden">
                <p className="text-sm text-slate-500">Last updated: January 2026</p>
                <p className="mt-2 text-sm text-slate-500">
                  Alpha Freight Solutions Limited operates this platform.
                </p>
              </div>

              <div className="space-y-10 text-[15px] leading-7 text-slate-600">
                {sections.map((section) => (
                  <section key={section.id} id={section.id} className="scroll-mt-28">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      {section.title}
                    </h2>
                    <div className="mt-4">{section.content}</div>
                  </section>
                ))}
              </div>
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
