import type { SavedBuild } from "../types/share";

const savedBuildsStorageKey = "retcon.savedBuilds.v1";

function isSavedBuild(value: unknown): value is SavedBuild {
  if (!value || typeof value !== "object") {
    return false;
  }

  const build = value as Record<string, unknown>;

  return (
    typeof build.id === "string" &&
    typeof build.name === "string" &&
    typeof build.data === "string" &&
    typeof build.updatedAt === "string"
  );
}

export function loadSavedBuilds() {
  try {
    const rawValue = window.localStorage.getItem(savedBuildsStorageKey);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    return Array.isArray(parsedValue) && parsedValue.every(isSavedBuild)
      ? parsedValue
      : [];
  } catch {
    return [];
  }
}

export function storeSavedBuilds(savedBuilds: SavedBuild[]) {
  window.localStorage.setItem(savedBuildsStorageKey, JSON.stringify(savedBuilds));
}
