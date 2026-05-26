import type { Power } from "@/types/powers";

export function getPowerType(power: Power | null | undefined) {
  return power?.power_type ?? power?.Power_Type ?? power?.POWER_TYPE ?? null;
}

export function getNormalizedPowerType(power: Power | null | undefined) {
  return (getPowerType(power) ?? "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}
