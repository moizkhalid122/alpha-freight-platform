import Image from "next/image";
import { AlertTriangle } from "lucide-react";

import {
  alastairMasseyWarningImage,
  officialPublicWarningBlocks,
  officialPublicWarningTitle,
} from "@/lib/official-public-warning-content";

const displayFont = "var(--font-air-display), Georgia, 'Times New Roman', serif";
const serifFont = "var(--font-air-serif), Georgia, 'Times New Roman', serif";

export default function OfficialPublicWarningDocument() {
  return (
    <article className="w-full">
      <div className="flex items-center gap-4 border-2 border-red-600 bg-red-700 px-6 py-5 md:px-10 md:py-6">
        <AlertTriangle className="h-8 w-8 shrink-0 text-white md:h-9 md:w-9" aria-hidden />
        <p
          className="text-sm font-semibold uppercase tracking-[0.2em] text-white md:text-base"
          style={{ fontFamily: displayFont }}
        >
          Serious public notice — read in full
        </p>
      </div>

      <div className="border-x-2 border-b-2 border-red-600 bg-gradient-to-b from-red-950/50 via-[#0c0c0c] to-[#0a0a0a] px-6 py-10 md:px-12 md:py-14 lg:px-16 lg:py-16">
        <figure className="mx-auto mb-10 max-w-md text-center md:mb-12">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[min(100%,320px)] overflow-hidden rounded-2xl border-2 border-red-500/70 bg-[#151515] shadow-xl shadow-red-950/50">
            <Image
              src={alastairMasseyWarningImage.src}
              alt={alastairMasseyWarningImage.alt}
              fill
              priority
              className="object-cover object-top"
              sizes="(max-width: 768px) 90vw, 320px"
            />
          </div>
          <figcaption
            className="mt-5 text-lg font-medium text-white/90 md:text-xl"
            style={{ fontFamily: serifFont }}
          >
            {alastairMasseyWarningImage.name}
          </figcaption>
        </figure>

        <h1
          className="mx-auto max-w-4xl text-center text-[clamp(1.5rem,4.2vw,2.85rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-white"
          style={{ fontFamily: displayFont }}
        >
          {officialPublicWarningTitle}
        </h1>

        <div className="mx-auto mt-10 max-w-4xl space-y-7 md:mt-12 md:space-y-8">
          {officialPublicWarningBlocks.map((block, index) =>
            block.type === "emphasis" ? (
              <p
                key={index}
                className="rounded-xl border-2 border-red-500/50 bg-red-950/40 px-5 py-4 text-lg font-bold leading-[1.75] text-red-50 md:px-7 md:py-5 md:text-xl md:leading-[1.8]"
                style={{ fontFamily: serifFont }}
              >
                {block.text}
              </p>
            ) : (
              <p
                key={index}
                className="text-lg leading-[1.9] text-white/88 md:text-xl md:leading-[1.95]"
                style={{ fontFamily: serifFont }}
              >
                {block.text}
              </p>
            ),
          )}
        </div>
      </div>
    </article>
  );
}