import { useEffect, useState } from "react";
import type { GearItem, GearMod } from "@/types/gear";
import { publicAssetUrl } from "@/shared/utils/publicAssetUrl";

function fetchJson<T>(url: string) {
  return fetch(url, { cache: "default" }).then(
    (response) => response.json() as Promise<T>,
  );
}

export function useGearData(enabled: boolean, loadMods = enabled) {
  const [gears, setGears] = useState<GearItem[]>([]);
  const [mods, setMods] = useState<GearMod[]>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    fetchJson<GearItem[]>(publicAssetUrl("/data/gears.json")).then(setGears);
  }, [enabled]);

  useEffect(() => {
    if (!loadMods) {
      return;
    }

    fetchJson<GearMod[]>(publicAssetUrl("/data/mods.json")).then(setMods);
  }, [loadMods]);

  return {
    gears,
    mods,
    ready: !enabled || (gears.length > 0 && mods.length > 0),
  };
}
