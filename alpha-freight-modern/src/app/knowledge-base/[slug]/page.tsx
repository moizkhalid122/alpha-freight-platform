import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

import Navbar from "@/components/Navbar";
import JsonLd from "@/components/seo/JsonLd";
import { CinematicCTA, Footer } from "@/components/Footer";
import {
  getKnowledgeBaseArticle,
  getRelatedKnowledgeBaseArticles,
} from "@/lib/knowledge-base-content";
import { createArticleMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const { knowledgeBaseArticles } = await import("@/lib/knowledge-base-content");
  return knowledgeBaseArticles.map((article) => ({ slug: article.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = getKnowledgeBaseArticle(slug);

  if (!article) {
    return { title: "Article Not Found | Alpha Freight" };
  }

  return createArticleMetadata({
    title: `${article.title} | Alpha Freight Knowledge Base`,
    description: article.excerpt,
    path: `/knowledge-base/${slug}`,
  });
}

export default async function KnowledgeBaseArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getKnowledgeBaseArticle(slug);

  if (!article) {
    notFound();
  }

  const related = getRelatedKnowledgeBaseArticles(slug);

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-900">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.content.map((paragraph) => ({
            "@type": "Question",
            name: article.title,
            acceptedAnswer: {
              "@type": "Answer",
              text: paragraph,
            },
          })),
        }}
      />

      <Navbar variant="dark" />

      <main className="mx-auto max-w-[860px] px-6 pt-32 pb-24">
        <Link
          href="/knowledge-base"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Knowledge Base
        </Link>

        <div className="mt-8 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          <span className="rounded-full bg-slate-900 px-3 py-1 text-white">{article.category}</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {article.readTime}
          </span>
        </div>

        <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
          {article.title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-500">{article.excerpt}</p>

        <article className="mt-10 space-y-5">
          {article.content.map((paragraph, index) => (
            <p key={index} className="text-base leading-[1.85] text-slate-600">
              {paragraph}
            </p>
          ))}
        </article>

        <section className="mt-12 rounded-[1.5rem] border border-slate-200 bg-white p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Related links</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {article.related.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900"
              >
                {item.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </section>

        {related.length > 0 ? (
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-slate-900">Related articles</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/knowledge-base/${item.id}`}
                  className="rounded-[1.25rem] border border-slate-200 bg-white p-5 hover:-translate-y-1 transition-transform"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {item.category}
                  </p>
                  <h3 className="mt-2 font-semibold text-slate-900">{item.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <CinematicCTA
        title="Need help with a live shipment?"
        subtitle="Our support team is ready to assist"
        buttonText="Contact Support"
        buttonHref="/support"
      />
      <Footer />
    </div>
  );
}
