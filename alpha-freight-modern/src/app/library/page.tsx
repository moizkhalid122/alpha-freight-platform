import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { blogArticles } from "@/lib/blog-content";
import { featuredBooks, getFeaturedBookOfWeek } from "@/lib/book-content";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-library-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-library-sans",
  display: "swap",
});

const serif = () => "font-[family-name:var(--font-library-serif)]";

export const metadata: Metadata = {
  title: "The Library | Alpha Freight",
  description:
    "Curated freight books and in-house insights from Alpha Freight — reading for UK suppliers, carriers, and logistics operators.",
};

export default function LibraryPage() {
  const bookOfWeek = getFeaturedBookOfWeek();
  const insights = blogArticles.slice(0, 4);

  return (
    <div
      className={`${cormorant.variable} ${dmSans.variable} min-h-screen bg-white font-[family-name:var(--font-library-sans)] text-neutral-900`}
    >
      <Navbar variant="dark" />

      <main className="pt-28 md:pt-32">
        <section className="border-b border-neutral-200 py-16 md:py-24">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[180px_1fr] lg:items-start">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-center">
                <div className="px-3">
                  <p className="text-[8px] font-semibold uppercase leading-tight tracking-[0.18em] text-neutral-400">
                    The Library
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-700">Alpha Freight</p>
                </div>
              </div>
              <div className="max-w-[760px]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-neutral-400">Curated reading</p>
                <h1 className={`mt-4 text-[clamp(2.5rem,5vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.02em] text-neutral-900 ${serif()}`}>
                  Ideas that move freight forward.
                </h1>
                <p className="mt-6 max-w-[620px] text-[16px] leading-[1.75] text-neutral-600">
                  Books we recommend for UK haulage operators, plus Alpha Freight insights on transparency, POD,
                  marketplace operations, and the future of logistics.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-neutral-200 py-16 md:py-24">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={`text-[clamp(1.75rem,3vw,2.25rem)] font-medium tracking-[-0.02em] text-neutral-900 ${serif()}`}>
                  Book of the week
                </h2>
                <p className="mt-2 text-[15px] text-neutral-500">Freight moves on what you don&apos;t see.</p>
              </div>
              <p className="text-[12px] uppercase tracking-[0.16em] text-neutral-400">Updated weekly</p>
            </div>

            <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-16">
              <div className="relative overflow-hidden rounded-2xl bg-[#8fa3a8] px-8 py-12 sm:px-12 sm:py-16 lg:min-h-[480px]">
                <div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] drop-shadow-[0_28px_48px_rgba(15,23,42,0.28)]">
                  <Image
                    src={bookOfWeek.image}
                    alt={`${bookOfWeek.title} by ${bookOfWeek.author}`}
                    fill
                    sizes="(max-width: 1024px) 80vw, 280px"
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              <div>
                <p className="text-[13px] italic text-neutral-500">
                  &ldquo;{bookOfWeek.quote}&rdquo;{" "}
                  <span className="not-italic text-[#c0392b]">— {bookOfWeek.quoteSource}</span>
                </p>
                <h3 className={`mt-6 text-[clamp(1.5rem,2.4vw,2rem)] font-medium leading-tight tracking-[-0.02em] text-neutral-900 ${serif()}`}>
                  {bookOfWeek.title}
                </h3>
                <p className="mt-2 text-[15px] font-medium text-neutral-600">{bookOfWeek.author}</p>
                <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-neutral-400">{bookOfWeek.credit}</p>

                <div className="mt-8 space-y-5 text-[15px] leading-[1.78] text-neutral-600">
                  {bookOfWeek.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                  ))}
                </div>

                <div className="mt-10 flex flex-wrap gap-3">
                  <a
                    href={bookOfWeek.purchaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-900 px-5 text-[13px] font-semibold text-white transition hover:bg-neutral-800"
                  >
                    Get the book
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  {bookOfWeek.insightSlug ? (
                    <Link
                      href={`/blog/${bookOfWeek.insightSlug}`}
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 px-5 text-[13px] font-semibold text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50"
                    >
                      Related insight
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-neutral-200 bg-neutral-50 py-16 md:py-24">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
            <h2 className={`text-[clamp(1.75rem,3vw,2.25rem)] font-medium tracking-[-0.02em] text-neutral-900 ${serif()}`}>
              Recommended reading
            </h2>
            <p className="mt-2 max-w-[560px] text-[15px] leading-relaxed text-neutral-600">
              Freight, logistics, and marketplace books we share with suppliers and carriers on the Alpha Freight network.
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {featuredBooks.map((book) => (
                <article
                  key={book.slug}
                  className="flex gap-5 rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-300 hover:shadow-[0_16px_48px_rgba(15,23,42,0.06)]"
                >
                  <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-xl bg-[#8fa3a8]">
                    <Image src={book.image} alt={book.title} fill sizes="112px" className="object-contain p-2" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-[1.125rem] font-medium leading-snug text-neutral-900 ${serif()}`}>{book.title}</h3>
                    <p className="mt-1 text-[13px] text-neutral-500">{book.author}</p>
                    <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-neutral-600">{book.paragraphs[0]}</p>
                    <a
                      href={book.purchaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-neutral-900 hover:underline"
                    >
                      Get the book
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-neutral-400">In-house publications</p>
                <h2 className={`mt-4 text-[clamp(1.75rem,3vw,2.25rem)] font-medium tracking-[-0.02em] text-neutral-900 ${serif()}`}>
                  Alpha Freight insights
                </h2>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-neutral-900"
              >
                <BookOpen className="h-4 w-4" />
                View all articles
              </Link>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {insights.map((article) => (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">{article.category}</p>
                    <h3 className={`mt-2 text-[1rem] font-medium leading-snug text-neutral-900 ${serif()}`}>{article.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <CinematicCTA />
      </main>

      <Footer />
    </div>
  );
}
