"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock,
  CreditCard,
  HelpCircle,
  Search,
  Shield,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";
import {
  knowledgeBaseArticles as articles,
  knowledgeBaseCategories as categories,
  type KnowledgeBaseCategory as Category,
} from "@/lib/knowledge-base-content";

gsap.registerPlugin(ScrollTrigger);

const categoryMeta: Record<
  Exclude<Category, "All">,
  { icon: typeof BookOpen; color: string; count: number }
> = {
  "Getting Started": { icon: Sparkles, color: "bg-violet-50 text-violet-700 ring-violet-100", count: 0 },
  Carriers: { icon: Truck, color: "bg-sky-50 text-sky-700 ring-sky-100", count: 0 },
  Suppliers: { icon: Users, color: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100", count: 0 },
  Payments: { icon: CreditCard, color: "bg-emerald-50 text-emerald-700 ring-emerald-100", count: 0 },
  Compliance: { icon: Shield, color: "bg-amber-50 text-amber-700 ring-amber-100", count: 0 },
  Platform: { icon: HelpCircle, color: "bg-slate-50 text-slate-700 ring-slate-100", count: 0 },
};

articles.forEach((article) => {
  categoryMeta[article.category].count += 1;
});

export default function KnowledgeBasePage() {
  useMarketingSmoothScroll();
  const searchParams = useSearchParams();
  const router = useRouter();
  const revealRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  useEffect(() => {
    const articleId = searchParams.get("article");
    const search = searchParams.get("search");

    if (articleId) {
      router.replace(`/knowledge-base/${articleId}`);
      return;
    }

    if (search) {
      setQuery(search);
    }
  }, [searchParams, router]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".kb-reveal").forEach((el) => {
        gsap.from(el, {
          y: 32,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
    }, revealRef);
    return () => ctx.revert();
  }, []);

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesCategory = activeCategory === "All" || article.category === activeCategory;
      const matchesQuery =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  const popularArticles = useMemo(() => articles.filter((a) => a.popular), []);

  return (
    <div ref={revealRef} className="min-h-screen bg-[#fafafa] font-sans text-slate-900 selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-10">
          <section className="kb-reveal text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-600">Help & guidance</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Knowledge Base</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-500">
              Search guides, FAQs, and step-by-step articles for carriers, suppliers, payments, and platform setup.
            </p>

            <div className="relative mx-auto mt-10 max-w-2xl">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles — payouts, POD, vetting, posting loads..."
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-sm shadow-[0_12px_40px_rgba(15,23,42,0.06)] outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-[#BFFF07]/40"
              />
            </div>
          </section>

          <section className="kb-reveal mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(categoryMeta) as Exclude<Category, "All">[]).map((category) => {
              const meta = categoryMeta[category];
              const Icon = meta.icon;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-[1.5rem] border p-5 text-left transition hover:shadow-lg ${
                    activeCategory === category
                      ? "border-slate-900 bg-white shadow-md"
                      : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${meta.color}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{meta.count} articles</span>
                  </div>
                  <h2 className="mt-4 font-semibold text-slate-900">{category}</h2>
                </button>
              );
            })}
          </section>

          <section className="kb-reveal mt-12 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeCategory === category
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-900"
                }`}
              >
                {category}
              </button>
            ))}
          </section>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-900">
                  {activeCategory === "All" ? "All articles" : activeCategory}
                </h2>
                <span className="text-sm text-slate-400">{filteredArticles.length} results</span>
              </div>

              {filteredArticles.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-8 py-16 text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-4 font-semibold text-slate-900">No articles found</p>
                  <p className="mt-2 text-sm text-slate-500">Try a different search term or browse another category.</p>
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <motion.div key={article.id} layout className="kb-reveal">
                    <Link
                      href={`/knowledge-base/${article.id}`}
                      className="group block w-full rounded-[1.5rem] border border-slate-200/80 bg-white p-6 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
                    >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                        {article.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {article.readTime}
                      </span>
                      {article.popular && (
                        <span className="rounded-full bg-[#BFFF07]/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-800">
                          Popular
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-slate-900 group-hover:text-slate-700">{article.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{article.excerpt}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
                      Read article
                      <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                    </Link>
                  </motion.div>
                ))
              )}
            </section>

            <aside className="kb-reveal space-y-6 lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Popular articles</h3>
                <ul className="mt-4 space-y-3">
                  {popularArticles.map((article) => (
                    <li key={article.id}>
                      <Link
                        href={`/knowledge-base/${article.id}`}
                        className="text-left text-sm font-medium text-slate-600 transition hover:text-slate-900"
                      >
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.75rem] bg-slate-900 p-6 text-white">
                <h3 className="text-lg font-bold">Still need help?</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  Our support team and AI assistant can help with live shipment issues and account questions.
                </p>
                <div className="mt-5 space-y-2">
                  <Link href="/support" className="flex items-center gap-2 text-sm font-semibold text-[#BFFF07]">
                    Help center <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/products/ai-assistant" className="flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
                    AI Assistant <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/docs?tab=overview" className="flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
                    Full documentation <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <CinematicCTA />
      <Footer />
    </div>
  );
}
