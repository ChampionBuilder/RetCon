import type { Power } from "@/types/powers";
import { getNormalizedPowerType } from "@/shared/utils/powerTypes";

export const powerTargetingOptions = [
  "Single Target",
  "Targeted AoE",
  "PBAoE",
  "Self",
  "Special",
] as const;

export type PowerTargetingFilter = (typeof powerTargetingOptions)[number];

function normalizeTargetingText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
}

function hasMaxTargetCount(value: string) {
  return /\(\s*\d+\s*max\s*\)/i.test(value);
}

function isAoePowerType(power: Power) {
  return getNormalizedPowerType(power)?.includes("AOE") ?? false;
}

function isTargetingToken(value: string) {
  return /\b(?:affect|affects|target|targets|tagerts)\b/i.test(value);
}

function getPrimaryTargetingTag(power: Power) {
  return (power.range_tags ?? []).find(isTargetingToken) ?? null;
}

function isExcludedFromTargetingSearch(power: Power) {
  const powerType = getNormalizedPowerType(power);
  const activationType =
    power.activation_type?.replace(/[^a-z0-9]+/gi, "_").toUpperCase() ?? "";

  return (
    powerType === "BLOCK" ||
    powerType === "ENERGY_UNLOCK" ||
    (powerType === "DEVICE" && activationType === "PASSIVE") ||
    powerType === "SLOTTED_DEFENSIVE_PASSIVE" ||
    powerType === "SLOTTED_HYBRID_PASSIVE" ||
    powerType === "SLOTTED_OFFENSIVE_PASSIVE" ||
    powerType === "SLOTTED_SUPPORT_PASSIVE" ||
    powerType === "TOGGLE_FORM"
  );
}

export function getPowerTargetingFilter(power: Power): PowerTargetingFilter {
  const targetingTag = normalizeTargetingText(getPrimaryTargetingTag(power));

  if (!targetingTag) {
    return "Special";
  }

  if (/\btargets?\s+self\b/.test(targetingTag)) {
    return "Self";
  }

  if (/^affects?\b/.test(targetingTag)) {
    return "PBAoE";
  }

  if (isAoePowerType(power)) {
    return "Targeted AoE";
  }

  if (/^(?:targets?|tagerts)\b/.test(targetingTag)) {
    return hasMaxTargetCount(targetingTag) ? "Targeted AoE" : "Single Target";
  }

  return "Special";
}

export function powerMatchesTargetingFilter(
  power: Power,
  targetingFilter: PowerTargetingFilter | "",
) {
  if (targetingFilter === "") {
    return true;
  }

  if (isExcludedFromTargetingSearch(power)) {
    return false;
  }

  return getPowerTargetingFilter(power) === targetingFilter;
}
