import { useMemo } from "react";
import type { BuildSlot } from "../types/builds";
import type { Archetype } from "../types/character";

type UseArchetypePowerStateOptions = {
  buildSlots: BuildSlot[];
  isFreeform: boolean;
  selectedArchetype: Archetype | null;
};

export function useArchetypePowerState({
  buildSlots,
  isFreeform,
  selectedArchetype,
}: UseArchetypePowerStateOptions) {
  const archetypeAlternativePowerIdsBySlot = useMemo(() => {
    if (isFreeform || !selectedArchetype?.powerList) {
      return new Map<number, number[]>();
    }

    return new Map(
      selectedArchetype.powerList.flatMap((entry, index) =>
        Array.isArray(entry) ? [[index + 1, entry]] : [],
      ),
    );
  }, [isFreeform, selectedArchetype]);

  const archetypeAlternativePowerSlotNumbers = useMemo(() => {
    return new Set(archetypeAlternativePowerIdsBySlot.keys());
  }, [archetypeAlternativePowerIdsBySlot]);

  const lockedPowerSlotNumbers = useMemo(() => {
    if (isFreeform) {
      return new Set<number>();
    }

    return new Set(
      buildSlots
        .filter((slot) => !archetypeAlternativePowerSlotNumbers.has(slot.slot))
        .map((slot) => slot.slot),
    );
  }, [archetypeAlternativePowerSlotNumbers, buildSlots, isFreeform]);

  return {
    archetypeAlternativePowerIdsBySlot,
    archetypeAlternativePowerSlotNumbers,
    lockedPowerSlotNumbers,
  };
}
