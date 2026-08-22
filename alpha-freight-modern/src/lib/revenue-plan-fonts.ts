import { Cormorant_Garamond, DM_Sans, Playfair_Display } from "next/font/google";

export const planDisplayFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-plan-display",
  weight: ["400", "500", "600", "700"],
});

export const planSerifFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-plan-serif",
  weight: ["400", "500", "600", "700"],
});

export const planSansFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-plan-sans",
  weight: ["400", "500", "600", "700"],
});

export const planFontClassName = `${planDisplayFont.variable} ${planSerifFont.variable} ${planSansFont.variable}`;
