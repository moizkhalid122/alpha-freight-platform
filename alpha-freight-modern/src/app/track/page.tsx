"use client";

import { Suspense } from "react";

import ToolsShell from "@/components/tools/ToolsShell";
import TrackShipmentForm from "@/components/tools/TrackShipmentForm";

function TrackPageContent() {
  return (
    <ToolsShell
      eyebrow="Shipment visibility"
      title="Track Shipment"
      description="Enter your Alpha Freight load reference to see booking and transit status. No login required for booked shipments."
    >
      <TrackShipmentForm />
    </ToolsShell>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
      <TrackPageContent />
    </Suspense>
  );
}
