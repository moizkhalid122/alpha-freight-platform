import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import AnalyticsPageTracker from "@/components/AnalyticsPageTracker";
import Chatbot from "@/components/Chatbot";
import JsonLd from "@/components/seo/JsonLd";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import { createPageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/sitemap-data";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "Freight Broker UK | Load Matching & Verified Carriers | Alpha Freight",
    description:
      "UK's leading freight brokerage platform. Connect with verified carriers, AI-powered load matching, real-time tracking and guaranteed 7-day payouts. Post loads free today.",
    path: "/",
    keywords: [
      "freight broker UK",
      "find loads UK",
      "post loads online UK",
      "load board UK",
      "find freight loads",
      "post haulage loads",
      "verified carriers UK",
      "7-day payouts logistics",
    ],
  }),
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${plusJakartaSans.variable} ${inter.variable} antialiased`}
    >
      <body className="flex flex-col font-sans">
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Alpha Freight Solutions Limited",
              url: SITE_URL,
              logo: `${SITE_URL}/favicon-192.png`,
              email: "support@alphafreightuk.com",
              telephone: "+44 7782 294718",
              address: {
                "@type": "PostalAddress",
                streetAddress: "124 City Road",
                addressLocality: "London",
                postalCode: "EC1V 2NX",
                addressCountry: "GB",
              },
              sameAs: ["https://www.alphafreightuk.com"],
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Alpha Freight",
              url: SITE_URL,
              potentialAction: {
                "@type": "SearchAction",
                target: `${SITE_URL}/knowledge-base?search={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            },
          ]}
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              send_page_view: true,
              page_path: window.location.pathname,
              page_location: window.location.href,
            });
          `}
        </Script>
        <AnalyticsPageTracker />
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
