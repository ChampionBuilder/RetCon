import { useEffect, useRef, useState } from "react";
import {
  loadLastBuild,
  storeLastBuild,
} from "@/features/saved-builds/lastBuild";

type UseShareUrlSyncOptions = {
  applyHydratedBuild: (
    serializedData: string,
    buildNameOverride?: string | null,
  ) => boolean;
  buildName: string;
  dataReady: boolean;
  serializedBuild: string;
  shareUrl: string;
};

export function useShareUrlSync({
  applyHydratedBuild,
  buildName,
  dataReady,
  serializedBuild,
  shareUrl,
}: UseShareUrlSyncOptions) {
  const hasAttemptedInitialHydrationRef = useRef(false);
  const [initialHydrationComplete, setInitialHydrationComplete] =
    useState(false);

  useEffect(() => {
    if (!dataReady || hasAttemptedInitialHydrationRef.current) {
      return;
    }

    hasAttemptedInitialHydrationRef.current = true;
    const urlSearchParams = new URLSearchParams(window.location.search);
    const urlSerializedData = urlSearchParams.get("b");
    const urlBuildName = urlSearchParams.get("n");
    const storedBuild = urlSerializedData ? null : loadLastBuild();
    const initialSerializedData = urlSerializedData ?? storedBuild?.data;
    const initialBuildName = urlSerializedData
      ? urlBuildName
      : storedBuild?.name;

    window.setTimeout(() => {
      if (initialSerializedData) {
        applyHydratedBuild(initialSerializedData, initialBuildName);
      }

      setInitialHydrationComplete(true);
    }, 0);
  }, [applyHydratedBuild, dataReady]);

  useEffect(() => {
    if (!initialHydrationComplete) {
      return;
    }

    window.history.replaceState(null, "", shareUrl);
  }, [initialHydrationComplete, shareUrl]);

  useEffect(() => {
    if (!initialHydrationComplete) {
      return;
    }

    storeLastBuild(serializedBuild, buildName);
  }, [buildName, initialHydrationComplete, serializedBuild]);
}
