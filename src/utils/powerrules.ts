import type { Power } from "@/types/powers";
import type { BuildSlot } from "@/types/builds";
import { getNormalizedPowerType } from "@/shared/utils/powerTypes";
import { areFrameworksRelatedForUnlock } from "./powerFrameworks";

function isTierUnlockedBySlotLevel(power: Power, targetSlotLevel: number | null) {
  if (targetSlotLevel === null) {
    return false;
  }

  switch (power.tier) {
    case 1:
      return targetSlotLevel >= 8;
    case 2:
      return targetSlotLevel >= 14;
    case 3:
      return targetSlotLevel >= 20;
    default:
      return false;
  }
}

export function isPowerEnabled(power: Power | null | undefined) {
  return power?.is_disabled !== true;
}

export function isEnergyUnlockPower(power: Power | null | undefined) {
  return power ? getNormalizedPowerType(power) === "ENERGY_UNLOCK" : false;
}

export function canSelectPower(
  power: Power,
  buildSlots: BuildSlot[],
  targetSlotNumber?: number,
): boolean {
  if (!isPowerEnabled(power)) {
    return false;
  }

  const isTargetSlot = (slot: BuildSlot) => slot.slot === targetSlotNumber;
  const targetSlotLevel =
    buildSlots.find((slot) => slot.slot === targetSlotNumber)?.level ?? null;

  // ========================================
  // DUPLICATES
  // ========================================

  const alreadyTaken = buildSlots.some(
    (slot) =>
      !isTargetSlot(slot) &&
      slot.power?.power_id === power.power_id
  );

  if (alreadyTaken) {
    return false;
  }

  // ========================================
  // UNIQUE ENERGY BUILDER
  // ========================================

  if (power.tier === -1) {
    const hasEnergyBuilder =
      buildSlots.some(
        (slot) => !isTargetSlot(slot) && slot.power?.tier === -1
      );

    if (hasEnergyBuilder) {
      return false;
    }

    return true;
  }

  // ========================================
  // UNIQUE ENERGY UNLOCK
  // ========================================

  if (isEnergyUnlockPower(power)) {
    const hasEnergyUnlock =
      buildSlots.some(
        (slot) => !isTargetSlot(slot) && isEnergyUnlockPower(slot.power)
      );

    if (hasEnergyUnlock) {
      return false;
    }
  }

  // ========================================
  // UNIQUE ULTIMATE
  // ========================================

  if (power.tier === 4) {
    const hasUltimate =
      buildSlots.some(
        (slot) => !isTargetSlot(slot) && slot.power?.tier === 4
      );

    if (hasUltimate) {
      return false;
    }

    return true;
  }

  // ========================================
  // COUNT PREVIOUS POWERS
  // ========================================

  const selectedPowers = buildSlots
    .filter(
      (slot) =>
        slot.power !== null &&
        (targetSlotNumber === undefined || slot.slot < targetSlotNumber),
    )
    .map((slot) => slot.power!);

  const frameworkCount = selectedPowers.filter(
    (p) =>
      areFrameworksRelatedForUnlock(p.framework_id, power.framework_id)
  ).length;

  const anyFrameworkCount = selectedPowers.filter(
    (p) => p.tier !== -1,
  ).length;

  // ========================================
  // TIER RULES
  // ========================================

  switch (power.tier) {

    case 0:
      return true;

    case 1:
      return (
        isTierUnlockedBySlotLevel(power, targetSlotLevel) ||
        frameworkCount >= 1 ||
        anyFrameworkCount >= 2
      );

    case 2:
      return (
        isTierUnlockedBySlotLevel(power, targetSlotLevel) ||
        frameworkCount >= 3 ||
        anyFrameworkCount >= 4
      );

    case 3:
      return (
        isTierUnlockedBySlotLevel(power, targetSlotLevel) ||
        frameworkCount >= 5 ||
        anyFrameworkCount >= 6
      );

    default:
      return true;
  }
}
