import type { GearMod, GearModRank } from "@/types/gear";

function usesArmorPenetrationRanks(mod: GearMod) {
  return mod.bonuses.some((bonus) =>
    bonus.type.toLowerCase().startsWith("armor_penetration_"),
  );
}

export function getGearModDisplayRank(mod: GearMod, rank: GearModRank) {
  if (!usesArmorPenetrationRanks(mod)) {
    return rank;
  }

  const displayRanks: Record<GearModRank, number> = {
    5: 7,
    7: 8,
    9: 9,
  };

  return displayRanks[rank];
}
