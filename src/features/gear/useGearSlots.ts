import { useState } from "react";
import type {
  GearBuildSlot,
  GearItem,
  GearMod,
  GearModRank,
} from "@/types/gear";

const initialGearSlots: GearBuildSlot[] = [
  {
    id: "primary-offense",
    gearSlot: "Primary",
    gearType: "Offense",
    gear: null,
    selectedMods: [],
  },
  {
    id: "primary-defense",
    gearSlot: "Primary",
    gearType: "Defense",
    gear: null,
    selectedMods: [],
  },
  {
    id: "primary-utility",
    gearSlot: "Primary",
    gearType: "Utility",
    gear: null,
    selectedMods: [],
  },
  {
    id: "secondary-offense",
    gearSlot: "Secondary",
    gearType: "Offense",
    gear: null,
    selectedMods: [],
  },
  {
    id: "secondary-defense",
    gearSlot: "Secondary",
    gearType: "Defense",
    gear: null,
    selectedMods: [],
  },
  {
    id: "secondary-utility",
    gearSlot: "Secondary",
    gearType: "Utility",
    gear: null,
    selectedMods: [],
  },
];

export function useGearSlots() {
  const [gearSlots, setGearSlots] = useState<GearBuildSlot[]>(initialGearSlots);

  function clearGearSlot(slotId: string) {
    setGearSlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.id === slotId ? { ...slot, gear: null, selectedMods: [] } : slot,
      ),
    );
  }

  function resetAllGearSlots() {
    setGearSlots(initialGearSlots);
  }

  function resetAllGearMods() {
    setGearSlots((currentSlots) =>
      currentSlots.map((slot) => ({
        ...slot,
        selectedMods: slot.gear?.mod_slots.map(() => null) ?? [],
      })),
    );
  }

  function placeGear(slotId: string, gear: GearItem) {
    setGearSlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              gear,
              selectedMods: gear.mod_slots.map(() => null),
            }
          : slot,
      ),
    );
  }

  function clearGearMods(slotId: string) {
    setGearSlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              selectedMods: slot.gear?.mod_slots.map(() => null) ?? [],
            }
          : slot,
      ),
    );
  }

  function clearGearMod(slotId: string, modSlotIndex: number) {
    setGearSlots((currentSlots) =>
      currentSlots.map((slot) => {
        if (slot.id !== slotId || !slot.gear) {
          return slot;
        }

        const nextSelectedMods = slot.gear.mod_slots.map(
          (_, index) => slot.selectedMods[index] ?? null,
        );
        nextSelectedMods[modSlotIndex] = null;

        return {
          ...slot,
          selectedMods: nextSelectedMods,
        };
      }),
    );
  }

  function placeGearMod(
    slotId: string,
    modSlotIndex: number,
    mod: GearMod,
    rank: GearModRank | null,
  ) {
    setGearSlots((currentSlots) =>
      currentSlots.map((slot) => {
        if (slot.id !== slotId || !slot.gear) {
          return slot;
        }

        const nextSelectedMods = slot.gear.mod_slots.map(
          (_, index) => slot.selectedMods[index] ?? null,
        );
        nextSelectedMods[modSlotIndex] = {
          mod,
          rank,
        };

        return {
          ...slot,
          selectedMods: nextSelectedMods,
        };
      }),
    );
  }

  return {
    clearGearMod,
    clearGearMods,
    clearGearSlot,
    gearSlots,
    placeGear,
    placeGearMod,
    resetAllGearMods,
    resetAllGearSlots,
  };
}
