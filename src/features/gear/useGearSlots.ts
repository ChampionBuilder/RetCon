import { useState } from "react";
import type {
  GearBuildSlot,
  GearItem,
  GearMod,
  GearModRank,
} from "@/types/gear";

export type BasicGearStatCode =
  | "STR"
  | "DEX"
  | "CON"
  | "INT"
  | "EGO"
  | "PRE"
  | "REC"
  | "END";

function getModRankValue(mod: GearMod, rank: GearModRank) {
  return mod.bonuses
    .map((bonus) => bonus.values_by_rank?.[String(rank)] ?? null)
    .find((value) => value !== null && value !== undefined && value !== "");
}

function getGearMaxRank(slot: GearBuildSlot) {
  const maxRank = Number(slot.gear?.max_rank);

  return Number.isFinite(maxRank) ? maxRank : null;
}

function getFillRank(slot: GearBuildSlot, mod: GearMod): GearModRank | null {
  const maxRank = getGearMaxRank(slot);

  if ((maxRank === null || maxRank >= 7) && getModRankValue(mod, 7)) {
    return 7;
  }

  return getModRankValue(mod, 5) ? 5 : null;
}

function getBasicStatMod(
  mods: GearMod[],
  statCode: BasicGearStatCode,
  slotType: "Armoring" | "Enhancement",
) {
  return mods.find(
    (mod) =>
      !mod.is_disabled &&
      mod.name === statCode &&
      mod.mod_types.includes(slotType),
  ) ?? null;
}

function getStatSlotType(slotTypes: string[]) {
  if (slotTypes.includes("Armoring")) {
    return "Armoring";
  }

  if (slotTypes.includes("Enhancement")) {
    return "Enhancement";
  }

  return null;
}

export const initialGearSlots: GearBuildSlot[] = [
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

  function replaceGearSlots(slots: GearBuildSlot[]) {
    setGearSlots(slots);
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

  function fillGearStatMods(statCode: BasicGearStatCode, mods: GearMod[]) {
    setGearSlots((currentSlots) =>
      currentSlots.map((slot) => {
        if (!slot.gear) {
          return slot;
        }

        const nextSelectedMods = slot.gear.mod_slots.map(
          (slotTypes, modSlotIndex) => {
            const statSlotType = getStatSlotType(slotTypes);

            if (!statSlotType) {
              return slot.selectedMods[modSlotIndex] ?? null;
            }

            const mod = getBasicStatMod(mods, statCode, statSlotType);
            const rank = mod ? getFillRank(slot, mod) : null;

            return mod && rank
              ? {
                  mod,
                  rank,
                }
              : slot.selectedMods[modSlotIndex] ?? null;
          },
        );

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
    fillGearStatMods,
    gearSlots,
    placeGear,
    placeGearMod,
    replaceGearSlots,
    resetAllGearMods,
    resetAllGearSlots,
  };
}
