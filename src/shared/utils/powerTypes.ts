import type { Power } from "@/types/powers";

export function getPowerType(power: Power | null | undefined) {
  return power?.power_type ?? power?.Power_Type ?? power?.POWER_TYPE ?? null;
}

export function getNormalizedPowerType(power: Power | null | undefined) {
  const normalizedType = (getPowerType(power) ?? "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

  return normalizedType === "TOGGLE_FORMS" ? "TOGGLE_FORM" : normalizedType;
}
