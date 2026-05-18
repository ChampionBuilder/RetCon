import type { Power } from "../types/powers";
import { isPowerEnabled } from "./powerrules";

export type PowerFrameworkFilter = {
  id: string;
  iconId: string | null;
  title: string;
  selectable: boolean;
};

export type PowerFrameworkFilterGroup = {
  id: string;
  title: string;
  filters: PowerFrameworkFilter[];
};

export const travelPowerFilterId = "__travel_powers__";
export const powerVariantsFilterId = "__power_variants__";
export const devicesFilterId = "__devices__";

const sharedFrameworkChildren: Record<string, string[]> = {
  Shared_Brick: ["Earth", "Heavy_Weapon", "Might"],
  Shared_Energy_Projector: ["Electricity", "Fire", "Force", "Ice", "Wind"],
  Shared_Martial_Arts: [
    "Dual_Blades",
    "Fighting_Claws",
    "Single_Blade",
    "Unarmed",
  ],
  Shared_Mentalist: ["Telekinesis", "Telepathy"],
  Shared_Mystic: [
    "Celestial",
    "Darkness",
    "Sorcery",
    "Bestial_Supernatural",
    "Infernal_Supernatural",
  ],
  Shared_mystic: [
    "Celestial",
    "Darkness",
    "Sorcery",
    "Bestial_Supernatural",
    "Infernal_Supernatural",
  ],
  Shared_Sorcery: ["Celestial", "Sorcery", "Darkness"],
  Shared_Supernatural: ["Bestial_Supernatural", "Infernal_Supernatural"],
  Shared_Technology: [
    "Archery",
    "Gadgeteering",
    "Laser_Sword",
    "Munitions",
    "Power_Armor",
  ],
};

const frameworkGroups = [
  {
    id: "energy-projector",
    title: "Energy Projector",
    frameworkIds: ["Electricity", "Fire", "Force", "Wind", "Ice"],
  },
  {
    id: "technology",
    title: "Technology",
    frameworkIds: [
      "Archery",
      "Gadgeteering",
      "Munitions",
      "Power_Armor",
      "Laser_Sword",
    ],
  },
  {
    id: "martial-arts",
    title: "Martial Arts",
    frameworkIds: [
      "Dual_Blades",
      "Fighting_Claws",
      "Single_Blade",
      "Unarmed",
    ],
  },
  {
    id: "mentalist",
    title: "Mentalist",
    frameworkIds: ["Telekinesis", "Telepathy"],
  },
  {
    id: "brick",
    title: "Brick",
    frameworkIds: ["Earth", "Might", "Heavy_Weapon"],
  },
  {
    id: "mystic",
    title: "Mystic",
    frameworkIds: [
      "Celestial",
      "Darkness",
      "Sorcery",
      "Bestial_Supernatural",
      "Infernal_Supernatural",
    ],
  },
];

const orderedFrameworkIds = frameworkGroups.flatMap(
  (frameworkGroup) => frameworkGroup.frameworkIds,
);

export const supplementalFrameworkFilters: PowerFrameworkFilter[] = [
  {
    id: travelPowerFilterId,
    iconId: "TravelPower_Flight",
    title: "Travel Powers",
    selectable: true,
  },
  {
    id: powerVariantsFilterId,
    iconId: "Gadgeteering_SonicDevice",
    title: "Power Variants",
    selectable: true,
  },
  {
    id: devicesFilterId,
    iconId: "Gadgeteering_SonicDevice",
    title: "Devices",
    selectable: true,
  },
];

export function isSharedFramework(frameworkId: string | null) {
  return frameworkId?.startsWith("Shared_") ?? false;
}

export function isTravelPower(power: Power) {
  return power.powerset_id?.toLowerCase() === "travel_power";
}

export function isPowerVariantDevice(power: Power) {
  return power.powerset_id?.toLowerCase() === "pvd";
}

export function isStandardDevice(power: Power) {
  return power.powerset_id?.toLowerCase() === "device";
}

