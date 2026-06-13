import type { GearMod } from "@/types/gear";
import type { Power } from "@/types/powers";
import { formatFrameworkName } from "./powerFrameworks";

const DAMAGE_MOD_ICON_KEYS_BY_FRAMEWORK: Record<string, string> = {
  Archery: "Archery",
  Bestial_Supernatural: "Bestial",
  Celestial: "Celestial",
  Darkness: "Darkness",
  Dual_Blades: "DualBlades",
  Earth: "Earth",
  Electricity: "Electricity",
  Fighting_Claws: "Claws",
  Fire: "Fire",
  Force: "Force",
  Gadgeteering: "Gadget",
  Heavy_Weapon: "HeavyWeapons",
  Ice: "Ice",
  Infernal_Supernatural: "Supernatural",
  Laser_Sword: "LaserSword",
  Might: "Might",
  Munitions: "Munitions",
  Power_Armor: "PowerArmor",
  Single_Blade: "SingleBlade",
  Sorcery: "Sorcery",
  Telekinesis: "Telekinesis",
  Telepathy: "Telepathy",
  Unarmed: "Unarmed",
  Wind: "Wind",
};

function normalizeText(value: string | null | undefined) {
  return value?.replace(/[^a-z0-9]+/giu, "").toLowerCase() ?? "";
}

function isDamageMod(mod: GearMod) {
  return (
    mod.tag.some((tag) => normalizeText(tag) === "damagemod") ||
    normalizeText(mod.mod_bonus) === "damagebonus" ||
    mod.bonuses.some((bonus) => normalizeText(bonus.type) === "damagebonus")
  );
}

function getFrameworkSearchLabels(frameworkId: string) {
  const label = formatFrameworkName(frameworkId);
  const labels = new Set([label]);

  if (label.endsWith(" Supernatural")) {
    labels.add(label.replace(/ Supernatural$/u, ""));
    labels.add("Supernatural");
  }

  if (frameworkId === "Heavy_Weapon") {
    labels.add("Heavy Weapons");
  }

  return Array.from(labels).filter(Boolean);
}

function modTooltipMentionsFramework(mod: GearMod, frameworkId: string) {
  const tooltip = normalizeText(mod.tooltip);

  if (!tooltip) {
    return false;
  }

  return getFrameworkSearchLabels(frameworkId).some((label) =>
    tooltip.includes(`${normalizeText(label)}framework`),
  );
}

function getDamageModIconKey(mod: GearMod) {
  const iconName = mod.icon_override?.trim();

  if (!iconName?.startsWith("Mod_Damage_")) {
    return null;
  }

  return iconName.replace(/^Mod_Damage_/u, "");
}

export function buildDamageModsByFramework(
  mods: GearMod[],
  powers: Power[],
) {
  const damageMods = mods.filter(isDamageMod);
  const damageModsByIconKey = new Map(
    damageMods
      .map((mod) => [getDamageModIconKey(mod), mod.name] as const)
      .filter((entry): entry is readonly [string, string] =>
        Boolean(entry[0] && entry[1]),
      )
      .map(([iconKey, name]) => [normalizeText(iconKey), name]),
  );
  const frameworkIds = Array.from(
    new Set(
      powers
        .map((power) => power.framework_id)
        .filter((frameworkId): frameworkId is string => Boolean(frameworkId)),
    ),
  );
  const damageModsByFramework = new Map<string, string>();

  frameworkIds.forEach((frameworkId) => {
    const configuredIconKey = DAMAGE_MOD_ICON_KEYS_BY_FRAMEWORK[frameworkId];
    const matchingModName = configuredIconKey
      ? damageModsByIconKey.get(normalizeText(configuredIconKey))
      : null;

    if (matchingModName) {
      damageModsByFramework.set(frameworkId, matchingModName);

      return;
    }

    const matchingMod = damageMods.find((mod) =>
      modTooltipMentionsFramework(mod, frameworkId),
    );

    if (matchingMod?.name) {
      damageModsByFramework.set(frameworkId, matchingMod.name);
    }
  });

  return damageModsByFramework;
}
