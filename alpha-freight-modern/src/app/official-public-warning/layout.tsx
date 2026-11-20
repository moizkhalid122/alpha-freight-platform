import type { ReactNode } from "react";

import JsonLd from "@/components/seo/JsonLd";
import { officialPublicWarningSeoDescription, officialPublicWarningTitle } from "@/lib/official-public-warning-content";
import { marketingSeo } from "@/lib/marketing-seo";
import { SITE_URL } from "@/lib/sitemap-data";

export const metadata = marketingSeo.officialPublicWarning;

const pageUrl = `${SITE_URL}/official-public-warning`;

export default function OfficialPublicWarningLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": `${pageUrl}#webpage`,
            url: pageUrl,
            name: officialPublicWarningTitle,
            description: officialPublicWarningSeoDescription,
            inLanguage: "en-GB",
            isAccessibleForFree: true,
            primaryImageOfPage: {
              "@type": "ImageObject",
              url: `${SITE_URL}/leadership/commercial-director.jpg`,
            },
            about: {
              "@type": "Organization",
              name: "Alpha Freight Solutions Limited",
              legalName: "Alpha Freight Solutions Limited",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: officialPublicWarningTitle,
            description: officialPublicWarningSeoDescription,
            url: pageUrl,
            inLanguage: "en-GB",
            author: {
              "@type": "Person",
              name: "Khalid Mehmood",
            },
            publisher: {
              "@type": "Organization",
              name: "Alpha Freight Solutions Limited",
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${pageUrl}#webpage`,
            },
          },
        ]}
      />
      {children}
    </>
  );
}