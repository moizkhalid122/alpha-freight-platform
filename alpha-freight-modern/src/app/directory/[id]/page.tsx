"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Mail,
  MapPin,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import type { PublicCarrierListing } from "@/lib/public-directory";

const FALLBACK_IMAGE = "/alpha freight truck.jpg";

export default function CarrierProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [carrier, setCarrier] = useState<PublicCarrierListing | null>(null);
  const [related, setRelated] = useState<PublicCarrierListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShortlisted, setIsShortlisted] = useState(false);

  useEffect(() => {
    async function loadCarrier() {
      setLoading(true);

      try {
        const response = await fetch("/api/public/carriers");
        const payload = (await response.json()) as { carriers?: PublicCarrierListing[] };
        const carriers = payload.carriers ?? [];
        const found = carriers.find((item) => item.id === id) ?? null;

        setCarrier(found);
        setRelated(carriers.filter((item) => item.id !== id).slice(0, 3));

        if (found) {
          const shortlist = JSON.parse(localStorage.getItem("alpha_shortlist") || "[]");
          setIsShortlisted(shortlist.includes(found.id));
        }
      } finally {
        setLoading(false);
      }
    }

    if (id) loadCarrier();
  }, [id]);

  const toggleShortlist = () => {
    if (!carrier) return;

    const shortlist = JSON.parse(localStorage.getItem("alpha_shortlist") || "[]");
    const next = isShortlisted
      ? shortlist.filter((item: string) => item !== carrier.id)
      : [...shortlist, carrier.id];

    localStorage.setItem("alpha_shortlist", JSON.stringify(next));
    window.dispatchEvent(new Event("alpha_shortlist_updated"));
    setIsShortlisted(!isShortlisted);
  };

  const contactHref = useMemo(() => {
    if (!carrier) return "/contact";
    const subject = encodeURIComponent(`Carrier enquiry: ${carrier.company_name}`);
    const body = encodeURIComponent(
      `Hello Alpha Freight team,\n\nI would like to connect with ${carrier.company_name} regarding freight capacity.\n\nThanks,`,
    );
    return `mailto:support@alphafreightuk.com?subject=${subject}&body=${body}`;
  }, [carrier]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD]">
        <Navbar variant="dark" />
        <div className="mx-auto max-w-5xl px-6 pt-40 pb-24 animate-pulse space-y-8">
          <div className="h-8 w-40 rounded bg-slate-100" />
          <div className="h-64 rounded-[2rem] bg-slate-100" />
          <div className="h-40 rounded-[2rem] bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!carrier) {
    return (
      <div className="min-h-screen bg-[#FDFDFD]">
        <Navbar variant="dark" />
        <div className="mx-auto max-w-3xl px-6 pt-40 pb-24 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Carrier not found</h1>
          <p className="mt-4 text-slate-500">
            This profile is not available or the carrier is not yet verified on Alpha Freight.
          </p>
          <Link
            href="/directory"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to directory
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <Navbar variant="dark" />

      <main className="mx-auto max-w-6xl px-6 pt-36 pb-24">
        <Link
          href="/directory"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to directory
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)]"
        >
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative min-h-[320px] bg-slate-100">
              <Image
                src={carrier.image || FALLBACK_IMAGE}
                alt={carrier.company_name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  {carrier.tag}
                </span>
                <h1 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-white">
                  {carrier.company_name}
                </h1>
              </div>
            </div>

            <div className="p-8 md:p-10 space-y-6">
              <div className="flex items-center gap-2 text-amber-500">
                <Star className="h-5 w-5 fill-current" />
                <span className="text-lg font-bold text-slate-900">{carrier.rating.toFixed(1)}</span>
                <span className="text-sm text-slate-400">({carrier.reviews} completed loads)</span>
              </div>

              <div className="space-y-3 text-sm text-slate-600">
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {carrier.city}
                </p>
                <p className="inline-flex items-center gap-2">
                  <Truck className="h-4 w-4 text-slate-400" />
                  {carrier.vehicle_types.join(" · ")}
                </p>
              </div>

              <p className="text-sm leading-relaxed text-slate-600">{carrier.description}</p>

              <div className="flex flex-wrap gap-2">
                {carrier.service_areas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600"
                  >
                    {area}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={contactHref}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white hover:bg-[#BFFF07] hover:text-black transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Contact via Alpha
                </a>
                <button
                  type="button"
                  onClick={toggleShortlist}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 hover:border-slate-900 transition-colors"
                >
                  <Bookmark className={`h-4 w-4 ${isShortlisted ? "fill-slate-900" : ""}`} />
                  {isShortlisted ? "Shortlisted" : "Shortlist"}
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {related.length > 0 ? (
          <section className="mt-16">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-900">More verified carriers</h2>
              <Link href="/directory" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
                View all
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(`/directory/${item.id}`)}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-left hover:-translate-y-1 transition-transform"
                >
                  <p className="font-semibold text-slate-900">{item.company_name}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.city}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                    View profile
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
