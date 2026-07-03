"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const cookieTable = [
  {
    name: "carrierAuth / supplierAuth",
    purpose: "Stores user authentication session",
    duration: "Session / Persistent",
  },
  {
    name: "alphaPreferredLanguage",
    purpose: "Stores user's language preference",
    duration: "Persistent (1 year)",
  },
  {
    name: "ab.portal.lastRole",
    purpose: "Remembers last used portal (carrier/supplier)",
    duration: "Persistent (30 days)",
  },
];

const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: (
      <p>
        Alpha Freight Solutions Limited (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) uses cookies
        and similar tracking technologies on our website and mobile applications. This Cookie Policy
        explains what cookies are, how we use them, and your choices regarding cookies.
      </p>
    ),
  },
  {
    id: "what-are-cookies",
    title: "2. What Are Cookies?",
    content: (
      <div className="space-y-4">
        <p>
          Cookies are small text files that are placed on your device (computer, tablet, or mobile)
          when you visit a website. They are widely used to make websites work more efficiently and
          provide information to website owners.
        </p>
        <p>Cookies can be:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold text-slate-900">Session cookies:</span> Temporary cookies
            that expire when you close your browser
          </li>
          <li>
            <span className="font-semibold text-slate-900">Persistent cookies:</span> Cookies that
            remain on your device for a set period or until you delete them
          </li>
          <li>
            <span className="font-semibold text-slate-900">First-party cookies:</span> Set by the
            website you are visiting
          </li>
          <li>
            <span className="font-semibold text-slate-900">Third-party cookies:</span> Set by domains
            other than the website you are visiting
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "how-we-use-cookies",
    title: "3. How We Use Cookies",
    content: (
      <div className="space-y-6">
        <p>We use cookies for the following purposes:</p>

        <div>
          <h3 className="text-base font-semibold text-slate-900">3.1 Essential Cookies</h3>
          <p className="mt-3">
            These cookies are necessary for the website to function properly. They enable core
            functionality such as:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>User authentication and login sessions</li>
            <li>Security and fraud prevention</li>
            <li>Load balancing and website performance</li>
            <li>Remembering your preferences and settings</li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-900">3.2 Functional Cookies</h3>
          <p className="mt-3">These cookies enhance your experience by:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Remembering your language preferences</li>
            <li>Storing your currency and regional settings</li>
            <li>Maintaining your dashboard preferences</li>
            <li>Remembering your notification settings</li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-900">3.3 Analytics Cookies</h3>
          <p className="mt-3">
            These cookies help us understand how visitors interact with our website by:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Collecting information about pages visited</li>
            <li>Tracking user navigation patterns</li>
            <li>Measuring website performance</li>
            <li>Identifying areas for improvement</li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-900">3.4 Marketing Cookies</h3>
          <p className="mt-3">These cookies are used to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Deliver relevant advertisements</li>
            <li>Track campaign effectiveness</li>
            <li>Personalize marketing content</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "types-of-cookies",
    title: "4. Types of Cookies We Use",
    content: (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 pr-4 font-semibold text-slate-900">Cookie Name</th>
              <th className="py-3 pr-4 font-semibold text-slate-900">Purpose</th>
              <th className="py-3 font-semibold text-slate-900">Duration</th>
            </tr>
          </thead>
          <tbody>
            {cookieTable.map((row) => (
              <tr key={row.name} className="border-b border-slate-100">
                <td className="py-3 pr-4 align-top font-medium text-slate-900">{row.name}</td>
                <td className="py-3 pr-4 align-top">{row.purpose}</td>
                <td className="py-3 align-top">{row.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "third-party-cookies",
    title: "5. Third-Party Cookies",
    content: (
      <div className="space-y-4">
        <p>We may use third-party services that set cookies on your device, including:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold text-slate-900">Google Analytics:</span> Website analytics
            and performance monitoring
          </li>
          <li>
            <span className="font-semibold text-slate-900">Firebase:</span> Authentication and
            database services
          </li>
          <li>
            <span className="font-semibold text-slate-900">Supabase:</span> Storage and backend
            services
          </li>
          <li>
            <span className="font-semibold text-slate-900">Payment Processors:</span> Secure payment
            processing
          </li>
        </ul>
        <p>
          These third parties may use cookies to collect information about your online activities
          across different websites.
        </p>
      </div>
    ),
  },
  {
    id: "your-cookie-choices",
    title: "6. Your Cookie Choices",
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900">6.1 Browser Settings</h3>
          <p className="mt-3">
            Most web browsers allow you to control cookies through their settings. You can:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Block all cookies</li>
            <li>Block third-party cookies</li>
            <li>Delete existing cookies</li>
            <li>Set your browser to notify you when cookies are set</li>
          </ul>
          <p className="mt-3">
            <span className="font-semibold text-slate-900">Note:</span> Blocking essential cookies
            may affect website functionality.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-900">6.2 Cookie Consent</h3>
          <p className="mt-3">When you first visit our website, you may see a cookie consent banner. You can:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Accept all cookies</li>
            <li>Reject non-essential cookies</li>
            <li>Customize your cookie preferences</li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-900">6.3 Opt-Out Links</h3>
          <p className="mt-3">For specific third-party cookies, you can opt-out through:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Google Analytics Opt-Out</li>
            <li>Your browser&apos;s privacy settings</li>
            <li>Third-party opt-out tools</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "mobile-applications",
    title: "7. Mobile Applications",
    content: (
      <div className="space-y-4">
        <p>Our mobile applications may use similar technologies to cookies, including:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Local storage for user preferences</li>
          <li>Device identifiers for analytics</li>
          <li>Push notification tokens</li>
        </ul>
        <p>You can manage these through your device settings or within the app preferences.</p>
      </div>
    ),
  },
  {
    id: "updates",
    title: "8. Updates to This Policy",
    content: (
      <div className="space-y-4">
        <p>
          We may update this Cookie Policy from time to time to reflect changes in our practices or
          for legal, operational, or regulatory reasons. We will notify you of any material changes
          by:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Posting the updated policy on this page</li>
          <li>Updating the &quot;Last updated&quot; date</li>
          <li>Notifying you through email or in-app notifications (for significant changes)</li>
        </ul>
      </div>
    ),
  },
  {
    id: "international-users",
    title: "9. International Users",
    content: (
      <div className="space-y-4">
        <p>If you are accessing our services from outside your home country, please note that:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Cookie laws may vary by jurisdiction</li>
          <li>
            We comply with GDPR (European Union), CCPA (California), and other applicable privacy
            laws
          </li>
          <li>Your cookie preferences are respected globally</li>
        </ul>
      </div>
    ),
  },
  {
    id: "contact",
    title: "10. Contact Us",
    content: (
      <div className="space-y-4">
        <p>
          If you have questions about our use of cookies or this Cookie Policy, please contact us:
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
];

export default function CookiePolicyPage() {
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
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Cookie Policy</h1>
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

              <div className="mt-8 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Alpha Freight Solutions Limited</p>
                  <p className="mt-2">Company No. 16860760</p>
                  <Link href="/company-overview" className="mt-3 inline-block text-violet-700 hover:underline">
                    Company overview →
                  </Link>
                </div>
                <Link
                  href="/privacy-policy"
                  className="inline-block text-sm text-violet-700 hover:underline"
                >
                  Privacy Policy →
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
