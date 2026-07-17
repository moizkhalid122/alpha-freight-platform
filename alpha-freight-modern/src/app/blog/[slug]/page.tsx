import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import { getBlogArticle, getRelatedArticles } from "@/lib/blog-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const { blogArticles } = await import("@/lib/blog-content");
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = getBlogArticle(slug);

  if (!article) {
    return { title: "Article Not Found | Alpha Freight" };
  }

  return {
    title: `${article.title} | Alpha Freight Blog`,
    description: article.excerpt,
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getBlogArticle(slug);

  if (!article) {
    notFound();
  }

  const related = getRelatedArticles(slug);

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-black overflow-x-hidden">
      <Navbar variant="dark" />

      <main className="pt-28 md:pt-32">
        <section className="pb-10 md:pb-14">
          <div className="max-w-[1200px] mx-auto px-5 md:px-6 lg:px-12">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-black/45 hover:text-black transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-[0.22em] text-black/45">
              <span className="px-3 py-1 bg-black text-white">{article.category}</span>
              <span>{article.publishedAt}</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {article.readTime}
              </span>
            </div>

            <h1 className="mt-6 text-[2.6rem] sm:text-[3.6rem] md:text-[4.4rem] font-medium leading-[0.95] tracking-tighter text-[#171717] max-w-[980px]">
              {article.title}
            </h1>

            <p className="mt-6 text-[17px] md:text-[19px] leading-[1.7] text-black/50 max-w-[760px]">
              {article.excerpt}
            </p>

            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-black/35">
              By {article.author}
            </p>
          </div>
        </section>

        <section className="pb-14 md:pb-20">
          <div className="max-w-[1200px] mx-auto px-5 md:px-6 lg:px-12">
            <div className="relative aspect-[16/9] overflow-hidden rounded-[2rem] bg-[#dfdfd8]">
              <Image
                src={article.image}
                alt={article.title}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="max-w-[1200px] mx-auto px-5 md:px-6 lg:px-12">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-12 lg:gap-16">
              <article className="space-y-10">
                {article.sections.map((section, index) => (
                  <div key={index} className="space-y-5">
                    {section.heading ? (
                      <h2 className="text-[1.8rem] md:text-[2.2rem] font-medium tracking-tight text-[#171717]">
                        {section.heading}
                      </h2>
                    ) : null}
                    {section.paragraphs.map((paragraph, paragraphIndex) => (
                      <p
                        key={paragraphIndex}
                        className="text-[16px] md:text-[18px] leading-[1.85] text-black/55"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ))}
              </article>

              <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
                <div className="rounded-[1.75rem] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/35">
                    Alpha Freight Insights
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-black/50">
                    Practical updates on marketplace operations, carrier networks, and the technology shaping UK freight.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-[#BFFF07] hover:text-black transition-colors"
                  >
                    Talk to our team
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="pb-24 md:pb-32">
          <div className="max-w-[1200px] mx-auto px-5 md:px-6 lg:px-12">
            <div className="flex items-end justify-between gap-6 mb-8">
              <h2 className="text-[2rem] md:text-[2.6rem] font-medium tracking-tight text-[#171717]">
                Related Articles
              </h2>
              <Link
                href="/blog"
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/45 hover:text-black transition-colors"
              >
                View all
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-4 md:gap-5">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/blog/${item.slug}`}
                  className="group rounded-[1.5rem] overflow-hidden bg-white border border-black/5 hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="relative aspect-[1.25/0.88] bg-[#dfdfd8]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-5 space-y-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/35">
                      {item.category}
                    </p>
                    <h3 className="text-[1.35rem] font-medium leading-tight tracking-tight text-[#202020]">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <CinematicCTA
        title="Ready to move freight with more clarity?"
        subtitle="Join the Alpha Freight marketplace"
        buttonText="Get Started"
        buttonHref="/auth/select"
      />
      <Footer />
    </div>
  );
}
