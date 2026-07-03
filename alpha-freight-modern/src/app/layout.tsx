import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Chatbot from "@/components/Chatbot";
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
  metadataBase: new URL(SITE_URL),
  title: "Freight Broker UK | Load Matching & Verified Carriers | Alpha Freight",
  description: "UK's leading freight brokerage platform. Connect with 5,000+ verified carriers, AI-powered load matching, real-time tracking & guaranteed 7-day payouts. Post loads free today!",
  keywords: ["freight broker UK", "load matching service", "verified carriers UK", "freight brokerage platform", "shipment tracking", "7-day payouts logistics"],
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
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
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
