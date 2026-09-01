export type ContactFields = {
  trap: string;
  name: string;
  email: string;
  message: string;
};

const WINDOW_MS = 15 * 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

export function readContact(formData: FormData): ContactFields {
  return {
    trap: String(formData.get("company") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
  };
}

/** In-process throttle so a form flood cannot mail-bomb the support inbox. */
export function contactLimited(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

export function resetContactLimits(): void {
  hits.clear();
}
