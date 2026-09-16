import type { BuildSlot } from "@/types/builds";
import type { Advantage } from "@/types/advantages";
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

const checkedScalingStatPowerTypes = new Set([
  "ENERGY_UNLOCK",
  "SLOTTED_SUPPORT_PASSIVE",
  "TOGGLE_FORM",
]);
const threatWipeFilterTags = new Set(["threat wipe"]);

export function getMissingScalingStats(
  power: Power | null,
  selectedSuperStats: (SuperStat | null)[],
) {
  if (!power || !checkedScalingStatPowerTypes.has(getNormalizedPowerType(power))) {
    return [];
  }

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
  advantagesById?: ReadonlyMap<number, Advantage> | null,
) {
  return new Set(
    powers
      .filter((power) =>
        isPowerEnabled(power) &&
        (requirement.key === "ultimate"
          ? isCombatPower(power) && isUltimatePower(power)
          : requirement.key === "threat-wipe"
            ? requirement.powerTypes.includes(getNormalizedPowerType(power)) ||
              hasThreatWipeAdvantage(power, advantagesById)
            : requirement.powerTypes.includes(getNormalizedPowerType(power))),
      )
      .map((power) => power.power_id),
  );
}

function normalizeRequirementText(value: string | null | undefined) {
  return value?.replace(/[^a-z0-9]+/giu, " ").trim().toLowerCase() ?? "";
}

function getTagValues(value: string[] | string | null | undefined) {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  return values
    .flatMap((tag) => String(tag).split(";"))
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function advantageHasThreatWipeFilterTag(advantage: Advantage | null | undefined) {
  return getTagValues(advantage?.filter_tag).some((tag) =>
    threatWipeFilterTags.has(normalizeRequirementText(tag)),
  );
}

function hasThreatWipeAdvantage(
  power: Power | null,
  advantagesById: ReadonlyMap<number, Advantage> | null | undefined,
) {
  return Boolean(
    power &&
      advantagesById &&
      power.advantages.some((advantageId) =>
        advantageHasThreatWipeFilterTag(advantagesById.get(advantageId)),
      ),
  );
}

function hasSelectedThreatWipeAdvantage(
  slot: BuildSlot,
  advantagesById: ReadonlyMap<number, Advantage> | null | undefined,
) {
  return Boolean(
    slot.power &&
      advantagesById &&
      slot.selectedAdvantages.some((advantageId) =>
        advantageHasThreatWipeFilterTag(advantagesById.get(advantageId)),
      ),
  );
}

function getRequirementResults(
  buildSlots: BuildSlot[],
  requirements: BuildRequirement[],
  powerVariantSlots: BuildSlot[] = [],
  advantagesById?: ReadonlyMap<number, Advantage> | null,
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
        : requirement.key === "threat-wipe"
          ? buildSlots.find((slot) =>
              requirement.powerTypes.includes(getNormalizedPowerType(slot.power)) ||
              hasSelectedThreatWipeAdvantage(slot, advantagesById),
            )?.power ?? null
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
  advantagesById?: ReadonlyMap<number, Advantage> | null,
) {
  return getRequirementResults(
    buildSlots,
    optionalBuildRequirements,
    powerVariantSlots,
    advantagesById,
  );
}
