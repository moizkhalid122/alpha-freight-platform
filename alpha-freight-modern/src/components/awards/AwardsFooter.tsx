"use client";

import Link from "next/link";

const LINKS = [
  { label: "Awards", href: "#categories" },
  { label: "Sponsors", href: "#register" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy-policy" },
];

const SOCIAL = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/alpha-freight-solutions-4aa8a43a6" },
  { label: "YouTube", href: "https://www.youtube.com/@ALPHAFREIGHTSOLUTIONS" },
  { label: "Instagram", href: "https://www.instagram.com/alphafreight.uk" },
];

export function AwardsFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white pt-14 pb-10">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">Alpha Freight Awards</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
              The UK&apos;s premium logistics awards — built on verified performance and trust.
            </p>
          </div>
          <div className="flex flex-wrap gap-5">
            {LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="text-sm text-slate-500 hover:text-[#3B82F6]">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Alpha Freight Solutions</p>
          <div className="flex gap-4">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-[#3B82F6]"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
