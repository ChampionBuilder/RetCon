import { useEffect, useState } from "react";
import type { SavedBuild } from "@/types/share";
import { parseSerializedBuild } from "@/utils/buildSerialization";
import { loadSavedBuilds, storeSavedBuilds } from "@/features/saved-builds/savedBuilds";
import { trimBuildNameForUrl } from "@/constants/buildName";

type UseSavedBuildsOptions = {
  buildName: string;
  serializedBuild: string;
};

export type ImportSavedBuildsResult = {
  imported: number;
  skipped: number;
};

type ImportedBuildUrlData = {
  buildName: string | null;
  serializedBuild: string;
};

function getSerializedBuildFromLine(line: string): ImportedBuildUrlData | null {
  const trimmedLine = line.trim();

  if (!trimmedLine || trimmedLine.startsWith("#")) {
    return null;
  }

  try {
    const url = new URL(trimmedLine);
    const serializedBuild = url.searchParams.get("b");

    return serializedBuild
      ? {
          buildName: url.searchParams.get("n"),
          serializedBuild,
        }
      : null;
  } catch {
    if (trimmedLine.startsWith("?") || trimmedLine.includes("b=")) {
      const params = new URLSearchParams(trimmedLine.replace(/^[^?]*\?/u, ""));
      const serializedBuild = params.get("b");

      return serializedBuild
        ? {
            buildName: params.get("n"),
            serializedBuild,
          }
        : null;
    }

    return {
      buildName: null,
      serializedBuild: trimmedLine,
    };
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
      const importedBuildUrlData = getSerializedBuildFromLine(line);
      const serializedImportedBuild = importedBuildUrlData?.serializedBuild;

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
        name:
          trimBuildNameForUrl(
            importedBuildUrlData.buildName ?? parsedBuild.buildName,
          ) || "Imported build",
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
