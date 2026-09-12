"use client";

type NavbarPayoutIconProps = {
  className?: string;
};

/** Premium 7-day payout badge for Why Alpha mega menu. */
export default function NavbarPayoutIcon({ className = "h-16 w-16" }: NavbarPayoutIconProps) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-black shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.45)] ring-1 ring-white/12 ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(191,255,7,0.14),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,rgba(232,197,71,0.1),transparent_50%)]" />
      <div className="absolute inset-[1px] rounded-[15px] bg-neutral-950/85" />

      <svg
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden
        className="relative z-10 h-9 w-9"
      >
        <defs>
          <linearGradient id="payout-stroke" x1="8" y1="6" x2="32" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E8D48B" />
            <stop offset="0.55" stopColor="#BFFF07" />
            <stop offset="1" stopColor="#9AE600" />
          </linearGradient>
        </defs>
        <rect x="7" y="9" width="26" height="22" rx="4.5" stroke="url(#payout-stroke)" strokeWidth="1.6" />
        <path d="M7 15h26" stroke="url(#payout-stroke)" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M13 9V6.5M27 9V6.5"
          stroke="url(#payout-stroke)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="20" cy="23" r="6.25" stroke="#BFFF07" strokeWidth="1.5" opacity="0.95" />
        <path
          d="M17.2 23.1l1.8 1.8 3.6-3.8"
          stroke="#F4FFD6"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="11.5"
          y="13.5"
          fill="#E8D48B"
          fontSize="6.5"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          7
        </text>
      </svg>
    </div>
  );
}
