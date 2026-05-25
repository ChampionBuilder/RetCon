import type { Advantage } from "@/types/advantages";
import type { BuildSlot } from "@/types/builds";
import type { Power } from "@/types/powers";
import { isUltimatePower } from "./powerFrameworks";
import { getPowerAdvantages } from "./powerAdvantages";

const inheritedPvdAdvantageNames = new Set(["Rank 2", "Rank 3", "Challenge!"]);

export function getPowerVariantParentPowerIds(power: Power | null | undefined) {
  return power?.power_dependency ?? [];
}

export function getPowerVariantParentSlots(
  power: Power | null | undefined,
  buildSlots: BuildSlot[],
) {
  const parentPowerIds = new Set(getPowerVariantParentPowerIds(power));

  return buildSlots.filter(
    (slot) =>
      slot.power !== null && parentPowerIds.has(slot.power.power_id),
  );
}

export function hasPowerVariantParent(
  power: Power | null | undefined,
  buildSlots: BuildSlot[],
) {
  return getPowerVariantParentSlots(power, buildSlots).length > 0;
}

function getSlotAdvantages(slot: BuildSlot, advantages: Advantage[]) {
  return getPowerAdvantages(slot.power, advantages).filter((advantage) =>
    slot.selectedAdvantages.includes(advantage.advantage_id),
  );
}

function uniqueAdvantages(advantages: Advantage[]) {
  return advantages.filter(
    (advantage, index, allAdvantages) =>
      allAdvantages.findIndex(
        (candidate) => candidate.advantage_id === advantage.advantage_id,
      ) === index,
  );
}

function getUltimateInheritedAdvantages(
  parentSlots: BuildSlot[],
  advantages: Advantage[],
) {
  const inherited: Advantage[] = [];

  parentSlots.forEach((parentSlot) => {
    if (!parentSlot.power) {
      return;
    }

    const parentAdvantages = getPowerAdvantages(parentSlot.power, advantages);
    const selectedAdvantages = getSlotAdvantages(parentSlot, advantages);
    const selectedPointTotal = selectedAdvantages.reduce(
      (sum, advantage) => sum + (advantage.points_cost ?? 0),
      0,
    );
    const rank2 = parentAdvantages.find((advantage) => advantage.name === "Rank 2");
    const rank3 = parentAdvantages.find((advantage) => advantage.name === "Rank 3");
    const challenge = selectedAdvantages.find(
      (advantage) => advantage.name === "Challenge!",
    );

    if (selectedPointTotal >= 2 && rank2) {
      inherited.push(rank2);
    }

    if (selectedPointTotal >= 4 && rank3) {
      inherited.push(rank3);
    }

    if (challenge) {
      inherited.push(challenge);
    }
  });

  return uniqueAdvantages(inherited);
}

function getStandardInheritedAdvantages(
  parentSlots: BuildSlot[],
  advantages: Advantage[],
) {
  return uniqueAdvantages(
    parentSlots.flatMap((parentSlot) =>
      getSlotAdvantages(parentSlot, advantages).filter((advantage) =>
        inheritedPvdAdvantageNames.has(advantage.name),
      ),
    ),
  );
}

export function getPowerVariantDisplayAdvantages(
  power: Power | null | undefined,
  buildSlots: BuildSlot[],
  advantages: Advantage[],
) {
  const parentSlots = getPowerVariantParentSlots(power, buildSlots);

  if (isUltimatePower(power)) {
    return getUltimateInheritedAdvantages(parentSlots, advantages);
  }

  return getStandardInheritedAdvantages(parentSlots, advantages);
}
