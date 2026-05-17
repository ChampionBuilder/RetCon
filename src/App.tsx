import { useCallback, useMemo, useState } from "react";
import "./App.css";
import type { DialogAnchor } from "./components/AnchoredDialog";
import { AdvantageSelectionDialog } from "./components/AdvantageSelectionDialog";
import { AboutDialog } from "./components/AboutDialog";
import { AppHeader } from "./components/AppHeader";
import { ArchetypePowerSelectionDialog } from "./components/ArchetypePowerSelectionDialog";
import { ArchetypeSelectionDialog } from "./components/ArchetypeSelectionDialog";
import { BuildPanel } from "./components/BuildPanel";
import { BuildCheckDialog } from "./components/BuildCheckDialog";
import { CharacterPanel } from "./components/CharacterPanel";
import { DataDialog } from "./components/DataDialog";
import { DeviceSelectionDialog } from "./components/DeviceSelectionDialog";
import { InnateTalentSelectionDialog } from "./components/InnateTalentSelectionDialog";
import { InstantTooltip } from "./components/InstantTooltip";
import { PowerSelectionDialog } from "./components/PowerSelectionDialog";
import { PowerVariantSelectionDialog } from "./components/PowerVariantSelectionDialog";
import { PowersPanel } from "./components/PowersPanel";
import { RoleSelectionDialog } from "./components/RoleSelectionDialog";
import { SpecializationsPanel } from "./components/SpecializationsPanel";
import { SpecializationMasteryDialog } from "./components/SpecializationMasteryDialog";
import { SpecializationSelectionDialog } from "./components/SpecializationSelectionDialog";
import { StatSelectionDialog } from "./components/StatSelectionDialog";
import { TalentSelectionDialog } from "./components/TalentSelectionDialog";
import { TravelPowerSelectionDialog } from "./components/TravelPowerSelectionDialog";
import type { Power } from "./types/powers";
import type { BuildRequirementResult } from "./utils/buildValidation";
import {
  maxCamsLevel,
} from "./utils/advantagerules";
import {
  getVisiblePowerFrameworkGroups,
  isPowerVariantDevice,
  isStandardDevice,
  isTravelPower,
  devicesFilterId,
  powerVariantsFilterId,
  travelPowerFilterId,
} from "./utils/powerFrameworks";
import {
  canPlacePowerInSlot,
  getFirstValidPowerSlot,
} from "./utils/powerSlots";
import { createRandomFreeformBuild } from "./utils/randomizer";
import {
  createShareUrl,
  hydrateSerializedBuild,
  parseSerializedBuild,
  serializeBuild,
} from "./utils/buildSerialization";
import { useSavedBuilds } from "./hooks/useSavedBuilds";
import { useShareUrlSync } from "./hooks/useShareUrlSync";
import { useBuilderData } from "./hooks/useBuilderData";
import { useSpecializations } from "./hooks/useSpecializations";
import { useStatsTalents } from "./hooks/useStatsTalents";
import { usePowerDialogs } from "./hooks/usePowerDialogs";
import { usePowerPanelTargets } from "./hooks/usePowerPanelTargets";
import { useBuildPowerState } from "./hooks/useBuildPowerState";
import { useAuxiliaryPowerSlots } from "./hooks/useAuxiliaryPowerSlots";
import { useCombatPowerSlots } from "./hooks/useCombatPowerSlots";
import { useArchetypeRoleState } from "./hooks/useArchetypeRoleState";
import { useArchetypePowerState } from "./hooks/useArchetypePowerState";
import { useAdvantageActions } from "./hooks/useAdvantageActions";
import { getMatchingRequirementPowerIds } from "./utils/buildValidation";
function App() {
  const [buildName, setBuildName] = useState("My Awesome Build");
  const [buildCheckDialogOpen, setBuildCheckDialogOpen] = useState(false);
  const [buildCheckPowerFilter, setBuildCheckPowerFilter] = useState<{
    ids: Set<number>;
    label: string;
  } | null>(null);
  const {
    advantages,
    archetypesData,
    dataReady,
    powers,
    specializationTreesData,
    statsTalentsData,
  } = useBuilderData();
  const {
    applySelectedArchetype,
    archetypeDialogAnchor,
    closeArchetypeDialog,
    closeRoleDialog,
    hydrateArchetypeRole,
    isFreeform,
    openArchetypeDialog,
    openRoleDialog,
    resetArchetypeRole,
    roleDialogAnchor,
    selectedArchetype,
    selectedArchetypeId,
    selectedRole,
    selectedRoleId,
    selectRole,
  } = useArchetypeRoleState(archetypesData);
  const {
    activeSpecializationTreeSlot,
    applyArchetypeSpecializations,
    changeSpecializationPoints,
    clearSpecializationSlot,
    closeMasteryDialog,
    closeSpecializationTreeDialog,
    hydrateSpecializations,
    masteryDialogAnchor,
    openMasteryDialog,
    openSpecializationTreeDialog,
    resetAllSpecializations,
    resetSpecializations: resetSpecializationState,
    selectedMasterySlot,
    selectedSpecializationTreeIds,
    selectedSpecializationTrees,
    selectMastery,
    selectSpecializationTree,
    specializationPointsBySlot,
    specializationTreeDialogAnchor,
    specializationTrees,
    updatePrimarySpecializationTree,
  } = useSpecializations(specializationTreesData);
  const {
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
    resetSuperStats: resetSuperStatState,
    resetTalents: resetTalentState,
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
  } = useStatsTalents({
    onPrimarySuperStatChange: updatePrimarySpecializationTree,
    statsTalentsData,
  });
  const {
    activeAdvantageSlot,
    activeDeviceSlot,
    activePowerSlot,
    activePowerVariantSlot,
    activeTravelPowerSlot,
    advantageDialogAnchor,
    closeAdvantageDialog,
    closeDeviceDialog,
    closePowerDialog,
    closePowerDialogs,
    closePowerVariantDialog,
    closeTravelPowerDialog,
    deviceDialogAnchor,
    lastPowerDialogFrameworkId,
    openAdvantageDialog,
    openDeviceDialog,
    openPowerDialog: openPowerDialogState,
    openPowerVariantDialog,
    openTravelPowerDialog,
    powerDialogAnchor,
    powerVariantDialogAnchor,
    travelPowerDialogAnchor,
    setLastPowerDialogFrameworkId,
  } = usePowerDialogs();
  const {
    applyArchetypeBuildSlots,
    applyFreeformBuildSlots,
    buildSlots,
    clearPowerAdvantages,
    clearPowerSlotAdvantages,
    placeArchetypePower,
    placePower,
    removePower: removeCombatPower,
    replaceBuildSlots,
    resetArchetypePowers,
    resetFreeformPowers,
    togglePowerAdvantage,
  } = useCombatPowerSlots();
  const {
    clearDeviceSlot: clearAuxiliaryDeviceSlot,
    clearPowerVariantSlot: clearAuxiliaryPowerVariantSlot,
    clearTravelPowerSlot: clearAuxiliaryTravelPowerSlot,
    clearTravelPowerAdvantages,
    clearTravelPowerSlotAdvantages,
    deviceSlots,
    hydrateAuxiliaryPowerSlots,
    placeDevice,
    placePowerVariant,
    placeTravelPower,
    powerVariantSlots,
    replaceTravelPowerSlots,
    resetAllAuxiliaryPowerSlots,
    resetDevices: resetAuxiliaryDevices,
    resetPowerVariants: resetAuxiliaryPowerVariants,
    resetTravelPowers: resetAuxiliaryTravelPowers,
    toggleTravelPowerAdvantage,
    travelPowerSlots,
  } = useAuxiliaryPowerSlots();
  const [camsLevel, setCamsLevel] = useState(0);
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);

  const combatPowers = useMemo(() => {
    return powers.filter((power) => power.tier !== null);
  }, [powers]);

  const frameworkGroups = useMemo(() => {
    return getVisiblePowerFrameworkGroups(combatPowers);
  }, [combatPowers]);

  const powersById = useMemo(() => {
    return new Map(powers.map((power) => [power.power_id, power]));
  }, [powers]);
  const serializedBuild = useMemo(
    () =>
      serializeBuild({
        buildName,
        selectedArchetypeId,
        selectedRoleId,
        selectedSuperStatIds,
        selectedInnateTalentId,
        selectedTalentIds,
        buildSlots,
        travelPowerSlots,
        powerVariantSlots,
        deviceSlots,
        selectedSpecializationTreeIds,
        specializationPointsBySlot,
        selectedMasterySlot,
        camsLevel,
      }),
    [
      buildName,
      buildSlots,
      camsLevel,
      selectedArchetypeId,
      selectedInnateTalentId,
      selectedMasterySlot,
      selectedRoleId,
      selectedSpecializationTreeIds,
      selectedSuperStatIds,
      selectedTalentIds,
      specializationPointsBySlot,
      travelPowerSlots,
      powerVariantSlots,
      deviceSlots,
    ],
  );
  const shareUrl = useMemo(
    () => createShareUrl(serializedBuild),
    [serializedBuild],
  );
  const {
    deleteSavedBuild,
    getSavedBuildData,
    overwriteSavedBuild,
    savedBuilds,
    saveCurrentBuild,
  } = useSavedBuilds({
    buildName,
    serializedBuild,
  });
  const {
    archetypeAlternativePowerIdsBySlot,
    archetypeAlternativePowerSlotNumbers,
    lockedPowerSlotNumbers,
  } = useArchetypePowerState({
    buildSlots,
    isFreeform,
    selectedArchetype,
  });
  const {
    clearDeviceTarget,
    clearDeviceTargetIfSelected,
    clearPowerPanelTargets,
    clearPowerTarget,
    clearPowerVariantTarget,
    clearPowerVariantTargetIfSelected,
    clearTravelPowerTarget,
    powerPanelTargetDeviceSlot,
    powerPanelTargetPowerVariantSlot,
    powerPanelTargetTravelPowerSlot,
    powerSearchResetKey,
    resetPowerSearch,
    selectedDeviceTargetBuildSlot,
    selectedFramework,
    selectedPowerTargetBuildSlot,
    selectedPowerTargetSlot,
    selectedPowerVariantTargetBuildSlot,
    selectPowerPanelTarget,
    setSelectedFramework,
  } = usePowerPanelTargets({
    archetypeAlternativePowerSlotNumbers,
    buildSlots,
    deviceSlots,
    isFreeform,
    powerVariantSlots,
    travelPowerSlots,
  });
  const {
    activeAdvantageBuildSlot,
    activeArchetypePowerOptions,
    activeBuildSlot,
    activeDeviceBuildSlot,
    activePowerVariantBuildSlot,
    activeTravelPowerBuildSlot,
    allPowerSlots,
    invalidPowerSlotNumbers,
    invalidPowerVariantSlotNumbers,
    restrictedPowerIds,
    restrictedPowerSectionLabel,
  } = useBuildPowerState({
    activeAdvantageSlot,
    activeDeviceSlot,
    activePowerSlot,
    activePowerVariantSlot,
    activeTravelPowerSlot,
    archetypeAlternativePowerIdsBySlot,
    buildSlots,
    deviceSlots,
    invalidPowerVariantTargetSlot: selectedPowerVariantTargetBuildSlot,
    isFreeform,
    powersById,
    powerVariantSlots,
    selectedPowerTargetSlot,
    travelPowerSlots,
  });
  const activeRestrictedPowerIds =
    buildCheckPowerFilter?.ids ?? restrictedPowerIds;
  const activeRestrictedPowerSectionLabel =
    buildCheckPowerFilter?.label ?? restrictedPowerSectionLabel;
  const {
    advantagePointBudget,
    clearSlotAdvantages,
    resetAdvantages: resetAdvantageState,
    toggleAdvantage,
    totalAdvantagePoints,
  } = useAdvantageActions({
    advantages,
    allPowerSlots,
    buildSlots,
    camsLevel,
    clearPowerAdvantages,
    clearPowerSlotAdvantages,
    clearTravelPowerAdvantages,
    clearTravelPowerSlotAdvantages,
    togglePowerAdvantage,
    toggleTravelPowerAdvantage,
  });

  function addPower(power: Power, displayFrameworkId?: string | null) {
    if (isStandardDevice(power)) {
      addDevice(power);
      return;
    }

    if (isPowerVariantDevice(power)) {
      addPowerVariant(power);
      return;
    }

    if (isTravelPower(power)) {
      addTravelPower(power);
      return;
    }

    const targetSlot =
      selectedPowerTargetBuildSlot ??
      getFirstValidPowerSlot(power, buildSlots);

    if (!targetSlot) {
      return;
    }

    if (!isFreeform) {
      const allowedPowerIds =
        archetypeAlternativePowerIdsBySlot.get(targetSlot.slot) ?? [];

      if (!allowedPowerIds.includes(power.power_id)) {
        return;
      }

      selectArchetypePowerForSlot(targetSlot.slot, power.power_id);
      setBuildCheckPowerFilter(null);
      clearPowerTarget();
      return;
    }

    if (targetSlot.power?.power_id === power.power_id) {
      clearPowerTarget();
      return;
    }

    if (!canPlacePowerInSlot(power, targetSlot, buildSlots)) {
      return;
    }

    placePower(power, displayFrameworkId, targetSlot);
    setBuildCheckPowerFilter(null);
    clearPowerTarget();
  }

  function filterPowersForMissingRequirement(
    requirement: BuildRequirementResult,
  ) {
    setBuildCheckPowerFilter({
      ids: getMatchingRequirementPowerIds(requirement, powers),
      label: requirement.label,
    });
    clearPowerPanelTargets();
    resetPowerSearch();
    setSelectedFramework(null);
    setBuildCheckDialogOpen(false);
  }

  function addTravelPower(power: Power) {
    const targetSlot = powerPanelTargetTravelPowerSlot;

    if (!targetSlot) {
      return;
    }

    if (targetSlot.power?.power_id === power.power_id) {
      clearTravelPowerTarget();
      return;
    }

    placeTravelPower(power, targetSlot);
    clearTravelPowerTarget();
  }

  function addPowerVariant(power: Power) {
    const targetSlot = powerPanelTargetPowerVariantSlot;

    if (!targetSlot) {
      return;
    }

    if (targetSlot.power?.power_id === power.power_id) {
      clearPowerVariantTarget();
      return;
    }

    placePowerVariant(power, targetSlot);
    setBuildCheckPowerFilter(null);
    clearPowerVariantTarget();
  }

  function addDevice(power: Power) {
    const targetSlot = powerPanelTargetDeviceSlot;

    if (!targetSlot) {
      return;
    }

    if (targetSlot.power?.power_id === power.power_id) {
      clearDeviceTarget();
      return;
    }

    placeDevice(power, targetSlot);
    clearDeviceTarget();
  }

  function selectPowerVariantForSlot(slotNumber: number, power: Power) {
    const targetSlot =
      powerVariantSlots.find((slot) => slot.slot === slotNumber) ?? null;

    if (!targetSlot) {
      return;
    }

    placePowerVariant(power, targetSlot);
    closePowerVariantDialog();
  }

  function selectTravelPowerForSlot(slotNumber: number, power: Power) {
    const targetSlot =
      travelPowerSlots.find((slot) => slot.slot === slotNumber) ?? null;

    if (!targetSlot) {
      return;
    }

    placeTravelPower(power, targetSlot);
    closeTravelPowerDialog();
  }

  function selectDeviceForSlot(slotNumber: number, power: Power) {
    const targetSlot =
      deviceSlots.find((slot) => slot.slot === slotNumber) ?? null;

    if (!targetSlot) {
      return;
    }

    placeDevice(power, targetSlot);
    closeDeviceDialog();
  }

  function removePower(slotNumber: number) {
    if (!isFreeform) {
      return;
    }

    removeCombatPower(slotNumber);
  }

  function clearPowerVariantSlot(slotNumber: number) {
    clearAuxiliaryPowerVariantSlot(slotNumber);
    clearPowerVariantTargetIfSelected(slotNumber);
    closePowerVariantDialog();
  }

  function clearTravelPowerSlot(slotNumber: number) {
    clearAuxiliaryTravelPowerSlot(slotNumber);
    clearTravelPowerTarget();
    closeTravelPowerDialog();
  }

  function clearDeviceSlot(slotNumber: number) {
    clearAuxiliaryDeviceSlot(slotNumber);
    clearDeviceTargetIfSelected(slotNumber);
    closeDeviceDialog();
  }

  function openPowerDialog(slotNumber: number, anchor: DialogAnchor) {
    if (
      !isFreeform &&
      !archetypeAlternativePowerSlotNumbers.has(slotNumber)
    ) {
      return;
    }

    openPowerDialogState(slotNumber, anchor);
  }

  function selectBuildSlotAsPowerTarget(slotNumber: number) {
    setBuildCheckPowerFilter(null);

    if (!isFreeform) {
      if (archetypeAlternativePowerSlotNumbers.has(slotNumber)) {
        selectArchetypePowerSlotAsTarget(slotNumber);
      }

      return;
    }

    selectPowerPanelTarget("power", slotNumber, null, true);
  }

  function selectPowerVariantSlotAsTarget(slotNumber: number) {
    setBuildCheckPowerFilter(null);
    selectPowerPanelTarget(
      "powerVariant",
      slotNumber,
      powerVariantsFilterId,
      true,
    );
  }

  function selectArchetypePowerSlotAsTarget(slotNumber: number) {
    setBuildCheckPowerFilter(null);
    selectPowerPanelTarget("power", slotNumber, null, true);
  }

  function selectTravelPowerSlotAsTarget(slotNumber: number) {
    setBuildCheckPowerFilter(null);
    selectPowerPanelTarget(
      "travelPower",
      slotNumber,
      travelPowerFilterId,
      false,
    );
  }

  function selectDeviceSlotAsTarget(slotNumber: number) {
    setBuildCheckPowerFilter(null);
    selectPowerPanelTarget("device", slotNumber, devicesFilterId, true);
  }

  function selectPowerForSlot(
    slotNumber: number,
    power: Power,
    displayFrameworkId: string | null,
  ) {
    const targetSlot =
      buildSlots.find((slot) => slot.slot === slotNumber) ?? null;

    if (!targetSlot || !canPlacePowerInSlot(power, targetSlot, buildSlots)) {
      return;
    }

    setLastPowerDialogFrameworkId(displayFrameworkId);
    placePower(power, displayFrameworkId, targetSlot);
    closePowerDialog();
  }

  function selectArchetypePowerForSlot(slotNumber: number, powerId: number) {
    const allowedPowerIds =
      archetypeAlternativePowerIdsBySlot.get(slotNumber) ?? [];

    if (!allowedPowerIds.includes(powerId)) {
      return;
    }

    const power = powersById.get(powerId);

    if (!power) {
      return;
    }

    placeArchetypePower(slotNumber, power);
    closePowerDialog();
  }

  function clearPowerSlot(slotNumber: number) {
    removePower(slotNumber);
    closePowerDialog();
    closeAdvantageDialog();
  }

  function resetPowers() {
    if (!isFreeform && selectedArchetype) {
      resetArchetypePowers(selectedArchetype, powersById);
    } else {
      resetFreeformPowers();
    }

    clearPowerTarget();
    closePowerDialog();
    closeAdvantageDialog();
  }

  function resetTravelPowers() {
    resetAuxiliaryTravelPowers();
    clearTravelPowerTarget();
    closeAdvantageDialog();
  }

  function resetPowerVariants() {
    resetAuxiliaryPowerVariants();
    clearPowerVariantTarget();
  }

  function resetDevices() {
    resetAuxiliaryDevices();
    clearDeviceTarget();
    closeDeviceDialog();
  }

  function resetSuperStats() {
    if (!isFreeform && selectedArchetype) {
      resetSuperStatState(selectedArchetype.superStatList);
    } else {
      resetSuperStatState([0, 0, 0]);
    }
  }

  function resetTalents() {
    resetTalentState(
      !isFreeform && selectedArchetype
        ? selectedArchetype.innateTalent ?? 0
        : 0,
    );
  }

  function resetSpecializations(primaryTreeId = selectedSuperStatIds[0] ?? 0) {
    resetSpecializationState(
      !isFreeform && selectedArchetype
        ? selectedArchetype.specializationTreeList
        : [primaryTreeId, 0, 0],
    );
  }

  function resetAdvantages() {
    resetAdvantageState();
    closeAdvantageDialog();
  }

  function resetAll() {
    setBuildName("My Awesome Build");
    resetFreeformPowers();
    resetAllAuxiliaryPowerSlots();
    setCamsLevel(0);
    resetArchetypeRole();
    setSelectedFramework(null);
    clearPowerPanelTargets();
    resetAllStatsTalents();
    resetAllSpecializations();
    closePowerDialog();
    closePowerVariantDialog();
    closeDeviceDialog();
    closeAdvantageDialog();
    closeArchetypeDialog();
    closeRoleDialog();
    resetPowerVariants();
    resetDevices();
  }

  const applyHydratedBuild = useCallback((serializedData: string) => {
    const payload = parseSerializedBuild(serializedData);

    if (!payload) {
      return false;
    }

    const hydratedBuild = hydrateSerializedBuild(payload, powersById);

    setBuildName(hydratedBuild.buildName);
    hydrateArchetypeRole(
      hydratedBuild.selectedArchetypeId,
      hydratedBuild.selectedRoleId,
    );
    hydrateStatsTalents({
      selectedSuperStatIds: hydratedBuild.selectedSuperStatIds,
      selectedInnateTalentId: hydratedBuild.selectedInnateTalentId,
      selectedTalentIds: hydratedBuild.selectedTalentIds,
    });
    replaceBuildSlots(hydratedBuild.buildSlots);
    hydrateAuxiliaryPowerSlots({
      travelPowerSlots: hydratedBuild.travelPowerSlots,
      powerVariantSlots: hydratedBuild.powerVariantSlots,
      deviceSlots: hydratedBuild.deviceSlots,
    });
    hydrateSpecializations({
      selectedSpecializationTreeIds:
        hydratedBuild.selectedSpecializationTreeIds,
      specializationPointsBySlot: hydratedBuild.specializationPointsBySlot,
      selectedMasterySlot: hydratedBuild.selectedMasterySlot,
    });
    setCamsLevel(hydratedBuild.camsLevel);
    setSelectedFramework(null);
    clearPowerPanelTargets();
    closePowerDialogs();
    closeArchetypeDialog();
    closeRoleDialog();

    return true;
  }, [closeArchetypeDialog, closePowerDialogs, closeRoleDialog, powersById]);

  function loadSavedBuild(buildId: string) {
    const savedBuildData = getSavedBuildData(buildId);

    if (!savedBuildData || !applyHydratedBuild(savedBuildData)) {
      return;
    }

    setDataDialogOpen(false);
  }

  function randomizeFreeformBuild() {
    if (!isFreeform || !statsTalentsData) {
      return;
    }

    const randomizedBuild = createRandomFreeformBuild({
      combatPowers,
      powers,
      statsTalentsData,
    });
    const randomizedSuperStats = randomizedBuild.superStats;
    const randomizedSuperStatIds = randomizedSuperStats.map((stat) => stat.id);

    updatePrimarySpecializationTree(randomizedSuperStatIds[0] ?? 0);
    hydrateStatsTalents({
      selectedSuperStatIds: [
        randomizedSuperStatIds[0] ?? 0,
        randomizedSuperStatIds[1] ?? 0,
        randomizedSuperStatIds[2] ?? 0,
      ],
      selectedInnateTalentId: randomizedBuild.innateTalent?.id ?? 0,
      selectedTalentIds: Array.from(
        { length: 6 },
        (_, index) => randomizedBuild.talents[index]?.id ?? 0,
      ),
    });
    replaceBuildSlots(randomizedBuild.buildSlots);
    replaceTravelPowerSlots(randomizedBuild.travelPowerSlots);
    clearPowerTarget();
    clearTravelPowerTarget();
    closePowerDialog();
    closeAdvantageDialog();
  }

  function changeCamsLevel(delta: 1 | -1) {
    setCamsLevel((currentCamsLevel) =>
      Math.max(0, Math.min(maxCamsLevel, currentCamsLevel + delta)),
    );
  }

  function selectArchetype(archetypeId: number) {
    const archetype =
      archetypesData?.archetypes.find(
        (candidateArchetype) => candidateArchetype.id === archetypeId,
      ) ?? null;

    if (!archetype) {
      return;
    }

    if (archetype.id === selectedArchetypeId) {
      closeArchetypeDialog();
      return;
    }

    if (archetype.id !== 1 && powersById.size === 0) {
      return;
    }

    applySelectedArchetype(archetype);
    clearPowerTarget();
    closePowerDialog();

    if (archetype.id === 1) {
      applyFreeformBuildSlots();
      closeArchetypeDialog();
      return;
    }

    applyArchetypeStatsTalents(
      archetype.superStatList,
      archetype.innateTalent ?? 0,
    );
    applyArchetypeBuildSlots(archetype, powersById);
    applyArchetypeSpecializations(archetype.specializationTreeList);
    closeArchetypeDialog();
    closeRoleDialog();
    closeStatsTalentDialogs();
    closeSpecializationTreeDialog();
    closeMasteryDialog();
  }

  function openCurrentSuperStatDialog(
    slotIndex: number,
    anchor: DialogAnchor,
  ) {
    openSuperStatDialog(slotIndex, anchor, isFreeform);
  }

  function openCurrentInnateTalentDialog(anchor: DialogAnchor) {
    openInnateTalentDialog(anchor, isFreeform);
  }

  function selectCurrentSuperStat(slotIndex: number, statId: number) {
    selectSuperStat(slotIndex, statId, isFreeform);
  }

  function selectCurrentInnateTalent(talentId: number) {
    selectInnateTalent(talentId, isFreeform);
  }

  function clearCurrentSpecializationSlot(slotIndex: 0 | 1 | 2) {
    clearSpecializationSlot(slotIndex, isFreeform);
  }

  function selectCurrentSpecializationTree(slotIndex: number, treeId: number) {
    selectSpecializationTree(slotIndex, treeId, isFreeform);
  }

  useShareUrlSync({
    applyHydratedBuild,
    dataReady,
    shareUrl,
  });

  return (
    <div className="app-shell">
      <AppHeader
        buildName={buildName}
        shareUrl={shareUrl}
        resetSuperStatsDisabled={!isFreeform}
        onBuildNameChange={setBuildName}
        onOpenAbout={() => setAboutDialogOpen(true)}
        onOpenBuildCheck={() => setBuildCheckDialogOpen(true)}
        onOpenData={() => setDataDialogOpen(true)}
        onSave={saveCurrentBuild}
        onResetAll={resetAll}
        onResetSuperStats={resetSuperStats}
        onResetTalents={resetTalents}
        onResetPowers={resetPowers}
        onResetTravelPowers={resetTravelPowers}
        onResetPowerVariants={resetPowerVariants}
        onResetDevices={resetDevices}
        onResetAdvantages={resetAdvantages}
        onResetSpecializations={resetSpecializations}
        onRandomize={randomizeFreeformBuild}
      />

      {dataDialogOpen ? (
        <DataDialog
          currentBuildName={buildName}
          savedBuilds={savedBuilds}
          onClose={() => setDataDialogOpen(false)}
          onDeleteBuild={deleteSavedBuild}
          onLoadBuild={loadSavedBuild}
          onOverwriteBuild={overwriteSavedBuild}
          onSaveCurrentBuild={saveCurrentBuild}
        />
      ) : null}

      {aboutDialogOpen ? (
        <AboutDialog onClose={() => setAboutDialogOpen(false)} />
      ) : null}

      {buildCheckDialogOpen ? (
        <BuildCheckDialog
          buildSlots={buildSlots}
          powers={powers}
          powerVariantSlots={powerVariantSlots}
          onClose={() => setBuildCheckDialogOpen(false)}
          onSelectMissingRequirement={filterPowersForMissingRequirement}
        />
      ) : null}

      <main className="workspace-grid">
        <CharacterPanel
          innateTalent={selectedInnateTalent}
          innateTalentLocked={!isFreeform}
          superStats={selectedSuperStats}
          superStatsLocked={!isFreeform}
          talents={selectedTalents}
          deviceSlots={deviceSlots}
          highlightedDeviceTargetSlot={
            selectedFramework === devicesFilterId
              ? selectedDeviceTargetBuildSlot?.slot ?? null
              : null
          }
          onSelectInnateTalent={openCurrentInnateTalentDialog}
          onSelectSuperStatSlot={openCurrentSuperStatDialog}
          onSelectTalentSlot={openTalentDialog}
          onSelectDeviceSlot={selectDeviceSlotAsTarget}
          onSelectDeviceName={openDeviceDialog}
        />

        <PowersPanel
          key={`powers-${powerSearchResetKey}`}
          advantages={advantages}
          buildSlots={allPowerSlots}
          canAddPower={(power) =>
            isStandardDevice(power)
              ? powerPanelTargetDeviceSlot !== null
              : isPowerVariantDevice(power)
              ? powerPanelTargetPowerVariantSlot !== null
              : isTravelPower(power)
              ? powerPanelTargetTravelPowerSlot !== null
              : selectedPowerTargetBuildSlot
                ? isFreeform
                  ? canPlacePowerInSlot(
                      power,
                      selectedPowerTargetBuildSlot,
                      buildSlots,
                    )
                  : restrictedPowerIds?.has(power.power_id) ?? false
                : isFreeform
                  ? getFirstValidPowerSlot(power, buildSlots) !== null
                  : false
          }
          frameworkGroups={frameworkGroups}
          powers={powers}
          restrictedPowerIds={activeRestrictedPowerIds}
          restrictedPowerSectionLabel={activeRestrictedPowerSectionLabel}
          selectedFramework={selectedFramework}
          onAddPower={addPower}
          onSelectFramework={(frameworkId) => {
            setBuildCheckPowerFilter(null);
            setSelectedFramework(frameworkId);
          }}
        />

        <BuildPanel
          advantagePointBudget={advantagePointBudget}
          advantages={advantages}
          archetype={selectedArchetype}
          role={selectedRole}
          roleLocked={!isFreeform}
          buildSlots={buildSlots}
          travelPowerSlots={travelPowerSlots}
          powerVariantSlots={powerVariantSlots}
          camsLevel={camsLevel}
          totalAdvantagePoints={totalAdvantagePoints}
          onChangeCamsLevel={changeCamsLevel}
          onSelectArchetype={openArchetypeDialog}
          onSelectRole={openRoleDialog}
          onSelectBuildSlot={selectBuildSlotAsPowerTarget}
          onSelectTravelPowerSlot={selectTravelPowerSlotAsTarget}
          onSelectTravelPowerName={openTravelPowerDialog}
          onSelectPowerVariantSlot={selectPowerVariantSlotAsTarget}
          onSelectPowerVariantName={openPowerVariantDialog}
          onSelectAdvantageSlot={openAdvantageDialog}
          onSelectPowerSlot={openPowerDialog}
          highlightedPowerTargetSlot={
            selectedPowerTargetBuildSlot?.slot ?? null
          }
          highlightedTravelPowerTargetSlot={
            selectedFramework === travelPowerFilterId
              ? powerPanelTargetTravelPowerSlot?.slot ?? null
              : null
          }
          highlightedPowerVariantTargetSlot={
            selectedFramework === powerVariantsFilterId
              ? selectedPowerVariantTargetBuildSlot?.slot ?? null
              : null
          }
          invalidPowerSlotNumbers={invalidPowerSlotNumbers}
          invalidPowerVariantSlotNumbers={invalidPowerVariantSlotNumbers}
          lockedPowerSlotNumbers={lockedPowerSlotNumbers}
        />

        <SpecializationsPanel
          masterySlot={selectedMasterySlot}
          pointsBySlot={specializationPointsBySlot}
          trees={selectedSpecializationTrees}
          onOpenSpecialization={openSpecializationTreeDialog}
          onSelectMastery={openMasteryDialog}
        />
      </main>

      {activeSuperStatSlot !== null && statsTalentsData && superStatDialogAnchor ? (
        <StatSelectionDialog
          anchor={superStatDialogAnchor}
          selectedStatIds={selectedSuperStatIds}
          slotIndex={activeSuperStatSlot}
          stats={statsTalentsData.superStats}
          onClose={closeSuperStatDialog}
          onSelectStat={selectCurrentSuperStat}
        />
      ) : null}

      {statsTalentsData && innateTalentDialogAnchor ? (
        <InnateTalentSelectionDialog
          anchor={innateTalentDialogAnchor}
          selectedTalentId={selectedInnateTalentId}
          selectedSuperStats={selectedSuperStats}
          talents={statsTalentsData.innateTalents}
          onClose={closeInnateTalentDialog}
          onSelectTalent={selectCurrentInnateTalent}
        />
      ) : null}

      {activeTalentSlot !== null && statsTalentsData && talentDialogAnchor ? (
        <TalentSelectionDialog
          anchor={talentDialogAnchor}
          selectedSuperStats={selectedSuperStats}
          selectedTalentIds={selectedTalentIds}
          slotIndex={activeTalentSlot}
          talents={statsTalentsData.talents}
          onClose={closeTalentDialog}
          onAutofillTalents={autofillTalents}
          onSelectTalent={selectTalent}
        />
      ) : null}

      {isFreeform && activeBuildSlot && powerDialogAnchor ? (
        <PowerSelectionDialog
          anchor={powerDialogAnchor}
          buildSlots={buildSlots}
          buildSlot={activeBuildSlot}
          initialFrameworkId={lastPowerDialogFrameworkId}
          powers={combatPowers}
          canSelectPower={(power) =>
            canPlacePowerInSlot(power, activeBuildSlot, buildSlots)
          }
          onClearPower={clearPowerSlot}
          onClose={closePowerDialog}
          onSelectFramework={setLastPowerDialogFrameworkId}
          onSelectPower={selectPowerForSlot}
        />
      ) : null}

      {activePowerVariantBuildSlot && powerVariantDialogAnchor ? (
        <PowerVariantSelectionDialog
          anchor={powerVariantDialogAnchor}
          buildSlot={activePowerVariantBuildSlot}
          powerVariantSlots={powerVariantSlots}
          powers={powers}
          onClearPowerVariant={clearPowerVariantSlot}
          onClose={closePowerVariantDialog}
          onSelectPowerVariant={selectPowerVariantForSlot}
        />
      ) : null}

      {activeTravelPowerBuildSlot && travelPowerDialogAnchor ? (
        <TravelPowerSelectionDialog
          anchor={travelPowerDialogAnchor}
          buildSlot={activeTravelPowerBuildSlot}
          powers={powers}
          onClearTravelPower={clearTravelPowerSlot}
          onClose={closeTravelPowerDialog}
          onSelectTravelPower={selectTravelPowerForSlot}
        />
      ) : null}

      {activeDeviceBuildSlot && deviceDialogAnchor ? (
        <DeviceSelectionDialog
          anchor={deviceDialogAnchor}
          buildSlot={activeDeviceBuildSlot}
          powers={powers}
          onClearDevice={clearDeviceSlot}
          onClose={closeDeviceDialog}
          onSelectDevice={selectDeviceForSlot}
        />
      ) : null}

      {!isFreeform &&
      activeBuildSlot &&
      powerDialogAnchor &&
      activeArchetypePowerOptions.length > 0 ? (
        <ArchetypePowerSelectionDialog
          anchor={powerDialogAnchor}
          currentPowerId={activeBuildSlot.power?.power_id ?? null}
          powers={activeArchetypePowerOptions}
          slotNumber={activeBuildSlot.slot}
          onClose={closePowerDialog}
          onSelectPower={selectArchetypePowerForSlot}
        />
      ) : null}

      {activeAdvantageBuildSlot?.power && advantageDialogAnchor ? (
        <AdvantageSelectionDialog
          anchor={advantageDialogAnchor}
          advantagePointBudget={advantagePointBudget}
          advantages={advantages}
          buildSlot={activeAdvantageBuildSlot}
          totalAdvantagePoints={totalAdvantagePoints}
          onClearAdvantages={clearSlotAdvantages}
          onClose={closeAdvantageDialog}
          onToggleAdvantage={toggleAdvantage}
        />
      ) : null}

      {activeSpecializationTreeSlot !== null &&
      specializationTreesData &&
      specializationTreeDialogAnchor ? (
        <SpecializationSelectionDialog
          anchor={specializationTreeDialogAnchor}
          points={specializationPointsBySlot[activeSpecializationTreeSlot] ?? []}
          selectedRoleTreeIds={selectedSpecializationTreeIds.slice(1)}
          slotIndex={activeSpecializationTreeSlot}
          tree={selectedSpecializationTrees[activeSpecializationTreeSlot]}
          trees={specializationTrees}
          canChangeTree={isFreeform}
          onChangeSpecializationPoints={changeSpecializationPoints}
          onClearSlot={clearCurrentSpecializationSlot}
          onClose={closeSpecializationTreeDialog}
          onSelectTree={selectCurrentSpecializationTree}
        />
      ) : null}

      {masteryDialogAnchor ? (
        <SpecializationMasteryDialog
          anchor={masteryDialogAnchor}
          selectedMasterySlot={selectedMasterySlot}
          trees={selectedSpecializationTrees}
          onClose={closeMasteryDialog}
          onSelectMastery={selectMastery}
        />
      ) : null}

      {archetypesData && archetypeDialogAnchor ? (
        <ArchetypeSelectionDialog
          anchor={archetypeDialogAnchor}
          archetypes={archetypesData.archetypes}
          groups={archetypesData.archetypeGroups}
          selectedArchetypeId={selectedArchetypeId}
          unlocks={archetypesData.archetypeUnlocks}
          onClose={closeArchetypeDialog}
          onSelectArchetype={selectArchetype}
        />
      ) : null}

      {archetypesData && roleDialogAnchor ? (
        <RoleSelectionDialog
          anchor={roleDialogAnchor}
          groups={archetypesData.archetypeGroups}
          selectedRoleId={selectedRoleId}
          onClose={closeRoleDialog}
          onSelectRole={selectRole}
        />
      ) : null}

      <InstantTooltip />
    </div>
  );
}

export default App;
