import type { SuperStat } from "@/types/character";
import type { GearBonus, GearBuildSlot, GearItem } from "@/types/gear";
import {
  formatBonusType,
  getGearBonusValue,
  getRankedGearBonusValue,
  getResolvedBonusTypes,
  statBonusOrderIndex,
} from "./gearBonusFormatting";

function addBonusToTotals(
  totals: Map<string, number>,
  type: string,
  value: number | null,
) {
  if (value === null || !Number.isFinite(value)) {
    return;
  }

  const normalizedType = formatBonusType(type);

  totals.set(normalizedType, (totals.get(normalizedType) ?? 0) + value);
}

function addResolvedBonusToTotals(
  totals: Map<string, number>,
  bonus: GearBonus,
  value: number | null,
  selectedSuperStats: (SuperStat | null)[],
) {
  getResolvedBonusTypes(bonus.type, selectedSuperStats).forEach((type) => {
    addBonusToTotals(totals, type, value);
  });
}

function getSelectedGearBySet(gearSlots: GearBuildSlot[]) {
  const gearBySet = new Map<string, GearItem[]>();

  gearSlots.forEach((gearSlot) => {
    const gear = gearSlot.gear;

    if (!gear?.gear_set) {
      return;
    }

    gearBySet.set(gear.gear_set, [
      ...(gearBySet.get(gear.gear_set) ?? []),
      gear,
    ]);
  });

  return gearBySet;
}

export function getGearTotals(
  gearSlots: GearBuildSlot[],
  selectedSuperStats: (SuperStat | null)[],
) {
  const totals = new Map<string, number>();

  gearSlots.forEach((gearSlot) => {
    gearSlot.gear?.bonuses.forEach((bonus) => {
      addResolvedBonusToTotals(
        totals,
        bonus,
        getGearBonusValue(bonus),
        selectedSuperStats,
      );
    });

    gearSlot.gear?.set_piece_bonuses.forEach((bonus) => {
      addResolvedBonusToTotals(
        totals,
        bonus,
        getGearBonusValue(bonus),
        selectedSuperStats,
      );
    });

    gearSlot.selectedMods.forEach((selectedMod) => {
      if (!selectedMod?.rank) {
        return;
      }

      const selectedRank = selectedMod.rank;

      selectedMod.mod.bonuses.forEach((bonus) => {
        addResolvedBonusToTotals(
          totals,
          bonus,
          getRankedGearBonusValue(bonus, selectedRank),
          selectedSuperStats,
        );
      });
    });
  });

  getSelectedGearBySet(gearSlots).forEach((setGears) => {
    const setGearCount = setGears.length;
    const representativeGear = setGears[0];

    representativeGear?.set_bonuses.forEach((setBonusTier) => {
      if (setBonusTier.pieces > setGearCount) {
        return;
      }

      setBonusTier.bonuses.forEach((bonus) => {
        addResolvedBonusToTotals(
          totals,
          bonus,
          getGearBonusValue(bonus),
          selectedSuperStats,
        );
      });
    });
  });

  return Array.from(totals.entries()).sort(([typeA], [typeB]) => {
    const statIndexA = statBonusOrderIndex.get(typeA.toUpperCase());
    const statIndexB = statBonusOrderIndex.get(typeB.toUpperCase());

    if (statIndexA !== undefined || statIndexB !== undefined) {
      return (statIndexA ?? 999) - (statIndexB ?? 999);
    }

    return formatBonusType(typeA).localeCompare(formatBonusType(typeB));
  });
}
