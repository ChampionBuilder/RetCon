import { useEffect, useRef } from "react";

type UseShareUrlSyncOptions = {
  applyHydratedBuild: (serializedData: string) => boolean;
  dataReady: boolean;
  shareUrl: string;
};

export function useShareUrlSync({
  applyHydratedBuild,
  dataReady,
  shareUrl,
}: UseShareUrlSyncOptions) {
  const hasAttemptedUrlHydrationRef = useRef(false);
  const hasCompletedUrlHydrationRef = useRef(false);

  useEffect(() => {
    if (!dataReady || hasAttemptedUrlHydrationRef.current) {
      return;
    }

    hasAttemptedUrlHydrationRef.current = true;
    const serializedData = new URLSearchParams(window.location.search).get("b");

    if (serializedData) {
      window.setTimeout(() => {
        applyHydratedBuild(serializedData);
        hasCompletedUrlHydrationRef.current = true;
      }, 0);
      return;
    }

    hasCompletedUrlHydrationRef.current = true;
  }, [applyHydratedBuild, dataReady]);

  useEffect(() => {
    if (!hasCompletedUrlHydrationRef.current) {
      return;
    }

    window.history.replaceState(null, "", shareUrl);
  }, [shareUrl]);
}
