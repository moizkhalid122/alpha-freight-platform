type ReelStopHandler = () => void;

const stopHandlers = new Set<ReelStopHandler>();

export function registerReelStopHandler(handler: ReelStopHandler) {
  stopHandlers.add(handler);
  return () => {
    handler();
    stopHandlers.delete(handler);
  };
}

export function stopAllReelPlayers() {
  stopHandlers.forEach((handler) => {
    try {
      handler();
    } catch {
      // Ignore stop errors during teardown.
    }
  });
}
