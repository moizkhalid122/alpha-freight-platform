export type VerifiedCelebrationPayload = {
  title: string;
  body: string;
  onClose?: () => void;
};

type VerifiedCelebrationListener = (payload: VerifiedCelebrationPayload) => void;

let listener: VerifiedCelebrationListener | null = null;

export function subscribeVerifiedCelebration(nextListener: VerifiedCelebrationListener) {
  listener = nextListener;
  return () => {
    if (listener === nextListener) {
      listener = null;
    }
  };
}

export function showVerifiedCelebration(payload: VerifiedCelebrationPayload) {
  listener?.(payload);
}

export function isCarrierVerifiedNotification(type: unknown) {
  return String(type ?? "").trim() === "carrier_verified";
}
