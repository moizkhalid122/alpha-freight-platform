import { CheckCircle2, Mail } from "lucide-react";
import { VERIFIED_OFFICIAL_CONTACTS } from "@/lib/official-contacts";

export default function VerifiedOfficialContacts({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-emerald-200 bg-emerald-50/50 ${
        compact ? "p-5" : "p-6 sm:p-8"
      }`}
    >
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        Verified Official Contacts
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Only trust these official @alphafreightuk.com addresses for Alpha Freight employees and
        company support.
      </p>

      <ul className={`mt-5 space-y-3 ${compact ? "" : "sm:grid sm:grid-cols-1 sm:gap-3 sm:space-y-0 lg:grid-cols-1 lg:space-y-3"}`}>
        {VERIFIED_OFFICIAL_CONTACTS.map((contact) => (
          <li
            key={contact.email}
            className="flex items-start justify-between gap-4 rounded-xl border border-white/80 bg-white px-4 py-4 shadow-sm"
          >
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{contact.name}</p>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                {contact.role}
              </p>
              <a
                href={`mailto:${contact.email}`}
                className="mt-2 inline-flex items-center gap-1.5 break-all font-mono text-sm text-emerald-800 hover:underline"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {contact.email}
              </a>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
