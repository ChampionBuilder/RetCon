import type { SavedBuild } from "@/types/share";

const savedBuildsStorageKey = "retcon.savedBuilds.v1";
const legacyLastBuildStorageKey = "retcon.lastBuild.v1";

export const autosaveBuildId = "autosave";

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

export function loadLegacyLastBuild() {
  try {
    const rawValue = window.localStorage.getItem(legacyLastBuildStorageKey);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!parsedValue || typeof parsedValue !== "object") {
      return null;
    }

    const build = parsedValue as Record<string, unknown>;

    return typeof build.data === "string" && typeof build.name === "string"
      ? { data: build.data, name: build.name }
      : null;
  } catch {
    return null;
  }
}

export function clearLegacyLastBuild() {
  try {
    window.localStorage.removeItem(legacyLastBuildStorageKey);
  } catch {
    // Ignore browsers that block localStorage access.
  }
}

export function isAutosaveBuild(savedBuild: SavedBuild) {
  return savedBuild.id === autosaveBuildId;
}

export function storeSavedBuilds(savedBuilds: SavedBuild[]) {
  window.localStorage.setItem(savedBuildsStorageKey, JSON.stringify(savedBuilds));
}
