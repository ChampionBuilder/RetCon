export type GearBonus = {
  type: string;
  value?: number | string;
  values_by_rank?: Record<string, number | string>;
};

export type GearSetBonusTier = {
  pieces: number;
  bonuses: GearBonus[];
  text: string[];
};

export type GearItem = {
  gear_id: number;
  gear_set: string | null;
  gear_slot: "Primary" | "Secondary" | string;
  gear_type: "Offense" | "Defense" | "Utility" | string;
  name: string;
  gear_tooltip: string | null;
  gear_bonus: string | null;
  set_tooltip: string | null;
  set_bonus: string | null;
  set_piece_bonus: string | null;
  override_set_bonus: boolean | string | null;
  mod_slot_1: string[];
  mod_slot_2: string[];
  mod_slot_3: string[];
  mod_slot_4: string[];
  mod_slots: string[][];
  max_rank: number | string | null;
  tag: string[];
  source: string[];
  icon_override: string | null;
  is_disabled: boolean;
  bonuses: GearBonus[];
  bonus_text: string[];
  set_piece_bonuses: GearSetBonusTier[];
  set_piece_bonus_text: string[];
  set_bonuses: GearSetBonusTier[];
};

export type GearMod = {
  mod_id: number;
  mod_type: string | null;
  name: string;
  mod_bonus: string | null;
  rank_5: number | string | null;
  rank_7: number | string | null;
  rank_9: number | string | null;
  tooltip: string | null;
  stackable?: boolean | string | null;
  tag: string[];
  source: string[];
  icon_override: string | null;
  is_disabled: boolean;
  mod_types: string[];
  bonuses: GearBonus[];
};

export type GearModRank = 5 | 7 | 9;

export type SelectedGearMod = {
  mod: GearMod;
  rank: GearModRank | null;
};

export type GearBuildSlot = {
  id: string;
  gearSlot: "Primary" | "Secondary";
  gearType: "Offense" | "Defense" | "Utility";
  gear: GearItem | null;
  selectedMods: Array<SelectedGearMod | null>;
};

export type SavedGearPresetSlot = {
  slotId: string;
  gearId: number | null;
  mods: Array<{
    modId: number | null;
    rank: GearModRank | null;
  }>;
};

export type SavedGearPreset = {
  id: string;
  name: string;
  slots: SavedGearPresetSlot[];
  updatedAt: string;
};
