import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import AiTopicLanding from "@/components/marketing/AiTopicLanding";
import { AI_TOPIC_PAGES, getTopicBySlug } from "@/lib/ai-topic-pages";
import { getAiBreadcrumbSchema } from "@/lib/ai-seo-data";
import { createPageMetadata, absoluteUrl } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return AI_TOPIC_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return {};

  return createPageMetadata({
    title: topic.title,
    description: topic.description,
    path: `/ai/${topic.slug}`,
    keywords: topic.keywords,
    image: "/alpha freight truck.jpg",
  });
}

export default async function AiTopicPage({ params }: PageProps) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();

  const pageUrl = absoluteUrl(`/ai/${topic.slug}`);

  const relatedTopics = AI_TOPIC_PAGES.filter((item) => item.slug !== topic.slug).slice(0, 4);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: topic.title,
            description: topic.description,
            url: pageUrl,
            isPartOf: {
              "@type": "WebSite",
              name: "Alpha Freight",
              url: absoluteUrl("/"),
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: topic.h1,
                acceptedAnswer: { "@type": "Answer", text: topic.intro },
              },
            ],
          },
          getAiBreadcrumbSchema(topic.slug, topic.h1),
        ]}
      />
      <nav aria-label={`${topic.h1} — related AI guides`} className="sr-only">
        <h1>{topic.h1}</h1>
        <p>{topic.intro}</p>
        <p>
          <Link href="/ai">Free UK Freight AI</Link>
          {topic.relatedTool ? (
            <>
              {" · "}
              <Link href={topic.relatedTool.href}>{topic.relatedTool.label}</Link>
            </>
          ) : null}
        </p>
        <h2>Related AI guides</h2>
        <ul>
          {relatedTopics.map((item) => (
            <li key={item.slug}>
              <Link href={`/ai/${item.slug}`}>{item.h1}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <AiTopicLanding topic={topic} canonicalUrl={pageUrl} />
    </>
  );
}
