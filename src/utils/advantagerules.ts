import type { Advantage } from "@/types/advantages";
import type { BuildSlot } from "@/types/builds";

export const baseAdvantagePointBudget = 36;
export const maxAdvantagePointsPerPower = 5;
export const maxCamsLevel = 5;

export function getAdvantagePointBudget(camsLevel: number) {
  return baseAdvantagePointBudget + Math.max(0, Math.min(maxCamsLevel, camsLevel));
}

export function getTotalAdvantagePoints(
  buildSlots: BuildSlot[],
  advantages: Advantage[]
): number {

  return buildSlots.reduce(
    (total, slot) => {

      const slotAdvantages =
        advantages.filter((advantage) =>
          slot.selectedAdvantages.includes(
            advantage.advantage_id
          )
        );

      const slotCost =
        slotAdvantages.reduce(
          (sum, advantage) =>
            sum +
            (advantage.points_cost ?? 0),
          0
        );

      return total + slotCost;

    },
    0
  );
}

export function getSlotAdvantagePoints(
  slot: BuildSlot,
  advantages: Advantage[],
) {
  return advantages
    .filter((advantage) =>
      slot.selectedAdvantages.includes(advantage.advantage_id),
    )
    .reduce((sum, advantage) => sum + (advantage.points_cost ?? 0), 0);
}

export function canAddAdvantage(
  slot: BuildSlot,
  advantage: Advantage,
  advantages: Advantage[],
  totalAdvantagePoints: number,
  advantagePointBudget: number,
) {
  const advantageCost = advantage.points_cost ?? 0;

  if (totalAdvantagePoints >= advantagePointBudget) {
    return false;
  }

  if (
    getSlotAdvantagePoints(slot, advantages) + advantageCost >
    maxAdvantagePointsPerPower
  ) {
    return false;
  }

  return totalAdvantagePoints + advantageCost <= advantagePointBudget;
}
