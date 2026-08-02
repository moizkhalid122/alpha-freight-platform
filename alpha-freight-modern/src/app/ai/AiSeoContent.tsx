import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { AI_TOPIC_PAGES } from "@/lib/ai-topic-pages";
import { AI_MAIN_FAQS, getAiBreadcrumbSchema, getAiTopicListSchema } from "@/lib/ai-seo-data";
import { absoluteUrl } from "@/lib/seo";

export default function AiSeoContent() {
  const pageUrl = absoluteUrl("/ai");

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Alpha Freight AI — Free UK Freight AI",
            url: pageUrl,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
            description:
              "Free UK freight AI for haulage, logistics, RPM, diesel, loads, and Alpha Freight marketplace help.",
            provider: {
              "@type": "Organization",
              name: "Alpha Freight Solutions Limited",
              url: absoluteUrl("/"),
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Alpha Freight AI",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: pageUrl,
            offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
            description: "Free UK freight AI by Alpha Freight for haulage, RPM, diesel, loads, and logistics.",
            provider: {
              "@type": "Organization",
              name: "Alpha Freight Solutions Limited",
              url: absoluteUrl("/"),
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: AI_MAIN_FAQS.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          },
          getAiTopicListSchema(),
          getAiBreadcrumbSchema(),
        ]}
      />
      <nav aria-label="UK freight AI guides" className="sr-only">
        <h1>Free UK Freight AI — Alpha Freight</h1>
        <p>
          Ask about UK freight, haulage, RPM, diesel, find loads, post loads, POD, and carrier payouts.
          Free freight AI for carriers and suppliers. Search keywords: UK freight AI, freight AI, haulage AI,
          free freight AI.
        </p>
        <h2>AI guides</h2>
        <ul>
          {AI_TOPIC_PAGES.map((topic) => (
            <li key={topic.slug}>
              <Link href={`/ai/${topic.slug}`}>{topic.h1}</Link>
              <p>{topic.intro}</p>
            </li>
          ))}
        </ul>
        {AI_MAIN_FAQS.map((faq) => (
          <div key={faq.question}>
            <h2>{faq.question}</h2>
            <p>{faq.answer}</p>
          </div>
        ))}
      </nav>
    </>
  );
}
