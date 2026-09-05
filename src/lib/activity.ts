export type ActivityItem = { id: string; tool: string; detail: string; at: number };

const KEY = "wpa-activity";

export function logActivity(tool: string, detail: string) {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list: ActivityItem[] = raw ? JSON.parse(raw) : [];
    const next = [
      { id: crypto.randomUUID(), tool, detail: detail.slice(0, 120), at: Date.now() },
      ...list,
    ].slice(0, 20);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
