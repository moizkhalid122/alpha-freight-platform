"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import EmployeeVerificationCheck from "@/components/security/EmployeeVerificationCheck";
import VerifiedOfficialContacts from "@/components/security/VerifiedOfficialContacts";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  CheckCircle2,
  Globe,
  Mail,
  Shield,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";

const employeeChecks = [
  "A unique Employee ID",
  "An official Alpha Freight email address",
  "An official company role",
  "An active employee status",
];

const officialChannels = [
  {
    icon: Globe,
    title: "Official Website",
    value: "https://www.alphafreightuk.com",
    href: "https://www.alphafreightuk.com",
  },
  {
    icon: Mail,
    title: "Official Email",
    value: "emmanuel@ / alastair@ / support@alphafreightuk.com",
  },
  {
    icon: Users,
    title: "Official Employee Portal",
    value: "Employees work through our official internal systems.",
  },
  {
    icon: ShieldCheck,
    title: "Official Support Team",
    value: "Always contact our official support team if you have any concerns.",
    href: "/support",
  },
];

const forbiddenPayments = [
  "Personal bank accounts",
  "Personal PayPal accounts",
  "Personal Wise accounts",
  "Personal cryptocurrency wallets",
  "Personal payment links",
];

const approvedPayments = [
  "Alpha Freight Platform",
  "Official Stripe Checkout",
  "Official Alpha Freight Business Bank Account (when instructed through official company channels)",
];

const privateDealWarnings = [
  "Complete a private freight deal",
  "Ignore the Alpha Freight platform",
  "Send payment directly to them",
  "Continue the transaction privately",
];

const verifyBeforePay = [
  "You're communicating with a verified Alpha Freight employee.",
  "You're using the official Alpha Freight platform.",
  "The payment page belongs to Alpha Freight.",
  "The payment instructions were sent through an official Alpha Freight email.",
];

const reportReasons = [
  "Claims to represent Alpha Freight but cannot verify their identity.",
  "Requests payment to a personal account.",
  "Asks you to complete a private deal.",
  "Requests confidential company information.",
  "Behaves suspiciously.",
];

const securityRules = [
  "Verify the employee.",
  "Verify the payment method.",
  "Use only official Alpha Freight communication channels.",
  "Keep all bookings and payments within the Alpha Freight platform.",
  "Contact our Support Team whenever you're unsure.",
];

const disclaimerItems = [
  "Payments made to personal bank accounts.",
  "Private agreements made outside the Alpha Freight platform.",
  "Transactions completed outside our official booking and payment systems.",
  "Communication with individuals who cannot be verified as authorised Alpha Freight representatives.",
];

const sections = [
  { id: "verify-employee", title: "Verify an Employee" },
  { id: "official-channels", title: "Official Channels" },
  { id: "payment-safety", title: "Payment Safety" },
  { id: "private-deals", title: "No Private Deals" },
  { id: "verify-before-pay", title: "Verify Before You Pay" },
  { id: "report", title: "Report Suspicious Activity" },
  { id: "security-rules", title: "Security Rules" },
  { id: "commitment", title: "Our Commitment" },
  { id: "disclaimer", title: "Disclaimer" },
];

