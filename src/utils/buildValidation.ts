import type { BuildSlot } from "@/types/builds";
import type { SuperStat } from "@/types/character";
import type { Power } from "@/types/powers";
import { getNormalizedPowerType } from "@/shared/utils/powerTypes";
import { isCombatPower, isUltimatePower } from "./powerFrameworks";
import { isPowerEnabled } from "./powerrules";

export type BuildRequirementKey =
  | "energy-builder"
  | "slotted-passive"
  | "toggle-form"
  | "block"
  | "energy-unlock"
  | "active-offense"
  | "active-defense"
  | "ultimate"
  | "threat-wipe";

export type BuildRequirement = {
  key: BuildRequirementKey;
  label: string;
  section: "core" | "optional";
  powerTypes: string[];
};

export type BuildRequirementResult = BuildRequirement & {
  power: Power | null;
};

export const coreBuildRequirements: BuildRequirement[] = [
  {
    key: "energy-builder",
    label: "Energy Builder",
    section: "core",
    powerTypes: ["ENERGY_BUILDER"],
  },
  {
    key: "slotted-passive",
    label: "Slotted Passive",
    section: "core",
    powerTypes: [
      "SLOTTED_DEFENSIVE_PASSIVE",
      "SLOTTED_HYBRID_PASSIVE",
      "SLOTTED_OFFENSIVE_PASSIVE",
      "SLOTTED_PASSIVES",
      "SLOTTED_SUPPORT_PASSIVE",
    ],
  },
  {
    key: "toggle-form",
    label: "Toggle Form",
    section: "core",
    powerTypes: ["TOGGLE_FORM"],
  },
  {
    key: "block",
    label: "Block",
    section: "core",
    powerTypes: ["BLOCK"],
  },
  {
    key: "energy-unlock",
    label: "Energy Unlock",
    section: "core",
    powerTypes: ["ENERGY_UNLOCK"],
  },
];

export const optionalBuildRequirements: BuildRequirement[] = [
  {
    key: "active-offense",
    label: "Active Offense",
    section: "optional",
    powerTypes: ["ACTIVE_OFFENSE"],
  },
  {
    key: "active-defense",
    label: "Active Defense",
    section: "optional",
    powerTypes: ["ACTIVE_DEFENSE"],
  },
  {
    key: "ultimate",
    label: "Ultimate",
    section: "optional",
    powerTypes: [],
  },
  {
    key: "threat-wipe",
    label: "Threat Wipe",
    section: "optional",
    powerTypes: ["THREAT_WIPE"],
  },
];

const superStatNameToCode: Record<string, string> = {
  Strength: "STR",
  Dexterity: "DEX",
  Constitution: "CON",
  Intelligence: "INT",
  Ego: "EGO",
  Presence: "PRE",
  Recovery: "REC",
  Endurance: "END",
};

export function getMissingScalingStats(
  power: Power | null,
  selectedSuperStats: (SuperStat | null)[],
) {
  const scalingStats = power?.scaling_stats ?? [];

  if (scalingStats.length === 0) {
    return [];
  }

  const selectedStatCodes = new Set(
    selectedSuperStats
      .map((stat) => (stat ? superStatNameToCode[stat.name] : null))
      .filter((statCode): statCode is string => statCode !== null),
  );
  const normalizedScalingStats = scalingStats.map((stat) => stat.toUpperCase());

  return normalizedScalingStats.some((stat) => selectedStatCodes.has(stat))
    ? []
    : normalizedScalingStats;
}

export function getMatchingRequirementPowerIds(
  requirement: BuildRequirement,
  powers: Power[],
) {
  return new Set(
    powers
      .filter((power) =>
        isPowerEnabled(power) &&
        (requirement.key === "ultimate"
          ? isCombatPower(power) && isUltimatePower(power)
          : requirement.powerTypes.includes(getNormalizedPowerType(power))),
      )
      .map((power) => power.power_id),
  );
}

function getRequirementResults(
  buildSlots: BuildSlot[],
  requirements: BuildRequirement[],
  powerVariantSlots: BuildSlot[] = [],
) {
  return requirements.map((requirement) => ({
    ...requirement,
    power:
      requirement.key === "ultimate"
        ? buildSlots.find((slot) =>
            isUltimatePower(slot.power),
          )?.power ??
          powerVariantSlots.find((slot) =>
            isUltimatePower(slot.power),
          )?.power ??
          null
        : buildSlots.find((slot) =>
            requirement.powerTypes.includes(getNormalizedPowerType(slot.power)),
          )?.power ?? null,
  }));
}

export function getCoreBuildRequirementResults(buildSlots: BuildSlot[]) {
  return getRequirementResults(buildSlots, coreBuildRequirements);
}

export function getOptionalBuildRequirementResults(
  buildSlots: BuildSlot[],
  powerVariantSlots: BuildSlot[],
) {
  return getRequirementResults(
    buildSlots,
    optionalBuildRequirements,
    powerVariantSlots,
  );
}
