"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const sections = [
  {
    id: "introduction",
    title: "Introduction",
    content: (
      <div className="space-y-4">
        <p>
          This Refund &amp; Cancellation Policy explains how Alpha Freight Solutions Limited
          (&ldquo;Alpha Freight&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;)
          handles payments, cancellations, refunds and payment disputes for freight transactions
          arranged through the Alpha Freight platform.
        </p>
        <p>
          Alpha Freight operates a freight brokerage and logistics platform connecting suppliers and
          freight customers with carriers and transport providers.
        </p>
        <p>
          By using the Alpha Freight platform, you agree to the terms of this policy together with
          our applicable{" "}
          <Link href="/terms-of-service" className="text-violet-700 hover:underline">
            Terms of Service
          </Link>{" "}
          and any transaction-specific terms.
        </p>
      </div>
    ),
  },
  {
    id: "supplier-payment",
    title: "1. Supplier Payment Before Load Posting",
    content: (
      <div className="space-y-4">
        <p>
          A supplier must pay the full amount shown at checkout before a load can be posted on the
          Alpha Freight platform.
        </p>
        <p>
          The checkout will clearly show the load amount and Alpha Freight&apos;s applicable service
          fee separately.
        </p>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">Example</p>
          <p className="mt-2 text-sm text-slate-600">For a £4,000 load:</p>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>Load amount: £4,000</li>
            <li>Alpha Freight service fee (4%): £160</li>
            <li>
              <span className="font-semibold text-slate-900">Total paid by supplier: £4,160</span>
            </li>
          </ul>
        </div>
        <p>
          The load will only be posted after the required payment has been successfully confirmed.
        </p>
      </div>
    ),
  },
  {
    id: "supplier-service-fee",
    title: "2. Alpha Freight Service Fee",
    content: (
      <div className="space-y-4">
        <p>
          Alpha Freight currently applies a 4% supplier service fee to applicable loads.
        </p>
        <p>
          The fee is displayed separately during the payment process before the supplier completes
          payment.
        </p>
        <p>
          The applicable fee may be updated in accordance with Alpha Freight&apos;s applicable terms
          and pricing displayed before a transaction is completed.
        </p>
      </div>
    ),
  },
  {
    id: "carrier-platform-fee",
    title: "3. Carrier Platform Fee",
    content: (
      <div className="space-y-4">
        <p>A 3% Alpha Freight platform fee applies to the carrier side of applicable loads.</p>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-600">
            For example, if the load value shown for a carrier is £4,000:
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li>Load value: £4,000</li>
            <li>Carrier platform fee (3%): £120</li>
            <li>
              <span className="font-semibold text-slate-900">Carrier payable amount: £3,880</span>
            </li>
          </ul>
        </div>
        <p>
          The carrier&apos;s applicable amount and fee will be displayed before the carrier accepts
          the load.
        </p>
      </div>
    ),
  },
  {
    id: "cancellation-before-acceptance",
    title: "4. Cancellation Before Carrier Acceptance",
    content: (
      <div className="space-y-4">
        <p>
          If a supplier cancels a load before a carrier has accepted the load, Alpha Freight will
          normally process a refund of the amount paid.
        </p>
        <p>
          Where Alpha Freight has incurred legitimate, non-recoverable third-party costs directly
          related to the transaction, those costs may be deducted where legally permitted and where
          the deduction is reasonable and proportionate.
        </p>
        <p>
          Alpha Freight does not apply an automatic fixed cancellation penalty simply because a
          supplier cancels before carrier acceptance.
        </p>
        <p>
          This approach is intended to ensure that any amount retained reflects the actual direct
          loss caused by the cancellation rather than operating as a punitive charge. UK government
          guidance states that cancellation charges should be reasonable and generally reflect actual
          direct losses.
        </p>
      </div>
    ),
  },
  {
    id: "cancellation-after-acceptance",
    title: "5. Cancellation After Carrier Acceptance",
    content: (
      <div className="space-y-4">
        <p>
          If a carrier has already accepted a load, cancellation may result in costs being incurred
          by the carrier or Alpha Freight.
        </p>
        <p>In such circumstances, any refund will be assessed based on:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Whether the carrier has accepted the load;</li>
          <li>Whether the carrier has started travelling or preparing for collection;</li>
          <li>Costs already reasonably incurred;</li>
          <li>Whether the carrier can reasonably be reassigned to another load;</li>
          <li>Any applicable third-party costs; and</li>
          <li>The specific circumstances of the cancellation.</li>
        </ul>
        <p>
          Any amount retained will be limited to what is reasonably justified by the applicable
          transaction and permitted by law.
        </p>
      </div>
    ),
  },
  {
    id: "cancellation-after-collection",
    title: "6. Cancellation After Collection or Service Has Started",
    content: (
      <div className="space-y-4">
        <p>
          If the carrier has already collected the goods or transportation has started, a full
          refund will not automatically be available.
        </p>
        <p>Alpha Freight will review the circumstances, including:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>The stage reached in the delivery;</li>
          <li>Carrier costs already incurred;</li>
          <li>Whether the service can be stopped or reassigned;</li>
          <li>Any goods or delivery-related issues; and</li>
          <li>The applicable transaction terms.</li>
        </ul>
        <p>
          Where a refund is appropriate, the amount will be determined fairly based on the
          circumstances.
        </p>
      </div>
    ),
  },
  {
    id: "alpha-freight-cancels",
    title: "7. Alpha Freight Cancels a Load",
    content: (
      <div className="space-y-4">
        <p>
          If Alpha Freight cancels a transaction without the supplier being responsible for the
          cancellation and the agreed service has not been provided, Alpha Freight will normally
          refund the relevant amount paid, subject to any applicable legal or transaction-specific
          requirements.
        </p>
        <p>
          Alpha Freight will not retain an advance payment merely because it was paid in advance
          where there is no legitimate basis for doing so. UK guidance indicates that businesses
          should not automatically keep advance payments where the service is not provided.
        </p>
      </div>
    ),
  },
  {
    id: "completed-loads",
    title: "8. Completed Loads",
    content: (
      <div className="space-y-4">
        <p>
          Once a load has been successfully completed and the relevant delivery has been confirmed,
          the transaction will normally be considered completed.
        </p>
        <p>A normal change-of-mind cancellation is not available after completion.</p>
        <p>
          However, this does not affect any rights a customer may have where there is a genuine
          service failure, dispute, fraud, incorrect transaction or other issue covered by
          applicable law or the relevant agreement.
        </p>
      </div>
    ),
  },
  {
    id: "carrier-payment-pod",
    title: "9. Carrier Payment & POD Verification",
    content: (
      <div className="space-y-4">
        <p>
          After completing delivery, the carrier must upload the required Proof of Delivery (POD)
          through the Alpha Freight system.
        </p>
        <p>Alpha Freight will review and verify the POD.</p>
        <p>
          Once the POD has been successfully verified, the carrier payment will normally be
          processed within 7 days.
        </p>
        <p>Payment may be delayed where:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>The POD is incomplete or cannot be verified;</li>
          <li>There is a genuine dispute concerning the delivery;</li>
          <li>The transaction information is inconsistent;</li>
          <li>Fraud or misuse is suspected; or</li>
          <li>Additional verification is reasonably required.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "refund-processing",
    title: "10. Refund Processing",
    content: (
      <div className="space-y-4">
        <p>
          Once Alpha Freight approves a refund, the refund will normally be returned through the
          original payment method where technically possible.
        </p>
        <p>
          The time required for the funds to appear in the customer&apos;s account may depend on the
          customer&apos;s bank, card issuer or payment provider.
        </p>
        <p>
          Alpha Freight cannot control delays caused by third-party financial institutions.
        </p>
      </div>
    ),
  },
  {
    id: "duplicate-payments",
    title: "11. Duplicate or Incorrect Payments",
    content: (
      <div className="space-y-4">
        <p>If you believe that you have:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Paid twice;</li>
          <li>Been charged an incorrect amount; or</li>
          <li>Been charged for a transaction that you did not authorise,</li>
        </ul>
        <p>you should contact Alpha Freight as soon as possible.</p>
        <p>
          Alpha Freight will investigate the transaction and, where appropriate, arrange a correction
          or refund.
        </p>
      </div>
    ),
  },
  {
    id: "payment-disputes",
    title: "12. Payment Disputes",
    content: (
      <div className="space-y-4">
        <p>If you wish to dispute a transaction, please provide:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Your name;</li>
          <li>Account information;</li>
          <li>Load or transaction reference;</li>
          <li>Payment date;</li>
          <li>Amount paid;</li>
          <li>Reason for the dispute; and</li>
          <li>Relevant supporting information or documents.</li>
        </ul>
        <p>
          Alpha Freight will review the matter and communicate the outcome of its review.
        </p>
      </div>
    ),
  },
  {
    id: "fraudulent-transactions",
    title: "13. Unauthorised or Fraudulent Transactions",
    content: (
      <div className="space-y-4">
        <p>
          If you believe a transaction was made without your authorisation, contact Alpha Freight
          immediately.
        </p>
        <p>
          Alpha Freight may investigate the transaction and may request information necessary to
          verify the circumstances.
        </p>
        <p>
          Where appropriate, Alpha Freight may also work with the relevant payment provider.
        </p>
      </div>
    ),
  },
  {
    id: "statutory-rights",
    title: "14. Statutory Rights",
    content: (
      <div className="space-y-4">
        <p>
          Nothing in this Refund &amp; Cancellation Policy is intended to remove, restrict or
          exclude any rights or protections that cannot lawfully be excluded under applicable UK
          law.
        </p>
        <p>
          Where a customer has a statutory right to a refund, cancellation or other remedy, that
          right will continue to apply.
        </p>
        <p>
          UK consumer contracts must use fair and transparent terms, and terms that impose
          excessive cancellation charges or automatically forfeit large upfront payments may be
          considered unfair.
        </p>
      </div>
    ),
  },
  {
    id: "changes",
    title: "15. Changes to This Policy",
    content: (
      <p>
        Alpha Freight may update this policy from time to time to reflect changes to our services,
        payment processes, platform features or legal requirements. The latest version will be
        published on this page.
      </p>
    ),
  },
  {
    id: "contact",
    title: "16. Contact Us",
    content: (
      <div className="space-y-4">
        <div>
          <p className="font-semibold text-slate-900">Alpha Freight Solutions Limited</p>
          <p className="mt-1">Company No.: 16860760</p>
          <p className="mt-1">
            Registered Office: 124–128 City Road, London, England, EC1V 2NX
          </p>
        </div>
        <p>
          For refund, cancellation or payment enquiries, please contact Alpha Freight through the
          official contact details provided on our website:
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
            <span className="font-semibold text-slate-900">Support:</span>{" "}
            <Link href="/support" className="text-violet-700 hover:underline">
              Help Center
            </Link>
          </li>
        </ul>
      </div>
    ),
  },
];

export default function RefundCancellationPolicyPage() {
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
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Refund &amp; Cancellation Policy
              </h1>
              <p className="mt-3 text-sm text-slate-500">Last updated: 10 August 2026</p>
              <p className="mt-2 text-sm text-slate-500">
                Payments, cancellations, refunds and disputes on the Alpha Freight platform.
              </p>

              <nav className="mt-8 hidden lg:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  On this page
                </p>
                <ul className="mt-4 max-h-[420px] space-y-2 overflow-y-auto border-l border-slate-200 pl-4">
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
                <Link href="/terms-of-service" className="inline-block text-sm text-violet-700 hover:underline">
                  Terms of Service →
                </Link>
                <Link href="/privacy-policy" className="inline-block text-sm text-violet-700 hover:underline">
                  Privacy Policy →
                </Link>
              </div>
            </aside>

            <article className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-10">
              <div className="mb-10 border-b border-slate-100 pb-8 lg:hidden">
                <p className="text-sm text-slate-500">Last updated: 10 August 2026</p>
                <p className="mt-2 text-sm text-slate-500">
                  Payments, cancellations, refunds and disputes on the Alpha Freight platform.
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
