"use client";

import TransportModeAuthShell from "@/components/auth/TransportModeAuthShell";
import { airDisplayFont, airScriptFont, airSerifFont } from "@/lib/air-fonts";
import { getTransportMode } from "@/lib/transport-modes";
import "@/app/air/air-portal.css";

export default function AirAuthLayout({ children }: { children: React.ReactNode }) {
  const mode = getTransportMode("air");

  if (!mode) return <>{children}</>;

  return (
    <div className={`${airDisplayFont.variable} ${airSerifFont.variable} ${airScriptFont.variable}`}>
      <TransportModeAuthShell mode={mode}>{children}</TransportModeAuthShell>
    </div>
  );
}
