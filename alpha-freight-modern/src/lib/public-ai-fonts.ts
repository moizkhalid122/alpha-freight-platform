import { Cormorant_Garamond } from "next/font/google";

export const publicAiReplyFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-public-ai-reply",
  weight: ["400", "500", "600", "700"],
});

export const publicAiReplyFontClass = "public-ai-reply-font";
