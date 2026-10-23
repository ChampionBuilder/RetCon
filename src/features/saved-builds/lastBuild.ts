export type StoredLastBuild = {
  data: string;
  name: string;
};

const lastBuildStorageKey = "retcon.lastBuild.v1";

function isStoredLastBuild(value: unknown): value is StoredLastBuild {
  if (!value || typeof value !== "object") {
    return false;
  }

  const build = value as Record<string, unknown>;

  return typeof build.data === "string" && typeof build.name === "string";
}

export function loadLastBuild(): StoredLastBuild | null {
  try {
    const rawValue = window.localStorage.getItem(lastBuildStorageKey);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    return isStoredLastBuild(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function storeLastBuild(data: string, name: string) {
  try {
    window.localStorage.setItem(
      lastBuildStorageKey,
      JSON.stringify({ data, name } satisfies StoredLastBuild),
    );
  } catch {
    // A blocked or full localStorage should not prevent using the builder.
  }
}
