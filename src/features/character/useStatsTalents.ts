import { useMemo, useState } from "react";
import type { DialogAnchor } from "@/shared/ui/AnchoredDialog";
import type {
  StatsTalentsData,
  SuperStat,
  Talent,
} from "@/types/character";
import { getSelectedStatKeys } from "@/utils/innateTalents";
import { getSortedTalents } from "@/utils/talents";

const emptySuperStatIds = [0, 0, 0];
const emptyTalentIds = [0, 0, 0, 0, 0, 0];

type HydratedStatsTalents = {
  selectedSuperStatIds: number[];
  selectedInnateTalentId: number;
  selectedTalentIds: number[];
};

type UseStatsTalentsOptions = {
  onPrimarySuperStatChange: (statId: number) => void;
  statsTalentsData: StatsTalentsData | null;
};

export function useStatsTalents({
  onPrimarySuperStatChange,
  statsTalentsData,
}: UseStatsTalentsOptions) {
  const [selectedSuperStatIds, setSelectedSuperStatIds] =
    useState(emptySuperStatIds);
  const [activeSuperStatSlot, setActiveSuperStatSlot] = useState<number | null>(
    null,
  );
  const [superStatDialogAnchor, setSuperStatDialogAnchor] =
    useState<DialogAnchor | null>(null);
  const [selectedInnateTalentId, setSelectedInnateTalentId] = useState(0);
  const [innateTalentDialogAnchor, setInnateTalentDialogAnchor] =
    useState<DialogAnchor | null>(null);
  const [selectedTalentIds, setSelectedTalentIds] = useState(emptyTalentIds);
  const [activeTalentSlot, setActiveTalentSlot] = useState<number | null>(null);
  const [talentDialogAnchor, setTalentDialogAnchor] =
    useState<DialogAnchor | null>(null);

  const selectedSuperStats = useMemo<(SuperStat | null)[]>(() => {
    const allStats = statsTalentsData?.superStats ?? [];

    return selectedSuperStatIds.map(
      (statId) => allStats.find((stat) => stat.id === statId) ?? null,
    );
  }, [selectedSuperStatIds, statsTalentsData]);

  const selectedInnateTalent =
    statsTalentsData?.innateTalents.find(
      (talent) => talent.id === selectedInnateTalentId && talent.id > 0,
    ) ?? null;

  const selectedTalents = useMemo<(Talent | null)[]>(() => {
    const allTalents = statsTalentsData?.talents ?? [];

    return selectedTalentIds.map(
      (talentId) =>
        allTalents.find((talent) => talent.id === talentId && talent.id > 0) ??
        null,
    );
  }, [selectedTalentIds, statsTalentsData]);

  function closeSuperStatDialog() {
    setActiveSuperStatSlot(null);
    setSuperStatDialogAnchor(null);
  }

  function closeInnateTalentDialog() {
    setInnateTalentDialogAnchor(null);
  }

  function closeTalentDialog() {
    setActiveTalentSlot(null);
    setTalentDialogAnchor(null);
  }

  function closeStatsTalentDialogs() {
    closeSuperStatDialog();
    closeInnateTalentDialog();
    closeTalentDialog();
  }

  function resetSuperStats(superStatIds: number[]) {
    setSelectedSuperStatIds(superStatIds);
    onPrimarySuperStatChange(superStatIds[0] ?? 0);
    closeSuperStatDialog();
  }

  function resetTalents(innateTalentId: number) {
    setSelectedInnateTalentId(innateTalentId);
    setSelectedTalentIds(emptyTalentIds);
    closeInnateTalentDialog();
    closeTalentDialog();
  }

  function resetAllStatsTalents() {
    setSelectedSuperStatIds(emptySuperStatIds);
    setSelectedInnateTalentId(0);
    setSelectedTalentIds(emptyTalentIds);
    closeStatsTalentDialogs();
  }

  function hydrateStatsTalents({
    selectedSuperStatIds: nextSuperStatIds,
    selectedInnateTalentId: nextInnateTalentId,
    selectedTalentIds: nextTalentIds,
  }: HydratedStatsTalents) {
    setSelectedSuperStatIds(nextSuperStatIds);
    setSelectedInnateTalentId(nextInnateTalentId);
    setSelectedTalentIds(nextTalentIds);
    closeStatsTalentDialogs();
  }

  function applyArchetypeStatsTalents(
    superStatIds: number[],
    innateTalentId: number,
  ) {
    setSelectedSuperStatIds(superStatIds);
    setSelectedInnateTalentId(innateTalentId);
  }

  function openSuperStatDialog(
    slotIndex: number,
    anchor: DialogAnchor,
    canChangeStats: boolean,
  ) {
    if (!canChangeStats) {
      return;
    }

    setActiveSuperStatSlot(slotIndex);
    setSuperStatDialogAnchor(anchor);
  }

  function openInnateTalentDialog(
    anchor: DialogAnchor,
    canChangeTalents: boolean,
  ) {
    if (!canChangeTalents) {
      return;
    }

    setInnateTalentDialogAnchor(anchor);
  }

  function openTalentDialog(slotIndex: number, anchor: DialogAnchor) {
    setActiveTalentSlot(slotIndex);
    setTalentDialogAnchor(anchor);
  }

  function selectSuperStat(
    slotIndex: number,
    statId: number,
    canChangeStats: boolean,
  ) {
    if (!canChangeStats) {
      return;
    }

    const oldStatId = selectedSuperStatIds[slotIndex] ?? 0;

    if (statId === oldStatId) {
      closeSuperStatDialog();
      return;
    }

    const nextStatIds = [...selectedSuperStatIds];
    const swapIndex =
      statId > 0
        ? nextStatIds.findIndex(
            (currentStatId, index) =>
              index !== slotIndex && currentStatId === statId,
          )
        : -1;

    nextStatIds[slotIndex] = statId;

    if (swapIndex >= 0) {
      nextStatIds[swapIndex] = oldStatId;
    }

    setSelectedSuperStatIds(nextStatIds);

    if ((nextStatIds[0] ?? 0) !== (selectedSuperStatIds[0] ?? 0)) {
      onPrimarySuperStatChange(nextStatIds[0] ?? 0);
    }

    closeSuperStatDialog();
  }

  function selectInnateTalent(talentId: number, canChangeTalents: boolean) {
    if (!canChangeTalents) {
      return;
    }

    setSelectedInnateTalentId(talentId);
    closeInnateTalentDialog();
  }

  function selectTalent(slotIndex: number, talentId: number) {
    setSelectedTalentIds((currentTalentIds) => {
      const oldTalentId = currentTalentIds[slotIndex] ?? 0;

      if (talentId === oldTalentId) {
        return currentTalentIds;
      }

      const nextTalentIds = [...currentTalentIds];
      const swapIndex =
        talentId > 0
          ? nextTalentIds.findIndex(
              (currentTalentId, index) =>
                index !== slotIndex && currentTalentId === talentId,
            )
          : -1;

      nextTalentIds[slotIndex] = talentId;

      if (swapIndex >= 0) {
        nextTalentIds[swapIndex] = oldTalentId;
      }

      return nextTalentIds;
    });
    closeTalentDialog();
  }

  function autofillTalents() {
    if (!statsTalentsData) {
      return;
    }

    const selectedStatKeys = getSelectedStatKeys(selectedSuperStats);
    const autofilledTalentIds = getSortedTalents(
      statsTalentsData.talents,
      selectedStatKeys,
      true,
    )
      .slice(0, emptyTalentIds.length)
      .map((talent) => talent.id);

    setSelectedTalentIds(
      emptyTalentIds.map((emptyTalentId, index) => {
        return autofilledTalentIds[index] ?? emptyTalentId;
      }),
    );
    closeTalentDialog();
  }

  return {
    activeSuperStatSlot,
    activeTalentSlot,
    applyArchetypeStatsTalents,
    autofillTalents,
    closeInnateTalentDialog,
    closeStatsTalentDialogs,
    closeSuperStatDialog,
    closeTalentDialog,
    hydrateStatsTalents,
    innateTalentDialogAnchor,
    openInnateTalentDialog,
    openSuperStatDialog,
    openTalentDialog,
    resetAllStatsTalents,
    resetSuperStats,
    resetTalents,
    selectedInnateTalent,
    selectedInnateTalentId,
    selectedSuperStatIds,
    selectedSuperStats,
    selectedTalentIds,
    selectedTalents,
    selectInnateTalent,
    selectSuperStat,
    selectTalent,
    superStatDialogAnchor,
    talentDialogAnchor,
  };
}
