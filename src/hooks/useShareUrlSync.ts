import { useEffect, useRef, useState } from "react";

type UseShareUrlSyncOptions = {
  applyHydratedBuild: (
    serializedData: string,
    buildNameOverride?: string | null,
  ) => boolean;
  dataReady: boolean;
  shareUrl: string;
};

export function useShareUrlSync({
  applyHydratedBuild,
  dataReady,
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
    const initialSerializedData = urlSerializedData;
    const initialBuildName = urlBuildName;

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

  return initialHydrationComplete;
}
