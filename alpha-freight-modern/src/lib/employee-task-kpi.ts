const KPI_KEY = "af_daily_kpi";

export type DailyKpiMap = Record<string, number>;

function todayKey(userId: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${KPI_KEY}_${userId}_${date}`;
}

export function loadDailyKpi(userId: string): DailyKpiMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(todayKey(userId)) || "{}");
  } catch {
    return {};
  }
}

export function saveDailyKpi(userId: string, map: DailyKpiMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(todayKey(userId), JSON.stringify(map));
}

export function bumpDailyKpi(userId: string, taskId: string, delta: number): DailyKpiMap {
  const current = loadDailyKpi(userId);
  const next = Math.max(0, (current[taskId] ?? 0) + delta);
  const map = { ...current, [taskId]: next };
  saveDailyKpi(userId, map);
  return map;
}

export function kpiProgressPct(current: number, target: number): number {
  if (!target) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}
