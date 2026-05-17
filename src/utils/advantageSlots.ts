import type { Advantage } from "../types/advantages";
import type { BuildSlot } from "../types/builds";
import { canAddAdvantage } from "./advantagerules";

function getDependentAdvantageIds(
  advantages: Advantage[],
  advantageId: number,
) {
  return advantages
    .filter(
      (advantage) => advantage.dependency_advantage_id === advantageId,
    )
    .map((advantage) => advantage.advantage_id);
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

    if (alreadySelected) {
      const dependentAdvantageIds = getDependentAdvantageIds(
        advantages,
        advantageId,
      );

      return {
        ...slot,
        selectedAdvantages: slot.selectedAdvantages.filter(
          (id) => id !== advantageId && !dependentAdvantageIds.includes(id),
        ),
      };
    }

    if (
      advantage.dependency_advantage_id !== null &&
      !slot.selectedAdvantages.includes(advantage.dependency_advantage_id)
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
