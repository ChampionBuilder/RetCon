import { useEffect, useState } from "react";
import type { SavedBuild } from "@/types/share";
import { parseSerializedBuild } from "@/utils/buildSerialization";
import { loadSavedBuilds, storeSavedBuilds } from "@/features/saved-builds/savedBuilds";

type UseSavedBuildsOptions = {
  buildName: string;
  serializedBuild: string;
};

export type ImportSavedBuildsResult = {
  imported: number;
  skipped: number;
};

function getSerializedBuildFromLine(line: string) {
  const trimmedLine = line.trim();

  if (!trimmedLine || trimmedLine.startsWith("#")) {
    return null;
  }

  try {
    const url = new URL(trimmedLine);

    return url.searchParams.get("b");
  } catch {
    if (trimmedLine.startsWith("?") || trimmedLine.includes("b=")) {
      return new URLSearchParams(trimmedLine.replace(/^[^?]*\?/u, "")).get("b");
    }

    return trimmedLine;
  }
}

export function useSavedBuilds({
  buildName,
  serializedBuild,
}: UseSavedBuildsOptions) {
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>(() =>
    loadSavedBuilds(),
  );

  useEffect(() => {
    storeSavedBuilds(savedBuilds);
  }, [savedBuilds]);

  function saveCurrentBuild() {
    setSavedBuilds((currentSavedBuilds) => [
      {
        id: crypto.randomUUID(),
        name: buildName,
        data: serializedBuild,
        updatedAt: new Date().toISOString(),
      },
      ...currentSavedBuilds,
    ]);
  }

  function getSavedBuildData(buildId: string) {
    return savedBuilds.find((build) => build.id === buildId)?.data ?? null;
  }

  function overwriteSavedBuild(buildId: string) {
    setSavedBuilds((currentSavedBuilds) =>
      currentSavedBuilds.map((savedBuild) =>
        savedBuild.id === buildId
          ? {
              ...savedBuild,
              name: buildName,
              data: serializedBuild,
              updatedAt: new Date().toISOString(),
            }
          : savedBuild,
      ),
    );
  }

  function deleteSavedBuild(buildId: string) {
    setSavedBuilds((currentSavedBuilds) =>
      currentSavedBuilds.filter((savedBuild) => savedBuild.id !== buildId),
    );
  }

  function importSavedBuildsFromText(text: string): ImportSavedBuildsResult {
    const importedBuilds: SavedBuild[] = [];
    const existingBuildData = new Set(
      savedBuilds.map((savedBuild) => savedBuild.data),
    );
    let skipped = 0;

    text.split(/\r?\n/u).forEach((line) => {
      const serializedImportedBuild = getSerializedBuildFromLine(line);

      if (!serializedImportedBuild || existingBuildData.has(serializedImportedBuild)) {
        if (line.trim()) {
          skipped += 1;
        }

        return;
      }

      const parsedBuild = parseSerializedBuild(serializedImportedBuild);

      if (!parsedBuild) {
        skipped += 1;
        return;
      }

      existingBuildData.add(serializedImportedBuild);
      importedBuilds.push({
        id: crypto.randomUUID(),
        name: parsedBuild.buildName || "Imported build",
        data: serializedImportedBuild,
        updatedAt: new Date().toISOString(),
      });
    });

    if (importedBuilds.length > 0) {
      setSavedBuilds((currentSavedBuilds) => [
        ...importedBuilds,
        ...currentSavedBuilds,
      ]);
    }

    return {
      imported: importedBuilds.length,
      skipped,
    };
  }

  return {
    deleteSavedBuild,
    getSavedBuildData,
    importSavedBuildsFromText,
    overwriteSavedBuild,
    savedBuilds,
    saveCurrentBuild,
  };
}
