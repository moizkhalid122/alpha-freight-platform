"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { blogArticles } from "@/lib/blog-content";

const serif = () => "font-[family-name:var(--font-home-serif)]";

const newsroomSlugs = [
  "transparency-standard-freight",
  "road-to-net-zero",
  "digital-pod-momentum",
  "final-mile-precision",
];

function formatNewsDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
}

function categoryLabel(category: (typeof blogArticles)[number]["category"]) {
  if (category === "Company News") return "News";
  return "Insights";
}

export default function HomeNewsroomShowcase() {
  const articles = newsroomSlugs
    .map((slug) => blogArticles.find((article) => article.slug === slug))
    .filter(Boolean) as (typeof blogArticles)[number][];

  return (
    <section className="border-b border-neutral-200 bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
        <div className="home-fade">
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-neutral-400">Recent articles</p>
          <h2 className={`mt-4 text-[clamp(2.25rem,4vw,3.5rem)] font-medium leading-[1.02] tracking-[-0.015em] text-neutral-900 ${serif()}`}>
            Newsroom
          </h2>
        </div>

        <div className="home-fade mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-12 sm:gap-5 [&::-webkit-scrollbar]:hidden">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group w-[78vw] shrink-0 snap-start sm:w-[280px] lg:w-[calc((100%-3.75rem)/4)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 640px) 78vw, 280px"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute left-4 top-4 rounded-md bg-black/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                  {categoryLabel(article.category)}
                </span>
              </div>
              <p className="mt-4 text-[12px] font-medium text-neutral-400">{formatNewsDate(article.publishedAt)}</p>
              <h3 className={`mt-2 text-[1.125rem] font-medium leading-snug tracking-[-0.015em] text-neutral-900 transition group-hover:text-neutral-600 ${serif()}`}>
                {article.title}
              </h3>
            </Link>
          ))}
        </div>

        <div className="mt-8 sm:hidden">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-neutral-900"
          >
            View all articles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
