import type { Power } from "@/types/powers";

export type PowerCooldownFilter = number | "none" | null;

export function getCooldownNumbers(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? [value] : [];
  }

  return Array.from(
    value.replace(/,/g, ".").matchAll(/\d+(?:\.\d+)?/g),
    (match) => Number(match[0]),
  ).filter((cooldown) => Number.isFinite(cooldown) && cooldown > 0);
}

export function getPowerCooldownFilterSteps(powers: Power[]) {
  return [
    null,
    "none" as const,
    ...Array.from(
      new Set(powers.flatMap((power) => getCooldownNumbers(power.cooldown))),
    ).sort((a, b) => a - b),
  ];
}

export function formatPowerCooldownFilterLabel(
  cooldown: PowerCooldownFilter,
) {
  if (cooldown === null) {
    return "Any CD";
  }

  if (cooldown === "none") {
    return "None";
  }

  return `${cooldown} sec`;
}

export function powerMatchesCooldown(
  power: Power,
  expectedCooldown: Exclude<PowerCooldownFilter, null>,
) {
  if (expectedCooldown === "none") {
    return getCooldownNumbers(power.cooldown).length === 0;
  }

  return getCooldownNumbers(power.cooldown).includes(expectedCooldown);
}
