import { Cormorant_Garamond, Great_Vibes, Playfair_Display } from "next/font/google";

export const airDisplayFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-air-display",
  weight: ["400", "500", "600", "700"],
});

export const airSerifFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-air-serif",
  weight: ["400", "500", "600", "700"],
});

export const airScriptFont = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-air-script",
  weight: ["400"],
});