function getNormalizedPowerType(power: Power) {
  return (power.Power_Type ?? power.POWER_TYPE ?? "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export function isUltimatePowerVariantDevice(power: Power) {
  return isPowerVariantDevice(power) && getNormalizedPowerType(power) === "ULTIMATE";
}

function toFrameworkFilter(frameworkId: string): PowerFrameworkFilter {
  return {
    id: frameworkId,
    iconId: null,
    title: formatFrameworkName(frameworkId),
    selectable: true,
  };
}

function buildFrameworkGroups(uniqueFrameworks: Set<string>) {
  const orderedGroups: PowerFrameworkFilterGroup[] = frameworkGroups
    .map((frameworkGroup) => ({
      id: frameworkGroup.id,
      title: frameworkGroup.title,
      filters: frameworkGroup.frameworkIds
        .filter((frameworkId) => uniqueFrameworks.has(frameworkId))
        .map(toFrameworkFilter),
    }))
    .filter((frameworkGroup) => frameworkGroup.filters.length > 0);
  const orderedFrameworks = new Set(
    orderedGroups.flatMap((group) => group.filters).map((filter) => filter.id),
  );
  const remainingFilters = Array.from(uniqueFrameworks)
    .filter((frameworkId) => !orderedFrameworks.has(frameworkId))
    .sort()
    .map(toFrameworkFilter);

  if (remainingFilters.length > 0) {
    orderedGroups.push({
      id: "other",
      title: "Other",
      filters: remainingFilters,
    });
  }

  return orderedGroups;
}

export function formatFrameworkName(frameworkId: string | null | undefined) {
  return frameworkId ? frameworkId.replace(/_/g, " ") : "";
}

export function getPowerDisplayFrameworkId(
  power: Power | null | undefined,
  preferredFrameworkId?: string | null,
) {
  if (!power) {
    return null;
  }

  if (!isSharedFramework(power.framework_id)) {
    return power.framework_id;
  }

  if (
    preferredFrameworkId &&
    isPowerVisibleInFramework(power, preferredFrameworkId)
  ) {
    return preferredFrameworkId;
  }

  const sharedFrameworkId = power.framework_id ?? "";
  const firstOrderedCompatibleFramework = orderedFrameworkIds.find(
    (frameworkId) => isPowerVisibleInFramework(power, frameworkId),
  );

  return (
    firstOrderedCompatibleFramework ??
    sharedFrameworkChildren[sharedFrameworkId]?.[0] ??
    power.framework_id
  );
}

export function getVisiblePowerFrameworkGroups(powers: Power[]) {
  const uniqueFrameworks = new Set<string>();

  powers.forEach((power) => {
    if (
      power.framework_id !== null &&
      !isSharedFramework(power.framework_id) &&
      !isTravelPower(power) &&
      !isPowerVariantDevice(power) &&
      !isStandardDevice(power)
    ) {
      uniqueFrameworks.add(power.framework_id);
    }
  });

  const orderedGroups = buildFrameworkGroups(uniqueFrameworks);

  orderedGroups.push({
    id: "utility",
    title: "Utility",
    filters: supplementalFrameworkFilters,
  });

  return orderedGroups;
}

export function getFrameworkGroupsForIds(
  frameworkIds: Iterable<string | null>,
) {
  const uniqueFrameworks = new Set<string>();

  Array.from(frameworkIds).forEach((frameworkId) => {
    if (frameworkId !== null && !isSharedFramework(frameworkId)) {
      uniqueFrameworks.add(frameworkId);
    }
  });

  return buildFrameworkGroups(uniqueFrameworks);
}

export function getSelectablePowerFrameworkGroups(powers: Power[]) {
  return getVisiblePowerFrameworkGroups(powers)
    .map((frameworkGroup) => ({
      ...frameworkGroup,
      filters: frameworkGroup.filters.filter(
        (framework) =>
          framework.selectable &&
          ![
            travelPowerFilterId,
            powerVariantsFilterId,
            devicesFilterId,
          ].includes(framework.id),
      ),
    }))
    .filter((frameworkGroup) => frameworkGroup.filters.length > 0);
}

export function getPowerFrameworkSortIndex(frameworkId: string | null) {
  if (frameworkId === null) {
    return Number.MAX_SAFE_INTEGER;
  }

  const ownFrameworkIndex = frameworkGroups.findIndex((frameworkGroup) =>
    frameworkGroup.frameworkIds.includes(frameworkId),
  );

  if (ownFrameworkIndex >= 0) {
    const frameworkGroup = frameworkGroups[ownFrameworkIndex];

    return (
      ownFrameworkIndex * 100 +
      frameworkGroup.frameworkIds.indexOf(frameworkId)
    );
  }

  const childFrameworkIndex = frameworkGroups.findIndex((frameworkGroup) =>
    frameworkGroup.frameworkIds.some((childFramework) =>
      getSharedFrameworksForFramework(childFramework).includes(frameworkId),
    )
  );

  if (childFrameworkIndex >= 0) {
    return childFrameworkIndex * 100 + 90;
  }

  return Number.MAX_SAFE_INTEGER;
}

export function getSharedFrameworksForFramework(frameworkId: string) {
  return Object.entries(sharedFrameworkChildren)
    .filter(([, childFrameworks]) => childFrameworks.includes(frameworkId))
    .map(([sharedFramework]) => sharedFramework);
}

export function isPowerVisibleInFramework(
  power: Power,
  selectedFramework: string | null,
) {
  if (!isPowerEnabled(power)) {
    return false;
  }

  if (selectedFramework === null) {
    return (
      !isTravelPower(power) &&
      !isPowerVariantDevice(power) &&
      !isStandardDevice(power)
    );
  }

  if (selectedFramework === travelPowerFilterId) {
    return isTravelPower(power);
  }

  if (selectedFramework === powerVariantsFilterId) {
    return isPowerVariantDevice(power);
  }

  if (selectedFramework === devicesFilterId) {
    return isStandardDevice(power);
  }

  if (power.framework_id === selectedFramework) {
    return true;
  }

  return getSharedFrameworksForFramework(selectedFramework).includes(
    power.framework_id ?? "",
  );
}

export function areFrameworksRelatedForUnlock(
  selectedFrameworkId: string | null,
  candidateFrameworkId: string | null,
) {
  if (
    selectedFrameworkId === null ||
    candidateFrameworkId === null
  ) {
    return false;
  }

  if (selectedFrameworkId === candidateFrameworkId) {
    return true;
  }

  if (isSharedFramework(candidateFrameworkId)) {
    return getSharedFrameworksForFramework(selectedFrameworkId).includes(
      candidateFrameworkId,
    );
  }

  if (isSharedFramework(selectedFrameworkId)) {
    return getSharedFrameworksForFramework(candidateFrameworkId).includes(
      selectedFrameworkId,
    );
  }

  return false;
}
