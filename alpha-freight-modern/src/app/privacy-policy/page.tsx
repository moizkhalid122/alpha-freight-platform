"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: (
      <p>
        Alpha Freight Solutions Limited (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to
        protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and
        safeguard your information when you visit our website or use our freight brokerage services.
      </p>
    ),
  },
  {
    id: "information-we-collect",
    title: "2. Information We Collect",
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900">2.1 Personal Information</h3>
          <p className="mt-3">We may collect the following types of personal information:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Name and contact information (email, phone, address)</li>
            <li>Business information (company name, registration details)</li>
            <li>Payment information (billing details, payment methods)</li>
            <li>Vehicle and driver information (for carriers)</li>
            <li>Cargo and shipment details (for suppliers)</li>
          </ul>
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">2.2 Technical Information</h3>
          <p className="mt-3">We automatically collect certain technical information when you visit our website:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>IP address and device information</li>
            <li>Browser type and version</li>
            <li>Pages visited and time spent on site</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Information",
    content: (
      <>
        <p>We use your information for the following purposes:</p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Providing freight brokerage services</li>
          <li>Matching suppliers with carriers</li>
          <li>Processing payments and transactions</li>
          <li>Communicating with you about services</li>
          <li>Improving our website and services</li>
          <li>Complying with legal obligations</li>
          <li>Preventing fraud and ensuring security</li>
        </ul>
      </>
    ),
  },
  {
    id: "information-sharing",
    title: "4. Information Sharing",
    content: (
      <>
        <p>We may share your information in the following circumstances:</p>
        <ul className="mt-4 space-y-3">
          {[
            {
              label: "Service Providers",
              text: "With third-party service providers who assist in our operations",
            },
            {
              label: "Business Partners",
              text: "With carriers and suppliers as necessary to provide services",
            },
            {
              label: "Legal Requirements",
              text: "When required by law or to protect our rights",
            },
            {
              label: "Business Transfers",
              text: "In connection with mergers, acquisitions, or asset sales",
            },
          ].map((item) => (
            <li key={item.label}>
              <span className="font-semibold text-slate-900">{item.label}:</span> {item.text}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "data-security",
    title: "5. Data Security",
    content: (
      <p>
        We implement appropriate technical and organizational measures to protect your personal
        information against unauthorized access, alteration, disclosure, or destruction. However, no
        method of transmission over the internet is 100% secure.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "6. Your Rights",
    content: (
      <>
        <p>
          Under GDPR (European Union), CCPA (California), and other applicable data protection laws,
          you have the following rights:
        </p>
        <ul className="mt-4 space-y-2">
          {[
            ["Access", "Request access to your personal data"],
            ["Rectification", "Request correction of inaccurate data"],
            ["Erasure", "Request deletion of your data"],
            ["Portability", "Request transfer of your data"],
            ["Objection", "Object to processing of your data"],
            ["Restriction", "Request restriction of processing"],
          ].map(([label, text]) => (
            <li key={label}>
              <span className="font-semibold text-slate-900">{label}:</span> {text}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    title: "7. Cookies",
    content: (
      <p>
        We use cookies and similar technologies to enhance your experience on our website. For
        detailed information about our use of cookies, please see our{" "}
        <Link href="/cookie-policy" className="text-violet-700 hover:underline">
          Cookie Policy
        </Link>
        . You can control cookie settings through your browser preferences.
      </p>
    ),
  },
  {
    id: "data-retention",
    title: "8. Data Retention",
    content: (
      <p>
        We retain your personal information only as long as necessary to fulfill the purposes
        outlined in this Privacy Policy, unless a longer retention period is required by law.
      </p>
    ),
  },
  {
    id: "international-transfers",
    title: "9. International Transfers",
    content: (
      <p>
        Your information may be transferred to and processed in countries other than your own. We
        ensure appropriate safeguards are in place for such transfers.
      </p>
    ),
  },
  {
    id: "childrens-privacy",
    title: "10. Children's Privacy",
    content: (
      <p>
        Our services are not intended for individuals under 18 years of age. We do not knowingly
        collect personal information from children.
      </p>
    ),
  },
  {
    id: "changes",
    title: "11. Changes to This Policy",
    content: (
      <p>
        We may update this Privacy Policy from time to time. We will notify you of any changes by
        posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
      </p>
    ),
  },
  {
    id: "contact",
    title: "12. Contact Us",
    content: (
      <div className="space-y-4">
        <p>
          If you have any questions about this Privacy Policy or our data practices, please contact
          us:
        </p>
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
            <span className="font-semibold text-slate-900">Address:</span> 124 City Road, London,
            EC1V 2NX, United Kingdom
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "account-deletion",
    title: "13. Account and Data Deletion",
    content: (
      <div className="space-y-5">
        <p>
          You can request deletion of your Alpha Freight account and associated personal data at any
          time.
        </p>
        <div>
          <h3 className="text-base font-semibold text-slate-900">How to request deletion:</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="font-semibold text-slate-900">Email:</span>{" "}
              <a href="mailto:support@alphafreightuk.com" className="text-violet-700 hover:underline">
                support@alphafreightuk.com
              </a>
            </li>
            <li>
              <span className="font-semibold text-slate-900">Subject:</span> Account deletion request
            </li>
            <li>
              <span className="font-semibold text-slate-900">Include:</span> your registered
              email/phone, your role (Supplier/Carrier/Broker), and your account ID (if available)
            </li>
          </ul>
        </div>
        <div>
          <p>
            <span className="font-semibold text-slate-900">What we delete:</span> your profile
            information, contact details, and account identifiers associated with your account.
          </p>
          <p className="mt-4">
            <span className="font-semibold text-slate-900">What we may retain:</span> records required
            for legal, accounting, dispute resolution, fraud prevention, or regulatory compliance
            (for example, invoice/payment history) for as long as required by law.
          </p>
        </div>
      </div>
    ),
  },
];

export default function PrivacyPolicyPage() {
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
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
              <p className="mt-3 text-sm text-slate-500">Last updated: December 2026</p>

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

              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Alpha Freight Solutions Limited</p>
                <p className="mt-2">Company No. 16860760</p>
                <Link href="/company-overview" className="mt-3 inline-block text-violet-700 hover:underline">
                  Company overview →
                </Link>
              </div>
            </aside>

            <article className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-10">
              <div className="mb-10 border-b border-slate-100 pb-8 lg:hidden">
                <p className="text-sm text-slate-500">Last updated: December 2026</p>
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
