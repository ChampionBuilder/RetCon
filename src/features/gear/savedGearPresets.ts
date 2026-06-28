import type { SavedGearPreset } from "@/types/gear";

const savedGearPresetsStorageKey = "retcon.savedGearPresets.v1";

function isSavedGearPreset(value: unknown): value is SavedGearPreset {
  if (!value || typeof value !== "object") {
    return false;
  }

  const preset = value as Record<string, unknown>;

  return (
    typeof preset.id === "string" &&
    typeof preset.name === "string" &&
    typeof preset.updatedAt === "string" &&
    Array.isArray(preset.slots)
  );
}

export function loadSavedGearPresets() {
  try {
    const rawValue = window.localStorage.getItem(savedGearPresetsStorageKey);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    return Array.isArray(parsedValue) && parsedValue.every(isSavedGearPreset)
      ? parsedValue
      : [];
  } catch {
    return [];
  }
}

export function storeSavedGearPresets(savedGearPresets: SavedGearPreset[]) {
  window.localStorage.setItem(
    savedGearPresetsStorageKey,
    JSON.stringify(savedGearPresets),
  );
}