function ListBlock({
  items,
  variant,
}: {
  items: string[];
  variant: "danger" | "success" | "neutral";
}) {
  const Icon = variant === "danger" ? XCircle : variant === "success" ? CheckCircle2 : Shield;
  const iconClass =
    variant === "danger"
      ? "text-red-500"
      : variant === "success"
        ? "text-emerald-600"
        : "text-slate-500";

  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SecurityCentrePage() {
  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
          <div className="flex flex-col gap-12 lg:flex-row lg:gap-12">
            <aside className="hidden w-[260px] shrink-0 lg:block">
              <div className="sticky top-28">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  <Shield className="h-3.5 w-3.5" />
                  Security
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  Security &amp; Verification Centre
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Your security is our priority. Learn how to verify employees, official channels, and
                  safe payment methods.
                </p>

                <nav className="mt-8">
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
                  <p className="font-semibold text-slate-900">Need help verifying someone?</p>
                  <p className="mt-2 leading-6">
                    Contact our official Support Team before sharing confidential information.
                  </p>
                  <Link href="/support" className="mt-3 inline-block font-semibold text-emerald-700 hover:underline">
                    Contact Support →
                  </Link>
                </div>
              </div>
            </aside>

            <div className="lg:hidden">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                <Shield className="h-3.5 w-3.5" />
                Security
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Security &amp; Verification Centre
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Your security is our priority. Learn how to verify employees, official channels, and
                safe payment methods.
              </p>
            </div>

            <article className="min-w-0 flex-1 space-y-8">
              <div className="rounded-[1.75rem] border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-10">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      Your Security Is Our Priority
                    </h2>
                    <p className="mt-4 text-[15px] leading-7 text-slate-600">
                      At Alpha Freight Solutions, protecting our customers, suppliers, carriers, and
                      business partners is one of our highest priorities.
                    </p>
                    <p className="mt-4 text-[15px] leading-7 text-slate-600">
                      This page explains how to verify official Alpha Freight communications, identify
                      our authorised employees, make secure payments, and protect yourself from fraud.
                    </p>
                    <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] font-medium leading-6 text-amber-900">
                      Please read this page carefully before communicating with anyone claiming to
                      represent Alpha Freight Solutions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-10">
                <div className="space-y-10 text-[15px] leading-7 text-slate-600">
                  <section id="verify-employee" className="scroll-mt-28">
                    <div className="flex items-center gap-3">
                      <BadgeCheck className="h-6 w-6 text-emerald-600" />
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                        Verify an Alpha Freight Employee
                      </h2>
                    </div>
                    <p className="mt-4">Every authorised Alpha Freight employee has:</p>
                    <ListBlock items={employeeChecks} variant="success" />
                    <p className="mt-6">
                      Before sharing confidential information or discussing business, always verify the
                      employee through our official platform.
                    </p>
                    <p className="mt-4">
                      If you&apos;re unsure about someone&apos;s identity,{" "}
                      <Link href="/support" className="font-semibold text-emerald-700 hover:underline">
                        contact our Support Team
                      </Link>{" "}
                      before continuing.
                    </p>

                    <div className="mt-8">
                      <EmployeeVerificationCheck />
                    </div>

                    <div className="mt-8">
                      <VerifiedOfficialContacts compact />
                    </div>
                  </section>

                  <section id="official-channels" className="scroll-mt-28 border-t border-slate-100 pt-10">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      Official Communication Channels
                    </h2>
                    <p className="mt-4">
                      Only trust communication sent through Alpha Freight&apos;s official channels.
                    </p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {officialChannels.map((channel) => {
                        const Icon = channel.icon;
                        return (
                          <div
                            key={channel.title}
                            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                                <Icon className="h-5 w-5" />
                              </div>
                              <h3 className="font-semibold text-slate-900">{channel.title}</h3>
                            </div>
                            {channel.href ? (
                              <Link
                                href={channel.href}
                                className="mt-3 block text-sm font-medium text-emerald-700 hover:underline"
                              >
                                {channel.value}
                              </Link>
                            ) : (
                              <p className="mt-3 text-sm leading-6">{channel.value}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section id="payment-safety" className="scroll-mt-28 border-t border-slate-100 pt-10">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      Payment Safety
                    </h2>
                    <p className="mt-4">
                      For your protection, Alpha Freight employees are never authorised to request
                      payments to:
                    </p>
                    <ListBlock items={forbiddenPayments} variant="danger" />
                    <p className="mt-6">All payments must only be completed through:</p>
                    <ListBlock items={approvedPayments} variant="success" />
                    <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-900">
                      If anyone asks you to make a payment outside the Alpha Freight platform, do not
                      proceed.
                    </p>
                  </section>

                  <section id="private-deals" className="scroll-mt-28 border-t border-slate-100 pt-10">
                    <div className="flex items-center gap-3">
                      <Ban className="h-6 w-6 text-red-500" />
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                        Never Complete Private Deals
                      </h2>
                    </div>
                    <p className="mt-4">
                      For your protection, all bookings, freight agreements, quotations, and payments
                      must remain within the Alpha Freight platform.
                    </p>
                    <p className="mt-4">If anyone asks you to:</p>
                    <ListBlock items={privateDealWarnings} variant="danger" />
                    <p className="mt-6">
                      Please stop immediately and{" "}
                      <Link href="/support" className="font-semibold text-emerald-700 hover:underline">
                        contact our Support Team
                      </Link>
                      .
                    </p>
                    <p className="mt-4">
                      Alpha Freight cannot guarantee or protect transactions completed outside the
                      official platform.
                    </p>
                  </section>

                  <section id="verify-before-pay" className="scroll-mt-28 border-t border-slate-100 pt-10">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      Verify Before You Pay
                    </h2>
                    <p className="mt-4">Before making any payment, always confirm:</p>
                    <ListBlock items={verifyBeforePay} variant="success" />
                    <p className="mt-6 font-semibold text-slate-900">Never send payment if you&apos;re unsure.</p>
                  </section>

                  <section id="report" className="scroll-mt-28 border-t border-slate-100 pt-10">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                        Report Suspicious Activity
                      </h2>
                    </div>
                    <p className="mt-4">Please report immediately if someone:</p>
                    <ListBlock items={reportReasons} variant="neutral" />
                    <p className="mt-6">Our team will investigate immediately.</p>
                    <Link
                      href="/support"
                      className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-slate-800"
                    >
                      Report to Support Team
                    </Link>
                  </section>

                  <section id="security-rules" className="scroll-mt-28 border-t border-slate-100 pt-10">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      Important Security Rules
                    </h2>
                    <p className="mt-4">Always remember:</p>
                    <ListBlock items={securityRules} variant="success" />
                  </section>

                  <section id="commitment" className="scroll-mt-28 border-t border-slate-100 pt-10">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      Our Commitment
                    </h2>
                    <p className="mt-4">
                      Alpha Freight Solutions is committed to providing a secure, transparent, and
                      professional logistics platform.
                    </p>
                    <p className="mt-4">
                      We continuously improve our security procedures to protect every supplier,
                      carrier, customer, employee, and business partner.
                    </p>
                    <p className="mt-4">
                      Security is a shared responsibility, and together we can help prevent fraud and
                      maintain a trusted logistics community.
                    </p>
                  </section>

                  <section id="disclaimer" className="scroll-mt-28 border-t border-slate-100 pt-10">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      Disclaimer
                    </h2>
                    <p className="mt-4">
                      Alpha Freight Solutions is not responsible for losses resulting from:
                    </p>
                    <ListBlock items={disclaimerItems} variant="neutral" />
                    <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
                      For your protection, always use the official Alpha Freight platform for all
                      freight bookings, communication, and payments.
                    </p>
                  </section>
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
