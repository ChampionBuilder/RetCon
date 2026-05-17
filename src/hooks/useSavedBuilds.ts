import { useEffect, useState } from "react";
import type { SavedBuild } from "../types/share";
import { loadSavedBuilds, storeSavedBuilds } from "../utils/savedBuilds";

type UseSavedBuildsOptions = {
  buildName: string;
  serializedBuild: string;
};

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

  return {
    deleteSavedBuild,
    getSavedBuildData,
    overwriteSavedBuild,
    savedBuilds,
    saveCurrentBuild,
  };
}
