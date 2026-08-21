import { airDisplayFont, airScriptFont, airSerifFont } from "@/lib/air-fonts";
import "./air-portal.css";

export default function AirRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${airDisplayFont.variable} ${airSerifFont.variable} ${airScriptFont.variable} min-h-[100dvh]`}
    >
      {children}
    </div>
  );
}
