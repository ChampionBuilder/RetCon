import type { Advantage } from "../types/advantages";
import type { BuildSlot } from "../types/builds";
import {
  getDependentAdvantageIds,
  getRequiredAdvantage,
} from "./advantageDependencies";
import { canAddAdvantage } from "./advantagerules";
import { getPowerAdvantages } from "./powerAdvantages";

function getSlotAdvantages(slot: BuildSlot, advantages: Advantage[]) {
  return getPowerAdvantages(slot.power, advantages);
}

export function toggleAdvantageForSlots(
  slots: BuildSlot[],
  slotNumber: number,
  advantageId: number,
  advantages: Advantage[],
  totalAdvantagePoints: number,
  advantagePointBudget: number,
) {
  const advantage = advantages.find(
    (candidateAdvantage) => candidateAdvantage.advantage_id === advantageId,
  );

  if (!advantage) {
    return slots;
  }

  return slots.map((slot) => {
    if (slot.slot !== slotNumber) {
      return slot;
    }

    const alreadySelected = slot.selectedAdvantages.includes(advantageId);
    const slotAdvantages = getSlotAdvantages(slot, advantages);

    if (alreadySelected) {
      const dependentAdvantageIds = getDependentAdvantageIds(
        advantage,
        slotAdvantages,
      );

      return {
        ...slot,
        selectedAdvantages: slot.selectedAdvantages.filter(
          (id) => id !== advantageId && !dependentAdvantageIds.includes(id),
        ),
      };
    }

    const requiredAdvantage = getRequiredAdvantage(advantage, slotAdvantages);

    if (
      requiredAdvantage !== null &&
      !slot.selectedAdvantages.includes(requiredAdvantage.advantage_id)
    ) {
      return slot;
    }

    if (
      !canAddAdvantage(
        slot,
        advantage,
        advantages,
        totalAdvantagePoints,
        advantagePointBudget,
      )
    ) {
      return slot;
    }

    return {
      ...slot,
      selectedAdvantages: [...slot.selectedAdvantages, advantageId],
    };
  });
}

export function clearAdvantagesForSlot(
  slots: BuildSlot[],
  slotNumber: number,
) {
  return slots.map((slot) =>
    slot.slot === slotNumber
      ? {
          ...slot,
          selectedAdvantages: [],
        }
      : slot,
  );
}
