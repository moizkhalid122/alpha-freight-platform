"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export default function EmailCaptureBar() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      const key = "af_ai_newsletter";
      const existing = JSON.parse(localStorage.getItem(key) || "[]") as string[];
      if (!existing.includes(email.trim())) {
        localStorage.setItem(key, JSON.stringify([email.trim(), ...existing].slice(0, 20)));
      }
      setDone(true);
    } catch {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-[#e5e5e5] bg-white px-3 py-2.5 text-xs text-[#666]">
        ✅ Thanks — we&apos;ll send UK diesel &amp; load tips soon.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[#e5e5e5] bg-white p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#444]">
        <Mail className="h-3.5 w-3.5" />
        Weekly UK diesel &amp; load tips
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="min-w-0 flex-1 rounded-lg border border-[#ececec] px-2.5 py-2 text-xs focus:border-[#ccc] focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-[#0d0d0d] px-3 py-2 text-xs font-medium text-white hover:bg-[#333]"
        >
          Join
        </button>
      </div>
    </form>
  );
}
