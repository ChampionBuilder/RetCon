import type { GearMod } from "@/types/gear";
import type { Power } from "@/types/powers";
import { formatFrameworkName } from "./powerFrameworks";

const DAMAGE_MOD_NAMES_BY_FRAMEWORK: Record<string, string> = {
  Archery: "Pinpoint Accuracy",
  Bestial_Supernatural: "Teleiosaurus Rage",
  Celestial: "Valerian Scarlet's Radiance",
  Darkness: "Shadow Destroyer's Comtempt",
  Dual_Blades: "Dragon's Fangs",
  Earth: "Earth Power",
  Electricity: "Right Eye of the Ruby Dragon",
  Fighting_Claws: "Nighthawk's Talons",
  Fire: "Qwyjibo's Fury",
  Force: "Gravitar's Influence",
  Gadgeteering: "Teleio's Gadget",
  Heavy_Weapon: "Ironclad's Will",
  Ice: "Kigatilik's Wrath",
  Infernal_Supernatural: "Venomous",
  Laser_Sword: "Cybermind's Impression",
  Might: "Ripper's Rage",
  Munitions: "ASCII's Precision",
  Power_Armor: "Clarence's Machinery",
  Single_Blade: "Jack Fool's Blade",
  Sorcery: "Spell of Takofanes",
  Telekinesis: "Medusa's Presence",
  Telepathy: "Menton's Will",
  Unarmed: "Left Eye of the Ruby Dragon",
  Wind: "Storm Chaser",
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

export function buildDamageModsByFramework(
  mods: GearMod[],
  powers: Power[],
) {
  const damageMods = mods.filter(isDamageMod);
  const damageModsByName = new Map(
    damageMods.map((mod) => [normalizeText(mod.name), mod.name]),
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
    const configuredModName = DAMAGE_MOD_NAMES_BY_FRAMEWORK[frameworkId];
    const matchingModName = configuredModName
      ? damageModsByName.get(normalizeText(configuredModName))
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
