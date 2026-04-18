import type { Identity } from "./types";

const KEY = "wc26-user-v1";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `u-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "YO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function accentFor(userId: string): 1 | 2 | 3 | 4 {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  return ((h % 4) + 1) as 1 | 2 | 3 | 4;
}

export function loadIdentity(): Identity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Identity>;
    if (!parsed.userId || !parsed.displayName) return null;
    return {
      userId: parsed.userId,
      displayName: parsed.displayName,
      avatar: parsed.avatar || initialsFor(parsed.displayName),
      accent: (parsed.accent && parsed.accent >= 1 && parsed.accent <= 4 ? parsed.accent : accentFor(parsed.userId)) as 1 | 2 | 3 | 4,
    };
  } catch {
    return null;
  }
}

export function saveIdentity(id: Identity): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(id));
  } catch {}
}

export function createIdentity(displayName: string): Identity {
  const userId = randomId();
  return {
    userId,
    displayName: displayName.trim() || "guest",
    avatar: initialsFor(displayName),
    accent: accentFor(userId),
  };
}

export function updateDisplayName(id: Identity, displayName: string): Identity {
  return { ...id, displayName: displayName.trim() || id.displayName, avatar: initialsFor(displayName) };
}
