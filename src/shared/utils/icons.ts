import type { Power } from "@/types/powers";

const legacyIconAliases: Record<string, string> = {
  Archery_StormofArrows: "Archery_StormOfArrows",
  Archery_TorrentofArrows: "Archery_TorrentOfArrows",
  BestialSupernatural_AspectoftheBestial:
    "BestialSupernatural_AspectOfTheBestial",
  Darkness_VeilofDarkness: "Darkness_VeilOfDarkness",
  DualBlades_EyeoftheStorm: "DualBlades_EyeOfTheStorm",
  DualBlades_FormoftheTempest: "DualBlades_FormOfTheTempest",
  DualBlades_RainofSteel: "DualBlades_RainOfSteel",
  Electricity_SigilsoftheStorm: "Electricity_SigilsOfTheStorm",
  FightingClaws_FormoftheTiger: "FightingClaws_FormOfTheTiger",
  FightingClaws_RendandTear: "FightingClaws_RendAndTear",
  Fire_RiseFromtheAshes: "Fire_RiseFromTheAshes",
  HeavyWeapon_ArcofRuin: "HeavyWeapon_ArcOfRuin",
  Ice_WallofIce: "Ice_WallOfIce",
  InfernalSupernatural_AspectoftheInfernal:
    "InfernalSupernatural_AspectOfTheInfernal",
  InfernalSupernatural_WillotheWisp: "InfernalSupernatural_WillOTheWisp",
  MartialArts_FuryoftheDragon: "MartialArts_FuryOfTheDragon",
  MartialArts_WayoftheWarrior: "MartialArts_WayOfTheWarrior",
  Mentalist_MasteroftheMind: "Mentalist_MasterOfTheMind",
  PowerArmor_AspectoftheMachine: "PowerArmor_AspectOfTheMachine",
  SingleBlade_FormoftheSwordsman: "SingleBlade_FormOfTheSwordsman",
  Telepathy_CongressofSelves: "Telepathy_CongressOfSelves",
  Telepathy_ShadowofDoubt: "Telepathy_ShadowOfDoubt",
  Unarmed_FormoftheMaster: "Unarmed_FormOfTheMaster",
  Wind_VeilofMist: "Wind_VeilOfMist",
};

function compact(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, "");
}

function frameworkToken(frameworkId: string | null) {
  if (!frameworkId) {
    return "Any";
  }

  const aliases: Record<string, string> = {
    Power_Armor: "PowerArmor",
    Heavy_Weapon: "HeavyWeapon",
    Laser_Sword: "LaserSword",
    Single_Blade: "SingleBlade",
    Dual_Blades: "DualBlades",
    Fighting_Claws: "FightingClaws",
    Shared_Martial_Arts: "MartialArts",
    Bestial_Supernatural: "BestialSupernatural",
    Infernal_Supernatural: "InfernalSupernatural",
    Shared_Sorcery: "Sorcery",
  };

  return aliases[frameworkId] ?? compact(frameworkId);
}

function resolveLegacyIconAlias(iconName: string) {
  return legacyIconAliases[iconName] ?? iconName;
}

export function getFrameworkIconName(frameworkId: string | null) {
  const token = frameworkToken(frameworkId);

  return frameworkId
    ? resolveLegacyIconAlias(`Framework_${token}`)
    : "Any_Generic";
}

export function getDeviceFrameworkIconName(frameworkId: string | null) {
  const aliases: Record<string, string> = {
    Bloodmoon: "Icon_Bloodmoon",
    Drifter: "Icon_Drifter",
    Healing_Devices: "Icon_Heal",
    Passive: "Icon_Passive",
    Questionite_Store: "Icon_QStore",
    Recognition_Vendor: "Icon_Recognition",
    Sidekick: "Icon_Sidekick",
    Travel_Power: "Icon_TravelPower",
  };

  return frameworkId ? aliases[frameworkId] ?? "Icon_Bag" : "Icon_Bag";
}

export function getPowerIconName(power: Power | null | undefined) {
  if (!power) {
    return "Any_Generic";
  }

  return resolveLegacyIconAlias(
    power.icon_override ??
      `${frameworkToken(power.framework_id)}_${compact(power.name)}`,
  );
}

export function getStatIconName(statName: string) {
  return `Stat_${statName}`;
}
