export type MotionPreference = "system" | "full" | "reduced";

export interface Preferences {
  autoplay: boolean;
  hoverPreviews: boolean;
  defaultSpeed: number;
  gridCols: number;
  motion: MotionPreference;
}

const STORAGE_KEY = "frame.prefs.v1";

const defaults: Preferences = {
  autoplay: false,
  hoverPreviews: true,
  defaultSpeed: 1,
  gridCols: 3,
  motion: "system"
};

function readStored(): Partial<Preferences> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const clean: Partial<Preferences> = {};
    if (typeof parsed.autoplay === "boolean") clean.autoplay = parsed.autoplay;
    if (typeof parsed.hoverPreviews === "boolean")
      clean.hoverPreviews = parsed.hoverPreviews;
    if (
      typeof parsed.defaultSpeed === "number" &&
      [0.5, 1, 1.25, 1.5, 2].includes(parsed.defaultSpeed)
    )
      clean.defaultSpeed = parsed.defaultSpeed;
    if (
      typeof parsed.gridCols === "number" &&
      parsed.gridCols >= 2 &&
      parsed.gridCols <= 6
    )
      clean.gridCols = Math.round(parsed.gridCols);
    if (
      parsed.motion === "system" ||
      parsed.motion === "full" ||
      parsed.motion === "reduced"
    )
      clean.motion = parsed.motion;
    return clean;
  } catch {
    return {};
  }
}

function applyMotion(motion: MotionPreference): void {
  if (typeof document === "undefined") return;
  if (motion === "system") {
    delete document.documentElement.dataset.motion;
  } else {
    document.documentElement.dataset.motion = motion;
  }
}

export const prefs: Preferences = $state({
  ...defaults,
  ...readStored()
});

export function savePrefs(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage may be unavailable (private mode); preferences stay session-only.
  }
}

export function setPref<K extends keyof Preferences>(
  key: K,
  value: Preferences[K]
): void {
  prefs[key] = value;
  savePrefs();
  if (key === "motion") applyMotion(prefs.motion);
}

export function initPrefs(): void {
  applyMotion(prefs.motion);
}
