import type { BuildSlot } from "../types/builds";

export function clearBuildSlot(slot: BuildSlot): BuildSlot {
  return {
    ...slot,
    power: null,
    displayFrameworkId: null,
    selectedAdvantages: [],
  };
}
