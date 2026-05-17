import { useMemo } from "react";
import type { BuildSlot } from "../types/builds";
import type { Power } from "../types/powers";
import { canSelectPower } from "../utils/powerrules";
import {
  getPowerVariantParentPowerIds,
  hasPowerVariantParent,
} from "../utils/powerVariantRules";

type UseBuildPowerStateOptions = {
  activeAdvantageSlot: number | null;
  activeDeviceSlot: number | null;
  activePowerSlot: number | null;
  activePowerVariantSlot: number | null;
  activeTravelPowerSlot: number | null;
  archetypeAlternativePowerIdsBySlot: Map<number, number[]>;
  buildSlots: BuildSlot[];
  deviceSlots: BuildSlot[];
  invalidPowerVariantTargetSlot: BuildSlot | null;
  isFreeform: boolean;
  powersById: Map<number, Power>;
  powerVariantSlots: BuildSlot[];
  selectedPowerTargetSlot: number | null;
  travelPowerSlots: BuildSlot[];
};

export function useBuildPowerState({
  activeAdvantageSlot,
  activeDeviceSlot,
  activePowerSlot,
  activePowerVariantSlot,
  activeTravelPowerSlot,
  archetypeAlternativePowerIdsBySlot,
  buildSlots,
  deviceSlots,
  invalidPowerVariantTargetSlot,
  isFreeform,
  powersById,
  powerVariantSlots,
  selectedPowerTargetSlot,
  travelPowerSlots,
}: UseBuildPowerStateOptions) {
  const allPowerSlots = useMemo(
    () => [...buildSlots, ...travelPowerSlots, ...powerVariantSlots, ...deviceSlots],
    [buildSlots, deviceSlots, powerVariantSlots, travelPowerSlots],
  );

  const activeBuildSlot =
    activePowerSlot === null
      ? null
      : buildSlots.find((slot) => slot.slot === activePowerSlot) ?? null;
  const activePowerVariantBuildSlot =
    activePowerVariantSlot === null
      ? null
      : powerVariantSlots.find((slot) => slot.slot === activePowerVariantSlot) ??
        null;
  const activeTravelPowerBuildSlot =
    activeTravelPowerSlot === null
      ? null
      : travelPowerSlots.find((slot) => slot.slot === activeTravelPowerSlot) ??
        null;
  const activeDeviceBuildSlot =
    activeDeviceSlot === null
      ? null
      : deviceSlots.find((slot) => slot.slot === activeDeviceSlot) ?? null;
  const activeAdvantageBuildSlot =
    activeAdvantageSlot === null
      ? null
      : allPowerSlots.find((slot) => slot.slot === activeAdvantageSlot) ?? null;

  const invalidPowerSlotNumbers = useMemo(() => {
    return new Set(
      buildSlots
        .filter(
          (slot) =>
            slot.power !== null &&
            !canSelectPower(slot.power, buildSlots, slot.slot),
        )
        .map((slot) => slot.slot),
    );
  }, [buildSlots]);

  const invalidPowerVariantSlotNumbers = useMemo(() => {
    return new Set(
      powerVariantSlots
        .filter(
          (slot) =>
            slot.power !== null &&
            !hasPowerVariantParent(slot.power, buildSlots),
        )
        .map((slot) => slot.slot),
    );
  }, [buildSlots, powerVariantSlots]);

  const restrictedPowerIds = useMemo(() => {
    if (!isFreeform && selectedPowerTargetSlot !== null) {
      const allowedPowerIds =
        archetypeAlternativePowerIdsBySlot.get(selectedPowerTargetSlot);

      return allowedPowerIds ? new Set(allowedPowerIds) : null;
    }

    if (
      invalidPowerVariantTargetSlot?.power &&
      invalidPowerVariantSlotNumbers.has(invalidPowerVariantTargetSlot.slot)
    ) {
      return new Set(
        getPowerVariantParentPowerIds(invalidPowerVariantTargetSlot.power),
      );
    }

    return null;
  }, [
    archetypeAlternativePowerIdsBySlot,
    invalidPowerVariantSlotNumbers,
    invalidPowerVariantTargetSlot,
    isFreeform,
    selectedPowerTargetSlot,
  ]);

  const restrictedPowerSectionLabel =
    !isFreeform && selectedPowerTargetSlot !== null
      ? "Archetype choices"
      : restrictedPowerIds !== null
        ? "Parent powers"
        : null;

  const activeArchetypePowerOptions = useMemo(() => {
    if (isFreeform || activePowerSlot === null) {
      return [];
    }

    return (archetypeAlternativePowerIdsBySlot.get(activePowerSlot) ?? [])
      .map((powerId) => powersById.get(powerId) ?? null)
      .filter((power): power is Power => power !== null);
  }, [
    activePowerSlot,
    archetypeAlternativePowerIdsBySlot,
    isFreeform,
    powersById,
  ]);

  return {
    activeAdvantageBuildSlot,
    activeArchetypePowerOptions,
    activeBuildSlot,
    activeDeviceBuildSlot,
    activePowerVariantBuildSlot,
    activeTravelPowerBuildSlot,
    allPowerSlots,
    invalidPowerSlotNumbers,
    invalidPowerVariantSlotNumbers,
    restrictedPowerIds,
    restrictedPowerSectionLabel,
  };
}
