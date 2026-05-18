import { initialBuildSlots, initialTravelPowerSlots } from "../constants/buildSlots";
import type { BuildSlot } from "../types/builds";
import type {
  InnateTalent,
  StatsTalentsData,
  SuperStat,
  Talent,
} from "../types/character";
import type { Power } from "../types/powers";
import {
  coreBuildRequirements,
  getMatchingRequirementPowerIds,
} from "./buildValidation";
import { getPowerDisplayFrameworkId, isTravelPower } from "./powerFrameworks";
import { canSelectPower } from "./powerrules";
import { isPowerEnabled } from "./powerrules";

type RandomFreeformBuildOptions = {
  combatPowers: Power[];
  powers: Power[];
  statsTalentsData: StatsTalentsData;
};

const randomSuperStatCount = 3;
const randomTalentCount = 6;

export type RandomFreeformBuild = {
  superStats: SuperStat[];
  innateTalent: InnateTalent | null;
  talents: Talent[];
  buildSlots: BuildSlot[];
  travelPowerSlots: BuildSlot[];
};

function getRandomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function getRandomUniqueItems<T>(items: T[], count: number) {
  const remainingItems = [...items];
  const selectedItems: T[] = [];

  while (remainingItems.length > 0 && selectedItems.length < count) {
    const randomIndex = Math.floor(Math.random() * remainingItems.length);
    const [item] = remainingItems.splice(randomIndex, 1);

    if (item !== undefined) {
      selectedItems.push(item);
    }
  }

  return selectedItems;
}

function createEmptyBuildSlots() {
  return initialBuildSlots.map((slot) => ({
    ...slot,
    power: null,
    displayFrameworkId: null,
    selectedAdvantages: [],
  }));
}

function placeRandomCorePowers(buildSlots: BuildSlot[], combatPowers: Power[]) {
  coreBuildRequirements.forEach((requirement) => {
    const matchingPowerIds = getMatchingRequirementPowerIds(
      requirement,
      combatPowers,
    );
    const candidatePowers = getRandomUniqueItems(
      combatPowers.filter(
        (power) => isPowerEnabled(power) && matchingPowerIds.has(power.power_id),
      ),
      matchingPowerIds.size,
    );

    for (const power of candidatePowers) {
      const targetSlot = buildSlots.find(
        (slot) =>
          slot.power === null &&
          canSelectPower(power, buildSlots, slot.slot),
      );

      if (!targetSlot) {
        continue;
      }

      const targetSlotIndex = buildSlots.findIndex(
        (slot) => slot.slot === targetSlot.slot,
      );

      buildSlots[targetSlotIndex] = {
        ...targetSlot,
        power,
        displayFrameworkId: getPowerDisplayFrameworkId(power),
      };
      break;
    }
  });
}

function randomizeCombatPowers(combatPowers: Power[]) {
  const buildSlots: BuildSlot[] = createEmptyBuildSlots();

  placeRandomCorePowers(buildSlots, combatPowers);

  buildSlots.forEach((slot, index) => {
    if (slot.power !== null) {
      return;
    }

    const availablePowers = combatPowers.filter((power) =>
      isPowerEnabled(power) && canSelectPower(power, buildSlots, slot.slot),
    );
    const power = getRandomItem(availablePowers) ?? null;

    if (!power) {
      return;
    }

    buildSlots[index] = {
      ...slot,
      power,
      displayFrameworkId: getPowerDisplayFrameworkId(power),
    };
  });

  return buildSlots;
}

function randomizeTravelPowers(powers: Power[]) {
  const travelPowers = getRandomUniqueItems(
    powers.filter((power) => isPowerEnabled(power) && isTravelPower(power)),
    initialTravelPowerSlots.length,
  );

  return initialTravelPowerSlots.map((slot, index) => {
    const power = travelPowers[index] ?? null;

    return {
      ...slot,
      power,
      displayFrameworkId: power ? getPowerDisplayFrameworkId(power) : null,
      selectedAdvantages: [],
    };
  });
}

export function createRandomFreeformBuild({
  combatPowers,
  powers,
  statsTalentsData,
}: RandomFreeformBuildOptions): RandomFreeformBuild {
  return {
    superStats: getRandomUniqueItems(
      statsTalentsData.superStats.filter((stat) => stat.id > 0),
      randomSuperStatCount,
    ),
    innateTalent:
      getRandomItem(
        statsTalentsData.innateTalents.filter((talent) => talent.id > 0),
      ) ?? null,
    talents: getRandomUniqueItems(
      statsTalentsData.talents.filter((talent) => talent.id > 0),
      randomTalentCount,
    ),
    buildSlots: randomizeCombatPowers(combatPowers),
    travelPowerSlots: randomizeTravelPowers(powers),
  };
}
