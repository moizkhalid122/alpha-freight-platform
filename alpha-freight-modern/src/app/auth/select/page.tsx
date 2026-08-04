"use client";

import Link from "next/link";
import { Truck, Building2, ChevronRight } from "lucide-react";
import { AUTH } from "@/components/auth/auth-styles";

const accountOptions = [
  {
    href: "/auth/login?role=carrier",
    title: "Carrier account",
    description: "Manage fleet and accept loads",
    icon: Truck,
    iconClass: "bg-[#FFD666] text-slate-900 shadow-yellow-500/20",
    hoverClass: "group-hover:text-blue-600",
  },
  {
    href: "/auth/login?role=supplier",
    title: "Supplier account",
    description: "Post freight and track shipments",
    icon: Building2,
    iconClass: "bg-slate-900 text-white shadow-slate-900/15",
    hoverClass: "group-hover:text-amber-600",
  },
] as const;

export default function SelectAccountPage() {
  return (
    <div className="w-full">
      <div className={AUTH.header}>
        <h2 className={AUTH.title}>Choose account</h2>
        <p className={AUTH.subtitle}>Select how you want to access Alpha Freight.</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {accountOptions.map((option) => {
          const Icon = option.icon;

          return (
            <Link
              key={option.href}
              href={option.href}
              className="group block rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-4"
            >
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-md transition group-hover:scale-105 sm:h-14 sm:w-14 sm:rounded-2xl ${option.iconClass}`}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className={`text-base font-bold text-slate-900 transition sm:text-lg ${option.hoverClass}`}>
                      {option.title}
                    </h3>
                    <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
                  </div>
                  <p className="mt-0.5 text-[12px] font-medium text-slate-500 sm:text-[13px]">{option.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5 sm:mt-8 sm:pt-6">
        <p className={AUTH.footerText}>
          New to Alpha Freight?{" "}
          <Link href="/auth/signup" className="font-bold text-slate-900 hover:underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
