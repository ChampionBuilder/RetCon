import type { BuildSlot } from "@/types/builds";

function createInitialSlots(levels: number[], firstSlot = 1): BuildSlot[] {
  return levels.map((level, index) => ({
    slot: firstSlot + index,
    level,
    power: null,
    selectedAdvantages: [],
  }));
}

export const initialBuildSlots = createInitialSlots([
  1, 1, 6, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35, 38,
]);

export const initialArchetypeBuildSlots = createInitialSlots([
  1, 1, 6, 8, 11, 14, 17, 21, 25, 30, 35, 40,
]);

export const initialTravelPowerSlots = createInitialSlots([6, 35], 101);

export const initialPowerVariantSlots = createInitialSlots(
  Array.from({ length: 5 }, () => 0),
  201,
);

export const initialDeviceSlots = createInitialSlots(
  Array.from({ length: 5 }, () => 0),
  301,
);
