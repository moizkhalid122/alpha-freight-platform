import type { ConciergeVoiceMemory } from "@/lib/concierge/concierge-session";
import {
  buildReturnVisitorGreeting,
  pageLabelFromPath,
} from "@/lib/concierge/concierge-return-visitor";

export function buildVipConciergeGreeting(
  memory: ConciergeVoiceMemory,
  pathname: string,
): string | null {
  const returning = buildReturnVisitorGreeting(memory, pathname);
  if (returning) return returning;

  const name = memory.userName?.trim();
  if (pathname.startsWith("/carrier")) {
    return name
      ? `Hey ${name}! What's up? Say show my loads or find loads — I'll jump there.`
      : "Hey! What's up? Say show my loads or find available loads.";
  }
  if (pathname.startsWith("/supplier")) {
    return name
      ? `Hey ${name}! Great to see you — say post a load or track shipment.`
      : "Hey! What's up? Say post a load and I'll open the form.";
  }
  if (pathname.includes("/auth/signup")) {
    return name
      ? `Hey ${name}! Alright — tell me your details and I'll fill the form. Say create account when you're ready.`
      : "Hey! What's up? Tell me your name and email — I'll fill signup for you.";
  }
  if (pathname.startsWith("/onboarding")) {
    return "Hey! Right — say continue or next and I'll press the button for you.";
  }
  const currentPage = pageLabelFromPath(pathname);
  if (name) {
    return `Hey ${name}! You're on ${currentPage} — what can I help with?`;
  }
  return `Hey! You're on ${currentPage} — how can I help?`;
}
