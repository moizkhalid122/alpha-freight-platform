function readErrorMessage(err: unknown): string | null {
  if (!err) return null;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return null;
}

export function formatAuthError(err: unknown): string {
  const direct = readErrorMessage(err);
  if (direct && direct !== "[object Object]") return direct;

  if (err instanceof Error && err.message && err.message !== "[object Object]") {
    return err.message;
  }

  return "Something went wrong. Please try again.";
}
