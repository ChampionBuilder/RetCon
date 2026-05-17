import type { SpecializationTree } from "../types/character";

export const specializationPointMax = 10;
export const specializationTier2Requirement = 5;

export type SpecializationSlotIndex = 0 | 1 | 2;

export type SpecializationTreePoints = number[];

export function createEmptySpecializationPoints() {
  return Array.from({ length: 8 }, () => 0);
}

export function getSpecializationTreePoints(points: SpecializationTreePoints) {
  return points.reduce((total, pointCount) => total + pointCount, 0);
}

export function getSpecializationTierPoints(
  tree: SpecializationTree,
  points: SpecializationTreePoints,
  tier: number,
) {
  return tree.specializationList
    .slice(0, -1)
    .reduce((total, specialization, index) => {
      return specialization.tier === tier ? total + (points[index] ?? 0) : total;
    }, 0);
}

export function canIncrementSpecialization(
  tree: SpecializationTree,
  points: SpecializationTreePoints,
  specializationIndex: number,
) {
  const specialization = tree.specializationList[specializationIndex];

  if (!specialization) {
    return false;
  }

  const currentPoints = points[specializationIndex] ?? 0;
  const totalPoints = getSpecializationTreePoints(points);
  const tier1Points = getSpecializationTierPoints(tree, points, 1);

  return (
    totalPoints < specializationPointMax &&
    currentPoints < specialization.maxPoints &&
    (specialization.tier === 1 || tier1Points >= specializationTier2Requirement)
  );
}

export function canDecrementSpecialization(
  points: SpecializationTreePoints,
  specializationIndex: number,
) {
  return (points[specializationIndex] ?? 0) > 0;
}

export function getTreeMastery(tree: SpecializationTree | null) {
  return tree?.specializationList[8] ?? null;
}

export function getSpecializationTreeIcon(tree: SpecializationTree) {
  return getTreeMastery(tree)?.icon ?? tree.icon;
}
