import {
  Box,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import {
  buildHumanReadableCargoSummary,
  parseLoadFormMeta,
  type LoadFormMeta,
} from "@/lib/load-form-meta";
import { stripLoadMarketMeta } from "@/lib/load-market-meta";
import { stripLoadFormMeta } from "@/lib/load-form-meta";

const SPECIAL_HANDLING_LABELS: Record<string, string> = {
  fragile: "Fragile",
  temperature: "Temperature controlled",
  adr: "ADR / Dangerous Goods",
  oversized: "Oversized",
};

export function getCarrierLoadNotesContext(notes?: string | null) {
  const meta = parseLoadFormMeta(notes) || ({} as LoadFormMeta);
  const cleanNotes = stripLoadFormMeta(stripLoadMarketMeta(notes || "")).trim();
  const autoSummary = buildHumanReadableCargoSummary(meta).trim();
  let extraNotes = cleanNotes;
  if (autoSummary && cleanNotes.startsWith(autoSummary)) {
    extraNotes = cleanNotes.slice(autoSummary.length).replace(/^\s*\n+/, "").trim();
  }
  return { meta, cleanNotes: extraNotes };
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
      <dt className="text-[12px] text-slate-500">{label}</dt>
      <dd className="max-w-[58%] text-right text-[12px] font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "blue" | "emerald" | "amber" | "slate" }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

type CarrierLoadDetailsPanelProps = {
  notes?: string | null;
  origin?: string | null;
  destination?: string | null;
  equipment?: string | null;
  weight?: string | null;
  commodity?: string | null;
  className?: string;
};

export default function CarrierLoadDetailsPanel({
  notes,
  origin,
  destination,
  equipment,
  weight,
  commodity,
  className = "",
}: CarrierLoadDetailsPanelProps) {
  const { meta, cleanNotes } = getCarrierLoadNotesContext(notes);

  const vehicleBadges = [
    meta.tail_lift ? "Tail lift" : null,
    meta.refrigerated ? "Refrigerated" : null,
    meta.adr_certified ? "ADR certified" : null,
    meta.forklift_required ? "Forklift required" : null,
    meta.crane_required ? "Crane required" : null,
    meta.pallet_exchange_required ? "Pallet exchange" : null,
  ].filter(Boolean) as string[];

  const specialHandling =
    meta.special_handling?.map((item) => SPECIAL_HANDLING_LABELS[item] || item).filter(Boolean) || [];

  const dimensions =
    meta.dimension_length || meta.dimension_width || meta.dimension_height
      ? `${meta.dimension_length || "—"} × ${meta.dimension_width || "—"} × ${meta.dimension_height || "—"} cm`
      : null;

  const hasCargo =
    meta.cargo_description ||
    meta.quantity ||
    meta.packaging_type ||
    meta.pallet_count ||
    meta.volume ||
    dimensions ||
    meta.declared_cargo_value ||
    specialHandling.length > 0 ||
    commodity;

  const hasRoute = origin || destination || meta.pickup_postcode || meta.delivery_postcode;
  const hasVehicle = equipment || vehicleBadges.length > 0 || meta.other_vehicle_requirements;

  if (!hasCargo && !hasRoute && !hasVehicle && !cleanNotes) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {hasRoute ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Route</h3>
          </div>
          <dl>
            <DetailRow label="Pickup" value={origin || undefined} />
            <DetailRow label="Pickup postcode" value={meta.pickup_postcode} />
            <DetailRow label="Delivery" value={destination || undefined} />
            <DetailRow label="Delivery postcode" value={meta.delivery_postcode} />
          </dl>
        </section>
      ) : null}

      {hasCargo ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-violet-600" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cargo</h3>
          </div>
          <dl>
            <DetailRow label="Commodity type" value={commodity || undefined} />
            <DetailRow label="Description" value={meta.cargo_description} />
            <DetailRow label="Quantity" value={meta.quantity} />
            <DetailRow label="Packaging" value={meta.packaging_type} />
            <DetailRow label="Units / pallets" value={meta.pallet_count} />
            <DetailRow label="Weight" value={weight ? `${weight} kg` : undefined} />
            <DetailRow label="Volume" value={meta.volume ? `${meta.volume} m³` : undefined} />
            <DetailRow label="Dimensions (L×W×H)" value={dimensions} />
            <DetailRow
              label="Declared goods value"
              value={meta.declared_cargo_value ? `£${meta.declared_cargo_value}` : undefined}
            />
          </dl>
          {specialHandling.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {specialHandling.map((item) => (
                <Badge key={item} tone="amber">
                  {item}
                </Badge>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {hasVehicle ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Truck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Vehicle</h3>
          </div>
          <dl>
            <DetailRow label="Equipment" value={equipment || undefined} />
          </dl>
          {vehicleBadges.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {vehicleBadges.map((item) => (
                <Badge key={item} tone="blue">
                  {item}
                </Badge>
              ))}
            </div>
          ) : null}
          {meta.other_vehicle_requirements ? (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[12px] leading-relaxed text-slate-700">
              {meta.other_vehicle_requirements}
            </p>
          ) : null}
        </section>
      ) : null}

      {meta.cargo_photo_urls?.length ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Box className="h-4 w-4 text-slate-600" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cargo photos</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {meta.cargo_photo_urls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
              >
                View file
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {cleanNotes ? (
        <section className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-700" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Additional notes</h3>
          </div>
          <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-amber-950">{cleanNotes}</p>
        </section>
      ) : null}

      {meta.urgency && meta.urgency !== "normal" ? (
        <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2">
          <Zap className="h-4 w-4 text-orange-600" />
          <p className="text-[12px] font-semibold text-orange-800">
            Urgency: {meta.urgency === "same-day" ? "Same day" : "Urgent"}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function buildCarrierLoadGeocodeQueries(options: {
  origin?: string | null;
  destination?: string | null;
  notes?: string | null;
  pickupPostcode?: string | null;
  deliveryPostcode?: string | null;
}) {
  const { meta } = getCarrierLoadNotesContext(options.notes);
  const stripParenPostcode = (value?: string | null) =>
    String(value || "")
      .replace(/\s*\([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\)\s*$/i, "")
      .trim();

  const originCity = stripParenPostcode(options.origin);
  const destinationCity = stripParenPostcode(options.destination);
  const pickupPostcode = options.pickupPostcode || meta.pickup_postcode;
  const deliveryPostcode = options.deliveryPostcode || meta.delivery_postcode;

  const originQuery = pickupPostcode
    ? `${pickupPostcode}, ${originCity || options.origin || ""}, United Kingdom`.replace(/,\s*,/g, ",")
    : String(options.origin || "");
  const destinationQuery = deliveryPostcode
    ? `${deliveryPostcode}, ${destinationCity || options.destination || ""}, United Kingdom`.replace(/,\s*,/g, ",")
    : String(options.destination || "");

  return {
    originQuery,
    destinationQuery,
    meta,
  };
}
