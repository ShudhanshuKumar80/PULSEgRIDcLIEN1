const STORAGE_KEY = "pulsegrid-profile";
const COLORS = [
  "#38bdf8",
  "#2dd4bf",
  "#f97316",
  "#facc15",
  "#a78bfa",
  "#fb7185",
  "#34d399",
  "#60a5fa",
  "#f472b6",
  "#22c55e"
];

const ADJECTIVES = [
  "Nebula",
  "Quartz",
  "Signal",
  "Velvet",
  "Solar",
  "Pixel",
  "Marble",
  "Lunar",
  "Echo",
  "Cinder"
];

const NOUNS = [
  "Fox",
  "Otter",
  "Kite",
  "Lynx",
  "Falcon",
  "Comet",
  "Badger",
  "Robin",
  "Manta",
  "Panda"
];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function sanitizeName(value) {
  const cleaned = String(value || "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 18);

  return cleaned || `${randomFrom(ADJECTIVES)} ${randomFrom(NOUNS)}`;
}

export function sanitizeColor(value) {
  if (/^#[0-9a-fA-F]{6}$/.test(String(value || "").trim())) {
    return String(value).toLowerCase();
  }

  return randomFrom(COLORS);
}

export function createProfile() {
  return {
    userId: createId(),
    name: `${randomFrom(ADJECTIVES)} ${randomFrom(NOUNS)}`,
    color: randomFrom(COLORS)
  };
}

export function loadStoredProfile() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed?.userId) {
      return null;
    }

    return {
      userId: String(parsed.userId),
      name: sanitizeName(parsed.name),
      color: sanitizeColor(parsed.color)
    };
  } catch {
    return null;
  }
}

export function saveStoredProfile(profile) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function randomColor(excluding) {
  const options = COLORS.filter((color) => color !== excluding);
  return randomFrom(options.length > 0 ? options : COLORS);
}

export function hexToRgba(hex, alpha) {
  const normalized = hex.replace("#", "");
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
