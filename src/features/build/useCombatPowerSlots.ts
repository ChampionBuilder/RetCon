import { useState } from "react";
import { initialBuildSlots } from "@/constants/buildSlots";
import type { Advantage } from "@/types/advantages";
import type { BuildSlot } from "@/types/builds";
import type { Archetype } from "@/types/character";
import type { Power } from "@/types/powers";
import {
  clearAdvantagesForSlot,
  toggleAdvantageForSlots,
} from "@/utils/advantageSlots";
import { clearBuildSlot } from "@/utils/buildSlots";
import { getPowerDisplayFrameworkId } from "@/utils/powerFrameworks";
import {
  createArchetypeBuildSlots,
  createFreeformBuildSlots,
  getPowerPlacementPreview,
} from "@/utils/powerSlots";

export function useCombatPowerSlots() {
  const [buildSlots, setBuildSlots] =
    useState<BuildSlot[]>(initialBuildSlots);

  function placePower(
    power: Power,
    displayFrameworkId: string | null | undefined,
    targetSlot: BuildSlot,
  ) {
    setBuildSlots(
      getPowerPlacementPreview(power, displayFrameworkId, targetSlot, buildSlots),
    );
  }

  function placeArchetypePower(slotNumber: number, power: Power) {
    setBuildSlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.slot === slotNumber
          ? {
              ...slot,
              power,
              displayFrameworkId: getPowerDisplayFrameworkId(power),
              selectedAdvantages:
                slot.power?.power_id === power.power_id
                  ? slot.selectedAdvantages
                  : [],
            }
          : slot,
      ),
    );
  }

  function removePower(slotNumber: number) {
    setBuildSlots((currentBuildSlots) =>
      currentBuildSlots.map((slot) =>
        slot.slot === slotNumber ? clearBuildSlot(slot) : slot,
      ),
    );
  }

  function resetFreeformPowers() {
    setBuildSlots(initialBuildSlots);
  }

  function resetArchetypePowers(
    archetype: Archetype,
    powersById: Map<number, Power>,
  ) {
    setBuildSlots(createArchetypeBuildSlots(archetype, [], powersById));
  }

  function replaceBuildSlots(nextBuildSlots: BuildSlot[]) {
    setBuildSlots(nextBuildSlots);
  }

  function applyFreeformBuildSlots() {
    setBuildSlots(createFreeformBuildSlots(buildSlots));
  }

  function applyArchetypeBuildSlots(
    archetype: Archetype,
    powersById: Map<number, Power>,
  ) {
    setBuildSlots(createArchetypeBuildSlots(archetype, buildSlots, powersById));
  }

  function clearPowerAdvantages() {
    setBuildSlots((currentBuildSlots) =>
      currentBuildSlots.map((slot) => ({
        ...slot,
        selectedAdvantages: [],
      })),
    );
  }

  function togglePowerAdvantage(
    slotNumber: number,
    advantageId: number,
    advantages: Advantage[],
    totalAdvantagePoints: number,
    advantagePointBudget: number,
  ) {
    setBuildSlots((currentBuildSlots) =>
      toggleAdvantageForSlots(
        currentBuildSlots,
        slotNumber,
        advantageId,
        advantages,
        totalAdvantagePoints,
        advantagePointBudget,
      ),
    );
  }

  function clearPowerSlotAdvantages(slotNumber: number) {
    setBuildSlots((currentBuildSlots) =>
      clearAdvantagesForSlot(currentBuildSlots, slotNumber),
    );
  }

  return {
    applyArchetypeBuildSlots,
    applyFreeformBuildSlots,
    buildSlots,
    clearPowerAdvantages,
    clearPowerSlotAdvantages,
    placeArchetypePower,
    placePower,
    removePower,
    replaceBuildSlots,
    resetArchetypePowers,
    resetFreeformPowers,
    togglePowerAdvantage,
  };
}
