import type { Advantage } from "@/types/advantages";
import type { BuildSlot } from "@/types/builds";
import {
  getAdvantagePointBudget,
  getTotalAdvantagePoints,
} from "@/utils/advantagerules";

type UseAdvantageActionsOptions = {
  advantages: Advantage[];
  allPowerSlots: BuildSlot[];
  buildSlots: BuildSlot[];
  camsLevel: number;
  clearPowerAdvantages: () => void;
  clearPowerSlotAdvantages: (slotNumber: number) => void;
  clearTravelPowerAdvantages: () => void;
  clearTravelPowerSlotAdvantages: (slotNumber: number) => void;
  togglePowerAdvantage: (
    slotNumber: number,
    advantageId: number,
    advantages: Advantage[],
    totalAdvantagePoints: number,
    advantagePointBudget: number,
  ) => void;
  toggleTravelPowerAdvantage: (
    slotNumber: number,
    advantageId: number,
    advantages: Advantage[],
    totalAdvantagePoints: number,
    advantagePointBudget: number,
  ) => void;
};

export function useAdvantageActions({
  advantages,
  allPowerSlots,
  buildSlots,
  camsLevel,
  clearPowerAdvantages,
  clearPowerSlotAdvantages,
  clearTravelPowerAdvantages,
  clearTravelPowerSlotAdvantages,
  togglePowerAdvantage,
  toggleTravelPowerAdvantage,
}: UseAdvantageActionsOptions) {
  const totalAdvantagePoints = getTotalAdvantagePoints(
    allPowerSlots,
    advantages,
  );
  const advantagePointBudget = getAdvantagePointBudget(camsLevel);

  function resetAdvantages() {
    clearPowerAdvantages();
    clearTravelPowerAdvantages();
  }

  function toggleAdvantage(slotNumber: number, advantageId: number) {
    if (buildSlots.some((slot) => slot.slot === slotNumber)) {
      togglePowerAdvantage(
        slotNumber,
        advantageId,
        advantages,
        totalAdvantagePoints,
        advantagePointBudget,
      );
      return;
    }

    toggleTravelPowerAdvantage(
      slotNumber,
      advantageId,
      advantages,
      totalAdvantagePoints,
      advantagePointBudget,
    );
  }

  function clearSlotAdvantages(slotNumber: number) {
    if (buildSlots.some((slot) => slot.slot === slotNumber)) {
      clearPowerSlotAdvantages(slotNumber);
      return;
    }

    clearTravelPowerSlotAdvantages(slotNumber);
  }

  return {
    advantagePointBudget,
    clearSlotAdvantages,
    resetAdvantages,
    toggleAdvantage,
    totalAdvantagePoints,
  };
}
