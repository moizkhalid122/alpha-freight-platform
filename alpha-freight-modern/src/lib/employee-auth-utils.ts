export function withTimeout<T>(promise: Promise<T>, ms: number, label = "Request"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    }),
  ]);
}

export function isEmployeeMetadata(user: { user_metadata?: Record<string, unknown> } | null | undefined): boolean {
  return String(user?.user_metadata?.role ?? "").toLowerCase() === "employee";
}
