"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Newspaper } from "lucide-react";
import { getFeaturedBookOfWeek } from "@/lib/book-content";

const serif = () => "font-[family-name:var(--font-home-serif)]";

export default function HomeBookOfWeek() {
  const featuredBook = getFeaturedBookOfWeek();
  const insightHref = featuredBook.insightSlug ? `/blog/${featuredBook.insightSlug}` : "/blog";

  return (
    <section className="border-b border-neutral-200 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
        <div className="home-fade">
          <h2 className={`text-[clamp(1.75rem,3vw,2.25rem)] font-medium tracking-[-0.02em] text-neutral-900 ${serif()}`}>
            Book of the week
          </h2>
          <p className="mt-2 text-[15px] text-neutral-500">Freight moves on what you don&apos;t see.</p>
        </div>

        <div className="home-fade mt-12 grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-16">
          <div className="relative overflow-hidden rounded-2xl bg-[#8fa3a8] px-8 py-12 sm:px-12 sm:py-16 lg:min-h-[520px] lg:px-14">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[300px] drop-shadow-[0_28px_48px_rgba(15,23,42,0.28)]">
              <Image
                src={featuredBook.image}
                alt={`${featuredBook.title} by ${featuredBook.author}`}
                fill
                sizes="(max-width: 1024px) 80vw, 300px"
                className="object-contain"
              />
            </div>
          </div>

          <div className="home-fade relative">
            <Link
              href="/library"
              className="absolute right-0 top-0 hidden h-28 w-28 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-center transition hover:border-neutral-300 hover:bg-neutral-100 lg:flex"
            >
              <div className="px-3">
                <p className="text-[8px] font-semibold uppercase leading-tight tracking-[0.18em] text-neutral-400">
                  The Library
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-700">Alpha Freight</p>
              </div>
            </Link>

            <p className="text-[13px] italic text-neutral-500">
              &ldquo;{featuredBook.quote}&rdquo;{" "}
              <span className="not-italic text-[#c0392b]">— {featuredBook.quoteSource}</span>
            </p>

            <h3 className={`mt-6 text-[clamp(1.5rem,2.4vw,2rem)] font-medium leading-tight tracking-[-0.02em] text-neutral-900 ${serif()}`}>
              {featuredBook.title}
            </h3>
            <p className="mt-2 text-[15px] font-medium text-neutral-600">{featuredBook.author}</p>
            <p className="mt-1 text-[12px] uppercase tracking-[0.14em] text-neutral-400">{featuredBook.credit}</p>

            <div className="mt-8 space-y-5 text-[15px] leading-[1.78] text-neutral-600">
              {featuredBook.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>

            <p className="mt-10 text-[13px] leading-relaxed text-neutral-500">
              For more on UK freight, transparency, and marketplace operations, explore our in-house publications:
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/blog"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-900 px-5 text-[13px] font-semibold text-white transition hover:bg-neutral-800"
              >
                <BookOpen className="h-4 w-4" />
                Alpha Freight Blog
              </Link>
              <Link
                href={insightHref}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 text-[13px] font-semibold text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                <Newspaper className="h-4 w-4" />
                Latest insight
              </Link>
              <a
                href={featuredBook.purchaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 text-[13px] font-semibold text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                Get the book
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
