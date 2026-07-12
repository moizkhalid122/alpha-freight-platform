"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function AccountDeletionPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600">
            Legal
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Delete Your Alpha Freight Account
          </h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: July 2026</p>

          <article className="mt-10 space-y-8 rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-10">
            <section className="space-y-4 text-[15px] leading-7 text-slate-600">
              <p>
                You can request deletion of your Alpha Freight account and associated personal data
                at any time. This applies to users of the Alpha Freight website, carrier portal,
                supplier portal, and Android mobile app.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                How to request account deletion
              </h2>
              <ol className="list-decimal space-y-3 pl-5 text-[15px] leading-7 text-slate-600">
                <li>
                  Email{" "}
                  <a
                    href="mailto:support@alphafreightuk.com?subject=Account%20deletion%20request"
                    className="font-semibold text-violet-700 hover:underline"
                  >
                    support@alphafreightuk.com
                  </a>{" "}
                  from your registered email address.
                </li>
                <li>Use the subject line: <strong>Account deletion request</strong>.</li>
                <li>
                  Include your registered email or phone number, your role (Carrier or Supplier),
                  and your account ID if you have it.
                </li>
                <li>
                  We will verify your identity and confirm deletion within 30 days, unless a longer
                  period is required by law.
                </li>
              </ol>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">What we delete</h2>
              <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-slate-600">
                <li>Profile information (name, phone, company details)</li>
                <li>Account identifiers and login credentials</li>
                <li>Uploaded identity documents linked to your account</li>
                <li>App passcode settings stored for your account</li>
                <li>Push notification tokens associated with your account</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                What we may retain
              </h2>
              <p className="text-[15px] leading-7 text-slate-600">
                We may keep certain records where required for legal, accounting, dispute resolution,
                fraud prevention, or regulatory compliance. This can include payment history,
                invoices, and load records linked to completed transactions, for as long as required
                by UK law.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Alpha Freight Solutions Limited</p>
              <p className="mt-2">124 City Road, London, EC1V 2NX, United Kingdom</p>
              <p className="mt-2">
                Email:{" "}
                <a href="mailto:support@alphafreightuk.com" className="text-violet-700 hover:underline">
                  support@alphafreightuk.com
                </a>
              </p>
              <p className="mt-1">
                Phone:{" "}
                <a href="tel:+447782294718" className="text-violet-700 hover:underline">
                  +44 7782 294718
                </a>
              </p>
            </section>

            <p className="text-sm text-slate-500">
              For full details on how we handle personal data, see our{" "}
              <Link href="/privacy-policy" className="text-violet-700 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
