import { useMemo, useState } from "react";
import type { DialogAnchor } from "@/shared/ui/AnchoredDialog";
import type {
  SpecializationTree,
  SpecializationTreesData,
} from "@/types/character";
import {
  canDecrementSpecialization,
  canIncrementSpecialization,
  createEmptySpecializationPoints,
  getTreeMastery,
  type SpecializationSlotIndex,
  type SpecializationTreePoints,
} from "./specializations";

const emptySpecializationTreeIds = [0, 0, 0];

function createEmptySpecializationPointsBySlot() {
  return [
    createEmptySpecializationPoints(),
    createEmptySpecializationPoints(),
    createEmptySpecializationPoints(),
  ];
}

type HydratedSpecializations = {
  selectedSpecializationTreeIds: number[];
  specializationPointsBySlot: SpecializationTreePoints[];
  selectedMasterySlot: number | null;
};

export function useSpecializations(
  specializationTreesData: SpecializationTreesData | null,
) {
  const [selectedSpecializationTreeIds, setSelectedSpecializationTreeIds] =
    useState(emptySpecializationTreeIds);
  const [specializationPointsBySlot, setSpecializationPointsBySlot] = useState<
    SpecializationTreePoints[]
  >(() => createEmptySpecializationPointsBySlot());
  const [activeSpecializationTreeSlot, setActiveSpecializationTreeSlot] =
    useState<SpecializationSlotIndex | null>(null);
  const [specializationTreeDialogAnchor, setSpecializationTreeDialogAnchor] =
    useState<DialogAnchor | null>(null);
  const [selectedMasterySlot, setSelectedMasterySlot] = useState<number | null>(
    null,
  );
  const [masteryDialogAnchor, setMasteryDialogAnchor] =
    useState<DialogAnchor | null>(null);

  const specializationTrees = useMemo(() => {
    return specializationTreesData?.specializationTrees ?? [];
  }, [specializationTreesData]);
  const selectedSpecializationTrees = useMemo<(SpecializationTree | null)[]>(() => {
    return selectedSpecializationTreeIds.map(
      (treeId) =>
        specializationTrees.find((tree) => tree.id === treeId && tree.id > 0) ??
        null,
    );
  }, [selectedSpecializationTreeIds, specializationTrees]);

  function closeSpecializationTreeDialog() {
    setActiveSpecializationTreeSlot(null);
    setSpecializationTreeDialogAnchor(null);
  }

  function closeMasteryDialog() {
    setMasteryDialogAnchor(null);
  }

  function closeSpecializationDialogs() {
    closeSpecializationTreeDialog();
    closeMasteryDialog();
  }

  function resetSpecializations(treeIds: number[]) {
    setSelectedSpecializationTreeIds(treeIds);
    setSpecializationPointsBySlot(createEmptySpecializationPointsBySlot());
    setSelectedMasterySlot(null);
    closeSpecializationDialogs();
  }

  function resetAllSpecializations() {
    resetSpecializations(emptySpecializationTreeIds);
  }

  function hydrateSpecializations({
    selectedSpecializationTreeIds: nextTreeIds,
    specializationPointsBySlot: nextPointsBySlot,
    selectedMasterySlot: nextMasterySlot,
  }: HydratedSpecializations) {
    setSelectedSpecializationTreeIds(nextTreeIds);
    setSpecializationPointsBySlot(nextPointsBySlot);
    setSelectedMasterySlot(nextMasterySlot);
    closeSpecializationDialogs();
  }

  function applyArchetypeSpecializations(treeIds: number[]) {
    setSelectedSpecializationTreeIds(treeIds);
    setSpecializationPointsBySlot(createEmptySpecializationPointsBySlot());
    setSelectedMasterySlot(null);
  }

  function updatePrimarySpecializationTree(primaryTreeId: number) {
    setSelectedSpecializationTreeIds((currentTreeIds) => {
      if (currentTreeIds[0] === primaryTreeId) {
        return currentTreeIds;
      }

      return [primaryTreeId, currentTreeIds[1], currentTreeIds[2]];
    });
    setSpecializationPointsBySlot((currentPointsBySlot) => [
      createEmptySpecializationPoints(),
      currentPointsBySlot[1],
      currentPointsBySlot[2],
    ]);
    setSelectedMasterySlot((currentMasterySlot) =>
      currentMasterySlot === 0 ? null : currentMasterySlot,
    );
  }

  function openSpecializationTreeDialog(
    slotIndex: SpecializationSlotIndex,
    anchor: DialogAnchor,
  ) {
    setActiveSpecializationTreeSlot(slotIndex);
    setSpecializationTreeDialogAnchor(anchor);
  }

  function selectSpecializationTree(
    slotIndex: number,
    treeId: number,
    canChangeTree: boolean,
  ) {
    if (!canChangeTree) {
      return;
    }

    const oldTreeId = selectedSpecializationTreeIds[slotIndex] ?? 0;

    if (oldTreeId === treeId) {
      return;
    }

    const swapIndex =
      treeId > 0
        ? selectedSpecializationTreeIds.findIndex(
            (currentTreeId, index) =>
              index > 0 && index !== slotIndex && currentTreeId === treeId,
          )
        : -1;

    setSelectedSpecializationTreeIds((currentTreeIds) => {
      const nextTreeIds = [...currentTreeIds];

      nextTreeIds[slotIndex] = treeId;

      if (swapIndex >= 0) {
        nextTreeIds[swapIndex] = oldTreeId;
      }

      return nextTreeIds;
    });
    setSpecializationPointsBySlot((currentPointsBySlot) => {
      const nextPointsBySlot = currentPointsBySlot.map((points) => [...points]);
      const oldPoints = nextPointsBySlot[slotIndex];

      nextPointsBySlot[slotIndex] =
        swapIndex >= 0
          ? nextPointsBySlot[swapIndex]
          : createEmptySpecializationPoints();

      if (swapIndex >= 0) {
        nextPointsBySlot[swapIndex] = oldPoints;
      }

      return nextPointsBySlot;
    });
    setSelectedMasterySlot((currentMasterySlot) => {
      if (currentMasterySlot === null) {
        return currentMasterySlot;
      }

      if (
        currentMasterySlot === slotIndex ||
        currentMasterySlot === swapIndex
      ) {
        return null;
      }

      return currentMasterySlot;
    });
  }

  function clearSpecializationSlot(
    slotIndex: SpecializationSlotIndex,
    canChangeTree: boolean,
  ) {
    if (canChangeTree && slotIndex > 0) {
      setSelectedSpecializationTreeIds((currentTreeIds) =>
        currentTreeIds.map((treeId, index) =>
          index === slotIndex ? 0 : treeId,
        ),
      );
    }

    setSpecializationPointsBySlot((currentPointsBySlot) =>
      currentPointsBySlot.map((points, index) =>
        index === slotIndex ? createEmptySpecializationPoints() : points,
      ),
    );
    setSelectedMasterySlot((currentMasterySlot) =>
      currentMasterySlot === slotIndex ? null : currentMasterySlot,
    );
  }

  function changeSpecializationPoints(
    slotIndex: SpecializationSlotIndex,
    specializationIndex: number,
    delta: 1 | -1,
  ) {
    const tree = selectedSpecializationTrees[slotIndex];

    if (!tree) {
      return;
    }

    setSpecializationPointsBySlot((currentPointsBySlot) => {
      const currentPoints = currentPointsBySlot[slotIndex] ?? [];
      const canChange =
        delta > 0
          ? canIncrementSpecialization(tree, currentPoints, specializationIndex)
          : canDecrementSpecialization(currentPoints, specializationIndex);

      if (!canChange) {
        return currentPointsBySlot;
      }

      return currentPointsBySlot.map((points, index) => {
        if (index !== slotIndex) {
          return points;
        }

        const nextPoints = [...points];
        nextPoints[specializationIndex] =
          (nextPoints[specializationIndex] ?? 0) + delta;

        return nextPoints;
      });
    });
  }

  function openMasteryDialog(anchor: DialogAnchor) {
    setMasteryDialogAnchor(anchor);
  }

  function selectMastery(slotIndex: number | null) {
    const mastery =
      slotIndex === null ? null : getTreeMastery(selectedSpecializationTrees[slotIndex]);

    setSelectedMasterySlot(mastery ? slotIndex : null);
    closeMasteryDialog();
  }

  return {
    activeSpecializationTreeSlot,
    applyArchetypeSpecializations,
    changeSpecializationPoints,
    clearSpecializationSlot,
    closeMasteryDialog,
    closeSpecializationDialogs,
    closeSpecializationTreeDialog,
    hydrateSpecializations,
    masteryDialogAnchor,
    openMasteryDialog,
    openSpecializationTreeDialog,
    resetAllSpecializations,
    resetSpecializations,
    selectedMasterySlot,
    selectedSpecializationTreeIds,
    selectedSpecializationTrees,
    selectMastery,
    selectSpecializationTree,
    specializationPointsBySlot,
    specializationTreeDialogAnchor,
    specializationTrees,
    updatePrimarySpecializationTree,
  };
}
