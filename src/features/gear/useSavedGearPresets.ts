import { useEffect, useState } from "react";
import type {
  GearBuildSlot,
  GearItem,
  GearMod,
  SavedGearPreset,
} from "@/types/gear";
import {
  loadSavedGearPresets,
  storeSavedGearPresets,
} from "./savedGearPresets";
import { initialGearSlots } from "./useGearSlots";

function getGearPresetName(gearSlots: GearBuildSlot[]) {
  const selectedGearNames = gearSlots
    .map((slot) => slot.gear?.name)
    .filter((name): name is string => Boolean(name));

  return selectedGearNames.length > 0
    ? selectedGearNames.slice(0, 2).join(" / ")
    : "";
}

function normalizeGearPresetName(name: string) {
  return name.trim().slice(0, 16) || "Gear preset";
}

function serializeGearSlots(gearSlots: GearBuildSlot[]) {
  return gearSlots.map((slot) => ({
    slotId: slot.id,
    gearId: slot.gear?.gear_id ?? null,
    mods: slot.selectedMods.map((selectedMod) => ({
      modId: selectedMod?.mod.mod_id ?? null,
      rank: selectedMod?.rank ?? null,
    })),
  }));
}

function hydrateGearPreset(
  savedGearPreset: SavedGearPreset,
  gearsById: Map<number, GearItem>,
  modsById: Map<number, GearMod>,
) {
  const savedSlotsById = new Map(
    savedGearPreset.slots.map((slot) => [slot.slotId, slot]),
  );

  return initialGearSlots.map((initialSlot) => {
    const savedSlot = savedSlotsById.get(initialSlot.id);
    const gear = savedSlot?.gearId ? gearsById.get(savedSlot.gearId) ?? null : null;

    return {
      ...initialSlot,
      gear,
      selectedMods: gear
        ? gear.mod_slots.map((_, modSlotIndex) => {
            const savedMod = savedSlot?.mods[modSlotIndex];
            const mod = savedMod?.modId
              ? modsById.get(savedMod.modId) ?? null
              : null;

            return mod
              ? {
                  mod,
                  rank: savedMod?.rank ?? null,
                }
              : null;
          })
        : [],
    };
  });
}

export function useSavedGearPresets({
  gearSlots,
  gearsById,
  modsById,
}: {
  gearSlots: GearBuildSlot[];
  gearsById: Map<number, GearItem>;
  modsById: Map<number, GearMod>;
}) {
  const [savedGearPresets, setSavedGearPresets] = useState<SavedGearPreset[]>(
    () => loadSavedGearPresets(),
  );

  useEffect(() => {
    storeSavedGearPresets(savedGearPresets);
  }, [savedGearPresets]);

  function saveCurrentGearPreset(name: string) {
    setSavedGearPresets((currentPresets) => [
      {
        id: crypto.randomUUID(),
        name: normalizeGearPresetName(name),
        slots: serializeGearSlots(gearSlots),
        updatedAt: new Date().toISOString(),
      },
      ...currentPresets,
    ]);
  }

  function overwriteGearPreset(presetId: string, name: string) {
    setSavedGearPresets((currentPresets) =>
      currentPresets.map((preset) =>
        preset.id === presetId
          ? {
              ...preset,
              name: normalizeGearPresetName(name),
              slots: serializeGearSlots(gearSlots),
              updatedAt: new Date().toISOString(),
            }
          : preset,
      ),
    );
  }

  function deleteGearPreset(presetId: string) {
    setSavedGearPresets((currentPresets) =>
      currentPresets.filter((preset) => preset.id !== presetId),
    );
  }

  function getHydratedGearPreset(presetId: string) {
    const preset = savedGearPresets.find(
      (savedGearPreset) => savedGearPreset.id === presetId,
    );

    return preset ? hydrateGearPreset(preset, gearsById, modsById) : null;
  }

  return {
    currentGearPresetName: getGearPresetName(gearSlots),
    deleteGearPreset,
    getHydratedGearPreset,
    overwriteGearPreset,
    savedGearPresets,
    saveCurrentGearPreset,
  };
}
