import { useEffect, useRef, useState } from "react";
import type { SavedBuild } from "@/types/share";
import { parseSerializedBuild } from "@/utils/buildSerialization";
import {
  autosaveBuildId,
  clearLegacyLastBuild,
  isAutosaveBuild,
  loadLegacyLastBuild,
  loadSavedBuilds,
  storeSavedBuilds,
} from "@/features/saved-builds/savedBuilds";
import { trimBuildNameForUrl } from "@/constants/buildName";

type UseSavedBuildsOptions = {
  autosaveEnabled: boolean;
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
  autosaveEnabled,
  buildName,
  serializedBuild,
}: UseSavedBuildsOptions) {
  const [emptyBuildSerializedData] = useState(serializedBuild);
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>(() => {
    const loadedBuilds = loadSavedBuilds();
    const existingAutosave = loadedBuilds.find(isAutosaveBuild);
    const legacyLastBuild = loadLegacyLastBuild();
    const autosave = existingAutosave ?? {
      id: autosaveBuildId,
      name: legacyLastBuild?.name ?? buildName,
      data: legacyLastBuild?.data ?? serializedBuild,
      updatedAt: new Date().toISOString(),
    };

    return [autosave, ...loadedBuilds.filter((build) => !isAutosaveBuild(build))];
  });
  const autosaveBaselineRef = useRef<{
    buildName: string;
    serializedBuild: string;
  } | null>(null);
  const autosaveHasContent = savedBuilds.some(
    (savedBuild) =>
      isAutosaveBuild(savedBuild) &&
      savedBuild.data !== emptyBuildSerializedData,
  );

  useEffect(() => {
    storeSavedBuilds(savedBuilds);
    clearLegacyLastBuild();
  }, [savedBuilds]);

  useEffect(() => {
    if (!autosaveEnabled) {
      return;
    }

    const baseline = autosaveBaselineRef.current;

    if (!baseline) {
      autosaveBaselineRef.current = { buildName, serializedBuild };
      return;
    }

    if (serializedBuild === emptyBuildSerializedData) {
      return;
    }

    if (
      baseline.buildName === buildName &&
      baseline.serializedBuild === serializedBuild
    ) {
      return;
    }

    autosaveBaselineRef.current = { buildName, serializedBuild };
    setSavedBuilds((currentSavedBuilds) => [
      {
        id: autosaveBuildId,
        name: buildName,
        data: serializedBuild,
        updatedAt: new Date().toISOString(),
      },
      ...currentSavedBuilds.filter((build) => !isAutosaveBuild(build)),
    ]);
  }, [autosaveEnabled, buildName, emptyBuildSerializedData, serializedBuild]);

  function saveCurrentBuild() {
    setSavedBuilds((currentSavedBuilds) => {
      const autosave = currentSavedBuilds.find(isAutosaveBuild);
      const manuallySavedBuild = {
        id: crypto.randomUUID(),
        name: buildName,
        data: serializedBuild,
        updatedAt: new Date().toISOString(),
      };

      return [
        ...(autosave ? [autosave] : []),
        manuallySavedBuild,
        ...currentSavedBuilds.filter((build) => !isAutosaveBuild(build)),
      ];
    });
  }

  function getSavedBuildData(buildId: string) {
    return savedBuilds.find((build) => build.id === buildId)?.data ?? null;
  }

  function overwriteSavedBuild(buildId: string) {
    if (buildId === autosaveBuildId) {
      return;
    }

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
    if (buildId === autosaveBuildId) {
      return;
    }

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
      setSavedBuilds((currentSavedBuilds) => {
        const autosave = currentSavedBuilds.find(isAutosaveBuild);

        return [
          ...(autosave ? [autosave] : []),
          ...importedBuilds,
          ...currentSavedBuilds.filter((build) => !isAutosaveBuild(build)),
        ];
      });
    }

    return {
      imported: importedBuilds.length,
      skipped,
    };
  }

  return {
    autosaveHasContent,
    deleteSavedBuild,
    getSavedBuildData,
    importSavedBuildsFromText,
    overwriteSavedBuild,
    savedBuilds,
    saveCurrentBuild,
  };
}
